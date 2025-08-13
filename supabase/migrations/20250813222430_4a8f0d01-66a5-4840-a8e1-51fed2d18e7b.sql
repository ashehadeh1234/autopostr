-- Make the user-assets bucket public so files can be accessed externally
UPDATE storage.buckets 
SET public = true 
WHERE id = 'user-assets';