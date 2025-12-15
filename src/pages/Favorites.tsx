/**
 * Favorites Page
 * Protected route - shows user's saved/favorite properties
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext.v2";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Heart, MapPin, DollarSign, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface SavedProperty {
  id: string;
  saved_id: string;
  title: string;
  price: number;
  location: string;
  featured_image: string | null;
  property_type: string;
  notes: string | null;
}

const FavoritesPage = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<SavedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      try {
        // First get saved property IDs
        const { data: savedData, error: savedError } = await supabase
          .from("saved_properties")
          .select("id, property_id, notes")
          .eq("user_id", user.id);

        if (savedError) throw savedError;

        if (!savedData || savedData.length === 0) {
          setFavorites([]);
          setIsLoading(false);
          return;
        }

        // Then fetch the actual properties (using type assertion for properties table)
        const propertyIds = savedData.map(s => s.property_id);
        const { data: propertiesData, error: propsError } = await (supabase as any)
          .from("properties")
          .select("id, title, price, location, featured_image, property_type")
          .in("id", propertyIds);

        if (propsError) throw propsError;

        // Combine the data
        const combined = savedData.map(saved => {
          const prop = propertiesData?.find((p: any) => p.id === saved.property_id);
          return prop ? {
            id: prop.id,
            saved_id: saved.id,
            title: prop.title,
            price: prop.price,
            location: prop.location,
            featured_image: prop.featured_image,
            property_type: prop.property_type,
            notes: saved.notes
          } : null;
        }).filter(Boolean) as SavedProperty[];

        setFavorites(combined);
      } catch (err) {
        console.error("Error fetching favorites:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const handleRemoveFavorite = async (savedId: string) => {
    try {
      const { error } = await supabase
        .from("saved_properties")
        .delete()
        .eq("id", savedId);

      if (error) throw error;

      setFavorites(prev => prev.filter(f => f.saved_id !== savedId));
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh] pt-20">
          <div className="text-gray-500">Loading your favorites...</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-12 pt-24 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              My Favorites
            </h1>
          </div>

          {favorites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                You haven't added any favorites yet
              </p>
              <Link
                to="/buy"
                className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Browse Properties
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((property, idx) => (
                <motion.div
                  key={property.saved_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Link to={`/property/${property.id}`}>
                    <div className="relative h-48 overflow-hidden bg-gray-300">
                      {property.featured_image && (
                        <img
                          src={property.featured_image}
                          alt={property.title}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        />
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                        {property.title}
                      </h3>

                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {property.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          AED {property.price?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Remove button */}
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => handleRemoveFavorite(property.saved_id)}
                      className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove from favorites
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </>
  );
};

export default FavoritesPage;
