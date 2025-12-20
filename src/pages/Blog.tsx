import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { NewsletterForm } from "@/components/NewsletterForm";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  featured_image: string | null;
  created_at: string;
  author_name: string;
  category: string;
  slug: string;
}

const Blog = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Market Insights", "Investment Guide", "Lifestyle", "Finance"];

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (selectedCategory !== "All") {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBlogPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 md:py-20">
          <div className="container-custom">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold text-gradient-primary mb-4 font-heading">
                Dubai Property Insights
              </h1>
              <p className="text-lg text-muted-foreground">
                Stay updated with the latest market trends, investment tips, and expert insights 
                for Indian investors in Dubai real estate.
              </p>
            </div>
          </div>
        </section>

        {/* Categories Filter */}
        <section className="border-b border-border py-6">
          <div className="container-custom">
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  className={selectedCategory === category ? "bg-gradient-primary" : ""}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16">
          <div className="container-custom">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : blogPosts.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No blog posts found in this category.</p>
              </Card>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {blogPosts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      className="block h-full group"
                    >
                      <Card className="h-full overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-muted/40">
                        <div className="aspect-video overflow-hidden bg-muted">
                          <img
                            src={post.featured_image || "/placeholder.svg"}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-6 flex flex-col gap-3">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                              {post.category}
                            </span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(post.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-muted-foreground line-clamp-3">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center gap-2 text-primary font-semibold">
                            <span>Read the story</span>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="bg-gradient-primary py-16 text-white">
          <div className="container-custom text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">
              Stay Informed
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
              Subscribe to our newsletter and get the latest Dubai property insights 
              delivered directly to your inbox.
            </p>
            <NewsletterForm source="blog" />
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Blog;
