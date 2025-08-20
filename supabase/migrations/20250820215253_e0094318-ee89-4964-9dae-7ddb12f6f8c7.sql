-- Complete security fix: Remove unencrypted token columns
-- Safe to do since there are no existing connections

-- Remove the unencrypted token columns completely
ALTER TABLE social_connections 
DROP COLUMN IF EXISTS access_token,
DROP COLUMN IF EXISTS refresh_token,
DROP COLUMN IF EXISTS page_access_token;

-- Verify the columns are gone
DO $$
DECLARE
    remaining_columns TEXT[];
BEGIN
    SELECT array_agg(column_name) INTO remaining_columns
    FROM information_schema.columns 
    WHERE table_name = 'social_connections' 
      AND table_schema = 'public'
      AND column_name IN ('access_token', 'refresh_token', 'page_access_token');
    
    IF remaining_columns IS NULL THEN
        RAISE NOTICE 'SUCCESS: All unencrypted token columns have been removed';
    ELSE
        RAISE NOTICE 'WARNING: Some unencrypted columns still exist: %', remaining_columns;
    END IF;
END $$;

-- Add a constraint to ensure encrypted tokens are used
ALTER TABLE social_connections 
ADD CONSTRAINT ensure_encrypted_tokens 
CHECK (
  (access_token_encrypted IS NOT NULL) OR 
  (page_access_token_encrypted IS NOT NULL)
);

COMMENT ON CONSTRAINT ensure_encrypted_tokens ON social_connections IS 'Ensures at least one encrypted token exists for each connection';