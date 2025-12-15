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
import { Bed, Bath, Square, MapPin, Heart, Grid3x3, List, Search, Building2, X, ChevronDown } from "lucide-react";
import { useIsPropertySaved, useToggleSaveProperty } from "@/hooks/useSavedProperties";
import { useAuth } from "@/contexts/AuthContext.v2";
import { useToast } from "@/hooks/use-toast";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parsePropertyTypes } from "@/lib/utils";
import { Property } from "@/types/property";
import { fetchBuyProperties } from "@/lib/supabase-queries";

// Helper function to format price in K or M for slider display
const formatSliderPrice = (value: number): string => {
  if (value >= 10000000) return "10M+";
  if (value >= 1000000) {
    const millions = value / 1000000;
    // Clean display: 1M, 1.5M, 2M, etc.
    return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1).replace(/\.0$/, '')}M`;
  }
  // For values under 1M, show in K
  return `${Math.round(value / 1000)}K`;
};

// Helper function to parse price from various formats (numeric, "366K", "1.2M", "Starting from AED 366K", etc.)
const parsePriceValue = (numericPrice: number | null | undefined, displayPrice: string | null | undefined): number => {
  // First try the numeric price field
  if (typeof numericPrice === "number" && numericPrice > 0) {
    return numericPrice;
  }
  
  // Try to parse from display string
  if (!displayPrice) return 0;
  
  const text = displayPrice.toLowerCase().replace(/,/g, "");
  
  // Look for patterns like "366k", "1.2m", "2m", etc.
  const millionMatch = text.match(/([\d.]+)\s*m(?:illion)?/i);
  if (millionMatch) {
    return parseFloat(millionMatch[1]) * 1000000;
  }
  
  const thousandMatch = text.match(/([\d.]+)\s*k/i);
  if (thousandMatch) {
    return parseFloat(thousandMatch[1]) * 1000;
  }
  
  // Try to find any number (could be full price like 366000)
  const numberMatch = text.match(/([\d,]+(?:\.\d+)?)/g);
  if (numberMatch) {
    // Get the largest number found (likely the price)
    const numbers = numberMatch.map(n => parseFloat(n.replace(/,/g, "")));
    const maxNum = Math.max(...numbers);
    if (maxNum > 0) return maxNum;
  }
  
  return 0;
};

const usePublishedProperties = (search: string) => {
  return useQuery<Property[], Error>({
    queryKey: ["properties", search],
    queryFn: () => fetchBuyProperties(search),
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
      className="absolute top-4 right-4 w-11 h-11 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-lg z-10 disabled:opacity-50"
    >
      <Heart className={`h-5 w-5 transition-colors ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-700 hover:text-red-500'}`} />
    </button>
  );
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
  const [minPrice, setMinPrice] = useState<string>("any");
  const [maxPrice, setMaxPrice] = useState<string>("any");
  const [minSize, setMinSize] = useState<number | null>(null);
  const [maxSize, setMaxSize] = useState<number | null>(null);
  
  // Min Price options for dropdown
  const minPriceOptions = [
    { value: "any", label: "Any" },
    { value: "300000", label: "300K" },
    { value: "600000", label: "600K" },
    { value: "1000000", label: "1M" },
    { value: "2000000", label: "2M" },
    { value: "3000000", label: "3M" },
    { value: "4000000", label: "4M" },
    { value: "5000000", label: "5M" },
  ];
  
  // Max Price options for dropdown
  const maxPriceOptions = [
    { value: "any", label: "Any" },
    { value: "600000", label: "600K" },
    { value: "1000000", label: "1M" },
    { value: "2000000", label: "2M" },
    { value: "3000000", label: "3M" },
    { value: "4000000", label: "4M" },
    { value: "5000000", label: "5M" },
    { value: "6000000", label: "6M" },
    { value: "7000000", label: "7M" },
    { value: "8000000", label: "8M" },
    { value: "9000000", label: "9M" },
    { value: "10000000", label: "10M+" },
  ];
  
  // Get filtered max options based on selected min price
  const getFilteredMaxOptions = () => {
    if (minPrice === "any") return maxPriceOptions;
    const minVal = parseInt(minPrice);
    return maxPriceOptions.filter(opt => opt.value === "any" || parseInt(opt.value) >= minVal);
  };
  
  // Get filtered min options based on selected max price
  const getFilteredMinOptions = () => {
    if (maxPrice === "any") return minPriceOptions;
    const maxVal = parseInt(maxPrice);
    return minPriceOptions.filter(opt => opt.value === "any" || parseInt(opt.value) <= maxVal);
  };
  
  // Search filter states for Developer and Location
  const [developerSearch, setDeveloperSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [showDeveloperDropdown, setShowDeveloperDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const developerRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  
  const { data: allProperties = [], isLoading } = usePublishedProperties(search);

  // Compute actual price range from properties
  const priceRange = useMemo(() => {
    const prices = allProperties
      .map(p => p.price ?? 0)
      .filter(p => p > 0);
    if (prices.length === 0) return { min: 300000, max: 10000000, step: 50000 };
    
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    // Round min down and max up to nice numbers
    const roundedMin = Math.floor(min / 100000) * 100000;
    const roundedMax = Math.ceil(max / 100000) * 100000;
    // Calculate step based on range (aim for ~20-50 steps)
    const range = roundedMax - roundedMin;
    const step = range <= 1000000 ? 25000 : range <= 5000000 ? 100000 : 250000;
    
    return { min: roundedMin || 100000, max: roundedMax || 10000000, step };
  }, [allProperties]);

  // Compute actual size range from properties
  const sizeRange = useMemo(() => {
    const parseSqft = (value: string | number | null | undefined) => {
      if (typeof value === "number") return value;
      const text = (value ?? "").toString().replace(/,/g, "");
      const match = text.match(/([0-9]+(\.[0-9]+)?)/); 
      return match ? parseFloat(match[1]) : 0;
    };
    const sizes = allProperties
      .map(p => parseSqft(p.size_sqft))
      .filter(s => s > 0);
    if (sizes.length === 0) return { min: 500, max: 4000, step: 50 };
    
    const min = Math.min(...sizes);
    const roundedMin = Math.floor(min / 100) * 100;
    const step = 50;
    
    // Always use 4000 as max regardless of actual property sizes
    return { min: roundedMin || 100, max: 4000, step };
  }, [allProperties]);

  // Initialize size sliders when data loads
  useEffect(() => {
    if (allProperties.length > 0) {
      if (minSize === null) setMinSize(sizeRange.min);
      if (maxSize === null) setMaxSize(sizeRange.max);
    }
  }, [allProperties.length, sizeRange]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (developerRef.current && !developerRef.current.contains(event.target as Node)) {
        setShowDeveloperDropdown(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build dynamic developer options from all properties
  const developerOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string; count: number }>();
    allProperties.forEach((property) => {
      const dev = property.developer?.trim();
      if (!dev) return;
      const value = dev.toLowerCase();
      if (map.has(value)) {
        const existing = map.get(value)!;
        existing.count++;
      } else {
        map.set(value, { value, label: dev, count: 1 });
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count); // Sort by property count (most properties first)
  }, [allProperties]);

  // Filter developers based on search
  const filteredDevelopers = useMemo(() => {
    if (!developerSearch.trim()) return developerOptions;
    const searchLower = developerSearch.toLowerCase();
    return developerOptions.filter(dev => 
      dev.label.toLowerCase().includes(searchLower) || 
      dev.value.toLowerCase().includes(searchLower)
    );
  }, [developerSearch, developerOptions]);

  // Build dynamic location options from all properties (location, city, area)
  const locationOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string; count: number }>();
    allProperties.forEach((property) => {
      const candidates = [property.location, property.city, typeof property.area === "string" ? property.area : ""];
      candidates.forEach((raw) => {
        const label = (raw ?? "").toString().trim();
        if (!label) return;
        const value = label.toLowerCase();
        if (map.has(value)) {
          const existing = map.get(value)!;
          existing.count++;
        } else {
          map.set(value, { value, label, count: 1 });
        }
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count); // Sort by property count (most properties first)
  }, [allProperties]);

  // Filter locations based on search
  const filteredLocations = useMemo(() => {
    if (!locationSearch.trim()) return locationOptions;
    const searchLower = locationSearch.toLowerCase();
    return locationOptions.filter(loc => 
      loc.label.toLowerCase().includes(searchLower) || 
      loc.value.toLowerCase().includes(searchLower)
    );
  }, [locationSearch, locationOptions]);

  // Get display labels
  const selectedDeveloperLabel = developer === "all" ? "" : developerOptions.find(d => d.value === developer)?.label || developer;
  const selectedLocationLabel = location === "all" ? "" : locationOptions.find(l => l.value === location)?.label || location;

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

  // Helper function to parse sqft values
  const parseSqftValue = (value: string | number | null | undefined) => {
    if (typeof value === "number") return value;
    const text = (value ?? "").toString().replace(/,/g, "");
    const match = text.match(/([0-9]+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

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
      // Parse bedroom range from text like "Studio - 4 Bedroom", "1-3 Bedroom", "3 Bedroom"
      const parseBedroomRange = (raw: string | number | null | undefined): { min: number; max: number; hasStudio: boolean } => {
        if (typeof raw === "number") return { min: raw, max: raw, hasStudio: raw === 0 };
        
        const text = String(raw ?? "").toLowerCase();
        const hasStudio = text.includes("studio");
        const numbers = text.match(/\d+/g);
        
        if (!numbers || numbers.length === 0) {
          // Only "Studio" mentioned
          return { min: 0, max: hasStudio ? 0 : 0, hasStudio };
        }
        
        const nums = numbers.map(n => parseInt(n));
        const min = hasStudio ? 0 : Math.min(...nums);
        const max = Math.max(...nums);
        
        return { min, max, hasStudio };
      };
      
      const propRange = parseBedroomRange(property.bedrooms);
      
      if (bedrooms === "studio") {
        // Studio filter: property must include studio (hasStudio or min is 0)
        if (!propRange.hasStudio && propRange.min !== 0) return false;
      } else if (bedrooms === "5+") {
        // 5+ means property has 5 or more bedrooms available
        if (propRange.max < 5) return false;
      } else {
        // 1, 2, 3, 4: show properties that INCLUDE this bedroom count in their range
        // E.g., "4" should match "Studio - 4 Bedroom" but NOT "Studio - 3 Bedroom"
        const bedroomNum = parseInt(bedrooms);
        // Property must have this bedroom count available (within its range)
        if (bedroomNum < propRange.min || bedroomNum > propRange.max) return false;
      }
    }
    if (developer !== "all" && !property.developer?.toLowerCase().includes(developer.toLowerCase())) return false;

    // Price filter - parse price from numeric field or display text
    const price = parsePriceValue(property.price, property.price_display);
    
    // Check minimum price filter
    if (minPrice !== "any") {
      const minPriceNum = parseInt(minPrice);
      // If property has no parseable price, include it (don't exclude)
      if (price > 0 && price < minPriceNum) return false;
    }
    
    // Check maximum price filter (10M+ means no upper limit)
    if (maxPrice !== "any" && maxPrice !== "10000000") {
      const maxPriceNum = parseInt(maxPrice);
      // If property has no parseable price, include it (don't exclude)
      // Only exclude if price is known and exceeds max
      if (price > 0 && price > maxPriceNum) return false;
    }

    // Size filter - only apply if user moved sliders
    const currentMinSize = minSize ?? sizeRange.min;
    const currentMaxSize = maxSize ?? sizeRange.max;
    if (currentMinSize !== sizeRange.min || currentMaxSize !== sizeRange.max) {
      const size = parseSqftValue(property.size_sqft);
      // Include properties with no size (size === 0), only filter if size is known
      if (size > 0 && (size < currentMinSize || size > currentMaxSize)) return false;
    }
    return true;
  });

  // Apply sorting
  const properties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        // Price: Low to High (ascending)
        const priceA_low = parsePriceValue(a.price, a.price_display);
        const priceB_low = parsePriceValue(b.price, b.price_display);
        return priceA_low - priceB_low;
      case "price-high":
        // Price: High to Low (descending)
        const priceA_high = parsePriceValue(a.price, a.price_display);
        const priceB_high = parsePriceValue(b.price, b.price_display);
        return priceB_high - priceA_high;
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
                    setMinPrice("any");
                    setMaxPrice("any");
                    setMinSize(sizeRange.min);
                    setMaxSize(sizeRange.max);
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
                  <CardContent className="p-3">
                    <h3 className="text-sm font-bold mb-3">Filters</h3>
                    <div className="space-y-3">
                      {/* Developer - Searchable dropdown */}
                      <div ref={developerRef} className="relative">
                        <label className="block text-xs font-semibold mb-1.5">Developer</label>
                        <div 
                          className={`group flex items-center gap-2 px-2.5 py-1.5 bg-white border rounded-lg cursor-pointer transition-all duration-200 ${
                            showDeveloperDropdown 
                              ? "border-primary ring-2 ring-primary/20 shadow-sm" 
                              : "border-gray-200 hover:border-primary/50"
                          }`}
                          onClick={() => setShowDeveloperDropdown(!showDeveloperDropdown)}
                        >
                          <Building2 className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="Search developers..."
                            value={showDeveloperDropdown ? developerSearch : selectedDeveloperLabel || "All developers"}
                            onChange={(e) => {
                              setDeveloperSearch(e.target.value);
                              setShowDeveloperDropdown(true);
                            }}
                            onFocus={() => {
                              setShowDeveloperDropdown(true);
                              setDeveloperSearch("");
                            }}
                            className="flex-1 text-xs bg-transparent border-0 outline-none placeholder:text-gray-400"
                          />
                          {developer !== "all" ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeveloper("all");
                                setDeveloperSearch("");
                              }}
                              className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                            >
                              <X className="h-3 w-3 text-gray-400" />
                            </button>
                          ) : (
                            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${showDeveloperDropdown ? "rotate-180" : ""}`} />
                          )}
                        </div>
                        
                        {/* Developer Dropdown */}
                        {showDeveloperDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-150">
                            <button
                              onClick={() => {
                                setDeveloper("all");
                                setDeveloperSearch("");
                                setShowDeveloperDropdown(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-xs hover:bg-primary/5 transition-colors flex items-center justify-between ${developer === "all" ? "bg-primary/10 text-primary font-medium" : ""}`}
                            >
                              <span className="flex items-center gap-2">
                                <Building2 className="h-3 w-3" />
                                All Developers
                              </span>
                              <span className="text-[10px] text-gray-400">{allProperties.length}</span>
                            </button>
                            {filteredDevelopers.map((dev) => (
                              <button
                                key={dev.value}
                                onClick={() => {
                                  setDeveloper(dev.value);
                                  setDeveloperSearch("");
                                  setShowDeveloperDropdown(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-xs hover:bg-primary/5 transition-colors flex items-center justify-between ${developer === dev.value ? "bg-primary/10 text-primary font-medium" : ""}`}
                              >
                                <span className="flex items-center gap-2">
                                  <Building2 className="h-3 w-3" />
                                  {dev.label}
                                </span>
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{dev.count}</span>
                              </button>
                            ))}
                            {filteredDevelopers.length === 0 && (
                              <div className="px-3 py-2 text-xs text-gray-400 text-center">No developers found</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Completion Status */}
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">Completion Status</label>
                        <Select value={completionStatus} onValueChange={setCompletionStatus}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="offplan">Off-Plan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Location - Searchable dropdown */}
                      <div ref={locationRef} className="relative">
                        <label className="block text-xs font-semibold mb-1.5">Location</label>
                        <div 
                          className={`group flex items-center gap-2 px-2.5 py-1.5 bg-white border rounded-lg cursor-pointer transition-all duration-200 ${
                            showLocationDropdown 
                              ? "border-primary ring-2 ring-primary/20 shadow-sm" 
                              : "border-gray-200 hover:border-primary/50"
                          }`}
                          onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                        >
                          <MapPin className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="Search locations..."
                            value={showLocationDropdown ? locationSearch : selectedLocationLabel || "All Areas"}
                            onChange={(e) => {
                              setLocationSearch(e.target.value);
                              setShowLocationDropdown(true);
                            }}
                            onFocus={() => {
                              setShowLocationDropdown(true);
                              setLocationSearch("");
                            }}
                            className="flex-1 text-xs bg-transparent border-0 outline-none placeholder:text-gray-400"
                          />
                          {location !== "all" ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation("all");
                                setLocationSearch("");
                              }}
                              className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                            >
                              <X className="h-3 w-3 text-gray-400" />
                            </button>
                          ) : (
                            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${showLocationDropdown ? "rotate-180" : ""}`} />
                          )}
                        </div>
                        
                        {/* Location Dropdown */}
                        {showLocationDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-150">
                            <button
                              onClick={() => {
                                setLocation("all");
                                setLocationSearch("");
                                setShowLocationDropdown(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-xs hover:bg-primary/5 transition-colors flex items-center justify-between ${location === "all" ? "bg-primary/10 text-primary font-medium" : ""}`}
                            >
                              <span className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                All Areas
                              </span>
                              <span className="text-[10px] text-gray-400">{allProperties.length}</span>
                            </button>
                            {filteredLocations.map((loc) => (
                              <button
                                key={loc.value}
                                onClick={() => {
                                  setLocation(loc.value);
                                  setLocationSearch("");
                                  setShowLocationDropdown(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-xs hover:bg-primary/5 transition-colors flex items-center justify-between ${location === loc.value ? "bg-primary/10 text-primary font-medium" : ""}`}
                              >
                                <span className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  {loc.label}
                                </span>
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{loc.count}</span>
                              </button>
                            ))}
                            {filteredLocations.length === 0 && (
                              <div className="px-3 py-2 text-xs text-gray-400 text-center">No locations found</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Property Type */}
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">Property Type</label>
                        <Select value={propertyType} onValueChange={setPropertyType}>
                          <SelectTrigger className="h-8 text-xs">
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
                        <label className="block text-xs font-semibold mb-1.5">Bedrooms</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[{ label: "All", value: "all" }, { label: "Studio", value: "studio" }, { label: "1", value: "1" }, { label: "2", value: "2" }, { label: "3", value: "3" }, { label: "4", value: "4" }, { label: "5+", value: "5+" }].map((bed) => (
                            <Button
                              key={bed.value}
                              variant={bedrooms === bed.value ? "default" : "outline"}
                              size="sm"
                              className={`h-7 text-xs ${bedrooms === bed.value ? "bg-primary text-white" : "hover:bg-primary hover:text-white"}`}
                              onClick={() => setBedrooms(bed.value)}
                            >
                              {bed.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Price Range */}
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">
                          Price Range (AED)
                        </label>
                        <div className="flex gap-2">
                          {/* Min Price Dropdown */}
                          <div className="flex-1">
                            <Select value={minPrice} onValueChange={(value) => {
                              setMinPrice(value);
                              // Auto-adjust max if min is higher than max
                              if (value !== "any" && maxPrice !== "any" && parseInt(value) > parseInt(maxPrice)) {
                                setMaxPrice("any");
                              }
                            }}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Min Price" />
                              </SelectTrigger>
                              <SelectContent>
                                {getFilteredMinOptions().map((option) => (
                                  <SelectItem key={option.value} value={option.value} className="text-xs">
                                    {option.value === "any" ? "Min" : option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <span className="flex items-center text-xs text-muted-foreground">to</span>
                          
                          {/* Max Price Dropdown */}
                          <div className="flex-1">
                            <Select value={maxPrice} onValueChange={(value) => {
                              setMaxPrice(value);
                              // Auto-adjust min if max is lower than min
                              if (value !== "any" && minPrice !== "any" && parseInt(value) < parseInt(minPrice)) {
                                setMinPrice("any");
                              }
                            }}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Max Price" />
                              </SelectTrigger>
                              <SelectContent>
                                {getFilteredMaxOptions().map((option) => (
                                  <SelectItem key={option.value} value={option.value} className="text-xs">
                                    {option.value === "any" ? "Max" : option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {/* Show selected range */}
                        {(minPrice !== "any" || maxPrice !== "any") && (
                          <div className="mt-1 text-[10px] text-muted-foreground text-center">
                            {minPrice !== "any" ? minPriceOptions.find(o => o.value === minPrice)?.label : "Any"}
                            {" - "}
                            {maxPrice !== "any" ? maxPriceOptions.find(o => o.value === maxPrice)?.label : "Any"}
                          </div>
                        )}
                      </div>

                      {/* Size Range */}
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">Size (sqft)</label>
                        <Slider
                          value={[minSize ?? sizeRange.min, maxSize ?? sizeRange.max]}
                          onValueChange={([min, max]) => {
                            setMinSize(min);
                            setMaxSize(max);
                          }}
                          min={sizeRange.min}
                          max={sizeRange.max}
                          step={sizeRange.step}
                          className="mb-1"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{(minSize ?? sizeRange.min).toLocaleString()}</span>
                          <span>{(maxSize ?? sizeRange.max).toLocaleString()}</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full h-8 text-xs bg-gradient-primary hover:opacity-90"
                        onClick={() => {
                          setPropertyType("all");
                          setCompletionStatus("all");
                          setLocation("all");
                          setBedrooms("all");
                          setDeveloper("all");
                          setMinPrice("any");
                          setMaxPrice("any");
                          setMinSize(sizeRange.min);
                          setMaxSize(sizeRange.max);
                          setDeveloperSearch("");
                          setLocationSearch("");
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
                              <HeartButton 
                                propertyId={property.id}
                                propertyTitle={property.title}
                                propertyImage={property.featured_image}
                                propertyPrice={property.price}
                              />
                              
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

export default Buy;
