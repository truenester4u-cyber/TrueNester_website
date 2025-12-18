/**
 * Property type definition for the Dubai Nest Hub platform.
 * This is manually maintained because the auto-generated Supabase types are incomplete.
 */
export interface Property {
  id: string;
  title: string;
  slug: string;
  price: number;
  price_display: string | null;
  property_type: string;
  purpose: string;
  city: string;
  location: string;
  area: string | null;
  bedrooms: string | null;
  bathrooms: string | null;
  sqft: string | null;
  size_sqft: string | null;
  developer: string | null;
  description: string | null;
  featured: boolean;
  featured_image: string | null;
  images: string[] | null;
  featured_dubai: boolean;
  featured_abu_dhabi: boolean;
  featured_ras_al_khaimah: boolean;
  featured_umm_al_quwain: boolean;
  published: boolean;
  created_at: string;
  updated_at: string | null;
  views: number;
  completion_status: string | null;
  furnished: string | null;
  amenities: string[] | null;
  features: string[] | null;
  floor_plans: any[] | null;
  payment_plan: any | null;
  handover_date: string | null;
  location_benefits: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  youtube_url: string | null;
  starting_price: number | null;
}
