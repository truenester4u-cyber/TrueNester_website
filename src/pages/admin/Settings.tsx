import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Settings as SettingsIcon, 
  Globe, 
  Mail, 
  DollarSign, 
  Share2, 
  Eye, 
  Bell,
  Palette,
  Shield,
  Loader2,
  Save
} from "lucide-react";

interface SiteSettings {
  // General
  site_name: string;
  site_tagline: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  
  // SEO
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  google_analytics_id: string;
  google_tag_manager_id: string;
  facebook_pixel_id: string;
  
  // Email
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  email_from_name: string;
  email_from_address: string;
  
  // Notifications
  enable_email_notifications: boolean;
  enable_inquiry_notifications: boolean;
  enable_new_property_alerts: boolean;
  notification_email: string;
  
  // Currency & Display
  default_currency: string;
  currency_symbol: string;
  price_format: string;
  properties_per_page: number;
  enable_price_on_request: boolean;
  
  // Social Media
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  linkedin_url: string;
  youtube_url: string;
  whatsapp_number: string;
  
  // Branding
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  
  // Features
  enable_chat: boolean;
  enable_property_comparison: boolean;
  enable_saved_properties: boolean;
  enable_property_alerts: boolean;
  enable_virtual_tours: boolean;
  
  // Legal
  terms_url: string;
  privacy_url: string;
  cookie_policy_url: string;
}

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: "Dubai Nest Hub",
    site_tagline: "Find Your Perfect Property in UAE",
    site_description: "",
    contact_email: "",
    contact_phone: "",
    contact_address: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    google_analytics_id: "",
    google_tag_manager_id: "",
    facebook_pixel_id: "",
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    smtp_password: "",
    email_from_name: "",
    email_from_address: "",
    enable_email_notifications: true,
    enable_inquiry_notifications: true,
    enable_new_property_alerts: false,
    notification_email: "",
    default_currency: "AED",
    currency_symbol: "AED",
    price_format: "1,234,567",
    properties_per_page: 12,
    enable_price_on_request: true,
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    linkedin_url: "",
    youtube_url: "",
    whatsapp_number: "",
    logo_url: "",
    favicon_url: "",
    primary_color: "#DC2626",
    secondary_color: "#1F2937",
    enable_chat: true,
    enable_property_comparison: true,
    enable_saved_properties: true,
    enable_property_alerts: true,
    enable_virtual_tours: true,
    terms_url: "",
    privacy_url: "",
    cookie_policy_url: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .single();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update(settings)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert([settings]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SiteSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your site configuration and preferences</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="general">
              <Globe className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="seo">
              <Eye className="h-4 w-4 mr-2" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="currency">
              <DollarSign className="h-4 w-4 mr-2" />
              Currency
            </TabsTrigger>
            <TabsTrigger value="social">
              <Share2 className="h-4 w-4 mr-2" />
              Social
            </TabsTrigger>
            <TabsTrigger value="branding">
              <Palette className="h-4 w-4 mr-2" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="features">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Features
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Basic site information and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_name">Site Name</Label>
                    <Input
                      id="site_name"
                      value={settings.site_name}
                      onChange={(e) => updateSetting("site_name", e.target.value)}
                      placeholder="Dubai Nest Hub"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site_tagline">Site Tagline</Label>
                    <Input
                      id="site_tagline"
                      value={settings.site_tagline}
                      onChange={(e) => updateSetting("site_tagline", e.target.value)}
                      placeholder="Find Your Perfect Property in UAE"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_description">Site Description</Label>
                  <Textarea
                    id="site_description"
                    value={settings.site_description}
                    onChange={(e) => updateSetting("site_description", e.target.value)}
                    placeholder="Describe your real estate platform..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => updateSetting("contact_email", e.target.value)}
                      placeholder="info@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      value={settings.contact_phone}
                      onChange={(e) => updateSetting("contact_phone", e.target.value)}
                      placeholder="+971 XX XXX XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                    <Input
                      id="whatsapp_number"
                      value={settings.whatsapp_number}
                      onChange={(e) => updateSetting("whatsapp_number", e.target.value)}
                      placeholder="+971XXXXXXXXX"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_address">Contact Address</Label>
                  <Textarea
                    id="contact_address"
                    value={settings.contact_address}
                    onChange={(e) => updateSetting("contact_address", e.target.value)}
                    placeholder="Your office address..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Settings */}
          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SEO & Analytics</CardTitle>
                <CardDescription>Search engine optimization and tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={settings.meta_title}
                    onChange={(e) => updateSetting("meta_title", e.target.value)}
                    placeholder="Default page title for SEO"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={settings.meta_description}
                    onChange={(e) => updateSetting("meta_description", e.target.value)}
                    placeholder="Default meta description for SEO"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_keywords">Meta Keywords</Label>
                  <Input
                    id="meta_keywords"
                    value={settings.meta_keywords}
                    onChange={(e) => updateSetting("meta_keywords", e.target.value)}
                    placeholder="real estate, dubai, properties, apartments"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                    <Input
                      id="google_analytics_id"
                      value={settings.google_analytics_id}
                      onChange={(e) => updateSetting("google_analytics_id", e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="google_tag_manager_id">Google Tag Manager ID</Label>
                    <Input
                      id="google_tag_manager_id"
                      value={settings.google_tag_manager_id}
                      onChange={(e) => updateSetting("google_tag_manager_id", e.target.value)}
                      placeholder="GTM-XXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
                    <Input
                      id="facebook_pixel_id"
                      value={settings.facebook_pixel_id}
                      onChange={(e) => updateSetting("facebook_pixel_id", e.target.value)}
                      placeholder="XXXXXXXXXXXXXXX"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>SMTP settings for sending emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_host">SMTP Host</Label>
                    <Input
                      id="smtp_host"
                      value={settings.smtp_host}
                      onChange={(e) => updateSetting("smtp_host", e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp_port">SMTP Port</Label>
                    <Input
                      id="smtp_port"
                      value={settings.smtp_port}
                      onChange={(e) => updateSetting("smtp_port", e.target.value)}
                      placeholder="587"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_user">SMTP Username</Label>
                    <Input
                      id="smtp_user"
                      value={settings.smtp_user}
                      onChange={(e) => updateSetting("smtp_user", e.target.value)}
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp_password">SMTP Password</Label>
                    <Input
                      id="smtp_password"
                      type="password"
                      value={settings.smtp_password}
                      onChange={(e) => updateSetting("smtp_password", e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email_from_name">From Name</Label>
                    <Input
                      id="email_from_name"
                      value={settings.email_from_name}
                      onChange={(e) => updateSetting("email_from_name", e.target.value)}
                      placeholder="Dubai Nest Hub"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_from_address">From Email</Label>
                    <Input
                      id="email_from_address"
                      type="email"
                      value={settings.email_from_address}
                      onChange={(e) => updateSetting("email_from_address", e.target.value)}
                      placeholder="noreply@example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure email notifications and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email notifications for important events</p>
                  </div>
                  <Switch
                    checked={settings.enable_email_notifications}
                    onCheckedChange={(checked) => updateSetting("enable_email_notifications", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Inquiry Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified when users submit inquiries</p>
                  </div>
                  <Switch
                    checked={settings.enable_inquiry_notifications}
                    onCheckedChange={(checked) => updateSetting("enable_inquiry_notifications", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Property Alerts</Label>
                    <p className="text-sm text-muted-foreground">Send alerts to users when new properties are listed</p>
                  </div>
                  <Switch
                    checked={settings.enable_new_property_alerts}
                    onCheckedChange={(checked) => updateSetting("enable_new_property_alerts", checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification_email">Notification Email</Label>
                  <Input
                    id="notification_email"
                    type="email"
                    value={settings.notification_email}
                    onChange={(e) => updateSetting("notification_email", e.target.value)}
                    placeholder="admin@example.com"
                  />
                  <p className="text-sm text-muted-foreground">Email address to receive admin notifications</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Currency & Display */}
          <TabsContent value="currency" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Currency & Display Settings</CardTitle>
                <CardDescription>Configure currency and property display options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default_currency">Default Currency</Label>
                    <Select value={settings.default_currency} onValueChange={(value) => updateSetting("default_currency", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency_symbol">Currency Symbol</Label>
                    <Input
                      id="currency_symbol"
                      value={settings.currency_symbol}
                      onChange={(e) => updateSetting("currency_symbol", e.target.value)}
                      placeholder="AED"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_format">Price Format</Label>
                    <Select value={settings.price_format} onValueChange={(value) => updateSetting("price_format", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1,234,567">1,234,567</SelectItem>
                        <SelectItem value="1.234.567">1.234.567</SelectItem>
                        <SelectItem value="1 234 567">1 234 567</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="properties_per_page">Properties Per Page</Label>
                    <Select 
                      value={settings.properties_per_page.toString()} 
                      onValueChange={(value) => updateSetting("properties_per_page", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="12">12</SelectItem>
                        <SelectItem value="24">24</SelectItem>
                        <SelectItem value="48">48</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between pt-8">
                    <div className="space-y-0.5">
                      <Label>Enable "Price on Request"</Label>
                      <p className="text-sm text-muted-foreground">Allow hiding prices</p>
                    </div>
                    <Switch
                      checked={settings.enable_price_on_request}
                      onCheckedChange={(checked) => updateSetting("enable_price_on_request", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media */}
          <TabsContent value="social" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
                <CardDescription>Connect your social media profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook_url">Facebook URL</Label>
                    <Input
                      id="facebook_url"
                      value={settings.facebook_url}
                      onChange={(e) => updateSetting("facebook_url", e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram_url">Instagram URL</Label>
                    <Input
                      id="instagram_url"
                      value={settings.instagram_url}
                      onChange={(e) => updateSetting("instagram_url", e.target.value)}
                      placeholder="https://instagram.com/yourprofile"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter_url">Twitter/X URL</Label>
                    <Input
                      id="twitter_url"
                      value={settings.twitter_url}
                      onChange={(e) => updateSetting("twitter_url", e.target.value)}
                      placeholder="https://twitter.com/yourprofile"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                    <Input
                      id="linkedin_url"
                      value={settings.linkedin_url}
                      onChange={(e) => updateSetting("linkedin_url", e.target.value)}
                      placeholder="https://linkedin.com/company/yourcompany"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube_url">YouTube URL</Label>
                    <Input
                      id="youtube_url"
                      value={settings.youtube_url}
                      onChange={(e) => updateSetting("youtube_url", e.target.value)}
                      placeholder="https://youtube.com/@yourchannel"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding */}
          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Branding & Appearance</CardTitle>
                <CardDescription>Customize your site's look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      value={settings.logo_url}
                      onChange={(e) => updateSetting("logo_url", e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="favicon_url">Favicon URL</Label>
                    <Input
                      id="favicon_url"
                      value={settings.favicon_url}
                      onChange={(e) => updateSetting("favicon_url", e.target.value)}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary_color"
                        type="color"
                        value={settings.primary_color}
                        onChange={(e) => updateSetting("primary_color", e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={settings.primary_color}
                        onChange={(e) => updateSetting("primary_color", e.target.value)}
                        placeholder="#DC2626"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary_color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary_color"
                        type="color"
                        value={settings.secondary_color}
                        onChange={(e) => updateSetting("secondary_color", e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={settings.secondary_color}
                        onChange={(e) => updateSetting("secondary_color", e.target.value)}
                        placeholder="#1F2937"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="terms_url">Terms & Conditions URL</Label>
                    <Input
                      id="terms_url"
                      value={settings.terms_url}
                      onChange={(e) => updateSetting("terms_url", e.target.value)}
                      placeholder="/terms"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="privacy_url">Privacy Policy URL</Label>
                    <Input
                      id="privacy_url"
                      value={settings.privacy_url}
                      onChange={(e) => updateSetting("privacy_url", e.target.value)}
                      placeholder="/privacy"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cookie_policy_url">Cookie Policy URL</Label>
                    <Input
                      id="cookie_policy_url"
                      value={settings.cookie_policy_url}
                      onChange={(e) => updateSetting("cookie_policy_url", e.target.value)}
                      placeholder="/cookies"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features */}
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feature Toggles</CardTitle>
                <CardDescription>Enable or disable site features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Live Chat</Label>
                    <p className="text-sm text-muted-foreground">Enable TrueNester AI chatbot</p>
                  </div>
                  <Switch
                    checked={settings.enable_chat}
                    onCheckedChange={(checked) => updateSetting("enable_chat", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Property Comparison</Label>
                    <p className="text-sm text-muted-foreground">Allow users to compare properties</p>
                  </div>
                  <Switch
                    checked={settings.enable_property_comparison}
                    onCheckedChange={(checked) => updateSetting("enable_property_comparison", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Saved Properties</Label>
                    <p className="text-sm text-muted-foreground">Let users save favorite properties</p>
                  </div>
                  <Switch
                    checked={settings.enable_saved_properties}
                    onCheckedChange={(checked) => updateSetting("enable_saved_properties", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Property Alerts</Label>
                    <p className="text-sm text-muted-foreground">Email alerts for new matching properties</p>
                  </div>
                  <Switch
                    checked={settings.enable_property_alerts}
                    onCheckedChange={(checked) => updateSetting("enable_property_alerts", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Virtual Tours</Label>
                    <p className="text-sm text-muted-foreground">Enable 360° virtual property tours</p>
                  </div>
                  <Switch
                    checked={settings.enable_virtual_tours}
                    onCheckedChange={(checked) => updateSetting("enable_virtual_tours", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Settings;
