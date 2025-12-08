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
import { Bed, Bath, Square, MapPin, Heart, Grid3x3, List, ChevronDown } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parsePropertyTypes } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;

const usePublishedRentals = (search: string) => {
  return useQuery<Property[], Error>({
    queryKey: ["rentals", search],
    queryFn: async () => {
      let query = supabase
        .from("properties")
        .select("*")
        .eq("published", true)
        .eq("purpose", "rent")
        .order("created_at", { ascending: false });
      
      if (search.trim()) {
        query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%`);
      }
      const { data, error } = await query.limit(48);
      if (error) throw error;
      return (data || []) as Property[];
    },
  });
};

const Rent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [subarea, setSubarea] = useState<string>("all");
  const [bedrooms, setBedrooms] = useState<string>("all");
  const [propertyType, setPropertyType] = useState<string>("all");
  const [furnishing, setFurnishing] = useState<string>("all");
  const [minRent, setMinRent] = useState<number>(50000);
  const [maxRent, setMaxRent] = useState<number>(2000000);
  const [minSize, setMinSize] = useState<number>(500);
  const [maxSize, setMaxSize] = useState<number>(10000);
  const [showFilters, setShowFilters] = useState(false);
  const { data: allProperties = [], isLoading } = usePublishedRentals(search);

  // Helper function to slugify location names
  const slugify = (value?: string | null) =>
    (value || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  // Build dynamic location/subarea options from all properties (location, city, area)
  const locationOptions = useMemo(() => {
    const map = new Map<string, string>();
    allProperties.forEach((property) => {
      const candidates = [property.location, property.city, typeof property.area === "string" ? property.area : ""];
      candidates.forEach((raw) => {
        const label = (raw ?? "").toString().trim();
        if (!label) return;
        const value = slugify(label);
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
    const loc = searchParams.get("location");
    const cityParam = searchParams.get("city");
    const sub = searchParams.get("subarea");
    const beds = searchParams.get("bedrooms");
    const typeParam = searchParams.get("type");
    const query = searchParams.get("q");
    
    if (loc) setLocation(loc);
    if (cityParam) setCity(cityParam);
    if (sub) setSubarea(sub);
    if (beds) setBedrooms(beds);
    if (typeParam) setPropertyType(typeParam);
    if (query) setSearch(query);
  }, [searchParams]);

  // Apply filters - each filter is independent and only applies if explicitly set by user
  const properties = allProperties.filter((property) => {
    // Location/Subarea filter - match against location or area fields
    if (subarea !== "all") {
      const locSlug = slugify(property.location);
      const areaSlug = slugify(property.area as string | undefined);
      const citySlug = slugify(property.city as string | undefined);
      
      // Check if any of the location fields match the selected subarea
      const matchesLocation = locSlug === subarea || areaSlug === subarea || citySlug === subarea;
      if (!matchesLocation) return false;
    }

    // Property Type filter
    if (propertyType !== "all") {
      const types = parsePropertyTypes(property.property_type || "");
      if (!types.includes(propertyType)) return false;
    }

    // Bedrooms filter - maximum match logic
    if (bedrooms !== "all") {
      // Normalize bedroom text like "Studio - 2 Bedroom" to the numeric bedroom count
      const propBedrooms = (() => {
        const raw = property.bedrooms;
        if (typeof raw === "number") return raw;
        const text = String(raw ?? "").toLowerCase();
        const matches = text.match(/\d+/g);
        if (matches && matches.length) return parseInt(matches[matches.length - 1]);
        if (text.includes("studio")) return 0;
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

    // Furnishing filter - match against furnished field
    if (furnishing !== "all") {
      const propFurn = (property.furnished || "").toString().toLowerCase().trim();
      const searchFurn = furnishing.toLowerCase();
      
      // Exact matching with proper handling
      if (searchFurn === "furnished") {
        // Match "furnished" or "fully furnished", but exclude "unfurnished" and "semi"
        const hasFurnished = propFurn === "furnished" || propFurn === "fully furnished" || propFurn === "yes";
        if (!hasFurnished) return false;
      } else if (searchFurn === "unfurnished") {
        // Match "unfurnished" or "no"
        const isUnfurnished = propFurn === "unfurnished" || propFurn === "no" || propFurn === "";
        if (!isUnfurnished) return false;
      } else if (searchFurn === "semi-furnished") {
        // Match "semi-furnished" or "semi furnished" or "partially furnished"
        const isSemi = propFurn.includes("semi") || propFurn.includes("partial");
        if (!isSemi) return false;
      }
    }

    // Yearly Rent filter - only apply if user moved sliders
    if (minRent !== 50000 || maxRent !== 2000000) {
      const propPrice = property.price ?? 0;
      // Skip properties with no price or apply range filter
      if (propPrice === 0 || propPrice < minRent || propPrice > maxRent) return false;
    }

    // Size filter - only apply if user moved sliders
    if (minSize !== 500 || maxSize !== 10000) {
      const propSize = parseSqftValue(property.size_sqft);
      // Skip properties with no size or apply range filter
      if (propSize === 0 || propSize < minSize || propSize > maxSize) return false;
    }

    return true;
  });

  const parseSqftValue = (value: string | number | null | undefined) => {
    if (typeof value === "number") return value;
    const text = (value ?? "").toString().replace(/,/g, "");
    const match = text.match(/([0-9]+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

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

  const formatSizeValue = (value?: string | number | null) => {
    if (value === null || value === undefined) return "";
    const raw = typeof value === "number" ? value.toString() : value.toString().trim();
    if (!raw) return "";
    const numeric = Number(raw.replace(/,/g, ""));
    if (Number.isFinite(numeric) && /^[0-9.,]+$/.test(raw.replace(/\s+/g, ""))) {
      return `${numeric.toLocaleString()} sqft`;
    }
    return raw;
  };

  // Check if any filters are active
  const hasActiveFilters = 
    furnishing !== "all" || 
    subarea !== "all" || 
    propertyType !== "all" || 
    bedrooms !== "all" || 
    minRent !== 50000 || 
    maxRent !== 2000000 || 
    minSize !== 500 || 
    maxSize !== 10000;

  // Clear all filters
  const clearFilters = () => {
    setFurnishing("all");
    setSubarea("all");
    setPropertyType("all");
    setBedrooms("all");
    setMinRent(50000);
    setMaxRent(2000000);
    setMinSize(500);
    setMaxSize(10000);
    setSearchParams(new URLSearchParams());
  };

  return (
    <Layout>
      <div className="pt-20">
        {/* Quick Search */}
        <section className="bg-background border-b py-3 sm:py-4 gap-4">
          <div className="container-custom px-3 sm:px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                <Input
                  placeholder="Search..."
                  className="md:col-span-2 text-xs sm:text-sm h-9 sm:h-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10">
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
                  className="bg-gradient-primary hover:opacity-90 text-xs sm:text-sm h-9 sm:h-10"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (search.trim()) params.set("q", search.trim());
                    if (propertyType !== "all") params.set("type", propertyType);
                    if (location !== "all") params.set("location", location);
                    if (city !== "all") params.set("city", city);
                    if (subarea !== "all") params.set("subarea", subarea);
                    if (bedrooms !== "all") params.set("bedrooms", bedrooms);
                    setSearchParams(params);
                  }}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-4 sm:py-6">
          <div className="container-custom px-3 sm:px-4">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              {/* Filters Sidebar - Collapsible on mobile */}
              <aside className="w-full lg:w-72 flex-shrink-0">
                {/* Mobile: Collapsible button */}
                <div className="lg:hidden mb-4">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-between text-sm h-9"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <span>Filters</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </Button>
                </div>

                {/* Filters content - Visible on desktop, toggleable on mobile */}
                <Card className={`sticky top-20 shadow-md ${!showFilters && 'hidden lg:block'}`}>
                  <CardContent className="p-3 sm:p-4">
                    <h3 className="text-sm md:text-base font-bold mb-3 sm:mb-4">Filters</h3>
                    <div className="space-y-3 sm:space-y-4">
                      {/* Furnishing */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-2">Furnishing</label>
                        <Select value={furnishing} onValueChange={(value) => setFurnishing(value)}>
                          <SelectTrigger className="w-full text-xs sm:text-sm h-9 sm:h-10">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="furnished">Furnished</SelectItem>
                            <SelectItem value="unfurnished">Unfurnished</SelectItem>
                            <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-2">Location</label>
                        <Select value={subarea} onValueChange={(value) => setSubarea(value)}>
                          <SelectTrigger className="w-full text-xs sm:text-sm h-9 sm:h-10">
                            <SelectValue placeholder="All Areas" />
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
                        <label className="block text-xs sm:text-sm font-semibold mb-2">Property Type</label>
                        <Select value={propertyType} onValueChange={(value) => setPropertyType(value)}>
                          <SelectTrigger className="w-full text-xs sm:text-sm h-9 sm:h-10">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="villa">Villa</SelectItem>
                            <SelectItem value="penthouse">Penthouse</SelectItem>
                            <SelectItem value="townhouse">Townhouse</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Bedrooms */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-2">Bedrooms</label>
                        <div className="grid grid-cols-3 gap-1 sm:gap-2">
                          {["All", "Studio", "1", "2", "3", "4", "5+"].map((bed) => {
                            const bedVal = bed === "All" ? "all" : bed === "Studio" ? "studio" : bed === "5+" ? "5+" : bed;
                            return (
                              <Button
                                key={bed}
                                variant={bedrooms === bedVal ? "default" : "outline"}
                                size="sm"
                                className={`text-xs h-8 sm:h-9 ${bedrooms === bedVal ? "bg-primary text-white" : "hover:bg-primary/10"}`}
                                onClick={() => setBedrooms(bedrooms === bedVal ? "all" : bedVal)}
                              >
                                {bed}
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Price Range */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-2">
                          Yearly Rent (AED)
                        </label>
                        <Slider
                          value={[minRent, maxRent]}
                          onValueChange={([min, max]) => {
                            setMinRent(min);
                            setMaxRent(max);
                          }}
                          min={50000}
                          max={2000000}
                          step={10000}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{Math.round(minRent / 1000)}K</span>
                          <span>{Math.round(maxRent / 1000)}K</span>
                        </div>
                      </div>

                      {/* Size Range */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-2">Size (sqft)</label>
                        <Slider
                          value={[minSize, maxSize]}
                          onValueChange={([min, max]) => {
                            setMinSize(min);
                            setMaxSize(max);
                          }}
                          min={500}
                          max={10000}
                          step={100}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{minSize.toLocaleString()}</span>
                          <span>{maxSize.toLocaleString()}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-gradient-primary hover:opacity-90 text-xs sm:text-sm h-9 sm:h-10"
                        onClick={() => {
                          if (hasActiveFilters) {
                            clearFilters();
                          } else {
                            const params = new URLSearchParams();
                            if (search.trim()) params.set("q", search.trim());
                            if (propertyType !== "all") params.set("type", propertyType);
                            if (subarea !== "all") params.set("subarea", subarea);
                            if (bedrooms !== "all") params.set("bedrooms", bedrooms);
                            if (furnishing !== "all") params.set("furnishing", furnishing);
                            setSearchParams(params);
                          }
                        }}
                      >
                        {hasActiveFilters ? "Clear Filters" : "Apply Filters"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </aside>

              {/* Results Section */}
              <div className="flex-1">
                {/* Results Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
                  <div>
                    <p className="text-xs sm:text-sm md:text-base font-semibold">
                      <span className="text-primary">{properties.length}</span> properties found
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <Select defaultValue="relevance">
                      <SelectTrigger className="w-32 sm:w-40 text-xs sm:text-sm h-9 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1 sm:gap-2">
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="icon"
                        className="h-9 w-9 sm:h-10 sm:w-10"
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid3x3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="icon"
                        className="h-9 w-9 sm:h-10 sm:w-10"
                        onClick={() => setViewMode("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Property Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-64 sm:h-72 md:h-96 bg-muted animate-pulse rounded-lg sm:rounded-2xl" />
                    ))}
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground px-2">No properties found. Try adjusting your search or filters.</p>
                  </div>
                ) : (
                  <div className={`grid ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2" : "grid-cols-1"} gap-2 sm:gap-3 md:gap-4`}>
                    {properties.map((property) => {
                      const images = (property.images as string[]) || [];
                      const allImages = property.featured_image ? [property.featured_image, ...images.filter((img: string) => img !== property.featured_image)] : images;
                      const displayImages = allImages.length > 0 ? allImages : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop"];
                      const totalPhotos = allImages.length > 0 ? allImages.length : 1;
                      const mainImage = displayImages[0];
                      const thumbnails = displayImages.slice(1, 4);
                      const priceLabel = getDisplayPrice(property);
                      const showMonthlySuffix = !property.price_display?.trim();
                      
                      return (
                        <Card
                          key={property.id}
                          className="overflow-hidden hover-lift group cursor-pointer border-0 shadow-lg"
                        >
                          <Link to={`/property/${property.id}`} onClick={() => window.scrollTo(0, 0)}>
                            <div className="relative overflow-hidden h-80">
                              {/* Enhanced Grid Layout: Main image with side thumbnails */}
                              <div className="flex gap-2 h-full">
                                {/* Main large image - 65% width */}
                                <div className="flex-[65] relative overflow-hidden">
                                  <img
                                    src={mainImage}
                                    alt={property.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                                  />
                                  {/* Gradient overlay for better text visibility */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                  
                                  {property.featured && (
                                    <div className="absolute top-4 left-4 z-10">
                                      <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-lg">FEATURED</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Right column with stacked thumbnails - 35% width */}
                                <div className="flex-[35] flex flex-col gap-2">
                                  {thumbnails.slice(0, 2).map((img: string, idx: number) => (
                                    <div key={idx} className="flex-1 relative overflow-hidden rounded-md">
                                      <img
                                        src={img}
                                        alt={`${property.title} - ${idx + 2}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                                      />
                                    </div>
                                  ))}
                                  {/* Bottom thumbnail with photo counter overlay */}
                                  {thumbnails.length >= 1 && (
                                    <div className="flex-1 relative overflow-hidden rounded-md">
                                      <img
                                        src={thumbnails[2] || thumbnails[0]}
                                        alt={`${property.title}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                                      />
                                      {totalPhotos > 4 && (
                                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                                          <span className="text-white text-2xl font-bold">+{totalPhotos - 4}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {thumbnails.length < 3 && Array.from({ length: 3 - thumbnails.length }).map((_, idx) => (
                                    <div key={`placeholder-${idx}`} className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-md" />
                                  ))}
                                </div>
                              </div>
                              
                              {/* Overlay elements with improved styling */}
                              <button className="absolute top-4 right-4 w-11 h-11 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-lg z-10">
                                <Heart className="h-5 w-5 text-gray-700 hover:text-red-500 transition-colors" />
                              </button>
                              
                              {/* Price badge with enhanced styling */}
                              <div className="absolute bottom-4 left-4 bg-white rounded-xl px-5 py-3 z-10 shadow-xl">
                                <div className="text-lg font-bold text-gray-900 flex items-center gap-1">
                                  <span>{priceLabel}</span>
                                  {showMonthlySuffix && (
                                    <span className="text-sm font-normal text-gray-600">/mo</span>
                                  )}
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
                                    <span className="font-medium">{formatSizeValue(property.size_sqft)}</span>
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

export default Rent;
