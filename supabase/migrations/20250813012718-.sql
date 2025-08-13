-- Fix infinite recursion in workspace_memberships RLS policies
-- First drop the problematic policies
DROP POLICY IF EXISTS "Users can view memberships in their workspaces" ON workspace_memberships;
DROP POLICY IF EXISTS "Workspace owners can manage memberships" ON workspace_memberships;

-- Update the get_user_role_in_workspace function to be more secure
CREATE OR REPLACE FUNCTION public.get_user_role_in_workspace(workspace_id_param uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT role FROM public.workspace_memberships 
  WHERE user_id = auth.uid() AND workspace_id = workspace_id_param
  LIMIT 1;
$function$;

-- Create a helper function to check workspace membership without recursion
CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_id_param uuid, user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_memberships 
    WHERE workspace_id = workspace_id_param AND user_id = user_id_param
  );
$function$;

-- Create new safe RLS policies for workspace_memberships
CREATE POLICY "Users can view their own memberships"
ON workspace_memberships
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can join workspaces as staff"
ON workspace_memberships
FOR INSERT
WITH CHECK (user_id = auth.uid() AND role = 'staff'::app_role);

-- Update the handle_new_user function to be more secure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  workspace_id UUID;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Create default workspace
  INSERT INTO public.workspaces (name)
  VALUES (COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Personal') || '''s Workspace')
  RETURNING id INTO workspace_id;
  
  -- Make user owner of their workspace
  INSERT INTO public.workspace_memberships (user_id, workspace_id, role)
  VALUES (NEW.id, workspace_id, 'owner');
  
  RETURN NEW;
END;
$function$;

-- Update update_updated_at_column function for security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;