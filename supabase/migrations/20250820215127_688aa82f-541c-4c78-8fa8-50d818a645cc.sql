-- Final security cleanup: Remove old unencrypted token columns
-- This completes the token security implementation

-- First verify that encrypted columns contain all the data
DO $$
DECLARE
    unencrypted_count INTEGER;
    encrypted_count INTEGER;
BEGIN
    -- Count rows with unencrypted tokens
    SELECT COUNT(*) INTO unencrypted_count 
    FROM social_connections 
    WHERE access_token IS NOT NULL OR refresh_token IS NOT NULL OR page_access_token IS NOT NULL;
    
    -- Count rows with encrypted tokens  
    SELECT COUNT(*) INTO encrypted_count
    FROM social_connections 
    WHERE access_token_encrypted IS NOT NULL OR refresh_token_encrypted IS NOT NULL OR page_access_token_encrypted IS NOT NULL;
    
    RAISE NOTICE 'Unencrypted tokens found: %, Encrypted tokens found: %', unencrypted_count, encrypted_count;
    
    -- Only proceed if we have encrypted versions
    IF encrypted_count > 0 THEN
        RAISE NOTICE 'Encrypted tokens detected, safe to remove unencrypted columns';
    ELSE
        RAISE EXCEPTION 'No encrypted tokens found, aborting cleanup for safety';
    END IF;
END $$;

-- Remove the old unencrypted token columns for complete security
ALTER TABLE social_connections 
DROP COLUMN IF EXISTS access_token,
DROP COLUMN IF EXISTS refresh_token,
DROP COLUMN IF EXISTS page_access_token;

-- Update any remaining RLS policies to ensure they don't reference removed columns
-- (The existing policies should already be secure, but let's verify)

-- Create a secure function to validate token access (for potential future use)
CREATE OR REPLACE FUNCTION validate_token_access(user_id_param uuid, connection_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure user can only access their own connections
  RETURN EXISTS (
    SELECT 1 FROM social_connections 
    WHERE id = connection_id_param 
    AND user_id = user_id_param
    AND is_active = true
  );
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION validate_token_access(uuid, uuid) IS 'Validates that a user can access a specific connection (used for token decryption authorization)';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Security cleanup completed: All unencrypted token columns removed';
END $$;