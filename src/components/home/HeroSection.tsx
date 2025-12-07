import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Home, DollarSign, Bed, X, Building2, Palmtree, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface LocationItem {
  name: string;
  subtext: string;
  city: string;
  type: "location" | "city";
  purposes: string[]; // buy/rent/offplan
}

const HeroSection = () => {
  const navigate = useNavigate();
  const locationInputRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<"buy" | "rent" | "offplan">("buy");
  const [location, setLocation] = useState<string>("");
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [propertyType, setPropertyType] = useState<string>("");
  const [bedrooms, setBedrooms] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [allLocations, setAllLocations] = useState<LocationItem[]>([]);

  // Fetch all unique locations from properties
  useEffect(() => {
    const fetchLocations = async () => {
      const { data: properties } = await supabase
        .from("properties")
        .select("location, area, city, purpose")
        .eq("published", true);

      if (properties) {
        const locationMap = new Map<string, LocationItem>();

        properties.forEach((prop) => {
          if (prop.location) {
            const key = `${prop.location}-${prop.city}`;
            const existing = locationMap.get(key);
            const purpose = (prop as any).purpose?.toLowerCase?.() || "";
            const normalizedPurpose =
              purpose === "sale" || purpose === "sell" || purpose === "buy"
                ? "buy"
                : purpose === "off-plan" || purpose === "offplan" || purpose === "off plan"
                ? "offplan"
                : purpose === "rent" || purpose === "rental" || purpose === "lease"
                ? "rent"
                : "";

            if (!existing) {
              const purposes = normalizedPurpose ? [normalizedPurpose] : [];
              locationMap.set(key, {
                name: prop.location,
                subtext: `${prop.area || ""}, ${prop.city}`.replace(/^, /, ""),
                city: prop.city,
                type: "location",
                purposes,
              });
            } else {
              const purposes = new Set(existing.purposes);
              if (normalizedPurpose) {
                purposes.add(normalizedPurpose);
              }
              locationMap.set(key, { ...existing, purposes: Array.from(purposes) });
            }
          }
        });

        setAllLocations(Array.from(locationMap.values()));
      }
    };

    fetchLocations();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter location suggestions based on input (word by word search)
  const locationSuggestions = useMemo(() => {
    if (!location.trim()) return []; // Only show when there's actual input
    
    const searchTerm = location.toLowerCase().trim();
    const matched = allLocations
      .filter((loc) => {
        const purposesText = loc.purposes?.join(" ") || "";
        const fullText = `${loc.name} ${loc.subtext} ${purposesText}`.toLowerCase();
        // Check if search term matches any word in the location, subtext, or purposes (e.g., rent)
        return searchTerm.split(" ").every((word) => fullText.includes(word));
      });

    // When on a specific tab (buy/rent/offplan), prioritize matches that actually have that purpose
    const tabFiltered = matched.filter((loc) => loc.purposes?.includes(activeTab));
    const finalList = tabFiltered.length > 0 ? tabFiltered : matched;

    return finalList.slice(0, 10); // Limit to 10 results
  }, [location, allLocations, activeTab]);

  const handleLocationSelect = (selectedLocation: LocationItem) => {
    setLocation(selectedLocation.name);
    setShowLocationSuggestions(false);
    
    // Navigate to Buy/Rent/Off-Plan page with location filter
    const basePath = activeTab === "rent" ? "/rent" : activeTab === "offplan" ? "/off-plan" : "/buy";
    const params = new URLSearchParams();
    params.append("location", selectedLocation.name);
    if (selectedLocation.city) params.append("city", selectedLocation.city);
    navigate(`${basePath}?${params.toString()}`);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    params.append("tab", activeTab);
    if (location.trim()) params.append("location", location.trim());
    if (propertyType) params.append("type", propertyType);
    if (bedrooms) params.append("bedrooms", bedrooms);
    if (minPrice) params.append("minPrice", minPrice);
    if (maxPrice) params.append("maxPrice", maxPrice);

    const basePath = activeTab === "rent" ? "/rent" : activeTab === "offplan" ? "/off-plan" : "/buy";
    navigate(`${basePath}?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="relative min-h-[500px] sm:min-h-[600px] md:h-[90vh] md:max-h-[700px] flex items-center justify-center overflow-hidden mt-[15px] py-6 sm:py-8 md:py-0">
      {/* Background Video with Overlay */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/hero-video.mp4.mp4" type="video/mp4" />
          {/* Fallback image if video doesn't load */}
          <img
            src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&auto=format&fit=crop"
            alt="Dubai Skyline"
            className="w-full h-full object-cover"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-3 sm:px-4 md:px-6 flex flex-col items-center">
        {/* Title and Description */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 md:mb-4 animate-fade-in font-heading leading-tight">
            Find Your Dream Property
            <br />
            <span className="text-gradient-accent block mt-1 sm:mt-2">in Dubai</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/90 animate-slide-up px-2">
            Connect with Dubai's finest developers and discover luxury properties tailored for Indian investors
          </p>
        </div>

        {/* Search Widget - Fully Responsive */}
        <div className="w-full max-w-2xl sm:max-w-3xl lg:max-w-[40rem] xl:max-w-[42rem] bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl p-2 sm:p-3 md:p-4 animate-slide-up">
          {/* Row 1: Tab Navigation - Fully responsive */}
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center mb-2 sm:mb-3">
            <button
              onClick={() => setActiveTab("buy")}
              className={`py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 flex-shrink-0 ${
                activeTab === "buy"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setActiveTab("rent")}
              className={`py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 flex-shrink-0 ${
                activeTab === "rent"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Rent
            </button>
            <button
              onClick={() => setActiveTab("offplan")}
              className={`py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 flex-shrink-0 ${
                activeTab === "offplan"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Off-Plan
            </button>
          </div>

          {/* Row 2: Location Field - Stacks on mobile */}
          <div className="mb-2 sm:mb-3">
            <div className="relative" ref={locationInputRef}>
              <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl hover:border-gray-300 focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/10 transition-all duration-200 bg-white">
                <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-primary flex-shrink-0" />
                <Input
                  type="text"
                  placeholder="Enter location"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setShowLocationSuggestions(true);
                  }}
                  onKeyPress={handleKeyPress}
                  className="border-0 focus:ring-0 focus:outline-none p-0 flex-1 text-xs sm:text-sm bg-white placeholder:text-gray-400"
                  autoComplete="off"
                />
                {location && (
                  <button
                    onClick={() => {
                      setLocation("");
                      setShowLocationSuggestions(false);
                    }}
                    className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Location Suggestions Dropdown - Mobile optimized */}
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 sm:mt-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-xl z-50 max-h-64 sm:max-h-96 overflow-y-auto" style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                  {locationSuggestions.map((loc, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLocationSelect(loc)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-start gap-2 sm:gap-3 hover:bg-primary/5 transition-colors duration-150 border-b border-gray-100 last:border-b-0 text-left"
                    >
                      <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-xs sm:text-sm">
                          {loc.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {loc.subtext}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {loc.purposes?.map((p) => (
                          <span
                            key={p}
                            className="text-[8px] sm:text-[10px] uppercase tracking-wide bg-primary/10 text-primary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold"
                          >
                            {p === "buy" ? "Buy" : p === "rent" ? "Rent" : p === "offplan" ? "Off-Plan" : p}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Search Button - Full width on mobile */}
          <div className="mb-2 sm:mb-3">
            <Button
              onClick={handleSearch}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 sm:py-2.5 rounded-lg sm:rounded-lg font-semibold text-xs sm:text-sm h-auto"
            >
              Search Properties
            </Button>
          </div>

          {/* Row 4: Filter Options - Grid layout, responsive */}
          <div className="border-t border-gray-100 pt-2 sm:pt-3">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {/* Property Type */}
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm border rounded-lg">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="penthouse">Penthouse</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                </SelectContent>
              </Select>

              {/* Beds & Baths */}
              <Select value={bedrooms} onValueChange={setBedrooms}>
                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm border rounded-lg">
                  <SelectValue placeholder="Bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="1">1 Bed</SelectItem>
                  <SelectItem value="2">2 Beds</SelectItem>
                  <SelectItem value="3">3 Beds</SelectItem>
                  <SelectItem value="4">4 Beds</SelectItem>
                  <SelectItem value="5">5+ Beds</SelectItem>
                </SelectContent>
              </Select>

              {/* Min Price */}
              <Select value={minPrice} onValueChange={setMinPrice}>
                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm border rounded-lg">
                  <SelectValue placeholder="Min Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100000">AED 100K</SelectItem>
                  <SelectItem value="250000">AED 250K</SelectItem>
                  <SelectItem value="500000">AED 500K</SelectItem>
                  <SelectItem value="1000000">AED 1M</SelectItem>
                </SelectContent>
              </Select>

              {/* Max Price */}
              <Select value={maxPrice} onValueChange={setMaxPrice}>
                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm border rounded-lg">
                  <SelectValue placeholder="Max Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000000">AED 1M</SelectItem>
                  <SelectItem value="2000000">AED 2M</SelectItem>
                  <SelectItem value="5000000">AED 5M+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
