import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bed, Bath, MapPin, Square } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Property } from "@/types/property";
import { fetchRentalProperties } from "@/lib/supabase-queries";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop";

const useJumeirahRentals = () => {
  return useQuery<Property[], Error>({
    queryKey: ["jumeirah-rentals"],
    queryFn: async () => {
      const allRentals = await fetchRentalProperties();

      if (!allRentals || allRentals.length === 0) {
        return [];
      }

      // Filter for Dubai rentals
      const dubaiRentals = (allRentals as Property[])
        .filter((property: Property) => {
          const city = String(property.city || "").toLowerCase();
          return city.includes("dubai") || city === "";
        })
        .slice(0, 6);

      if (dubaiRentals.length > 0) {
        return dubaiRentals;
      }

      return (allRentals as Property[]).slice(0, 6);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

const JumeirahRentals = () => {
  const { data: rentals = [], isLoading } = useJumeirahRentals();

  // Default rentals for when no database rentals are available
  const defaultRentals = [
    {
      title: "Skyline Apartments",
      price: "From AED 120K / year",
      beds: "1-3 BR",
      baths: "1-2 BA",
      highlight: "Panoramic Marina views just steps from JBR beach.",
      image:
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900&auto=format&fit=crop",
    },
    {
      title: "Garden Villas",
      price: "From AED 280K / year",
      beds: "3-5 BR",
      baths: "4-6 BA",
      highlight: "Private pools and lush courtyards in Jumeirah Park.",
      image:
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=900&auto=format&fit=crop",
    },
    {
      title: "Beachfront Penthouses",
      price: "From AED 450K / year",
      beds: "4-6 BR",
      baths: "5-7 BA",
      highlight: "Wraparound terraces overlooking the Arabian Gulf.",
      image:
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&auto=format&fit=crop",
    },
  ];

  const formatPrice = (price: number) => {
    if (!price) return "";
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
    }).format(Number(price));
  };

  const parseSqft = (sqft: any): number | null => {
    if (!sqft) return null;
    // Convert to string and remove all non-numeric characters except decimal point
    const cleanValue = String(sqft).replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleanValue);
    return !isNaN(parsed) && parsed > 0 ? parsed : null;
  };

  const displayRentals = rentals.length > 0 ? rentals : defaultRentals;
  const rentalPropertiesCount = rentals.length > 0 ? rentals.length : 0;

  const renderPropertyCard = (property: Property | typeof defaultRentals[0]) => {
    const isDbProperty = "id" in property;

    if (isDbProperty) {
      const images = Array.isArray(property.images) ? (property.images as string[]) : [];
      const baseImages = property.featured_image
        ? [property.featured_image, ...images.filter((img) => img !== property.featured_image)]
        : images;
      const mainImage = baseImages.length > 0 ? baseImages[0] : PLACEHOLDER_IMAGE;

      return (
        <Card key={property.id} className="overflow-hidden border-0 shadow-lg hover-lift group cursor-pointer">
          <Link to={`/property/${property.id}`} onClick={() => window.scrollTo(0, 0)} className="block">
            <div className="h-[336px] w-full overflow-hidden relative"> {/* 20% increase from h-56 (224px) to 268px, but using 336px for more impact */}
              <img
                src={mainImage}
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                style={{ minWidth: '120%', minHeight: '120%' }}
              />
            </div>
            <CardContent className="p-4 space-y-2">
              <div className="mb-2">
                <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors line-clamp-2">{property.title}</h3>
                <p className="text-primary font-semibold text-base">{formatPrice(property.price as number)}</p>
              </div>
              <p className="text-muted-foreground text-xs line-clamp-2">
                {typeof property.description === 'string'
                  ? property.description.replace(/<[^>]*>/g, '').substring(0, 100)
                  : ''}
              </p>
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-700 pt-2">
                {property.bedrooms && (
                  <span className="flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    {property.bedrooms} BR
                  </span>
                )}
                {property.bathrooms && (
                  <span className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    {Number(property.bathrooms).toFixed(1)} BA
                  </span>
                )}
                {(() => {
                  const sqftValue = parseSqft(property.size_sqft);
                  return sqftValue ? (
                    <span className="flex items-center gap-1">
                      <Square className="w-4 h-4" />
                      {sqftValue.toLocaleString()} sqft
                    </span>
                  ) : null;
                })()}
              </div>
              {property.location && (
                <p className="text-xs text-gray-900 font-medium flex items-center gap-1 pt-2">
                  <MapPin className="h-4 w-4" />
                  {property.location}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-primary hover:bg-primary-dark text-white text-xs py-2">View Details</Button>
                <Button variant="outline" className="flex-1 text-xs py-2">
                  Enquire Now
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>
      );
    } else {
      // Render default property card
      return (
        <Card key={property.title} className="overflow-hidden border-0 shadow-lg hover-lift group cursor-pointer">
          <div className="h-[336px] w-full overflow-hidden relative"> {/* 20% increase from h-56 (224px) to 268px, but using 336px for more impact */}
            <img
              src={property.image}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
              style={{ minWidth: '120%', minHeight: '120%' }}
            />
          </div>
          <CardContent className="p-4 space-y-2">
            <div className="mb-2">
              <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors line-clamp-2">{property.title}</h3>
              <p className="text-primary font-semibold text-base">{property.price}</p>
            </div>
            <p className="text-muted-foreground text-xs line-clamp-2">{property.highlight}</p>
            <div className="flex items-center gap-4 text-xs font-semibold text-gray-700 pt-2">
              <span className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                {property.beds}
              </span>
              <span className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                {property.baths}
              </span>
              <span className="flex items-center gap-1">
                Beach Access
              </span>
              <span className="flex items-center gap-1">
                Full Daylight
              </span>
            </div>
            <Button asChild className="w-full bg-gradient-primary hover:opacity-90 text-xs py-2">
              <Link to="/rent">View Rental Details</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }
  };

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/20">
        <div className="container-custom space-y-10">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Jumeirah Rentals
            </p>
            <h2 className="text-3xl md:text-4xl font-bold font-heading mt-3 mb-4">
              Explore <span className="text-gradient-primary">Rentals in Jumeirah</span>
            </h2>
            <p className="text-muted-foreground">
              Curated homes minutes from the beach, perfectly suited for modern families and
              professionals who want effortless resort living in the city.
            </p>
          </div>
          {renderSkeletonGrid()}
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/20">
      <div className="container-custom space-y-10">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Jumeirah Rentals
          </p>
          <h2 className="text-3xl md:text-4xl font-bold font-heading mt-3 mb-4">
            Explore <span className="text-gradient-primary">Rentals in Jumeirah</span>
          </h2>
          <p className="text-muted-foreground">
            {rentalPropertiesCount > 0
              ? `Discover ${rentalPropertiesCount} exclusive rental properties in Jumeirah. Curated homes minutes from the beach, perfectly suited for modern families and professionals.`
              : "Curated homes minutes from the beach, perfectly suited for modern families and professionals who want effortless resort living in the city."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayRentals.map((property) => renderPropertyCard(property))}
        </div>

        {rentalPropertiesCount > 0 && (
          <div className="text-center">
            <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 text-white px-8">
              <Link to="/rent">View All Rental Properties</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default JumeirahRentals;
