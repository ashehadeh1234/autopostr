-- AutoPostr Database Schema Setup
-- Phase 1: Core tables for Facebook/Instagram integration

-- Create enum types for better data integrity
CREATE TYPE post_target_type AS ENUM ('facebook_page', 'instagram');
CREATE TYPE post_status AS ENUM ('queued', 'published', 'failed');
CREATE TYPE comment_status AS ENUM ('open', 'replied', 'hidden', 'deleted');

-- FB Pages table
CREATE TABLE public.fb_pages (
  page_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  page_access_token_encrypted TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Instagram accounts linked to FB pages
CREATE TABLE public.ig_accounts (
  ig_user_id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES public.fb_pages(page_id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ad accounts
CREATE TABLE public.ad_accounts (
  ad_account_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Scheduled posts (enhanced from existing schedules)
CREATE TABLE public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type post_target_type NOT NULL,
  target_id TEXT NOT NULL, -- page_id or ig_user_id
  message TEXT,
  media_url TEXT,
  link_url TEXT,
  status post_status DEFAULT 'queued',
  run_at TIMESTAMP WITH TIME ZONE NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  result_json JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comments and moderation
CREATE TABLE public.comments (
  id TEXT PRIMARY KEY, -- Facebook comment ID
  page_id TEXT NOT NULL REFERENCES public.fb_pages(page_id) ON DELETE CASCADE,
  post_id TEXT NOT NULL,
  parent_id TEXT, -- for reply threads
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_type TEXT NOT NULL DEFAULT 'user', -- user, page, etc.
  message TEXT NOT NULL,
  created_at_fb TIMESTAMP WITH TIME ZONE NOT NULL,
  status comment_status DEFAULT 'open',
  last_action JSONB,
  is_hidden BOOLEAN DEFAULT false,
  is_liked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.fb_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ig_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fb_pages
CREATE POLICY "Users can manage their own FB pages" ON public.fb_pages
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for ig_accounts (through fb_pages relationship)
CREATE POLICY "Users can view IG accounts for their pages" ON public.ig_accounts
  FOR SELECT USING (
    page_id IN (SELECT page_id FROM public.fb_pages WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage IG accounts for their pages" ON public.ig_accounts
  FOR INSERT WITH CHECK (
    page_id IN (SELECT page_id FROM public.fb_pages WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update IG accounts for their pages" ON public.ig_accounts
  FOR UPDATE USING (
    page_id IN (SELECT page_id FROM public.fb_pages WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete IG accounts for their pages" ON public.ig_accounts
  FOR DELETE USING (
    page_id IN (SELECT page_id FROM public.fb_pages WHERE user_id = auth.uid())
  );

-- RLS Policies for ad_accounts
CREATE POLICY "Users can manage their own ad accounts" ON public.ad_accounts
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for scheduled_posts
CREATE POLICY "Users can manage their own scheduled posts" ON public.scheduled_posts
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for comments (through fb_pages relationship)
CREATE POLICY "Users can view comments for their pages" ON public.comments
  FOR SELECT USING (
    page_id IN (SELECT page_id FROM public.fb_pages WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage comments for their pages" ON public.comments
  FOR INSERT WITH CHECK (
    page_id IN (SELECT page_id FROM public.fb_pages WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update comments for their pages" ON public.comments
  FOR UPDATE USING (
    page_id IN (SELECT page_id FROM public.fb_pages WHERE user_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX idx_fb_pages_user_id ON public.fb_pages(user_id);
CREATE INDEX idx_ig_accounts_page_id ON public.ig_accounts(page_id);
CREATE INDEX idx_ad_accounts_user_id ON public.ad_accounts(user_id);
CREATE INDEX idx_scheduled_posts_user_id ON public.scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_run_at ON public.scheduled_posts(run_at) WHERE status = 'queued';
CREATE INDEX idx_comments_page_id ON public.comments(page_id);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);

-- Triggers for updated_at
CREATE TRIGGER update_fb_pages_updated_at
  BEFORE UPDATE ON public.fb_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ig_accounts_updated_at
  BEFORE UPDATE ON public.ig_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_accounts_updated_at
  BEFORE UPDATE ON public.ad_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper functions for encrypted token management for FB pages
CREATE OR REPLACE FUNCTION public.get_decrypted_page_access_token(p_page_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encrypted_token TEXT;
BEGIN
  SELECT page_access_token_encrypted INTO encrypted_token 
  FROM fb_pages 
  WHERE page_id = p_page_id AND user_id = auth.uid();
  
  RETURN decrypt_token(encrypted_token);
END;
$$;

-- Function to ensure only one default per user per type
CREATE OR REPLACE FUNCTION public.ensure_single_default_page()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Remove default from other pages for this user
    UPDATE public.fb_pages 
    SET is_default = false 
    WHERE user_id = NEW.user_id AND page_id != NEW.page_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_default_page_trigger
  BEFORE INSERT OR UPDATE ON public.fb_pages
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_page();

-- Similar function for IG accounts
CREATE OR REPLACE FUNCTION public.ensure_single_default_ig()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Remove default from other IG accounts for pages owned by this user
    UPDATE public.ig_accounts 
    SET is_default = false 
    WHERE ig_user_id != NEW.ig_user_id 
    AND page_id IN (SELECT page_id FROM public.fb_pages WHERE user_id = auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_default_ig_trigger
  BEFORE INSERT OR UPDATE ON public.ig_accounts
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_ig();

-- Similar function for ad accounts
CREATE OR REPLACE FUNCTION public.ensure_single_default_ad_account()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Remove default from other ad accounts for this user
    UPDATE public.ad_accounts 
    SET is_default = false 
    WHERE user_id = NEW.user_id AND ad_account_id != NEW.ad_account_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_default_ad_account_trigger
  BEFORE INSERT OR UPDATE ON public.ad_accounts
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_ad_account();