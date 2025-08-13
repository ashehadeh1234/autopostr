-- Create page_connections table for storing Facebook page connections
CREATE TABLE IF NOT EXISTS public.page_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  page_id TEXT NOT NULL,
  page_name TEXT NOT NULL,
  page_access_token_encrypted TEXT NOT NULL,
  ig_user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for page_connections
CREATE POLICY "Users can view page connections in their workspace" 
ON public.page_connections 
FOR SELECT 
USING (workspace_id IN (
  SELECT workspace_id FROM public.workspace_memberships 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create page connections in their workspace" 
ON public.page_connections 
FOR INSERT 
WITH CHECK (workspace_id IN (
  SELECT workspace_id FROM public.workspace_memberships 
  WHERE user_id = auth.uid()
) AND user_id = auth.uid());

CREATE POLICY "Users can update page connections in their workspace" 
ON public.page_connections 
FOR UPDATE 
USING (workspace_id IN (
  SELECT workspace_id FROM public.workspace_memberships 
  WHERE user_id = auth.uid()
) AND user_id = auth.uid());

CREATE POLICY "Users can delete page connections in their workspace" 
ON public.page_connections 
FOR DELETE 
USING (workspace_id IN (
  SELECT workspace_id FROM public.workspace_memberships 
  WHERE user_id = auth.uid()
) AND user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_page_connections_updated_at
BEFORE UPDATE ON public.page_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();