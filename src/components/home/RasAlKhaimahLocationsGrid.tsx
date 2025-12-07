import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import downtownImg from "@/assets/location-downtown.jpg";

interface Location {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  properties_count: number;
  price_range: string;
  published: boolean;
  city?: string;
}

const RasAlKhaimahLocationsGrid = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name, slug, image_url, properties_count, price_range, published, city")
        .eq("published", true)
        .eq("city", "Ras Al Khaimah")
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) {
        console.error("Error fetching Ras Al Khaimah locations:", error);
        return;
      }

      setLocations(data || []);
    } catch (error) {
      console.error("Error fetching Ras Al Khaimah locations:", error);
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
    <section className="py-20 bg-background">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">
            Explore Ras Al Khaimah <span className="text-gradient-primary">Locations</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover properties in Ras Al Khaimah's beautiful locations
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
                    src={location.image_url || downtownImg}
                    alt={location.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = downtownImg;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {location.name}
                    </h3>
                    <p className="text-sm text-white/80">{location.properties_count} Properties</p>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    {location.price_range}
                  </p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RasAlKhaimahLocationsGrid;
