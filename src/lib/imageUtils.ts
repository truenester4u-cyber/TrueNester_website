/**
 * Utility functions for handling image URLs and preventing 406 errors
 */

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop";

/**
 * Validates and sanitizes image URL to prevent 406 errors
 * @param url - Image URL to validate
 * @param fallback - Fallback image URL if validation fails
 * @returns Valid image URL or fallback
 */
export const getSafeImageUrl = (url: string | null | undefined, fallback: string = PLACEHOLDER_IMAGE): string => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }

  const cleanUrl = url.trim();

  // Check if it's a valid URL
  try {
    // If it's a Supabase storage URL, ensure it has proper format
    if (cleanUrl.includes('supabase.co/storage')) {
      // Add cache-busting and proper headers via URL params
      const urlObj = new URL(cleanUrl);
      // Don't add params if already present
      if (!urlObj.searchParams.has('t')) {
        // Just return the URL as-is, let browser handle caching
        return cleanUrl;
      }
    }

    // For external URLs (Unsplash, etc.), validate format
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }

    // If relative URL, assume it's valid
    if (cleanUrl.startsWith('/')) {
      return cleanUrl;
    }

    // Invalid format, use fallback
    console.warn('⚠️ Invalid image URL format:', cleanUrl);
    return fallback;
  } catch (error) {
    console.warn('⚠️ Error parsing image URL:', error);
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

export { PLACEHOLDER_IMAGE };
