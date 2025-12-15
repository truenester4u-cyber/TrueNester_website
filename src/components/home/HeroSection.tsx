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
import { fetchPropertiesForLocations } from "@/lib/supabase-queries";

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
  
  const [activeTab, setActiveTab] = useState<"buy" | "rent">("buy");
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
      const properties = await fetchPropertiesForLocations();

      if (properties) {
        const locationMap = new Map<string, LocationItem>();

        properties.forEach((prop: any) => {
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
    
    const basePath = activeTab === "rent" ? "/rent" : "/buy";
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

    const basePath = activeTab === "rent" ? "/rent" : "/buy";
    navigate(`${basePath}?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="relative min-h-[550px] sm:min-h-[660px] md:min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20 md:pt-32 pb-8 sm:pb-12 md:pb-16 px-4">
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-3 sm:px-4 md:px-6 flex flex-col items-center">
        {/* Title and Description */}
        <div className="text-center mb-3 sm:mb-6 md:mb-8 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-0 sm:mb-2 md:mb-3 animate-fade-in font-heading leading-none">
            Find Your Dream Property
            <br />
            <span className="text-gradient-accent block mt-0 sm:mt-1">in Dubai</span>
          </h1>
          <p className="text-[11px] sm:text-sm md:text-base lg:text-lg text-white/90 animate-slide-up px-2">
            Connect with Dubai's finest developers and discover luxury properties tailored for investors
          </p>
        </div>

        {/* Search Widget - Framer-inspired Design */}
        <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-[38rem] xl:max-w-[40rem] animate-slide-up">
          {/* Glassmorphism Card - Compact */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-white/30 p-3 sm:p-4 md:p-5 overflow-hidden">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-emerald-50/30 pointer-events-none rounded-xl sm:rounded-2xl" />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Row 1: Tab Navigation - Minimal pill design */}
              <div className="flex gap-1.5 sm:gap-2 items-center mb-3 sm:mb-4">
                <div className="inline-flex bg-gray-100/60 p-0.5 sm:p-1 rounded-lg sm:rounded-xl">
                  <button
                    onClick={() => setActiveTab("buy")}
                    className={`py-1.5 sm:py-2 px-3 sm:px-5 rounded-md sm:rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                      activeTab === "buy"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setActiveTab("rent")}
                    className={`py-1.5 sm:py-2 px-3 sm:px-5 rounded-md sm:rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                      activeTab === "rent"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Rent
                  </button>
                </div>
              </div>

              {/* Row 2: Location Field - Ultra minimal design */}
              <div className="mb-3 sm:mb-4">
                <div className="relative" ref={locationInputRef}>
                  <div className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200/80 rounded-lg sm:rounded-xl hover:border-emerald-300 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all duration-200">
                    <MapPin className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-emerald-500 flex-shrink-0" />
                    <Input
                      type="text"
                      placeholder="Enter location"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setShowLocationSuggestions(true);
                      }}
                      onKeyPress={handleKeyPress}
                      className="border-0 focus:ring-0 focus:outline-none p-0 flex-1 text-sm h-6 sm:h-7 bg-transparent placeholder:text-gray-400"
                      autoComplete="off"
                    />
                    {location && (
                      <button
                        onClick={() => {
                          setLocation("");
                          setShowLocationSuggestions(false);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <X className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* Location Suggestions Dropdown - Compact */}
                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-lg sm:rounded-xl shadow-xl z-50 max-h-56 sm:max-h-72 overflow-y-auto">
                      {locationSuggestions.map((loc, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleLocationSelect(loc)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2.5 sm:gap-3 hover:bg-emerald-50/60 transition-colors border-b border-gray-50 last:border-b-0 text-left"
                        >
                          <MapPin className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate text-sm">
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
                                className="text-[8px] sm:text-[10px] uppercase tracking-wide bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-medium"
                              >
                                {p === "buy" ? "Buy" : p === "rent" ? "Rent" : p}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Search Button - Sleek gradient */}
              <div className="mb-3 sm:mb-4">
                <Button
                  onClick={handleSearch}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm h-auto shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search Properties
                </Button>
              </div>

              {/* Row 4: Filter Options - Compact grid */}
              <div className="border-t border-gray-100/80 pt-3 sm:pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2">
                  {/* Property Type */}
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className="h-8 sm:h-9 text-[11px] sm:text-xs bg-gray-50/60 border-gray-100 hover:border-emerald-200 rounded-md sm:rounded-lg px-2 sm:px-3 transition-colors">
                      <SelectValue placeholder="Property Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="penthouse">Penthouse</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Bedrooms */}
                  <Select value={bedrooms} onValueChange={setBedrooms}>
                    <SelectTrigger className="h-8 sm:h-9 text-[11px] sm:text-xs bg-gray-50/60 border-gray-100 hover:border-emerald-200 rounded-md sm:rounded-lg px-2 sm:px-3 transition-colors">
                      <SelectValue placeholder="Bedrooms" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
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
                    <SelectTrigger className="h-8 sm:h-9 text-[11px] sm:text-xs bg-gray-50/60 border-gray-100 hover:border-emerald-200 rounded-md sm:rounded-lg px-2 sm:px-3 transition-colors">
                      <SelectValue placeholder="Min Price" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="100000">AED 100K</SelectItem>
                      <SelectItem value="250000">AED 250K</SelectItem>
                      <SelectItem value="500000">AED 500K</SelectItem>
                      <SelectItem value="1000000">AED 1M</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Max Price */}
                  <Select value={maxPrice} onValueChange={setMaxPrice}>
                    <SelectTrigger className="h-8 sm:h-9 text-[11px] sm:text-xs bg-gray-50/60 border-gray-100 hover:border-emerald-200 rounded-md sm:rounded-lg px-2 sm:px-3 transition-colors">
                      <SelectValue placeholder="Max Price" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="1000000">AED 1M</SelectItem>
                      <SelectItem value="2000000">AED 2M</SelectItem>
                      <SelectItem value="5000000">AED 5M+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
