import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Search,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Home,
  Maximize,
  DollarSign,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SellSubmission {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  status: string;
  lead_score: number;
  lead_quality: string | null;
  notes: string | null;
  start_time: string;
  tags: string[];
  lead_score_breakdown: {
    propertyType?: string;
    images?: string[];
    imageCount?: number;
    [key: string]: any;
  } | null;
}

const SellSubmissions = () => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<SellSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<SellSubmission | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      console.log("[SELL-ADMIN] Fetching sell submissions...");
      
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .contains("tags", ["sell"])
        .order("start_time", { ascending: false });

      if (error) {
        console.error("[SELL-ADMIN] Error fetching submissions:", error);
        throw error;
      }
      
      const rows = (data as SellSubmission[]) || [];
      console.log(`[SELL-ADMIN] Found ${rows.length} sell submissions`);

      // Images are now served from a public bucket - no signing needed
      // Just ensure URLs are properly formatted
      const processed = rows.map((row) => {
        const imgs = row.lead_score_breakdown?.images || [];
        if (imgs.length === 0) return row;
        
        console.log(`[SELL-ADMIN] Submission ${row.id} has ${imgs.length} images:`);
        imgs.forEach((url, i) => console.log(`  Image ${i + 1}: ${url}`));
        
        // Images should already be full public URLs, just return as-is
        return row;
      });

      setSubmissions(processed);
      console.log("[SELL-ADMIN] ✅ Submissions loaded successfully");
    } catch (error: any) {
      console.error("[SELL-ADMIN] ❌ Failed to fetch submissions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch sell submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Status updated successfully",
      });

      fetchSubmissions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const extractInfoFromNotes = (notes: string | null) => {
    if (!notes) return {};
    
    const info: any = {};
    
    // Extract expected price
    const priceMatch = notes.match(/Expected price:\s*([^\n]+)/);
    if (priceMatch) info.expectedPrice = priceMatch[1].trim();
    
    // Extract property details (from message format)
    const typeMatch = notes.match(/Property Type:\s*([^\n]+)/);
    if (typeMatch) info.propertyType = typeMatch[1].trim();
    
    const locationMatch = notes.match(/Location:\s*([^\n]+)/);
    if (locationMatch) info.location = locationMatch[1].trim();
    
    const sizeMatch = notes.match(/Size:\s*([^\n]+)/);
    if (sizeMatch) info.size = sizeMatch[1].trim();
    
    const bedroomsMatch = notes.match(/Bedrooms:\s*([^\n]+)/);
    if (bedroomsMatch) info.bedrooms = bedroomsMatch[1].trim();
    
    return info;
  };

  const getPropertyImages = (submission: SellSubmission): string[] => {
    if (submission.lead_score_breakdown?.images) {
      return submission.lead_score_breakdown.images;
    }
    
    // Try to extract from notes
    if (submission.notes) {
      const imagesMatch = submission.notes.match(/Property Images \(\d+\):\s*([^\n]+)/);
      if (imagesMatch) {
        return imagesMatch[1].split(',').map(url => url.trim());
      }
    }
    
    return [];
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      searchQuery === "" ||
      submission.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.customer_phone?.includes(searchQuery);

    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sell Submissions</h1>
            <p className="text-gray-600">Manage property valuation requests from sellers</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              <Package className="h-4 w-4 mr-1" />
              {filteredSubmissions.length} Total
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubmissions.map((submission) => {
            const info = extractInfoFromNotes(submission.notes);
            const images = getPropertyImages(submission);
            const propertyType = submission.lead_score_breakdown?.propertyType || info.propertyType;

            return (
              <Card key={submission.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{submission.customer_name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {new Date(submission.start_time).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        submission.status === "new"
                          ? "default"
                          : submission.status === "completed"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {submission.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2 text-sm">
                    {submission.customer_email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{submission.customer_email}</span>
                      </div>
                    )}
                    {submission.customer_phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{submission.customer_phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Property Details */}
                  <div className="space-y-2 text-sm border-t pt-3">
                    {propertyType && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Home className="h-4 w-4" />
                        <span className="font-medium">{propertyType}</span>
                      </div>
                    )}
                    {info.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{info.location}</span>
                      </div>
                    )}
                    {info.size && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Maximize className="h-4 w-4" />
                        <span>{info.size}</span>
                      </div>
                    )}
                    {info.expectedPrice && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">{info.expectedPrice}</span>
                      </div>
                    )}
                  </div>

                  {/* Property Images */}
                  {images.length > 0 && (
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <ImageIcon className="h-4 w-4" />
                        <span>Property Images ({images.length})</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {images.slice(0, 6).map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-square rounded-md overflow-hidden border border-gray-200 hover:border-primary transition-colors group"
                          >
                            <img
                              src={url}
                              alt={`Property ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onLoad={() => console.log(`[SELL] Image loaded successfully: ${url}`)}
                              onError={(e) => {
                                console.warn(`[SELL] Failed to load image: ${url}`);
                                e.currentTarget.src = "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=60";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                              <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </a>
                        ))}
                        {images.length > 6 && (
                          <div className="aspect-square rounded-md border border-gray-200 flex items-center justify-center bg-gray-50 text-sm font-medium text-gray-600">
                            +{images.length - 6}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lead Score */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm">
                      <span className="text-gray-500">Lead Score: </span>
                      <span className="font-semibold">{submission.lead_score}/100</span>
                    </div>
                    {submission.lead_quality && (
                      <Badge
                        variant={
                          submission.lead_quality === "hot"
                            ? "destructive"
                            : submission.lead_quality === "warm"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {submission.lead_quality}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Select
                      value={submission.status}
                      onValueChange={(value) => updateStatus(submission.id, value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredSubmissions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No submissions found</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Sell submissions will appear here"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Modal could be added here */}
    </AdminLayout>
  );
};

export default SellSubmissions;
