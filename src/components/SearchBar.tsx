import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Home, DollarSign, Bed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchBarProps {
  variant?: "compact";
}

const SearchBar = ({ variant = "compact" }: SearchBarProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"buy" | "rent" | "offplan" | null>(null);
  const [location, setLocation] = useState<string>("");
  const [propertyType, setPropertyType] = useState<string>("");
  const [bedrooms, setBedrooms] = useState<string>("");
  const [priceRange, setPriceRange] = useState<string>("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (activeTab) params.append("tab", activeTab);
    if (location) params.append("location", location);
    if (propertyType) params.append("type", propertyType);
    if (bedrooms) params.append("bedrooms", bedrooms);
    if (priceRange) params.append("price", priceRange);

    const basePath = activeTab === "rent" ? "/rent" : activeTab === "offplan" ? "/off-plan" : "/buy";
    navigate(`${basePath}?${params.toString()}`);
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-3 sm:p-4 md:p-5">
      {/* First Row: Buy/Rent/Off Plan Tabs + Location Field */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
        {/* Buy/Rent/Off Plan Tabs */}
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => setActiveTab("buy")}
            className={`py-2 sm:py-2.5 px-4 sm:px-5 rounded-lg font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
              activeTab === "buy"
                ? "bg-gradient-primary text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setActiveTab("rent")}
            className={`py-2 sm:py-2.5 px-4 sm:px-5 rounded-lg font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
              activeTab === "rent"
                ? "bg-gradient-primary text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Rent
          </button>
          <button
            onClick={() => setActiveTab("offplan")}
            className={`py-2 sm:py-2.5 px-4 sm:px-5 rounded-lg font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
              activeTab === "offplan"
                ? "bg-gradient-primary text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Off Plan
          </button>
        </div>

        {/* Location Field with Icon */}
        <div className="flex-1 flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:border-primary transition-colors">
          <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
          <Input
            type="text"
            placeholder="Enter location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border-0 focus:ring-0 focus:outline-none p-0 placeholder:text-gray-400 text-sm"
          />
        </div>
      </div>

      {/* Second Row: Property Type, Bedrooms, Price, Search Button */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {/* Property Type - Only show for Buy and Rent */}
        {activeTab !== "offplan" && (
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              <Home className="h-3 w-3 inline mr-1" />
              Type
            </label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="penthouse">Penthouse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Bedrooms */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            <Bed className="h-3 w-3 inline mr-1" />
            Beds
          </label>
          <Select value={bedrooms} onValueChange={setBedrooms}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            <DollarSign className="h-3 w-3 inline mr-1" />
            Price
          </label>
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="500k-1m">500K-1M</SelectItem>
              <SelectItem value="1m-2m">1M-2M</SelectItem>
              <SelectItem value="2m-5m">2M-5M</SelectItem>
              <SelectItem value="5m-10m">5M-10M</SelectItem>
              <SelectItem value="10m+">10M+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search Button - Full width on last column */}
        <div className="col-span-2 sm:col-span-1 flex items-end">
          <Button onClick={handleSearch} className="w-full bg-gradient-primary hover:opacity-90 text-white h-9 text-xs sm:text-sm rounded-lg">
            <Search className="h-3 w-3 mr-1" />
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
