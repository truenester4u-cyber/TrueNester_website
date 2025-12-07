import { Link } from "react-router-dom";
import { Bed, Bath, Square, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;
type FeaturedFlag = "featured_dubai" | "featured_abu_dhabi" | "featured_ras_al_khaimah";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop";

type FeaturedSection = {
  flag: FeaturedFlag;
  highlight: string;
  description: string;
};

type SectionWithProperties = FeaturedSection & { properties: Property[] };

const MAX_DUBAI_ROWS = 4;
const MAX_DUBAI_COLUMNS = 3;
const MAX_DUBAI_PROPERTIES = MAX_DUBAI_ROWS * MAX_DUBAI_COLUMNS;

const developerPriority: Partial<Record<FeaturedFlag, string[]>> = {
  featured_dubai: [
    "Emaar",
    "Damac",
    "Sobha",
    "Bingatti",
    "Deyaar",
    "Reportage",
    "Azizi",
    "Imtiaz",
    "Samana",
  ],
  featured_ras_al_khaimah: [
    "BNW",
    "Sobha",
    "Range Developer",
    "Uni Etstate",
    "Eli Seba La Mehr",
  ],
};

const normalizeName = (value: string) => value.replace(/[^a-z0-9]/gi, "").toLowerCase();

const getDeveloperPriorityIndex = (flag: FeaturedFlag, developer?: string | null) => {
  if (!developer) return Number.MAX_SAFE_INTEGER;
  const priorities = developerPriority[flag];
  if (!priorities || priorities.length === 0) return Number.MAX_SAFE_INTEGER;
  const normalizedDeveloper = normalizeName(developer);
  const index = priorities.findIndex((name) =>
    normalizedDeveloper.includes(normalizeName(name))
  );
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const FEATURED_SECTIONS: FeaturedSection[] = [
  {
    flag: "featured_dubai",
    highlight: "Developments in Dubai",
    description: "Handpicked luxury properties from Dubai's most prestigious developers",
  },
  {
    flag: "featured_abu_dhabi",
    highlight: "Developments in Abu Dhabi",
    description: "Explore the finest properties from Abu Dhabi's leading developers",
  },
  {
    flag: "featured_ras_al_khaimah",
    highlight: "Developments in Ras Al Khaimah near Wynn Casino",
    description: "Discover exclusive properties near the iconic Wynn Casino in Ras Al Khaimah",
  },
];

const buildSectionData = (properties: Property[]): SectionWithProperties[] => {
  const entries = properties.map((property, index) => ({ property, index }));

  return FEATURED_SECTIONS.map((section) => {
    const sorted = entries
      .filter(({ property }) => property[section.flag])
      .sort((a, b) => {
        const priorityA = getDeveloperPriorityIndex(section.flag, a.property.developer);
        const priorityB = getDeveloperPriorityIndex(section.flag, b.property.developer);
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.index - b.index;
      })
      .map(({ property }) => property);

    return {
      ...section,
      properties: sorted,
    };
  });
};

const renderSkeletonGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <div className="h-64 bg-muted animate-pulse" />
        <CardContent className="p-6 space-y-3">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-6 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const useFeaturedProperties = () => {
  return useQuery<Property[], Error>({
    queryKey: ["featured-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("published", true)
        .or("featured_dubai.eq.true,featured_abu_dhabi.eq.true,featured_ras_al_khaimah.eq.true")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Property[];
    },
  });
};

const FeaturedProperties = () => {
  const { data: properties = [], isLoading, isError, error } = useFeaturedProperties();

  const formatPrice = (price: number) => {
    if (!price) return "";
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
    }).format(Number(price));
  };

  const getDisplayPrice = (property: Property) => {
    const label = property.price_display?.trim();
    if (label) return label;
    if (property.price) return formatPrice(property.price);
    return "";
  };

  const getAreaDisplay = (property: Property) => {
    const area = typeof property.area === "string" ? property.area.trim() : "";
    if (area) return area;
    const location = typeof property.location === "string" ? property.location.trim() : "";
    if (location) return location;
    return property.city || "";
  };

  const parseSqft = (sqft: any): number | null => {
    if (!sqft) return null;
    // Convert to string and remove all non-numeric characters except decimal point
    const cleanValue = String(sqft).replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleanValue);
    return !isNaN(parsed) && parsed > 0 ? parsed : null;
  };

  const sectionData = buildSectionData(properties);
  const sectionsToRender: SectionWithProperties[] = isLoading
    ? FEATURED_SECTIONS.map((section) => ({ ...section, properties: [] }))
    : sectionData.filter((section) => section.properties.length > 0);
  const hasAnyFeatured = sectionsToRender.length > 0;

  const renderPropertyCard = (property: Property) => {
    const images = Array.isArray(property.images) ? (property.images as string[]) : [];
    const baseImages = property.featured_image
      ? [property.featured_image, ...images.filter((img) => img !== property.featured_image)]
      : images;
    const allImages = baseImages.length > 0 ? baseImages : [PLACEHOLDER_IMAGE];
    const mainImage = allImages[0] || PLACEHOLDER_IMAGE;
    const thumbnails = allImages.slice(1, 4);
    const hasMultipleImages = allImages.length > 1;

    return (
      <Card key={property.id} className="overflow-hidden hover-lift group cursor-pointer border-0 shadow-lg">
        <Link to={`/property/${property.id}`} onClick={() => window.scrollTo(0, 0)}>
          <div className="relative overflow-hidden h-64">
            {/* If only 1 image, show full width. Otherwise show grid layout */}
            {!hasMultipleImages ? (
              <div className="w-full h-full relative overflow-hidden">
                <img
                  src={mainImage}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                />
                {property.featured && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="badge-featured">Featured</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2 h-full">
                <div className={`${thumbnails.length > 0 ? 'flex-[65]' : 'w-full'} relative overflow-hidden`}>
                  <img
                    src={mainImage}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                  />
                  {property.featured && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="badge-featured">Featured</span>
                    </div>
                  )}
                </div>

                {thumbnails.length > 0 && (
                  <div className="flex-[35] flex flex-col gap-2">
                    {thumbnails.map((img, idx) => (
                      <div key={idx} className="flex-1 relative overflow-hidden rounded-md">
                        <img
                          src={img}
                          alt={`${property.title} - ${idx + 2}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                        />
                        {/* Show +N overlay on last thumbnail if more images exist */}
                        {idx === thumbnails.length - 1 && allImages.length > 4 && (
                          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-white text-xl font-bold">+{allImages.length - 4}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="absolute bottom-4 left-4 bg-white rounded-xl px-4 py-2 z-10 shadow-xl">
              <div className="text-sm font-bold text-gray-900">{getDisplayPrice(property)}</div>
            </div>
          </div>

          <CardContent className="p-6">
            <div className="mb-3">
              {property.developer && (
                <p className="text-sm text-primary font-bold mb-1 border border-primary/30 inline-block px-2 py-0.5 rounded">{property.developer}</p>
              )}
              <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {property.title}
              </h3>
              <p className="text-lg text-primary font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {getAreaDisplay(property)}
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
              {property.bedrooms && (
                <div className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  <span>{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-1">
                  <Bath className="h-4 w-4" />
                  <span>{property.bathrooms}</span>
                </div>
              )}
              {(() => {
                const sqftValue = parseSqft(property.size_sqft);
                return sqftValue ? (
                  <div className="flex items-center gap-1">
                    <Square className="h-4 w-4" />
                    <span>{sqftValue.toLocaleString()} sqft</span>
                  </div>
                ) : null;
              })()}
            </div>

            <div className="mt-4 flex gap-2">
              <Button className="flex-1 bg-primary hover:bg-primary-dark text-white">View Details</Button>
              <Button variant="outline" className="flex-1">
                Enquire Now
              </Button>
            </div>
          </CardContent>
        </Link>
      </Card>
    );
  };

  if (isError) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <div className="text-center text-destructive">Failed to load properties: {error?.message}</div>
        </div>
      </section>
    );
  }

  const renderSectionContent = (section: SectionWithProperties) => {
    if (isLoading) {
      return renderSkeletonGrid();
    }

    const isDubaiSection = section.flag === "featured_dubai";
    const propertiesToShow = isDubaiSection
      ? section.properties.slice(0, MAX_DUBAI_PROPERTIES)
      : section.properties;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto px-3 sm:px-0">
        {propertiesToShow.map((property) => renderPropertyCard(property))}
      </div>
    );
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
      <div className="container-custom space-y-8 sm:space-y-12 md:space-y-16 px-3 sm:px-4">
        {sectionsToRender.map((section) => (
          <div key={section.flag} className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 md:mb-4 font-heading px-2">
                Featured <span className="text-gradient-primary">{section.highlight}</span>
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-2">{section.description}</p>
            </div>
            {renderSectionContent(section)}
          </div>
        ))}

        {!isLoading && !hasAnyFeatured && (
          <div className="text-center py-8 sm:py-12 text-muted-foreground text-xs sm:text-sm md:text-base px-2">
            No featured developments are active yet. Use the admin status toggles to showcase projects per city.
          </div>
        )}

        <div className="text-center mt-8 sm:mt-12">
          <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 text-white px-6 sm:px-8 text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11">
            <Link to="/buy">Explore All Properties</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;
