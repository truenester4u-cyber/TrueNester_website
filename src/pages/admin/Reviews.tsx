import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Trash2, Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();

    // Realtime subscription
    const channel = supabase
      .channel("admin-reviews")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
        },
        () => {
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews((data as unknown as Review[]) || []);
    } catch (error: any) {
      toast({
        title: "Error fetching reviews",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: Review['status']) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Review marked as ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteReview = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reviews" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Review Deleted",
        description: "The review has been permanently removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting review",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    }
  };

  const ReviewsTable = ({ data }: { data: Review[] }) => (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead className="w-[300px]">Content</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                No reviews found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(review.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="font-medium">
                  {review.name || "Anonymous"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{review.rating}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-sm line-clamp-1">{review.headline}</p>
                    <p className="text-muted-foreground text-xs line-clamp-2">
                      {review.comment}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`capitalize ${getStatusColor(review.status)}`}>
                    {review.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {review.status !== "approved" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => updateStatus(review.id, "approved")}
                        title="Approve"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {review.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => updateStatus(review.id, "rejected")}
                        title="Reject"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the review.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteReview(review.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="h-8 w-8" />
              Reviews Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and moderate customer reviews
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading reviews...</div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({reviews.length})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({reviews.filter((r) => r.status === "pending").length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({reviews.filter((r) => r.status === "approved").length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({reviews.filter((r) => r.status === "rejected").length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <ReviewsTable data={reviews} />
            </TabsContent>
            <TabsContent value="pending">
              <ReviewsTable data={reviews.filter((r) => r.status === "pending")} />
            </TabsContent>
            <TabsContent value="approved">
              <ReviewsTable data={reviews.filter((r) => r.status === "approved")} />
            </TabsContent>
            <TabsContent value="rejected">
              <ReviewsTable data={reviews.filter((r) => r.status === "rejected")} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
