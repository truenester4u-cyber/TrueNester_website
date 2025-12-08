import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  featured_image: string | null;
  created_at: string;
}

const BlogPostDetail = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, content, category, featured_image, created_at")
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (!error && data) {
        setPost(data as BlogPost);
      }
      setLoading(false);
    };

    fetchPost();
  }, [slug]);

  return (
    <Layout>
      <div className="container-custom py-12">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/blog">
            <Button variant="ghost" size="sm" className="px-0">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
            </Button>
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {!loading && !post && (
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold mb-4">Post not found</h1>
            <p className="text-muted-foreground">The blog post you are looking for does not exist.</p>
          </div>
        )}

        {post && (
          <article className="max-w-4xl mx-auto space-y-6">
            {post.featured_image && (
              <div className="overflow-hidden rounded-xl border border-muted">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-[360px] md:h-[480px] object-cover"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="secondary">{post.category}</Badge>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(post.created_at).toLocaleDateString()}
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{post.title}</h1>
            <p className="text-lg text-muted-foreground">{post.excerpt}</p>

            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        )}
      </div>
    </Layout>
  );
};

export default BlogPostDetail;