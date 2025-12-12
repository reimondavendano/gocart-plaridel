import { supabase } from './supabase';

/**
 * Storage folder structure:
 * 
 * For Stores:
 *   stores/{store_slug}/
 *     ├── logo/
 *     ├── banner/
 *     ├── products/
 *     ├── avatar/
 *     └── verification_docs/
 * 
 * For Admin:
 *   admin/
 *     ├── logo/
 *     ├── banner/
 *     ├── products/
 *     └── avatar/
 */

export type StorageFolder = 'logo' | 'banner' | 'products' | 'avatar' | 'verification_docs' | 'categories';

interface UploadOptions {
    storeSlug?: string;  // If provided, uploads to store folder
    isAdmin?: boolean;   // If true, uploads to admin folder
    folder: StorageFolder;
    fileName?: string;   // Optional custom filename
    category?: string;   // Optional category for products subfolder
}

/**
 * Convert base64 data URL to File object
 */
export function dataURLtoFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

/**
 * Generate storage path for uploads
 */
export function getStoragePath(options: UploadOptions): string {
    const { storeSlug, isAdmin, folder, category } = options;

    // Clean category string if provided
    const cleanCategory = category ? category.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';

    if (isAdmin) {
        if (folder === 'products' && cleanCategory) {
            return `admin/${folder}/${cleanCategory}`;
        }
        return `admin/${folder}`;
    }

    if (storeSlug) {
        if (folder === 'products' && cleanCategory) {
            return `stores/${storeSlug}/${folder}/${cleanCategory}`;
        }
        return `stores/${storeSlug}/${folder}`;
    }

    throw new Error('Either storeSlug or isAdmin must be provided');
}

/**
 * Upload file to Supabase Storage
 */
const STORAGE_PROVIDER = process.env.NEXT_PUBLIC_STORAGE_PROVIDER || 'supabase'; // 'supabase' | 's3'

/**
 * Upload file to AWS S3 (Placeholder for future implementation)
 */
async function uploadToS3(file: File, path: string): Promise<{ url: string | null; error: Error | null }> {
    console.warn('AWS S3 upload is enabled but not implemented yet.');

    // Future Implementation Guide:
    // 1. Install @aws-sdk/client-s3
    // 2. Configure S3 Client with credentials (accessKeyId, secretAccessKey, region)
    // 3. Create PutObjectCommand
    // 4. Send command to S3
    // 5. Construct public URL: https://{bucket}.s3.{region}.amazonaws.com/{path}

    return {
        url: null,
        error: new Error('AWS S3 provider is not fully implemented. Please check storage.ts')
    };
}

/**
 * Upload file to Storage (Supabase or AWS S3 based on config)
 */
export async function uploadToStorage(
    file: File | string, // Can be File or base64 data URL
    options: UploadOptions
): Promise<{ url: string | null; error: Error | null }> {
    try {
        let fileToUpload: File;

        // Convert base64 to File if needed
        if (typeof file === 'string') {
            const extension = file.match(/data:image\/(.*?);/)?.[1] || 'jpg';
            const timestamp = Date.now();
            const fileName = options.fileName || `${timestamp}.${extension}`;
            fileToUpload = dataURLtoFile(file, fileName);
        } else {
            fileToUpload = file;
        }

        const path = getStoragePath(options);
        const filePath = `${path}/${fileToUpload.name}`;

        // ---------------------------------------------------------
        // AWS S3 Provider
        // ---------------------------------------------------------
        if (STORAGE_PROVIDER === 's3') {
            return await uploadToS3(fileToUpload, filePath);
        }

        // ---------------------------------------------------------
        // Supabase Storage Provider (Default)
        // ---------------------------------------------------------
        const { data, error } = await supabase.storage
            .from('gocart-assets') // Bucket name
            .upload(filePath, fileToUpload, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            console.error('Upload error:', error);
            return { url: null, error };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('gocart-assets')
            .getPublicUrl(filePath);

        return { url: urlData.publicUrl, error: null };
    } catch (error) {
        console.error('Upload error:', error);
        return { url: null, error: error as Error };
    }
}

/**
 * Create folder structure for a new store
 * Note: Supabase doesn't actually create folders, they're virtual based on paths
 * This function is more for documentation/initialization purposes
 */
export async function initializeStoreFolders(storeSlug: string): Promise<void> {
    // Supabase creates folders automatically when files are uploaded
    // This function can be used to log/track folder creation
    console.log(`Initialized folder structure for store: ${storeSlug}`);
    console.log(`  - stores/${storeSlug}/logo/`);
    console.log(`  - stores/${storeSlug}/banner/`);
    console.log(`  - stores/${storeSlug}/products/`);
    console.log(`  - stores/${storeSlug}/avatar/`);
    console.log(`  - stores/${storeSlug}/verification_docs/`);
}

/**
 * Delete all files for a store
 */
export async function deleteStoreFolders(storeSlug: string): Promise<void> {
    const folders: StorageFolder[] = ['logo', 'banner', 'products', 'avatar', 'verification_docs'];

    for (const folder of folders) {
        const path = `stores/${storeSlug}/${folder}`;
        const { data: files } = await supabase.storage
            .from('gocart-assets')
            .list(path);

        if (files && files.length > 0) {
            const filePaths = files.map(file => `${path}/${file.name}`);
            await supabase.storage
                .from('gocart-assets')
                .remove(filePaths);
        }
    }
}

/**
 * Upload logo for store or admin
 */
export async function uploadLogo(
    file: File | string,
    storeSlug?: string,
    isAdmin?: boolean
): Promise<string | null> {
    const { url, error } = await uploadToStorage(file, {
        storeSlug,
        isAdmin,
        folder: 'logo',
        fileName: `logo_${Date.now()}.jpg`
    });

    if (error) {
        console.error('Failed to upload logo:', error);
        return null;
    }

    return url;
}

/**
 * Upload banner for store or admin
 */
export async function uploadBanner(
    file: File | string,
    storeSlug?: string,
    isAdmin?: boolean
): Promise<string | null> {
    const { url, error } = await uploadToStorage(file, {
        storeSlug,
        isAdmin,
        folder: 'banner',
        fileName: `banner_${Date.now()}.jpg`
    });

    if (error) {
        console.error('Failed to upload banner:', error);
        return null;
    }

    return url;
}

/**
 * Upload product image
 */
export async function uploadProductImage(
    file: File | string,
    storeSlug?: string,
    isAdmin?: boolean,
    category?: string
): Promise<string | null> {
    const { url, error } = await uploadToStorage(file, {
        storeSlug,
        isAdmin,
        folder: 'products',
        fileName: `product_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`,
        category
    });

    if (error) {
        console.error('Failed to upload product image:', error);
        return null;
    }

    return url;
}

/**
 * Upload verification document (ID, permit, selfie)
 */
export async function uploadVerificationDoc(
    file: File | string,
    storeSlug: string,
    docType: 'id_front' | 'id_back' | 'business_permit' | 'selfie'
): Promise<string | null> {
    const { url, error } = await uploadToStorage(file, {
        storeSlug,
        folder: 'verification_docs',
        fileName: `${docType}_${Date.now()}.jpg`
    });

    if (error) {
        console.error('Failed to upload verification doc:', error);
        return null;
    }

    return url;
}
