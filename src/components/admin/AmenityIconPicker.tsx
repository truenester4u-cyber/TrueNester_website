import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { getAmenityIcon, getAmenityColor } from "@/lib/amenityIcons";

interface AmenityIconPickerProps {
  onSelect: (amenity: string) => void;
  selectedAmenities: string[];
  onRemove: (index: number) => void;
}

const PREDEFINED_AMENITIES = [
  "Resort Style Pool",
  "Kids Play Area",
  "Adult Pool",
  "BBQ Area",
  "Outdoor Gym",
  "MUGA Court",
  "Padel Court",
  "Ping Pong Table",
  "Kids Pool",
  "Cabanas & Swing Sweats",
  "Swimming Pool",
  "Gym",
  "Security",
  "Parking",
  "24/7 Security",
  "Covered Parking",
  "Central Air Conditioning",
  "Built in Wardrobes",
  "Balcony",
  "Maids Room",
  "Private Garden",
  "Walk-in Closet",
  "Study Room",
  "Laundry Room",
  "Spa",
  "Sauna",
  "Steam Room",
  "Jacuzzi",
  "Tennis Court",
  "Basketball Court",
  "Squash Court",
  "Jogging Track",
  "Cycling Track",
  "Yoga Studio",
  "Children's Pool",
  "Barbecue Area",
  "Community Center",
  "Clubhouse",
  "Concierge",
  "Reception",
  "Lobby",
  "Elevator",
  "Valet Parking",
  "Visitor Parking",
  "Underground Parking",
  "Retail Center",
  "Cafeteria",
  "Restaurant",
  "Supermarket",
  "Mosque",
  "School Nearby",
  "Hospital Nearby",
  "Beach Access",
  "Waterfront",
  "Sea View",
  "Park Nearby",
  "Pet Friendly",
  "Wheelchair Accessible",
  "Smart Home",
  "High Speed Internet",
  "Satellite/Cable TV",
  "Intercom",
  "CCTV",
  "Fire Alarm",
  "Maintenance",
  "Cleaning Services",
  "Landscaped Gardens",
  "Infinity Pool",
  "Rooftop Pool",
  "Indoor Pool",
  "Heated Pool",
  "Olympic Pool",
  "Lap Pool",
  "Splash Pad",
  "Water Slides",
  "Lazy River",
  "Wave Pool",
  "Private Beach",
  "Marina Access",
  "Boat Dock",
  "Fishing Pier",
  "Golf Course View",
  "Golf Course Access",
  "Driving Range",
  "Putting Green",
  "Cricket Pitch",
  "Football Field",
  "Volleyball Court",
  "Badminton Court",
  "Climbing Wall",
  "Skate Park",
  "Running Track",
  "Outdoor Cinema",
  "Amphitheater",
  "Event Space",
  "Business Center",
  "Conference Room",
  "Co-working Space",
  "Library",
  "Reading Room",
  "Game Room",
  "Billiards Room",
  "Card Room",
  "Music Room",
  "Art Studio",
  "Dance Studio",
  "Pilates Studio",
  "Spinning Studio",
  "Aerobics Room",
  "Boxing Ring",
  "Martial Arts Room",
  "Meditation Room",
  "Prayer Room",
  "Therapy Room",
  "Massage Room",
  "Beauty Salon",
  "Barber Shop",
  "Nail Salon",
  "Pet Spa",
  "Pet Park",
  "Dog Walking Area",
  "Cat Garden",
  "Aquarium",
  "Koi Pond",
  "Fountain",
  "Water Features",
  "Sculpture Garden",
  "Herb Garden",
  "Vegetable Garden",
  "Greenhouse",
  "Outdoor Kitchen",
  "Pizza Oven",
  "Fire Pit",
  "Pergola",
  "Gazebo",
  "Cabana",
  "Daybed Area",
  "Hammock Garden",
];

export const AmenityIconPicker = ({ onSelect, selectedAmenities, onRemove }: AmenityIconPickerProps) => {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customAmenity, setCustomAmenity] = useState("");

  const filteredAmenities = PREDEFINED_AMENITIES.filter(
    (amenity) =>
      amenity.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedAmenities.includes(amenity)
  );

  const handleSelect = (amenity: string) => {
    onSelect(amenity);
    setSearchQuery("");
  };

  const handleAddCustom = () => {
    if (customAmenity.trim() && !selectedAmenities.includes(customAmenity.trim())) {
      onSelect(customAmenity.trim());
      setCustomAmenity("");
      setShowModal(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => setShowModal(true)}
          variant="outline"
          className="w-full"
        >
          + Add Amenity with Icon
        </Button>
      </div>

      {/* Selected Amenities Display */}
      {selectedAmenities.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {selectedAmenities.map((amenity, index) => {
            const Icon = getAmenityIcon(amenity);
            const colorClass = getAmenityColor(amenity);
            return (
              <div
                key={index}
                className="relative flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-center gap-2 group"
              >
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
                <Icon className={`w-8 h-8 ${colorClass}`} />
                <span className="text-xs font-medium text-gray-700 leading-tight">
                  {amenity}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for selecting amenities */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Select Amenities & Features</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <Input
              placeholder="Search amenities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            {/* Custom Amenity Input */}
            <div className="flex gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Input
                placeholder="Add custom amenity..."
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustom())}
                className="flex-1"
              />
              <Button type="button" onClick={handleAddCustom} size="sm">
                Add Custom
              </Button>
            </div>

            {/* Amenities Grid */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredAmenities.map((amenity, index) => {
                  const Icon = getAmenityIcon(amenity);
                  const colorClass = getAmenityColor(amenity);
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelect(amenity)}
                      className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-gray-50 transition-all text-center gap-3 cursor-pointer"
                    >
                      <Icon className={`w-10 h-10 ${colorClass}`} />
                      <span className="text-sm font-medium text-gray-700 leading-tight">
                        {amenity}
                      </span>
                    </button>
                  );
                })}
              </div>
              {filteredAmenities.length === 0 && searchQuery && (
                <div className="text-center py-8 text-muted-foreground">
                  No amenities found. Try adding a custom amenity above.
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
