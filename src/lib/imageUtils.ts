/**
 * Utility functions for handling image URLs and preventing 406 errors
 */
import { supabase } from "@/integrations/supabase/client";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop";

/**
 * Validates and sanitizes image URL to prevent 406 errors
 * Converts Supabase storage paths to public URLs
 * @param url - Image URL or storage path to validate
 * @param fallback - Fallback image URL if validation fails
 * @returns Valid image URL or fallback
 */
export const getSafeImageUrl = (url: string | null | undefined, fallback: string = PLACEHOLDER_IMAGE): string => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }

  const cleanUrl = url.trim();

  try {
    // For blob URLs (in-memory previews), return as-is
    if (cleanUrl.startsWith('blob:')) {
      return cleanUrl;
    }

    // If it's a SIGNED URL (with token) — convert to permanent public URL
    // Signed URLs expire; the bucket is public so public URLs always work
    if (cleanUrl.includes('supabase.co/storage/v1/object/sign/') && cleanUrl.includes('?token=')) {
      const match = cleanUrl.match(/property-images\/([^?]+)/);
      if (match && match[1]) {
        const { data } = supabase.storage.from('property-images').getPublicUrl(match[1]);
        return data?.publicUrl || fallback;
      }
      return fallback;
    }

    // If it's already a PUBLIC Supabase storage URL, return as-is
    if (cleanUrl.includes('supabase.co/storage/v1/object/public/')) {
      return cleanUrl;
    }

    // For external URLs (Unsplash, etc.), return as-is
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }

    // If relative URL, assume it's valid
    if (cleanUrl.startsWith('/')) {
      return cleanUrl;
    }

    // If it's a storage path (e.g., "0.123456.jpg"), convert to public URL
    const { data } = supabase.storage.from('property-images').getPublicUrl(cleanUrl);
    
    if (data?.publicUrl) {
      return data.publicUrl;
    }

    // Invalid format, use fallback
    console.warn('⚠️ Invalid image URL:', cleanUrl);
    return fallback;
  } catch (error) {
    console.error('❌ Error processing image URL:', error);
    return fallback;
  }
};

/**
 * Handles image loading errors by using fallback
 * @param event - Image error event
 * @param fallback - Fallback image URL
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>, fallback: string = PLACEHOLDER_IMAGE) => {
  const img = event.currentTarget;
  
  // Prevent infinite loop if fallback also fails
  if (img.src === fallback) {
    console.error('❌ Fallback image also failed to load');
    return;
  }

  console.warn('⚠️ Image failed to load, using fallback:', img.src);
  img.src = fallback;
};

/**
 * Preloads an image to check if it's valid before displaying
 * @param url - Image URL to preload
 * @returns Promise that resolves with the URL if valid, rejects if invalid
 */
export const preloadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    
    // Set timeout to prevent hanging
    setTimeout(() => reject(new Error(`Image load timeout: ${url}`)), 10000);
    
    img.src = url;
  });
};

/**
 * Gets multiple safe image URLs from an array
 * @param urls - Array of image URLs
 * @param fallback - Fallback image URL
 * @returns Array of safe image URLs
 */
export const getSafeImageUrls = (
  urls: (string | null | undefined)[] | null | undefined,
  fallback: string = PLACEHOLDER_IMAGE
): string[] => {
  if (!Array.isArray(urls) || urls.length === 0) {
    return [fallback];
  }

  const safeUrls = urls
    .filter((url): url is string => !!url && typeof url === 'string')
    .map(url => getSafeImageUrl(url, fallback));

  return safeUrls.length > 0 ? safeUrls : [fallback];
};

/**
 * Extracts the storage filename from a URL or path.
 * Returns null for external URLs that aren't in our Supabase storage.
 */
const extractFilename = (urlOrPath: string | null | undefined): string | null => {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;
  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;

  // Already a bare filename (e.g. "0.12345.jpg")
  if (!trimmed.startsWith('http') && !trimmed.startsWith('/')) return trimmed;

  // Supabase storage URL — extract filename after bucket name
  const match = trimmed.match(/property-images\/([^?]+)/);
  if (match?.[1]) return decodeURIComponent(match[1]);

  // External URL (Unsplash etc.) — not in our storage
  return null;
};

/**
 * Collects all storage filenames associated with a property record.
 * Covers: images array, featured_image, trakheesi_qr_image, floor_plan images.
 */
export const getPropertyStorageFiles = (property: Record<string, any>): string[] => {
  const files: string[] = [];

  // images array
  const images = property.images;
  if (Array.isArray(images)) {
    images.forEach((img: any) => {
      const f = extractFilename(typeof img === 'string' ? img : img?.url ?? img?.src);
      if (f) files.push(f);
    });
  }

  // featured_image
  const fi = extractFilename(property.featured_image);
  if (fi) files.push(fi);

  // trakheesi_qr_image
  const qr = extractFilename(property.trakheesi_qr_image);
  if (qr) files.push(qr);

  // floor_plans[].image
  const plans = property.floor_plans;
  if (Array.isArray(plans)) {
    plans.forEach((plan: any) => {
      const f = extractFilename(plan?.image);
      if (f) files.push(f);
    });
  }

  // Deduplicate
  return [...new Set(files)];
};

/**
 * Removes a list of files from the property-images storage bucket.
 * Logs errors but does not throw so deletion can proceed.
 */
export const deletePropertyStorageFiles = async (filenames: string[]): Promise<void> => {
  if (filenames.length === 0) return;
  const { error } = await supabase.storage.from('property-images').remove(filenames);
  if (error) {
    console.error('Failed to delete storage files:', error.message, filenames);
  }
};

export { PLACEHOLDER_IMAGE };
