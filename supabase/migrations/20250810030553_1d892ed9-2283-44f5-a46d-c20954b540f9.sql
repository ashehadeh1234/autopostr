-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'staff');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspace memberships table
CREATE TABLE public.workspace_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_memberships ENABLE ROW LEVEL SECURITY;

-- Create function to get current user role in workspace
CREATE OR REPLACE FUNCTION public.get_user_role_in_workspace(workspace_id_param UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.workspace_memberships 
  WHERE user_id = auth.uid() AND workspace_id = workspace_id_param;
$$;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for workspaces
CREATE POLICY "Workspace members can view workspaces" 
ON public.workspaces 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_memberships 
    WHERE workspace_id = workspaces.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Workspace owners can update workspaces" 
ON public.workspaces 
FOR UPDATE 
USING (public.get_user_role_in_workspace(id) = 'owner');

CREATE POLICY "Users can create workspaces" 
ON public.workspaces 
FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for workspace memberships
CREATE POLICY "Users can view memberships in their workspaces" 
ON public.workspace_memberships 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_memberships wm 
    WHERE wm.workspace_id = workspace_memberships.workspace_id 
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Workspace owners can manage memberships" 
ON public.workspace_memberships 
FOR ALL 
USING (public.get_user_role_in_workspace(workspace_id) = 'owner');

CREATE POLICY "Users can join workspaces" 
ON public.workspace_memberships 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
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
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();