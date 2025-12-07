import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import downtownImg from "@/assets/location-downtown.jpg";

interface Location {
  id: string;
  name: string;
  slug: string;
  city: string;
  description: string;
  image_url: string;
  properties_count: number;
  price_range: string;
  features: string[];
  published: boolean;
}

const Locations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("published", true)
        .order("city", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching locations:", error);
        return;
      }

      setLocations(data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group locations by city
  const dubaiLocations = locations.filter(loc => loc.city === 'Dubai');
  const abuDhabiLocations = locations.filter(loc => loc.city === 'Abu Dhabi');
  const rakLocations = locations.filter(loc => loc.city === 'Ras Al Khaimah');

  const renderLocationCard = (location: Location) => (
    <Card
      key={location.id}
      className="group cursor-pointer hover-lift border-0 shadow-lg overflow-hidden"
    >
      <Link to="/buy">
        <div className="relative h-64 overflow-hidden">
          <img
            src={location.image_url || downtownImg}
            alt={location.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = downtownImg;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {location.name}
            </h3>
            <p className="text-sm text-white/80 mb-2">{location.properties_count} Properties Available</p>
            <p className="text-sm text-white/90">{location.price_range}</p>
          </div>
        </div>

        <CardContent className="p-6">
          <p className="text-muted-foreground mb-4">{location.description}</p>
          <div className="flex flex-wrap gap-2">
            {location.features && location.features.map((feature, idx) => (
              <span
                key={idx}
                className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>
        </CardContent>
      </Link>
    </Card>
  );

  return (
    <Layout>
      <div className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-secondary text-white py-20">
          <div className="container-custom text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-heading">
              Explore UAE Locations
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Discover properties in the UAE's most prestigious and sought-after neighborhoods
            </p>
          </div>
        </section>

        {loading ? (
          <section className="py-16 bg-background">
            <div className="container-custom">
              <div className="text-center text-muted-foreground py-12">
                Loading locations...
              </div>
            </div>
          </section>
        ) : locations.length === 0 ? (
          <section className="py-16 bg-background">
            <div className="container-custom">
              <div className="text-center text-muted-foreground py-12">
                No locations available at the moment.
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Dubai Locations */}
            {dubaiLocations.length > 0 && (
              <section className="py-16 bg-background">
                <div className="container-custom">
                  <div className="mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">
                      🏙️ Explore <span className="text-gradient-primary">Dubai</span> Locations
                    </h2>
                    <p className="text-muted-foreground">
                      Discover {dubaiLocations.length} premium locations in Dubai
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {dubaiLocations.map(renderLocationCard)}
                  </div>
                </div>
              </section>
            )}

            {/* Abu Dhabi Locations */}
            {abuDhabiLocations.length > 0 && (
              <section className="py-16 bg-muted/30">
                <div className="container-custom">
                  <div className="mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">
                      🏛️ Explore <span className="text-gradient-primary">Abu Dhabi</span> Locations
                    </h2>
                    <p className="text-muted-foreground">
                      Discover {abuDhabiLocations.length} premium locations in Abu Dhabi
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {abuDhabiLocations.map(renderLocationCard)}
                  </div>
                </div>
              </section>
            )}

            {/* Ras Al Khaimah Locations */}
            {rakLocations.length > 0 && (
              <section className="py-16 bg-background">
                <div className="container-custom">
                  <div className="mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">
                      🏔️ Explore <span className="text-gradient-primary">Ras Al Khaimah</span> Locations
                    </h2>
                    <p className="text-muted-foreground">
                      Discover {rakLocations.length} premium locations in Ras Al Khaimah
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {rakLocations.map(renderLocationCard)}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Locations;
