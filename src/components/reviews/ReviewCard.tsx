import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { format } from "date-fns";
import { Review } from "@/types/review";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="h-full"
    >
      <Card className="h-full border-none shadow-lg bg-white/50 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-200 fill-gray-200"
                  }`}
                />
              ))}
            </div>
            <Quote className="w-8 h-8 text-primary/10" />
          </div>
          <h3 className="font-bold text-lg leading-tight line-clamp-1">
            {review.headline}
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 line-clamp-4 text-sm leading-relaxed">
            "{review.comment}"
          </p>
          <div className="mt-auto border-t pt-4">
            <p className="font-semibold text-sm">
              {review.name || "Anonymous"}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(review.created_at), "MMM d, yyyy")}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
