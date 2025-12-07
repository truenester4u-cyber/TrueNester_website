import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationFormData {
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

const LocationForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [featureInput, setFeatureInput] = useState("");
  const [formData, setFormData] = useState<LocationFormData>({
    name: "",
    slug: "",
    city: searchParams.get("city") || "Dubai",
    description: "",
    image_url: "",
    properties_count: 0,
    price_range: "",
    features: [],
    published: false,
  });

  useEffect(() => {
    if (id) {
      fetchLocation();
    }
  }, [id]);

  const fetchLocation = async () => {
    try {
      setInitialLoading(true);
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || "",
        slug: data.slug || "",
        city: data.city || "Dubai",
        description: data.description || "",
        image_url: data.image_url || "",
        properties_count: data.properties_count || 0,
        price_range: data.price_range || "",
        features: data.features || [],
        published: data.published || false,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/admin/locations");
    } finally {
      setInitialLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "properties_count" ? parseInt(value) || 0 : value,
    }));

    // Auto-generate slug from name
    if (name === "name" && !id) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, featureInput.trim()],
      }));
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      toast({
        title: "Validation Error",
        description: "Name and slug are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      if (id) {
        // Update existing location
        // Build update object - conditionally include city if it exists
        const updateData: any = {
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          image_url: formData.image_url,
          properties_count: formData.properties_count,
          price_range: formData.price_range,
          features: formData.features,
          published: formData.published,
          updated_at: new Date().toISOString(),
        };
        
        // Only include city if it's set (avoids error if column doesn't exist)
        if (formData.city) {
          updateData.city = formData.city;
        }

        const { error } = await supabase
          .from("locations")
          .update(updateData)
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Location updated successfully",
        });
      } else {
        // Create new location
        // Build insert object - conditionally include city if it exists
        const insertData: any = {
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          image_url: formData.image_url,
          properties_count: formData.properties_count,
          price_range: formData.price_range,
          features: formData.features,
          published: formData.published,
        };
        
        // Only include city if it's set (avoids error if column doesn't exist)
        if (formData.city) {
          insertData.city = formData.city;
        }

        const { error } = await supabase.from("locations").insert(insertData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Location created successfully",
        });
      }

      navigate("/admin/locations");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading location...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/locations")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {id ? "Edit Location" : "New Location"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {id
                ? "Update location details"
                : "Add a new Dubai location to showcase"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Downtown Dubai"
                  required
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="e.g., downtown-dubai"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  URL-friendly version of the name
                </p>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, city: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dubai">🏙️ Dubai</SelectItem>
                    <SelectItem value="Abu Dhabi">🏛️ Abu Dhabi</SelectItem>
                    <SelectItem value="Ras Al Khaimah">🏔️ Ras Al Khaimah</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select the main city for this location
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the location and its highlights"
                  rows={4}
                />
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.image_url && (
                  <div className="mt-2">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full max-w-md h-48 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "";
                        (e.target as HTMLImageElement).alt = "Invalid image URL";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Properties Count */}
              <div className="space-y-2">
                <Label htmlFor="properties_count">Properties Count</Label>
                <Input
                  id="properties_count"
                  name="properties_count"
                  type="number"
                  value={formData.properties_count}
                  onChange={handleInputChange}
                  placeholder="e.g., 120"
                  min="0"
                />
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label htmlFor="price_range">Price Range</Label>
                <Input
                  id="price_range"
                  name="price_range"
                  value={formData.price_range}
                  onChange={handleInputChange}
                  placeholder="e.g., AED 800K - 15M"
                />
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label>Features</Label>
                <div className="flex gap-2">
                  <Input
                    value={featureInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFeatureInput(e.target.value)}
                    placeholder="Add a feature"
                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddFeature}>
                    Add
                  </Button>
                </div>
                {formData.features.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveFeature(index)}
                      >
                        {feature} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Published Status */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked: boolean) =>
                    setFormData((prev) => ({ ...prev, published: checked }))
                  }
                />
                <Label htmlFor="published" className="cursor-pointer">
                  Published
                </Label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {id ? "Update Location" : "Create Location"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/locations")}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
};

export default LocationForm;
