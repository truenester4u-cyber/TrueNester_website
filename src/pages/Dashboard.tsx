/**
 * Customer Dashboard - Protected customer area
 * Displays customer profile, saved properties, and inquiries
 */
import { useAuth } from "@/contexts/AuthContext.v2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LogOut, Home, User, Heart, MessageSquare, Settings, ExternalLink, Clock, Eye, Star, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSavedProperties } from "@/hooks/useSavedProperties";
import { useCustomerInquiries, useInquiryStats } from "@/hooks/useCustomerInquiries";

import { formatDistanceToNow } from "date-fns";

interface Profile {
  id: string;
  role: string;
  full_name: string;
  email: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real data using hooks
  const { data: savedProperties = [], isLoading: loadingSaved } = useSavedProperties();
  const { data: inquiries = [], isLoading: loadingInquiries } = useCustomerInquiries();
  const { data: inquiryStats = { total: 0, active: 0, closed: 0 } } = useInquiryStats();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      // @ts-ignore - profiles table will be created via migration
      const { data, error } = await supabase.from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data as unknown as Profile);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    // signOut now handles redirect to home page
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <h1 className="text-2xl font-bold text-primary">TRUE NESTER</h1>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {profile?.full_name ? getInitials(profile.full_name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">
                    Welcome back, {profile?.full_name || "User"}!
                  </h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Recently"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5 lg:w-[700px]">
              <TabsTrigger value="overview" className="gap-2">
                <User className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-2">
                <Heart className="h-4 w-4" />
                Saved
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Inquiries
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Saved Properties</CardTitle>
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loadingSaved ? "..." : savedProperties.length}
                    </div>
                    <p className="text-xs text-muted-foreground">Properties you liked</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Inquiries</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loadingInquiries ? "..." : inquiryStats.active}
                    </div>
                    <p className="text-xs text-muted-foreground">Open conversations</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loadingInquiries ? "..." : inquiryStats.total}
                    </div>
                    <p className="text-xs text-muted-foreground">All time inquiries</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Explore properties and get in touch</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <Link to="/buy">
                    <Button variant="outline" className="w-full">
                      Browse Properties
                    </Button>
                  </Link>
                  <Link to="/rent">
                    <Button variant="outline" className="w-full">
                      Find Rentals
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="outline" className="w-full">
                      Contact Us
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="saved">
              <Card>
                <CardHeader>
                  <CardTitle>Saved Properties</CardTitle>
                  <CardDescription>Properties you've marked as favorites</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSaved ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading...</p>
                    </div>
                  ) : savedProperties.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No saved properties yet</p>
                      <p className="text-sm">Start exploring and save your favorites!</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {savedProperties.map((saved) => (
                        <Card key={saved.id} className="overflow-hidden">
                          <div className="aspect-video relative">
                            <img
                              src={saved.property.featured_image || "/placeholder.svg"}
                              alt={saved.property.title || "Property"}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-1">{saved.property.title || "Property"}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {saved.property.location || "Location not available"}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-lg font-bold">
                                {saved.property.price 
                                  ? `AED ${saved.property.price.toLocaleString()}`
                                  : "Price on request"
                                }
                              </p>
                              <Link to={`/property/${saved.property.id}`}>
                                <Button size="sm" variant="outline">
                                  View <ExternalLink className="ml-1 h-3 w-3" />
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inquiries">
              <Card>
                <CardHeader>
                  <CardTitle>My Inquiries</CardTitle>
                  <CardDescription>Track your property inquiries and conversations</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingInquiries ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading...</p>
                    </div>
                  ) : inquiries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No inquiries yet</p>
                      <p className="text-sm">Contact us about any property you're interested in!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {inquiries.map((inquiry) => (
                        <Card key={inquiry.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold capitalize">{inquiry.inquiry_type}</span>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      inquiry.status === "new"
                                        ? "bg-blue-100 text-blue-800"
                                        : inquiry.status === "contacted"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : inquiry.status === "in-progress"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {inquiry.status}
                                  </span>
                                </div>
                                {inquiry.property_code && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Property Code: {inquiry.property_code}
                                  </p>
                                )}
                                <p className="text-sm mb-2">{inquiry.message}</p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted {new Date(inquiry.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              {inquiry.property_code && (
                                <Button size="sm" variant="ghost" title={`Property Code: ${inquiry.property_code}`}>
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            {inquiry.agent_notes && (
                              <div className="mt-3 p-3 bg-muted rounded-md">
                                <p className="text-xs font-semibold mb-1">Agent Notes:</p>
                                <p className="text-sm">{inquiry.agent_notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Profile Information</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Name:</span> {profile?.full_name}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span> {profile?.email}
                      </p>
                      <p>
                        <span className="font-medium">Role:</span> {profile?.role}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <Button variant="outline" disabled>
                      Update Profile (Coming Soon)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
