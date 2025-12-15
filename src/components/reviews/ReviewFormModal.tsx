import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext.v2";
import { useNavigate } from "react-router-dom";
import { ToastAction } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ReviewFormData {
  name: string;
  rating: number;
  headline: string;
  comment: string;
}

export const ReviewFormModal = () => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ReviewFormData>({
    defaultValues: {
      rating: 5,
    }
  });

  const rating = watch("rating");

  const handleTriggerClick = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Before submitting, you need to login",
        variant: "default",
        action: <ToastAction altText="Login" onClick={() => navigate("/login")}>Login</ToastAction>,
      });
      return;
    }
    setOpen(true);
  };

  const onSubmit = async (data: ReviewFormData) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Before submitting, you need to login",
        variant: "default",
        action: {
          label: "Login",
          onClick: () => navigate("/login"),
        },
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("reviews" as any)
        .insert([
          {
            name: data.name || null,
            rating: data.rating,
            headline: data.headline,
            comment: data.comment,
            status: "pending",
          },
        ]);

      if (error) throw error;

      toast({
        title: "Review Submitted!",
        description: "Thank you! Your review has been submitted and is awaiting approval.",
      });
      setOpen(false);
      reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleTriggerClick}
        >
          <Button 
            size="lg" 
            className="rounded-full font-bold shadow-lg bg-primary hover:bg-primary/90 text-white gap-2 px-8"
          >
            <MessageSquare className="w-5 h-5" />
            Share your experience
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Share Your Experience</DialogTitle>
          <DialogDescription className="text-center">
            We value your feedback! Please rate your experience with us.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2 flex flex-col items-center">
            <Label>Rating</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setValue("rating", star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-200 fill-gray-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            {errors.rating && <p className="text-red-500 text-sm">Rating is required</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name (Optional)</Label>
            <Input
              id="name"
              placeholder="Your name"
              {...register("name")}
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              placeholder="Sum up your experience in a few words"
              {...register("headline", { required: "Headline is required" })}
              className="bg-muted/50"
            />
            {errors.headline && (
              <p className="text-red-500 text-sm">{errors.headline.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Review</Label>
            <Textarea
              id="comment"
              placeholder="Tell us more about your experience..."
              {...register("comment", { required: "Comment is required" })}
              className="bg-muted/50 min-h-[100px]"
            />
            {errors.comment && (
              <p className="text-red-500 text-sm">{errors.comment.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full font-bold" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
