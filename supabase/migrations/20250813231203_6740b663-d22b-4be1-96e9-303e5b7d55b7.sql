-- Create a function to get random media assets for external integrations
CREATE OR REPLACE FUNCTION public.get_random_media_asset(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  type text,
  url text,
  size bigint,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.id,
    a.name,
    a.type,
    a.url,
    a.size,
    a.created_at
  FROM assets a
  WHERE a.user_id = p_user_id 
    AND (a.type LIKE 'image/%' OR a.type LIKE 'video/%')
  ORDER BY RANDOM()
  LIMIT 1;
$$;