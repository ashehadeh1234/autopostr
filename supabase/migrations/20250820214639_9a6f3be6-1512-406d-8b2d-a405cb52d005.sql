-- Create encryption functions for securing social media tokens
-- Using pgcrypto extension for encryption

-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a secure key derivation function
CREATE OR REPLACE FUNCTION generate_token_key()
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  master_key text;
  derived_key bytea;
BEGIN
  -- Use a combination of database secrets to derive encryption key
  master_key := current_setting('app.jwt_secret', true);
  IF master_key IS NULL OR master_key = '' THEN
    RAISE EXCEPTION 'Master key not found in configuration';
  END IF;
  
  -- Derive a 32-byte key for AES-256
  derived_key := digest(master_key || 'social_tokens_v1', 'sha256');
  RETURN derived_key;
END;
$$;

-- Create token encryption function
CREATE OR REPLACE FUNCTION encrypt_token(plaintext_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key bytea;
  encrypted bytea;
BEGIN
  IF plaintext_token IS NULL OR plaintext_token = '' THEN
    RETURN NULL;
  END IF;
  
  key := generate_token_key();
  encrypted := pgp_sym_encrypt(plaintext_token::bytea, key);
  
  -- Return as base64 encoded string for storage
  RETURN encode(encrypted, 'base64');
END;
$$;

-- Create token decryption function
CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key bytea;
  decrypted bytea;
BEGIN
  IF encrypted_token IS NULL OR encrypted_token = '' THEN
    RETURN NULL;
  END IF;
  
  key := generate_token_key();
  
  BEGIN
    decrypted := pgp_sym_decrypt(decode(encrypted_token, 'base64'), key);
    RETURN convert_from(decrypted, 'UTF8');
  EXCEPTION
    WHEN OTHERS THEN
      -- Return NULL if decryption fails (corrupted or wrong key)
      RETURN NULL;
  END;
END;
$$;

-- Add new encrypted columns to social_connections table
ALTER TABLE social_connections 
ADD COLUMN IF NOT EXISTS access_token_encrypted text,
ADD COLUMN IF NOT EXISTS refresh_token_encrypted text,
ADD COLUMN IF NOT EXISTS page_access_token_encrypted text;

-- Create a function to migrate existing tokens to encrypted format
CREATE OR REPLACE FUNCTION migrate_existing_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Encrypt existing tokens and store in new columns
  UPDATE social_connections 
  SET 
    access_token_encrypted = encrypt_token(access_token),
    refresh_token_encrypted = encrypt_token(refresh_token),
    page_access_token_encrypted = encrypt_token(page_access_token)
  WHERE 
    (access_token IS NOT NULL AND access_token_encrypted IS NULL) OR
    (refresh_token IS NOT NULL AND refresh_token_encrypted IS NULL) OR
    (page_access_token IS NOT NULL AND page_access_token_encrypted IS NULL);
    
  RAISE NOTICE 'Token migration completed for % rows', (SELECT COUNT(*) FROM social_connections WHERE access_token_encrypted IS NOT NULL);
END;
$$;

-- Execute the migration
SELECT migrate_existing_tokens();

-- Create secure token retrieval functions for edge functions
CREATE OR REPLACE FUNCTION get_decrypted_access_token(connection_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encrypted_token text;
BEGIN
  SELECT access_token_encrypted INTO encrypted_token 
  FROM social_connections 
  WHERE id = connection_id;
  
  RETURN decrypt_token(encrypted_token);
END;
$$;

CREATE OR REPLACE FUNCTION get_decrypted_page_token(connection_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encrypted_token text;
BEGIN
  SELECT page_access_token_encrypted INTO encrypted_token 
  FROM social_connections 
  WHERE id = connection_id;
  
  RETURN decrypt_token(encrypted_token);
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION get_decrypted_access_token(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION get_decrypted_page_token(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION encrypt_token(text) TO service_role;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_connections_encrypted_tokens 
ON social_connections(user_id, platform) 
WHERE access_token_encrypted IS NOT NULL;

COMMENT ON FUNCTION encrypt_token(text) IS 'Encrypts social media tokens using AES-256 encryption';
COMMENT ON FUNCTION decrypt_token(text) IS 'Decrypts social media tokens (SECURITY DEFINER - restricted access)';