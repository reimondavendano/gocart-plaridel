-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gocart-assets', 'gocart-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy 1: Allow public read access (so images can be seen)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'gocart-assets' );

-- Policy 2: Allow authenticated users (Admins & Sellers) to upload files
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'gocart-assets' );

-- Policy 3: Allow users to update their own files (or any file if we are lenient for this demo)
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update" 
ON storage.objects FOR UPDATE
TO authenticated 
USING ( bucket_id = 'gocart-assets' );

-- Policy 4: Allow users to delete files
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Authenticated Delete" 
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'gocart-assets' );
