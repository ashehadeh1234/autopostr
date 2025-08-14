import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Updating schedule execution status...')

    const { schedule_id, status, executed_at } = await req.json()

    if (!schedule_id) {
      throw new Error('schedule_id is required')
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update schedule with execution info
    const updateData: any = {
      last_executed_at: executed_at || new Date().toISOString()
    }

    // Calculate next execution time based on interval
    const { data: schedule } = await supabase
      .from('schedules')
      .select('interval_value, interval_unit')
      .eq('id', schedule_id)
      .single()

    if (schedule) {
      const intervalMs = schedule.interval_value * {
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000
      }[schedule.interval_unit as 'minutes' | 'hours' | 'days']

      const nextExecution = new Date(Date.now() + intervalMs)
      updateData.next_execution_at = nextExecution.toISOString()
    }

    const { error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', schedule_id)

    if (error) {
      console.error('Error updating schedule:', error)
      throw error
    }

    // Log execution in schedule_executions table
    await supabase
      .from('schedule_executions')
      .insert({
        schedule_id,
        status: status || 'completed',
        executed_at: executed_at || new Date().toISOString(),
        user_id: schedule?.user_id // This might need to be passed in the request
      })

    console.log(`Updated schedule ${schedule_id} execution status`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Schedule execution updated successfully',
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error) {
    console.error('Error in update-schedule-execution:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})