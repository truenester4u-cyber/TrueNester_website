import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getSafeImageUrl, handleImageError } from "@/lib/imageUtils";
import downtownImg from "@/assets/location-downtown.jpg";

interface Location {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  property_count: number;
  featured: boolean;
  city?: string;
}

const AbuDhabiLocationsGrid = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      // Simple query - just get all data
      const { data, error } = await supabase.from("locations").select();

      if (error) {
        console.error("Error fetching Abu Dhabi locations:", error.message);
        setLocations([]);
        return;
      }

      // Filter for Abu Dhabi and limit to 4
      const filtered = (data || [])
        .filter((loc: any) => loc.city === "Abu Dhabi")
        .slice(0, 4);

      console.log("Abu Dhabi locations loaded:", { total: data?.length, abudhabi: filtered.length });
      setLocations(filtered);
    } catch (error) {
      console.error("Error fetching Abu Dhabi locations:", error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (locations.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">
            Explore Abu Dhabi <span className="text-gradient-primary">Locations</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover properties in Abu Dhabi's most prestigious neighborhoods
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {locations.map((location) => (
            <Card
              key={location.id}
              className="group cursor-pointer hover-lift border-0 shadow-lg overflow-hidden"
            >
              <Link to="/locations">
                <div className="relative h-48 overflow-hidden">
                  <img
                     src={getSafeImageUrl(location.image_url, downtownImg)}
                    alt={location.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => handleImageError(e, downtownImg)}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {location.name}
                    </h3>
                     <p className="text-sm text-white/80">{location.property_count} Properties</p>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground text-center">&nbsp;</p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AbuDhabiLocationsGrid;
