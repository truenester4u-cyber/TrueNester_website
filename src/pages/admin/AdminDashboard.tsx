import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Building2,
  FileText,
  Eye,
  TrendingUp,
  Plus,
  Settings,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Stats {
  totalProperties: number;
  publishedProperties: number;
  featuredProperties: number;
  totalViews: number;
  totalBlogPosts: number;
  publishedBlogPosts: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalProperties: 0,
    publishedProperties: 0,
    featuredProperties: 0,
    totalViews: 0,
    totalBlogPosts: 0,
    publishedBlogPosts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch properties stats
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("published, featured, views");

      if (propertiesError) throw propertiesError;

      // Fetch blog posts stats (optional - won't fail if table doesn't exist)
      let blogPosts: any[] = [];
      try {
        const { data: blogData } = await supabase
          .from("blog_posts")
          .select("published");
        blogPosts = blogData || [];
      } catch (blogError) {
        // Silently ignore if blog_posts table doesn't exist
        console.warn("Blog posts table not available:", blogError);
      }

      const totalProperties = properties?.length || 0;
      const publishedProperties =
        properties?.filter((p) => p.published).length || 0;
      const featuredProperties =
        properties?.filter((p) => p.featured).length || 0;
      const totalViews =
        properties?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;

      const totalBlogPosts = blogPosts?.length || 0;
      const publishedBlogPosts =
        blogPosts?.filter((p) => p.published).length || 0;

      setStats({
        totalProperties,
        publishedProperties,
        featuredProperties,
        totalViews,
        totalBlogPosts,
        publishedBlogPosts,
      });
    } catch (error: any) {
      console.error("Dashboard stats error:", error);
      toast({
        title: "Error loading dashboard",
        description: error.message || "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    description,
    trend,
  }: {
    title: string;
    value: number | string;
    icon: any;
    description?: string;
    trend?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p className="text-xs text-green-600 mt-1 flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const QuickAction = ({
    title,
    description,
    icon: Icon,
    onClick,
  }: {
    title: string;
    description: string;
    icon: any;
    onClick: () => void;
  }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Welcome to your admin dashboard</p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="text-center py-12">Loading statistics...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Properties"
              value={stats.totalProperties}
              icon={Building2}
              description={`${stats.publishedProperties} published`}
            />
            <StatCard
              title="Featured Properties"
              value={stats.featuredProperties}
              icon={Building2}
              description="Properties highlighted on homepage"
            />
            <StatCard
              title="Total Views"
              value={stats.totalViews.toLocaleString()}
              icon={Eye}
              description="Across all properties"
            />
            <StatCard
              title="Blog Posts"
              value={stats.totalBlogPosts}
              icon={FileText}
              description={`${stats.publishedBlogPosts} published`}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <QuickAction
              title="Add New Property"
              description="Create a new property listing"
              icon={Plus}
              onClick={() => navigate("/admin/properties/new")}
            />
            <QuickAction
              title="Manage Properties"
              description="View and edit all properties"
              icon={Building2}
              onClick={() => navigate("/admin/properties")}
            />
            <QuickAction
              title="Add Blog Post"
              description="Create a new blog post"
              icon={Plus}
              onClick={() => navigate("/admin/blog/new")}
            />
            <QuickAction
              title="Manage Blog Posts"
              description="View and edit all blog posts"
              icon={FileText}
              onClick={() => navigate("/admin/blog")}
            />
            <QuickAction
              title="Manage Reviews"
              description="Approve or reject customer reviews"
              icon={MessageSquare}
              onClick={() => navigate("/admin/reviews")}
            />
            <QuickAction
              title="View Website"
              description="See your live website"
              icon={Eye}
              onClick={() => navigate("/")}
            />
            <QuickAction
              title="Settings"
              description="Configure site settings"
              icon={Settings}
              onClick={() => navigate("/admin/settings")}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500 py-8">
                <p>Activity tracking coming soon</p>
                <p className="text-sm mt-2">
                  This section will show recent changes to properties and blog posts
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Properties Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Properties</span>
                <span className="font-semibold">{stats.totalProperties}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Published</span>
                <span className="font-semibold text-green-600">
                  {stats.publishedProperties}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Featured</span>
                <span className="font-semibold text-blue-600">
                  {stats.featuredProperties}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Draft</span>
                <span className="font-semibold text-gray-600">
                  {stats.totalProperties - stats.publishedProperties}
                </span>
              </div>
              <Button
                className="w-full mt-4"
                onClick={() => navigate("/admin/properties")}
              >
                Manage Properties
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Blog Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Posts</span>
                <span className="font-semibold">{stats.totalBlogPosts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Published</span>
                <span className="font-semibold text-green-600">
                  {stats.publishedBlogPosts}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Draft</span>
                <span className="font-semibold text-gray-600">
                  {stats.totalBlogPosts - stats.publishedBlogPosts}
                </span>
              </div>
              <div className="h-[24px]"></div>
              <Button
                className="w-full mt-4"
                onClick={() => navigate("/admin/blog")}
              >
                Manage Blog Posts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
