/**
 * Image URL utilities for handling Supabase storage URLs - SIMPLIFIED & FIXED
 */
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=60";

/**
 * SIMPLIFIED: Get public URL directly (bucket is now public)
 */
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath || typeof imagePath !== 'string') {
    console.warn('[IMAGE] Empty or invalid image path, using fallback');
    return DEFAULT_PROPERTY_IMAGE;
  }
  
  // If already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log(`[IMAGE] Full URL provided: ${imagePath}`);
    return imagePath;
  }
  
  // Clean path and try public URL
  const cleanPath = imagePath.replace(/^\/+/, '');
  
  try {
    // After running the SQL fix, this should work directly
    const { data } = supabase.storage.from('property-images').getPublicUrl(cleanPath);
    
    if (data?.publicUrl) {
      console.log(`[IMAGE] ✅ Public URL: ${data.publicUrl}`);
      return data.publicUrl;
    }
  } catch (error) {
    console.warn(`[IMAGE] Public URL failed:`, error);
  }

  // Fallback: try with sell-properties folder
  try {
    const sellPath = cleanPath.startsWith('sell-properties/') ? cleanPath : `sell-properties/${cleanPath}`;
    const { data } = supabase.storage.from('property-images').getPublicUrl(sellPath);
    
    if (data?.publicUrl) {
      console.log(`[IMAGE] ✅ Public URL (sell-properties): ${data.publicUrl}`);
      return data.publicUrl;
    }
  } catch (error) {
    console.warn(`[IMAGE] Sell-properties path failed:`, error);
  }

  // Final fallback: construct direct URL manually
  const supabaseUrl = supabase.supabaseUrl;
  const directUrl = `${supabaseUrl}/storage/v1/object/public/property-images/${cleanPath}`;
  console.log(`[IMAGE] Direct URL fallback: ${directUrl}`);
  return directUrl;
};

/**
 * Get multiple image URLs for an array of paths
 */
export const getImageUrls = (imagePaths: (string | null | undefined)[]): string[] => {
  if (!Array.isArray(imagePaths)) {
    console.warn('[IMAGE] Invalid image paths array, returning empty array');
    return [];
  }
  
  return imagePaths
    .filter((path): path is string => Boolean(path && typeof path === 'string'))
    .map(path => getImageUrl(path));
};

/**
 * For backward compatibility - same as getImageUrl but async
 */
export const getSignedImageUrl = async (imagePath: string | null | undefined): Promise<string> => {
  return getImageUrl(imagePath);
};

/**
 * For backward compatibility - batch version
 */
export const getSignedImageUrls = async (imagePaths: (string | null | undefined)[]): Promise<string[]> => {
  return getImageUrls(imagePaths);
};

/**
 * Extract property images from various data formats
 */
export const extractPropertyImages = (data: any): string[] => {
  if (!data) return [];
  
  let imagePaths: string[] = [];
  
  // Handle different data structures
  if (data.images && Array.isArray(data.images)) {
    imagePaths.push(...data.images);
  }
  
  if (data.property_images && Array.isArray(data.property_images)) {
    imagePaths.push(...data.property_images);
  }
  
  if (data.featured_image) {
    imagePaths.unshift(data.featured_image); // Add to beginning
  }
  
  // Convert all paths to public URLs
  return getImageUrls(imagePaths);
};

/**
 * Validate if an image URL is accessible (for testing)
 */
export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const isValid = response.ok;
    console.log(`[IMAGE] Validation for ${url}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    return isValid;
  } catch (error) {
    console.error(`[IMAGE] Validation failed for ${url}:`, error);
    return false;
  }
};