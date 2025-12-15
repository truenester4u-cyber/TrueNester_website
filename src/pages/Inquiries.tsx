/**
 * Inquiries Page
 * Protected route - shows user's property inquiries
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext.v2";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Calendar, MapPin, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface Inquiry {
  id: string;
  property_id: string | null;
  inquiry_type: string;
  message: string;
  status: string;
  created_at: string;
}

const InquiriesPage = () => {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchInquiries = async () => {
      try {
        // Query customer_inquiries for this user
        const { data, error } = await supabase
          .from("customer_inquiries")
          .select("id, property_id, inquiry_type, message, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setInquiries(data || []);
      } catch (err) {
        console.error("Error fetching inquiries:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInquiries();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "closed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh] pt-20">
          <div className="text-gray-500">Loading your inquiries...</div>
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
            <MessageSquare className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              My Inquiries
            </h1>
          </div>

          {inquiries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                You haven't sent any inquiries yet
              </p>
              <Link
                to="/buy"
                className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Browse Properties
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inquiry, idx) => (
                <motion.div
                  key={inquiry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 capitalize">
                        {inquiry.inquiry_type.replace(/_/g, " ")}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {inquiry.message}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        inquiry.status
                      )}`}
                    >
                      {inquiry.status.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(inquiry.created_at).toLocaleDateString()}
                    </div>
                    {inquiry.property_id && (
                      <Link
                        to={`/property/${inquiry.property_id}`}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <MapPin className="w-4 h-4" />
                        View property
                      </Link>
                    )}
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

export default InquiriesPage;
