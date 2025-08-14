import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Schedule {
  id: string
  name: string
  interval_value: number
  interval_unit: 'minutes' | 'hours' | 'days'
  time_between_posts: number
  time_between_unit: 'seconds' | 'minutes' | 'hours'
  is_active: boolean
  last_executed_at: string | null
  next_execution_at: string | null
}

// Convert interval to milliseconds for n8n
function convertIntervalToMs(value: number, unit: string): number {
  const multipliers = {
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000
  }
  return value * (multipliers[unit as keyof typeof multipliers] || 0)
}

// Convert time between posts to milliseconds
function convertTimeBetweenToMs(value: number, unit: string): number {
  const multipliers = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000
  }
  return value * (multipliers[unit as keyof typeof multipliers] || 0)
}

// Calculate next execution time
function calculateNextExecution(schedule: Schedule): Date {
  const now = new Date()
  const intervalMs = convertIntervalToMs(schedule.interval_value, schedule.interval_unit)
  
  if (schedule.last_executed_at) {
    const lastExecuted = new Date(schedule.last_executed_at)
    return new Date(lastExecuted.getTime() + intervalMs)
  }
  
  // If never executed, start from now
  return new Date(now.getTime() + intervalMs)
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Getting active schedules for n8n...')

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all active schedules
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching schedules:', error)
      throw error
    }

    console.log(`Found ${schedules?.length || 0} active schedules`)

    // Transform schedules for n8n consumption
    const transformedSchedules = schedules?.map((schedule: Schedule) => {
      const intervalMs = convertIntervalToMs(schedule.interval_value, schedule.interval_unit)
      const timeBetweenMs = convertTimeBetweenToMs(schedule.time_between_posts, schedule.time_between_unit)
      const nextExecution = calculateNextExecution(schedule)

      return {
        id: schedule.id,
        name: schedule.name,
        interval_ms: intervalMs,
        time_between_posts_ms: timeBetweenMs,
        next_execution: nextExecution.toISOString(),
        last_executed_at: schedule.last_executed_at,
        should_execute: schedule.last_executed_at ? 
          new Date() >= nextExecution : 
          true, // Execute immediately if never run
        metadata: {
          interval_value: schedule.interval_value,
          interval_unit: schedule.interval_unit,
          time_between_posts: schedule.time_between_posts,
          time_between_unit: schedule.time_between_unit
        }
      }
    }) || []

    // Update next_execution_at for schedules that need it
    for (const schedule of schedules || []) {
      const nextExecution = calculateNextExecution(schedule)
      if (!schedule.next_execution_at || new Date(schedule.next_execution_at) < new Date()) {
        await supabase
          .from('schedules')
          .update({ next_execution_at: nextExecution.toISOString() })
          .eq('id', schedule.id)
      }
    }

    console.log('Transformed schedules:', transformedSchedules)

    return new Response(
      JSON.stringify({
        success: true,
        schedules: transformedSchedules,
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
    console.error('Error in get-active-schedules:', error)
    
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