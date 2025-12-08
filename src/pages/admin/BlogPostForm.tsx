import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X } from "lucide-react";
import { z } from "zod";

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  slug: z.string().min(3, "Slug must be at least 3 characters").max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase, alphanumeric, and hyphen-separated"),
  excerpt: z.string().min(20, "Excerpt must be at least 20 characters").max(500),
  content: z.string().min(50, "Content must be at least 50 characters"),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().optional().or(z.literal("")),
});

const categories = ["Market Insights", "Investment Guide", "Lifestyle", "Finance"];

const BlogPostForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [category, setCategory] = useState("");
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  useEffect(() => {
    if (!id && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setSlug(generatedSlug);
    }
  }, [title, id]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setTitle(data.title);
      setSlug(data.slug);
      setExcerpt(data.excerpt);
      setContent(data.content);
      setImageUrl(data.featured_image || "");
      setCategory(data.category);
      setPublished(data.published);
      if (data.featured_image) {
        setImagePreview(data.featured_image);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load blog post",
        variant: "destructive",
      });
      navigate("/admin");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    // For now, just use the imageUrl directly without file upload
    // File uploads will work once RLS policies are properly configured
    return imageUrl || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validation = postSchema.parse({
        title,
        slug,
        excerpt,
        content,
        category,
        imageUrl: imageUrl || undefined,
      });

      setLoading(true);

      // Use imageUrl directly (no file upload)
      const finalImageUrl = imageUrl || undefined;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const postData: any = {
        title: validation.title,
        slug: validation.slug,
        excerpt: validation.excerpt,
        content: validation.content,
        category: validation.category,
        featured_image: finalImageUrl || null,
        author_id: user.id,
        author_name: user.user_metadata?.name || user.email,
        published,
      };

      let result;
      if (id) {
        result = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", id)
          .select();
      } else {
        result = await supabase
          .from("blog_posts")
          .insert([postData])
          .select();
      }

      if (result.error) {
        console.error("Supabase Error:", result.error);
        throw new Error(result.error.message || "Failed to save blog post");
      }

      toast({
        title: "Success",
        description: `Blog post ${id ? "updated" : "created"} successfully`,
      });
      navigate("/admin/blog");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Posts
        </Button>

        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-6">
            {id ? "Edit Blog Post" : "New Blog Post"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="post-url-slug"
                required
              />
              <p className="text-sm text-muted-foreground">
                URL: /blog/{slug || "post-slug"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief description of the post"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Featured Image</Label>
              <div className="space-y-2">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-64 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImageUrl("");
                        setImagePreview("");
                      }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Current image loaded. Click X to remove.
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                    <input
                      id="imageUrl"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={uploading}
                    />
                    <label htmlFor="imageUrl" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm font-medium">Click to upload image</span>
                      <span className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</span>
                    </label>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="imageUrlInput" className="text-xs">Or paste image URL</Label>
                  <Input
                    id="imageUrlInput"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    disabled={!!imageFile || uploading}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <RichTextEditor content={content} onChange={setContent} />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={published}
                onCheckedChange={setPublished}
              />
              <Label htmlFor="published">Publish immediately</Label>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                className="bg-gradient-primary"
                disabled={loading}
              >
                {loading ? "Saving..." : id ? "Update Post" : "Create Post"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/blog")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default BlogPostForm;
