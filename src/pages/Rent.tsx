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
import { useIsPropertySaved, useToggleSaveProperty } from "@/hooks/useSavedProperties";
import { useAuth } from "@/contexts/AuthContext.v2";
import { useToast } from "@/hooks/use-toast";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parsePropertyTypes } from "@/lib/utils";
import { Property } from "@/types/property";
import { fetchRentalProperties } from "@/lib/supabase-queries";

const usePublishedRentals = (search: string) => {
  return useQuery<Property[], Error>({
    queryKey: ["rentals", search],
    queryFn: async () => {
      const allData = await fetchRentalProperties();
      
      if (!search.trim()) {
        return allData;
      }

      const searchLower = search.toLowerCase();
      return allData.filter((p) => 
        p.title?.toLowerCase().includes(searchLower) ||
        p.location?.toLowerCase().includes(searchLower)
      );
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Heart Button Component
const HeartButton = ({ propertyId, propertyTitle, propertyImage, propertyPrice }: { 
  propertyId: string; 
  propertyTitle: string; 
  propertyImage?: string;
  propertyPrice?: number;
}) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: isFavorite = false } = useIsPropertySaved(propertyId);
  const { toggleSave, isLoading } = useToggleSaveProperty();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Make sure you are logged in",
        variant: "destructive",
      });
      return;
    }

    await toggleSave(propertyId, isFavorite, {
      title: propertyTitle,
      image: propertyImage,
      price: propertyPrice?.toString(),
    });
  };

  return (
    <button 
      onClick={handleClick}
      disabled={isLoading}
      className="w-9 h-9 md:w-11 md:h-11 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-lg disabled:opacity-50"
    >
      <Heart className={`h-4 w-4 md:h-5 md:w-5 transition-colors ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-700 hover:text-red-500'}`} />
    </button>
  );
};

const Rent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [subarea, setSubarea] = useState<string>("all");
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [bedrooms, setBedrooms] = useState<string>("all");
  const [propertyType, setPropertyType] = useState<string>("all");
  const [furnishing, setFurnishing] = useState<string>("all");
  const [minRent, setMinRent] = useState<string>("any");
  const [maxRent, setMaxRent] = useState<string>("any");
  const [minSize, setMinSize] = useState<number>(500);
  const [maxSize, setMaxSize] = useState<number>(10000);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const { data: allProperties = [], isLoading } = usePublishedRentals(search);

  // Min Rent options for dropdown (yearly rent in AED)
  const minRentOptions = [
    { value: "any", label: "Any" },
    { value: "50000", label: "50K" },
    { value: "75000", label: "75K" },
    { value: "100000", label: "100K" },
    { value: "150000", label: "150K" },
    { value: "200000", label: "200K" },
    { value: "300000", label: "300K" },
    { value: "400000", label: "400K" },
    { value: "500000", label: "500K" },
  ];

  // Max Rent options for dropdown (yearly rent in AED)
  const maxRentOptions = [
    { value: "any", label: "Any" },
    { value: "75000", label: "75K" },
    { value: "100000", label: "100K" },
    { value: "150000", label: "150K" },
    { value: "200000", label: "200K" },
    { value: "300000", label: "300K" },
    { value: "400000", label: "400K" },
    { value: "500000", label: "500K" },
    { value: "750000", label: "750K" },
    { value: "1000000", label: "1M" },
    { value: "1500000", label: "1.5M" },
    { value: "2000000", label: "2M+" },
  ];

  // Get filtered max options based on selected min rent
  const getFilteredMaxRentOptions = () => {
    if (minRent === "any") return maxRentOptions;
    const minVal = parseInt(minRent);
    return maxRentOptions.filter(opt => opt.value === "any" || parseInt(opt.value) >= minVal);
  };

  // Get filtered min options based on selected max rent
  const getFilteredMinRentOptions = () => {
    if (maxRent === "any") return minRentOptions;
    const maxVal = parseInt(maxRent);
    return minRentOptions.filter(opt => opt.value === "any" || parseInt(opt.value) <= maxVal);
  };

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

  // Filtered location options based on typeahead query
  const filteredLocationOptions = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) return locationOptions;
    return locationOptions.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [locationOptions, locationQuery]);

  // Search suggestions based on property titles and locations
  const searchSuggestions = useMemo(() => {
    if (!search.trim() || search.trim().length < 2) return [];
    const searchLower = search.toLowerCase();
    const suggestions = new Set<string>();
    
    allProperties.forEach((property) => {
      if (property.title?.toLowerCase().includes(searchLower)) {
        suggestions.add(property.title);
      }
      if (property.location?.toLowerCase().includes(searchLower)) {
        suggestions.add(property.location);
      }
      if (property.city?.toLowerCase().includes(searchLower)) {
        suggestions.add(property.city);
      }
    });
    
    return Array.from(suggestions).slice(0, 8);
  }, [search, allProperties]);

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

  // Helpers placed before usage to avoid initialization errors
  const parseSqftValue = (value: string | number | null | undefined) => {
    if (typeof value === "number") return value;
    const text = (value ?? "").toString().replace(/,/g, "");
    const match = text.match(/([0-9]+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const parsePriceValue = (price?: number | null, display?: string | null) => {
    if (typeof price === "number" && price > 0) return price;
    const text = (display ?? "").toString().toLowerCase().replace(/,/g, "").trim();
    if (!text) return 0;
    const match = text.match(/([0-9]+(?:\.[0-9]+)?)(\s*[km])/i);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = match[2].trim().toLowerCase();
      if (unit === "k") return Math.round(num * 1000);
      if (unit === "m") return Math.round(num * 1_000_000);
    }
    const plain = text.match(/([0-9]+(?:\.[0-9]+)?)/);
    return plain ? Math.round(parseFloat(plain[1])) : 0;
  };

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

    // Yearly Rent filter - parse price from numeric field or display text
    const price = parsePriceValue(property.price, property.price_display);
    
    // Check minimum rent filter
    if (minRent !== "any") {
      const minRentNum = parseInt(minRent);
      // If property has no parseable price, include it (don't exclude)
      if (price > 0 && price < minRentNum) return false;
    }
    
    // Check maximum rent filter (2M+ means no upper limit)
    if (maxRent !== "any" && maxRent !== "2000000") {
      const maxRentNum = parseInt(maxRent);
      // If property has no parseable price, include it (don't exclude)
      // Only exclude if price is known and exceeds max
      if (price > 0 && price > maxRentNum) return false;
    }

    // Size filter - only apply if user moved sliders
    if (minSize !== 500 || maxSize !== 10000) {
      const propSize = parseSqftValue(property.size_sqft);
      // Skip properties with no size or apply range filter
      if (propSize === 0 || propSize < minSize || propSize > maxSize) return false;
    }

    return true;
  });

  // Apply sorting
  const sortedProperties = useMemo(() => {
    const sorted = [...properties];
    
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => {
          const priceA = parsePriceValue(a.price, a.price_display);
          const priceB = parsePriceValue(b.price, b.price_display);
          return priceA - priceB;
        });
      
      case "price-high":
        return sorted.sort((a, b) => {
          const priceA = parsePriceValue(a.price, a.price_display);
          const priceB = parsePriceValue(b.price, b.price_display);
          return priceB - priceA;
        });
      
      case "newest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
      
      default: // relevance
        return sorted;
    }
  }, [properties, sortBy]);

  // Removed duplicate parseSqftValue (moved above)

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
    minRent !== "any" || 
    maxRent !== "any" || 
    minSize !== 500 || 
    maxSize !== 10000;

  // Clear all filters
  const clearFilters = () => {
    setFurnishing("all");
    setSubarea("all");
    setPropertyType("all");
    setBedrooms("all");
    setMinRent("any");
    setMaxRent("any");
    setMinSize(500);
    setMaxSize(10000);
    setSearchParams(new URLSearchParams());
  };

  return (
    <Layout>
      <div className="pt-20">
        {/* Quick Search */}
        <section className="bg-background border-b py-2.5 sm:py-3 gap-4">
          <div className="container-custom px-3 sm:px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
                <div className="md:col-span-2 relative">
                  <Input
                    placeholder="Search..."
                    className="text-xs sm:text-sm h-8 sm:h-9"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowSearchSuggestions(true);
                    }}
                    onFocus={() => setShowSearchSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                  />
                  {showSearchSuggestions && searchSuggestions.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg max-h-64 overflow-auto">
                      <CardContent className="p-1">
                        {searchSuggestions.map((suggestion, idx) => (
                          <Button
                            key={idx}
                            variant="ghost"
                            className="w-full justify-start text-xs sm:text-sm h-8"
                            onClick={() => {
                              setSearch(suggestion);
                              setShowSearchSuggestions(false);
                            }}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-9">
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
                  className="bg-gradient-primary hover:opacity-90 text-xs sm:text-sm h-8 sm:h-9"
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
        <section className="py-3 sm:py-5">
          <div className="container-custom px-3 sm:px-4">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              {/* Filters Sidebar - Collapsible on mobile */}
              <aside className="w-full lg:w-72 flex-shrink-0">
                {/* Mobile: Collapsible button */}
                <div className="lg:hidden mb-4">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-between text-sm h-8"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <span>Filters</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </Button>
                </div>

                {/* Filters content - Visible on desktop, toggleable on mobile */}
                <Card className={`sticky top-20 shadow-md ${!showFilters && 'hidden lg:block'}`}>
                  <CardContent className="p-2 sm:p-3">
                    <h3 className="text-sm md:text-base font-bold mb-2 sm:mb-3">Filters</h3>
                    <div className="space-y-2 sm:space-y-3">
                      {/* Furnishing */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1">Furnishing</label>
                        <Select value={furnishing} onValueChange={(value) => setFurnishing(value)}>
                          <SelectTrigger className="w-full text-xs sm:text-sm h-8 sm:h-9">
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
                        <label className="block text-xs sm:text-sm font-semibold mb-1">Location</label>
                        <Select 
                          value={subarea} 
                          onValueChange={(value) => {
                            setSubarea(value);
                            setLocationQuery("");
                          }}
                        >
                          <SelectTrigger className="w-full text-xs sm:text-sm h-8 sm:h-9">
                            <SelectValue placeholder="All Areas" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <div className="sticky top-0 bg-background z-10 p-2 border-b">
                              <Input
                                placeholder="Type to search areas..."
                                value={locationQuery}
                                onChange={(e) => setLocationQuery(e.target.value)}
                                className="w-full text-xs sm:text-sm h-8"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <SelectItem value="all">All Areas</SelectItem>
                            {filteredLocationOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Property Type */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1">Property Type</label>
                        <Select value={propertyType} onValueChange={(value) => setPropertyType(value)}>
                          <SelectTrigger className="w-full text-xs sm:text-sm h-8 sm:h-9">
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
                        <label className="block text-xs sm:text-sm font-semibold mb-1">Bedrooms</label>
                        <div className="grid grid-cols-3 gap-1 sm:gap-2">
                          {["All", "Studio", "1", "2", "3", "4", "5+"].map((bed) => {
                            const bedVal = bed === "All" ? "all" : bed === "Studio" ? "studio" : bed === "5+" ? "5+" : bed;
                            return (
                              <Button
                                key={bed}
                                variant={bedrooms === bedVal ? "default" : "outline"}
                                size="sm"
                                className={`text-xs h-7 sm:h-8 ${bedrooms === bedVal ? "bg-primary text-white" : "hover:bg-primary/10"}`}
                                onClick={() => setBedrooms(bedrooms === bedVal ? "all" : bedVal)}
                              >
                                {bed}
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Price Range - Min/Max Selects */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1">Yearly Rent (AED)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Select 
                            value={minRent} 
                            onValueChange={(value) => {
                              setMinRent(value);
                              // Adjust maxRent if it's now less than minRent
                              if (maxRent !== "any" && value !== "any") {
                                const minVal = parseInt(value);
                                const maxVal = parseInt(maxRent);
                                if (maxVal < minVal) {
                                  setMaxRent(value);
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="w-full text-xs sm:text-sm h-8 sm:h-9">
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                            <SelectContent>
                              {getFilteredMinRentOptions().map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select 
                            value={maxRent} 
                            onValueChange={(value) => {
                              setMaxRent(value);
                              // Adjust minRent if it's now greater than maxRent
                              if (minRent !== "any" && value !== "any") {
                                const minVal = parseInt(minRent);
                                const maxVal = parseInt(value);
                                if (minVal > maxVal) {
                                  setMinRent(value);
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="w-full text-xs sm:text-sm h-8 sm:h-9">
                              <SelectValue placeholder="Max" />
                            </SelectTrigger>
                            <SelectContent>
                              {getFilteredMaxRentOptions().map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Size Range */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1">Size (sqft)</label>
                        <Slider
                          value={[minSize, maxSize]}
                          onValueChange={([min, max]) => {
                            setMinSize(min);
                            setMaxSize(max);
                          }}
                          min={500}
                          max={10000}
                          step={100}
                          className="mb-1.5"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{minSize.toLocaleString()}</span>
                          <span>{maxSize.toLocaleString()}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-gradient-primary hover:opacity-90 text-xs sm:text-sm h-8 sm:h-9"
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
                      <span className="text-primary">{sortedProperties.length}</span> properties found
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-32 sm:w-40 text-xs sm:text-sm h-8 sm:h-9">
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
                        className="h-8 w-8 sm:h-9 sm:w-9"
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid3x3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9"
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
                ) : sortedProperties.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground px-2">No properties found. Try adjusting your search or filters.</p>
                  </div>
                ) : (
                  <div className={`grid ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-2" : "grid-cols-1"} gap-6 md:gap-4`}>
                    {sortedProperties.map((property) => {
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
                            <div className="relative overflow-hidden h-64 md:h-80">
                              {/* 4-Image Grid Layout for all screen sizes from 307px */}
                              <div className="flex gap-1 sm:gap-2 h-full">
                                {/* Main large image - 65% width on all screens */}
                                <div className="flex-[65] relative overflow-hidden">
                                  <img
                                    src={mainImage}
                                    alt={property.title}
                                    className="w-full h-full object-contain md:object-cover group-hover:scale-105 transition-all duration-700"
                                  />
                                  
                                  {property.featured && (
                                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 md:top-4 md:left-4 z-10">
                                      <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 rounded-md shadow-lg">FEATURED</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Right column with stacked thumbnails - Visible on all screens from 307px */}
                                <div className="flex flex-[35] flex-col gap-1 sm:gap-2">
                                  {thumbnails.slice(0, 2).map((img: string, idx: number) => (
                                    <div key={idx} className="flex-1 relative overflow-hidden rounded-sm sm:rounded-md">
                                      <img
                                        src={img}
                                        alt={`${property.title} - ${idx + 2}`}
                                        className="w-full h-full object-contain md:object-cover group-hover:scale-105 transition-all duration-700"
                                      />
                                    </div>
                                  ))}
                                  {/* Bottom thumbnail with photo counter overlay */}
                                  {thumbnails.length >= 1 && (
                                    <div className="flex-1 relative overflow-hidden rounded-sm sm:rounded-md">
                                      <img
                                        src={thumbnails[2] || thumbnails[0]}
                                        alt={`${property.title}`}
                                        className="w-full h-full object-contain md:object-cover group-hover:scale-105 transition-all duration-700"
                                      />
                                      {totalPhotos > 4 && (
                                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                                          <span className="text-white text-base sm:text-xl md:text-2xl font-bold">+{totalPhotos - 4}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {thumbnails.length < 3 && Array.from({ length: 3 - thumbnails.length }).map((_, idx) => (
                                    <div key={`placeholder-${idx}`} className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-sm sm:rounded-md" />
                                  ))}
                                </div>
                              </div>
                              
                              {/* Heart button - Smaller on mobile */}
                              <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10">
                                <HeartButton 
                                  propertyId={property.id}
                                  propertyTitle={property.title}
                                  propertyImage={property.featured_image}
                                  propertyPrice={property.price}
                                />
                              </div>
                              
                              {/* Price badge - Responsive sizing */}
                              <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 bg-white rounded-lg md:rounded-xl px-3 py-2 md:px-5 md:py-3 z-10 shadow-xl">
                                <div className="text-sm md:text-lg font-bold text-gray-900 flex items-center gap-1">
                                  <span>{priceLabel}</span>
                                  {showMonthlySuffix && (
                                    <span className="text-xs md:text-sm font-normal text-gray-600">/mo</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Photo count badge - Mobile only */}
                              {totalPhotos > 1 && (
                                <div className="md:hidden absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 z-10">
                                  <span className="text-white text-xs font-medium">{totalPhotos} Photos</span>
                                </div>
                              )}
                            </div>

                            <CardContent className="p-4 md:p-6">
                              <div className="mb-3 md:mb-4">
                                {property.developer && (
                                  <p className="text-xs text-primary font-bold mb-1.5 md:mb-2 uppercase tracking-wide">
                                    {property.developer}
                                  </p>
                                )}
                                <h3 className="text-base md:text-lg font-bold mb-1.5 md:mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                                  {property.title}
                                </h3>
                                <p className="text-sm md:text-base text-primary flex items-center gap-1.5 font-semibold">
                                  <MapPin className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0 text-primary" />
                                  <span className="line-clamp-1">{getAreaDisplay(property)}</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-3 md:gap-5 text-sm md:text-lg text-gray-700 border-t border-gray-100 pt-3 md:pt-4">
                                {property.bedrooms && (
                                  <div className="flex items-center gap-1 md:gap-1.5">
                                    <Bed className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                                    <span className="font-medium text-xs md:text-base">{property.bedrooms}</span>
                                  </div>
                                )}
                                {property.bathrooms && (
                                  <div className="flex items-center gap-1 md:gap-1.5">
                                    <Bath className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                                    <span className="font-medium text-xs md:text-base">{property.bathrooms}</span>
                                  </div>
                                )}
                                {property.size_sqft && (
                                  <div className="flex items-center gap-1 md:gap-1.5">
                                    <Square className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                                    <span className="font-medium text-xs md:text-base">{formatSizeValue(property.size_sqft)}</span>
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
