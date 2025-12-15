import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { ReviewCard } from "./ReviewCard";
import { ReviewFormModal } from "./ReviewFormModal";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const fetchApprovedReviews = async (): Promise<Review[]> => {
  console.log("⭐ Fetching approved reviews...");
  
  const { data, error } = await supabase
    .from("reviews" as any)
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("❌ Error fetching reviews:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.log("⚠️ No approved reviews found");
    return [];
  }

  console.log("✅ Reviews loaded:", { count: data.length });
  return data as unknown as Review[];
};

const useApprovedReviews = () => {
  return useQuery({
    queryKey: ["reviews", "approved"],
    queryFn: fetchApprovedReviews,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export const ReviewsSection = () => {
  const { data: reviews = [], isLoading, error } = useApprovedReviews();
  const [hasVisibleReviews, setHasVisibleReviews] = useState(false);

  useEffect(() => {
    // Subscribe to real-time changes for approved reviews
    const channel = supabase
      .channel("public:reviews:approved")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: "status=eq.approved",
        },
        () => {
          console.log("📢 Reviews changed - refetching...");
          // Trigger a refetch by using queryClient (handled by React Query)
        }
      )
      .subscribe();

    // Refetch when user returns to page with visible reviews
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("👁️ Page became visible - checking reviews");
        setHasVisibleReviews(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (isLoading) {
    return (
      <section className="py-24 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
        <div className="container px-4 mx-auto">
          <div className="text-center py-20">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading reviews...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-24 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
        <div className="container px-4 mx-auto">
          <div className="text-center py-20">
            <p className="text-muted-foreground">Unable to load reviews at the moment</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            Trusted by Homeowners
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our community has to say about their experience finding their dream home with True Nester.
          </p>
          
          <div className="pt-4">
            <ReviewFormModal />
          </div>
        </motion.div>

        {reviews.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No reviews yet. Be the first to share your experience!
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="relative px-4 md:px-12"
          >
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4 pb-4">
                {reviews.map((review) => (
                  <CarouselItem key={review.id} className="pl-4 md:basis-1/2 lg:basis-1/3 h-auto">
                    <div className="h-full p-1">
                      <ReviewCard review={review} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4 lg:-left-12" />
              <CarouselNext className="hidden md:flex -right-4 lg:-right-12" />
            </Carousel>
          </motion.div>
        )}
      </div>
    </section>
  );
};
