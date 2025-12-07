import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Bed, Bath, Square, MapPin, Heart, Grid3x3, List } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { parsePropertyTypes } from "@/lib/utils";

type Property = Tables<"properties">;

const usePublishedProperties = (search: string) => {
  return useQuery<Property[], Error>({
    queryKey: ["properties", search],
    queryFn: async () => {
      let query = supabase.from("properties").select("*").eq("published", true).in("purpose", ["buy", "sale"]).order("created_at", {
        ascending: false,
      });
      if (search.trim()) {
        query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%`);
      }
      const { data, error } = await query.limit(48);
      if (error) throw error;
      return (data || []) as Property[];
    },
  });
};

const Buy = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState<string>("all");
  const [completionStatus, setCompletionStatus] = useState<string>("all");
  const [location, setLocation] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [bedrooms, setBedrooms] = useState<string>("all");
  const [developer, setDeveloper] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [minPrice, setMinPrice] = useState<number>(500000);
  const [maxPrice, setMaxPrice] = useState<number>(10000000);
  const [minSize, setMinSize] = useState<number>(500);
  const [maxSize, setMaxSize] = useState<number>(10000);
  const { data: allProperties = [], isLoading } = usePublishedProperties(search);

  // Build dynamic location options from all properties (location, city, area)
  const locationOptions = useMemo(() => {
    const map = new Map<string, string>();
    allProperties.forEach((property) => {
      const candidates = [property.location, property.city, typeof property.area === "string" ? property.area : ""];
      candidates.forEach((raw) => {
        const label = (raw ?? "").toString().trim();
        if (!label) return;
        const value = label.toLowerCase();
        if (!map.has(value)) {
          map.set(value, label);
        }
      });
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allProperties]);

  // Initialize filters from URL query parameters
  useEffect(() => {
    const type = searchParams.get("type");
    const loc = searchParams.get("location");
    const cityParam = searchParams.get("city");
    const beds = searchParams.get("bedrooms");
    
    if (type) setPropertyType(type);
    if (loc) setLocation(loc);
    if (cityParam) setCity(cityParam);
    if (beds) setBedrooms(beds);
  }, [searchParams]);

  // Apply filters
  const filteredProperties = allProperties.filter((property) => {
    if (propertyType !== "all") {
      const propertyTypes = parsePropertyTypes(property.property_type).map((type) => type.toLowerCase());
      if (!propertyTypes.includes(propertyType)) return false;
    }
    if (completionStatus !== "all" && property.completion_status?.toLowerCase().replace('-', '') !== completionStatus.replace('-', '')) return false;
    if (location !== "all") {
      const loc = property.location?.toLowerCase() || "";
      const cityVal = property.city?.toLowerCase() || "";
      const areaVal = typeof property.area === "string" ? property.area.toLowerCase() : "";
      const target = location.toLowerCase();
      if (!loc.includes(target) && !cityVal.includes(target) && !areaVal.includes(target)) return false;
    }
    if (city !== "all" && property.city?.toLowerCase() !== city.toLowerCase()) return false;
    if (bedrooms !== "all") {
      // Normalize bedroom text like "Studio - 2 Bedroom" to the numeric bedroom count
      const propBedrooms = (() => {
        const raw = property.bedrooms;
        if (typeof raw === "number") return raw;
        const text = (raw ?? "").toString().toLowerCase();
        // If it mentions studio at all (e.g., "Studio - 2 Bedroom"), treat as studio (0)
        if (text.includes("studio")) return 0;
        const matches = text.match(/\d+/g);
        if (matches && matches.length) return parseInt(matches[matches.length - 1]);
        return 0;
      })();
      
      if (bedrooms === "studio") {
        // Studio means exactly 0 bedrooms
        if (propBedrooms !== 0) return false;
      } else if (bedrooms === "5+") {
        // 5+ means 5 or more bedrooms
        if (propBedrooms < 5) return false;
      } else {
        // 1, 2, 3, 4 means that many bedrooms or LESS (maximum filter)
        // Selecting 3 bedrooms shows: Studio(0), 1, 2, 3 bedroom properties
        const bedroomNum = parseInt(bedrooms);
        if (propBedrooms > bedroomNum) return false;
      }
    }
    if (developer !== "all" && !property.developer?.toLowerCase().includes(developer.toLowerCase())) return false;

    // Price filter - only apply if user moved sliders
    if (minPrice !== 500000 || maxPrice !== 10000000) {
      const price = property.price ?? 0;
      if (price === 0 || price < minPrice || price > maxPrice) return false;
    }

    // Size filter - only apply if user moved sliders
    if (minSize !== 500 || maxSize !== 10000) {
      const size = property.size_sqft ?? 0;
      if (size === 0 || size < minSize || size > maxSize) return false;
    }
    return true;
  });

  // Apply sorting
  const properties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return (a.price ?? 0) - (b.price ?? 0);
      case "price-high":
        return (b.price ?? 0) - (a.price ?? 0);
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  const formatPrice = (price?: number) =>
    typeof price === "number"
      ? new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", minimumFractionDigits: 0 }).format(price)
      : "";

  const getDisplayPrice = (property: Property) => {
    const label = property.price_display?.trim();
    if (label) return label;
    return formatPrice(property.price ?? undefined);
  };

  const getAreaDisplay = (property: Property) => {
    const area = typeof property.area === "string" ? property.area.trim() : "";
    if (area) return area;
    const locationLabel = typeof property.location === "string" ? property.location.trim() : "";
    if (locationLabel) return locationLabel;
    return property.city || "";
  };

  return (
    <Layout>
      <div className="pt-20">
        {/* Quick Search */}
        <section className="bg-background border-b py-3 gap-4">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  placeholder="Search by title or location..."
                  className="md:col-span-2"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="penthouse">Penthouse</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  className="bg-gradient-primary hover:opacity-90"
                  onClick={() => {
                    setPropertyType("all");
                    setCompletionStatus("all");
                    setLocation("all");
                    setBedrooms("all");
                    setDeveloper("all");
                    setMinPrice(500000);
                    setMaxPrice(10000000);
                    setMinSize(500);
                    setMaxSize(10000);
                    setSearch("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-4">
          <div className="container-custom">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Filters Sidebar */}
              <aside className="lg:w-72 flex-shrink-0">
                <Card className="sticky top-20 shadow-md">
                  <CardContent className="p-4">
                    <h3 className="text-base font-bold mb-4">Filters</h3>
                    <div className="space-y-4">
                      {/* Completion Status */}
                      <div>
                        <label className="block text-sm font-semibold mb-2">Completion Status</label>
                        <Select value={completionStatus} onValueChange={setCompletionStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="offplan">Off-Plan</SelectItem>
                            <SelectItem value="underconstruction">Under Construction</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-sm font-semibold mb-2">Location</label>
                        <Select value={location} onValueChange={setLocation}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select area" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Areas</SelectItem>
                            {locationOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Property Type */}
                      <div>
                        <label className="block text-sm font-semibold mb-2">Property Type</label>
                        <Select value={propertyType} onValueChange={setPropertyType}>
                          <SelectTrigger>
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="villa">Villa</SelectItem>
                            <SelectItem value="penthouse">Penthouse</SelectItem>
                            <SelectItem value="townhouse">Townhouse</SelectItem>
                            <SelectItem value="land">Land</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Bedrooms */}
                      <div>
                        <label className="block text-sm font-semibold mb-2">Bedrooms</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[{ label: "All", value: "all" }, { label: "Studio", value: "studio" }, { label: "1", value: "1" }, { label: "2", value: "2" }, { label: "3", value: "3" }, { label: "4", value: "4" }, { label: "5+", value: "5+" }].map((bed) => (
                            <Button
                              key={bed.value}
                              variant={bedrooms === bed.value ? "default" : "outline"}
                              size="sm"
                              className={bedrooms === bed.value ? "bg-primary text-white" : "hover:bg-primary hover:text-white"}
                              onClick={() => setBedrooms(bed.value)}
                            >
                              {bed.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Price Range */}
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Price Range (AED)
                        </label>
                        <Slider
                          value={[minPrice, maxPrice]}
                          onValueChange={([min, max]) => {
                            setMinPrice(min);
                            setMaxPrice(max);
                          }}
                          min={500000}
                          max={10000000}
                          step={50000}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{Math.round(minPrice / 1000)}K</span>
                          <span>{Math.round(maxPrice / 1000)}K</span>
                        </div>
                      </div>

                      {/* Size Range */}
                      <div>
                        <label className="block text-sm font-semibold mb-2">Size (sqft)</label>
                        <Slider
                          value={[minSize, maxSize]}
                          onValueChange={([min, max]) => {
                            setMinSize(min);
                            setMaxSize(max);
                          }}
                          min={500}
                          max={10000}
                          step={50}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{minSize.toLocaleString()}</span>
                          <span>{maxSize.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Developer */}
                      <div>
                        <label className="block text-sm font-semibold mb-2">Developer</label>
                        <Select value={developer} onValueChange={setDeveloper}>
                          <SelectTrigger>
                            <SelectValue placeholder="All developers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="emaar">Emaar</SelectItem>
                            <SelectItem value="damac">Damac</SelectItem>
                            <SelectItem value="nakheel">Nakheel</SelectItem>
                            <SelectItem value="sobha">Sobha</SelectItem>
                            <SelectItem value="binghatti">Binghatti</SelectItem>
                            <SelectItem value="azizi">Azizi</SelectItem>
                            <SelectItem value="meraas">Meraas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        className="w-full bg-gradient-primary hover:opacity-90"
                        onClick={() => {
                          setPropertyType("all");
                          setCompletionStatus("all");
                          setLocation("all");
                          setBedrooms("all");
                          setDeveloper("all");
                          setMinPrice(500000);
                          setMaxPrice(10000000);
                          setMinSize(500);
                          setMaxSize(10000);
                        }}
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </aside>

              {/* Results Section */}
              <div className="flex-1">
                {/* Results Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <p className="text-base font-semibold">
                      <span className="text-primary">{properties.length}</span> properties found
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="icon"
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid3x3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="icon"
                        onClick={() => setViewMode("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Property Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-96 bg-muted animate-pulse rounded-2xl" />
                    ))}
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No properties found. Try adjusting your search or filters.</p>
                  </div>
                ) : (
                  <div className={`grid ${viewMode === "grid" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"} gap-4`}>
                    {properties.map((property: any) => {
                      const images = property.images || [];
                      const allImages = property.featured_image ? [property.featured_image, ...images.filter((img: string) => img !== property.featured_image)] : images;
                      const displayImages = allImages.length > 0 ? allImages : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop"];
                      const totalPhotos = allImages.length > 0 ? allImages.length : 1;
                      const mainImage = displayImages[0];
                      const thumbnails = displayImages.slice(1, 4);
                      const hasMultipleImages = displayImages.length > 1;
                      
                      return (
                        <Card
                          key={property.id}
                          className="overflow-hidden hover-lift group cursor-pointer border-0 shadow-lg"
                        >
                          <Link to={`/property/${property.id}`} onClick={() => window.scrollTo(0, 0)}>
                            <div className="relative overflow-hidden h-80">
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
                                      <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-lg">FEATURED</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex gap-2 h-full">
                                  {/* Main large image */}
                                  <div className={`${thumbnails.length > 0 ? 'flex-[65]' : 'w-full'} relative overflow-hidden`}>
                                    <img
                                      src={mainImage}
                                      alt={property.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                                    />
                                    {property.featured && (
                                      <div className="absolute top-4 left-4 z-10">
                                        <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-lg">FEATURED</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Right column with stacked thumbnails - only show if thumbnails exist */}
                                  {thumbnails.length > 0 && (
                                    <div className="flex-[35] flex flex-col gap-2">
                                      {thumbnails.map((img: string, idx: number) => (
                                        <div key={idx} className="flex-1 relative overflow-hidden rounded-md">
                                          <img
                                            src={img}
                                            alt={`${property.title} - ${idx + 2}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                                          />
                                          {/* Show +N overlay on last thumbnail if more images exist */}
                                          {idx === thumbnails.length - 1 && totalPhotos > 4 && (
                                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                                              <span className="text-white text-2xl font-bold">+{totalPhotos - 4}</span>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Overlay elements with improved styling */}
                              <button className="absolute top-4 right-4 w-11 h-11 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-lg z-10">
                                <Heart className="h-5 w-5 text-gray-700 hover:text-red-500 transition-colors" />
                              </button>
                              
                              {/* Price badge with enhanced styling */}
                              <div className="absolute bottom-4 left-4 bg-white rounded-xl px-5 py-3 z-10 shadow-xl">
                                <div className="text-lg font-bold text-gray-900">
                                  {getDisplayPrice(property)}
                                </div>
                              </div>
                            </div>

                            <CardContent className="p-6">
                              <div className="mb-4">
                                {property.developer && (
                                  <p className="text-xs text-primary font-bold mb-2 uppercase tracking-wide">
                                    {property.developer}
                                  </p>
                                )}
                                <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                                  {property.title}
                                </h3>
                                <p className="text-base text-primary flex items-center gap-1.5 font-semibold">
                                  <MapPin className="h-5 w-5 flex-shrink-0 text-primary" />
                                  <span className="line-clamp-1">{getAreaDisplay(property)}</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-5 text-lg text-gray-700 border-t border-gray-100 pt-4">
                                {property.bedrooms && (
                                  <div className="flex items-center gap-1.5">
                                    <Bed className="h-5 w-5 text-primary" />
                                    <span className="font-medium">{property.bedrooms}</span>
                                  </div>
                                )}
                                {property.bathrooms && (
                                  <div className="flex items-center gap-1.5">
                                    <Bath className="h-5 w-5 text-primary" />
                                    <span className="font-medium">{property.bathrooms}</span>
                                  </div>
                                )}
                                {property.size_sqft && (
                                  <div className="flex items-center gap-1.5">
                                    <Square className="h-5 w-5 text-primary" />
                                    <span className="font-medium">{Number(property.size_sqft).toLocaleString()} sqft</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Link>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Buy;
