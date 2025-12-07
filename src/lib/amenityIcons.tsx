import {
  Home,
  Dumbbell,
  Waves,
  Car,
  ShieldCheck,
  Wifi,
  Wind,
  Baby,
  Trees,
  Building2,
  Users,
  Utensils,
  Coffee,
  Droplets,
  Sun,
  Moon,
  Sofa,
  Bed,
  Bath,
  Tv,
  GamepadIcon,
  BookOpen,
  HeartPulse,
  Zap,
  Snowflake,
  Flame,
  Lock,
  Video,
  Phone,
  WashingMachine,
  Refrigerator,
  Microwave,
  AirVent,
  Fan,
  Lamp,
  DoorOpen,
  Home as WindowIcon,
  ParkingCircle,
  Bike,
  BusFront,
  TrainFront,
  ShoppingCart,
  Store,
  Hospital,
  GraduationCap,
  Church,
  TreePine,
  Flower2,
  UtensilsCrossed,
  CupSoda,
  Pizza,
  IceCream,
  LucideIcon,
} from "lucide-react";

// Comprehensive amenity icon mapping
export const amenityIconMap: Record<string, LucideIcon> = {
  // Living Spaces
  "balcony": Home,
  "balcony or terrace": Home,
  "terrace": Home,
  "garden": Trees,
  "lawn": Trees,
  "lawn or garden": Trees,
  "private garden": Trees,
  "backyard": Trees,
  "patio": Home,
  "rooftop": Building2,
  
  // Rooms & Features
  "maids room": Bed,
  "maid's room": Bed,
  "maids service room": Bed,
  "study room": BookOpen,
  "storage room": DoorOpen,
  "laundry room": WashingMachine,
  "walk-in closet": Sofa,
  "powder room": Bath,
  "guest room": Bed,
  
  // Climate Control
  "central air conditioning": Snowflake,
  "centrally air-conditioned": Snowflake,
  "air conditioning": Wind,
  "ac": Wind,
  "a/c": Wind,
  "heating": Flame,
  "central heating": Flame,
  "ceiling fans": Fan,
  "ventilation": AirVent,
  
  // Windows & Doors
  "double glazed windows": WindowIcon,
  "double glazing": WindowIcon,
  "floor to ceiling windows": WindowIcon,
  "bay windows": WindowIcon,
  "balcony doors": DoorOpen,
  
  // Kitchen Appliances
  "built in wardrobes": Sofa,
  "built-in wardrobes": Sofa,
  "kitchen appliances": Utensils,
  "fitted kitchen": UtensilsCrossed,
  "built in kitchen": UtensilsCrossed,
  "refrigerator": Refrigerator,
  "fridge": Refrigerator,
  "microwave": Microwave,
  "oven": Flame,
  "dishwasher": Droplets,
  "washing machine": WashingMachine,
  "dryer": WashingMachine,
  
  // Utilities
  "electricity": Zap,
  "power backup": Zap,
  "generator": Zap,
  "water": Droplets,
  "hot water": Flame,
  "water heater": Flame,
  "24/7 water": Droplets,
  
  // Entertainment & Technology
  "tv": Tv,
  "television": Tv,
  "satellite/cable tv": Tv,
  "wifi": Wifi,
  "internet": Wifi,
  "high speed internet": Wifi,
  "smart home": Phone,
  "home automation": Phone,
  "intercom": Phone,
  
  // Security
  "security": ShieldCheck,
  "24/7 security": ShieldCheck,
  "security system": Video,
  "cctv": Video,
  "gated community": Lock,
  "secure parking": Lock,
  "guard": ShieldCheck,
  "access control": Lock,
  
  // Building Amenities
  "swimming pool": Waves,
  "pool": Waves,
  "shared pool": Waves,
  "private pool": Waves,
  "gym": Dumbbell,
  "fitness center": Dumbbell,
  "gymnasium": Dumbbell,
  "spa": HeartPulse,
  "sauna": Flame,
  "steam room": Droplets,
  "jacuzzi": Waves,
  "kids play area": Baby,
  "children's play area": Baby,
  "playground": Baby,
  "children's pool": Baby,
  "bbq area": Flame,
  "barbecue": Flame,
  "shared gym": Users,
  "shared spa": Users,
  "community center": Users,
  "clubhouse": Users,
  "concierge": Users,
  "reception": Users,
  "lobby": Building2,
  "elevator": Building2,
  "lifts": Building2,
  
  // Parking
  "parking": Car,
  "covered parking": ParkingCircle,
  "garage": Car,
  "private parking": Car,
  "visitor parking": Car,
  "underground parking": Car,
  "valet parking": Car,
  
  // Sports & Recreation
  "tennis court": GamepadIcon,
  "basketball court": GamepadIcon,
  "squash court": GamepadIcon,
  "games room": GamepadIcon,
  "billiards": GamepadIcon,
  "table tennis": GamepadIcon,
  "golf course": Trees,
  "jogging track": Bike,
  "walking trails": Bike,
  "cycling track": Bike,
  
  // Dining & Shopping
  "cafeteria": Coffee,
  "cafe": Coffee,
  "restaurant": UtensilsCrossed,
  "dining area": Utensils,
  "shared kitchen": Utensils,
  "retail center": Store,
  "shopping mall": ShoppingCart,
  "supermarket": Store,
  "grocery store": ShoppingCart,
  
  // Services
  "maintenance": Phone,
  "24/7 maintenance": Phone,
  "cleaning services": WashingMachine,
  "laundry service": WashingMachine,
  "housekeeping": WashingMachine,
  "pet friendly": Baby,
  "pets allowed": Baby,
  
  // Transportation & Accessibility
  "bus stop": BusFront,
  "metro station": TrainFront,
  "public transport": BusFront,
  "accessible": Building2,
  "wheelchair accessible": Building2,
  
  // Nearby Facilities
  "schools nearby": GraduationCap,
  "hospital nearby": Hospital,
  "mosque nearby": Church,
  "beach access": Waves,
  "waterfront": Waves,
  "sea view": Waves,
  "park nearby": TreePine,
  "green spaces": Flower2,
  
  // Flooring & Finishing
  "marble flooring": Home,
  "wooden flooring": Home,
  "tiled floors": Home,
  "carpeted": Home,
  
  // Lighting
  "natural light": Sun,
  "pendant lighting": Lamp,
  "ambient lighting": Moon,
  
  // Default
  "default": Home,
};

// Function to get icon for amenity
export const getAmenityIcon = (amenityName: string): LucideIcon => {
  const normalized = amenityName.toLowerCase().trim();
  return amenityIconMap[normalized] || amenityIconMap["default"];
};

// Function to get color for amenity category
export const getAmenityColor = (amenityName: string): string => {
  const normalized = amenityName.toLowerCase().trim();
  
  // Security & Safety - Red
  if (normalized.includes("security") || normalized.includes("cctv") || normalized.includes("guard")) {
    return "text-red-600";
  }
  
  // Water & Pool - Blue
  if (normalized.includes("pool") || normalized.includes("water") || normalized.includes("beach")) {
    return "text-blue-600";
  }
  
  // Fitness & Health - Green
  if (normalized.includes("gym") || normalized.includes("fitness") || normalized.includes("spa")) {
    return "text-green-600";
  }
  
  // Parking & Transport - Gray
  if (normalized.includes("parking") || normalized.includes("garage") || normalized.includes("car")) {
    return "text-gray-600";
  }
  
  // Climate - Orange
  if (normalized.includes("air") || normalized.includes("heating") || normalized.includes("cooling")) {
    return "text-orange-600";
  }
  
  // Entertainment - Purple
  if (normalized.includes("tv") || normalized.includes("wifi") || normalized.includes("internet")) {
    return "text-purple-600";
  }
  
  // Nature & Outdoor - Emerald
  if (normalized.includes("garden") || normalized.includes("lawn") || normalized.includes("terrace")) {
    return "text-emerald-600";
  }
  
  // Default - Primary color
  return "text-primary";
};
