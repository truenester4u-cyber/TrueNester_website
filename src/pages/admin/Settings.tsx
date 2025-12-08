import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

interface SiteSettings {
  id?: string;
  site_title: string;
  site_description: string;
  site_keywords: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  about_us: string;
  updated_at?: string;
}

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    site_title: "",
    site_description: "",
    site_keywords: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    linkedin_url: "",
    about_us: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      // Initialize with empty settings if table doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof SiteSettings,
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!settings.site_title || !settings.contact_email) {
        toast({
          title: "Validation Error",
          description: "Site title and contact email are required",
          variant: "destructive",
        });
        return;
      }

      const settingsData = {
        site_title: settings.site_title,
        site_description: settings.site_description,
        site_keywords: settings.site_keywords,
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        address: settings.address,
        facebook_url: settings.facebook_url || null,
        twitter_url: settings.twitter_url || null,
        instagram_url: settings.instagram_url || null,
        linkedin_url: settings.linkedin_url || null,
        about_us: settings.about_us,
      };

      if (settings.id) {
        // Update existing settings
        const { error } = await supabase
          .from("site_settings")
          .update(settingsData)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { data, error } = await supabase
          .from("site_settings")
          .insert([settingsData])
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setSettings(data);
        }
      }

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Site Settings</h1>

        {/* General Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure your site's basic information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="site_title">Site Title</Label>
              <Input
                id="site_title"
                value={settings.site_title}
                onChange={(e) => handleInputChange("site_title", e.target.value)}
                placeholder="Your Site Title"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="site_description">Site Description</Label>
              <Textarea
                id="site_description"
                value={settings.site_description}
                onChange={(e) => handleInputChange("site_description", e.target.value)}
                placeholder="Brief description of your site"
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="site_keywords">Site Keywords</Label>
              <Input
                id="site_keywords"
                value={settings.site_keywords}
                onChange={(e) => handleInputChange("site_keywords", e.target.value)}
                placeholder="Comma-separated keywords for SEO"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="about_us">About Us</Label>
              <Textarea
                id="about_us"
                value={settings.about_us}
                onChange={(e) => handleInputChange("about_us", e.target.value)}
                placeholder="Your company/site information"
                rows={5}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>How customers can reach you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={settings.contact_email}
                onChange={(e) => handleInputChange("contact_email", e.target.value)}
                placeholder="contact@example.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={settings.contact_phone}
                onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address">Physical Address</Label>
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Your office address"
                rows={3}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Social Media</CardTitle>
            <CardDescription>Your social media profiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="facebook_url">Facebook URL</Label>
              <Input
                id="facebook_url"
                type="url"
                value={settings.facebook_url || ""}
                onChange={(e) => handleInputChange("facebook_url", e.target.value)}
                placeholder="https://facebook.com/yourpage"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="twitter_url">Twitter URL</Label>
              <Input
                id="twitter_url"
                type="url"
                value={settings.twitter_url || ""}
                onChange={(e) => handleInputChange("twitter_url", e.target.value)}
                placeholder="https://twitter.com/yourhandle"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="instagram_url">Instagram URL</Label>
              <Input
                id="instagram_url"
                type="url"
                value={settings.instagram_url || ""}
                onChange={(e) => handleInputChange("instagram_url", e.target.value)}
                placeholder="https://instagram.com/yourprofile"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                type="url"
                value={settings.linkedin_url || ""}
                onChange={(e) => handleInputChange("linkedin_url", e.target.value)}
                placeholder="https://linkedin.com/company/yourcompany"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            className="bg-gradient-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
