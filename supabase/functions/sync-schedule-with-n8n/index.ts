import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      supabaseClient.auth.setSession({
        access_token: authHeader.replace('Bearer ', ''),
        refresh_token: '',
      });
    }

    const { scheduleId, scheduleData } = await req.json();

    console.log('Syncing schedule with n8n:', { scheduleId, scheduleData });

    // Convert schedule data to cron expressions
    const cronExpressions = generateCronExpressions(scheduleData);
    
    // If webhook URL is provided, notify n8n about the schedule update
    if (scheduleData.webhook_url) {
      try {
        const syncPayload = {
          scheduleId,
          name: scheduleData.name,
          cronExpressions,
          timezone: scheduleData.timezone,
          isActive: true,
          daysOfWeek: scheduleData.days_of_week,
          times: scheduleData.times,
        };

        console.log('Sending sync payload to n8n webhook:', syncPayload);

        // Send schedule data to n8n webhook
        const webhookResponse = await fetch(scheduleData.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(syncPayload),
        });

        if (!webhookResponse.ok) {
          console.error('Failed to sync with n8n webhook:', await webhookResponse.text());
        } else {
          console.log('Successfully synced schedule with n8n');
        }

        // Update the schedule with sync status
        const { error: updateError } = await supabaseClient
          .from('schedules')
          .update({ 
            updated_at: new Date().toISOString(),
          })
          .eq('id', scheduleId);

        if (updateError) {
          console.error('Error updating schedule sync status:', updateError);
        }

      } catch (error) {
        console.error('Error syncing with n8n webhook:', error);
      }
    }

    // Log the sync event in schedule_executions for monitoring
    const { error: logError } = await supabaseClient
      .from('schedule_executions')
      .insert({
        schedule_id: scheduleId,
        user_id: (await supabaseClient.auth.getUser()).data.user?.id,
        status: 'success',
        executed_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Error logging schedule execution:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Schedule synced with n8n successfully',
        cronExpressions 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in sync-schedule-with-n8n function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateCronExpressions(scheduleData: any): string[] {
  const { days_of_week, times } = scheduleData;
  const cronExpressions: string[] = [];

  for (const time of times) {
    const [hours, minutes] = time.split(':');
    
    // Convert days of week from our format (0=Sunday) to cron format (0=Sunday)
    const cronDays = days_of_week.join(',');
    
    // Cron format: minute hour day-of-month month day-of-week
    // We use * for day-of-month and month since we're scheduling by day of week
    const cronExpression = `${minutes} ${hours} * * ${cronDays}`;
    cronExpressions.push(cronExpression);
  }

  return cronExpressions;
}