-- Add execution tracking columns to schedules table
ALTER TABLE public.schedules 
ADD COLUMN last_executed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN next_execution_at TIMESTAMP WITH TIME ZONE;