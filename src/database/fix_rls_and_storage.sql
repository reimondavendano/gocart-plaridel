-- Fix Storage RLS Policies for gocart-assets bucket

-- 1. Enable RLS on objects (if not already)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Allow Public Read Access (so images can be viewed)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'gocart-assets' );

-- 3. Allow Authenticated Uploads (Sellers/Admins)
DROP POLICY IF EXISTS "Authenticated Insert" ON storage.objects;
CREATE POLICY "Authenticated Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'gocart-assets' );

-- 4. Allow Authenticated Updates
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'gocart-assets' );

-- 5. Allow Authenticated Deletes
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'gocart-assets' );
