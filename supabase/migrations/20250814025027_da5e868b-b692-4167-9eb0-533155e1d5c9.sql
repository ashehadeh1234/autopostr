-- Create schedules table for n8n integration
CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  days_of_week INTEGER[] NOT NULL DEFAULT '{}', -- 0=Sunday, 1=Monday, etc.
  times TIME[] NOT NULL DEFAULT '{}', -- Array of times to post
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  n8n_workflow_id TEXT, -- Reference to n8n workflow
  webhook_url TEXT, -- n8n webhook URL for triggering
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for schedules
CREATE POLICY "Users can view their own schedules" 
ON public.schedules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedules" 
ON public.schedules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules" 
ON public.schedules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules" 
ON public.schedules 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create schedule executions table for monitoring
CREATE TABLE public.schedule_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  error_message TEXT,
  n8n_execution_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for schedule executions
ALTER TABLE public.schedule_executions ENABLE ROW LEVEL SECURITY;

-- Create policies for schedule executions
CREATE POLICY "Users can view their own schedule executions" 
ON public.schedule_executions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create schedule executions" 
ON public.schedule_executions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on schedules
CREATE TRIGGER update_schedules_updated_at
BEFORE UPDATE ON public.schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX idx_schedules_active ON public.schedules(is_active);
CREATE INDEX idx_schedule_executions_schedule_id ON public.schedule_executions(schedule_id);
CREATE INDEX idx_schedule_executions_user_id ON public.schedule_executions(user_id);