-- Fix security warnings for function search paths

-- Update the new trigger functions with proper search paths
CREATE OR REPLACE FUNCTION public.ensure_single_default_page()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.ensure_single_default_ig()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.ensure_single_default_ad_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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