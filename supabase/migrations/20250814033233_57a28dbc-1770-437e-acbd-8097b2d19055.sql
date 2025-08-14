-- Update schedules table to use interval-based structure instead of day/time based
ALTER TABLE public.schedules 
DROP COLUMN IF EXISTS days_of_week,
DROP COLUMN IF EXISTS times,
DROP COLUMN IF EXISTS timezone,
DROP COLUMN IF EXISTS webhook_url,
DROP COLUMN IF EXISTS n8n_workflow_id;

-- Add new interval-based columns
ALTER TABLE public.schedules 
ADD COLUMN interval_value INTEGER NOT NULL DEFAULT 1,
ADD COLUMN interval_unit TEXT NOT NULL DEFAULT 'hours' CHECK (interval_unit IN ('minutes', 'hours', 'days')),
ADD COLUMN time_between_posts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN time_between_unit TEXT NOT NULL DEFAULT 'minutes' CHECK (time_between_unit IN ('seconds', 'minutes', 'hours'));