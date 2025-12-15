/**
 * My Reviews Page
 * Protected route - shows user's submitted reviews
 * Note: Reviews functionality coming soon
 */

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext.v2";
import { motion } from "framer-motion";
import { Star, PenLine } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const MyReviewsPage = () => {
  const { user } = useAuth();
  const [reviews] = useState<any[]>([]);

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-12 pt-24 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                My Reviews
              </h1>
            </div>
          </div>

          {reviews.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                You haven't written any reviews yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                Share your experience with properties you've visited
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg">
                <PenLine className="w-5 h-5" />
                Reviews feature coming soon
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, idx) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < review.rating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {review.comment}
                  </p>
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

export default MyReviewsPage;
export { MyReviewsPage as MyReviews };
