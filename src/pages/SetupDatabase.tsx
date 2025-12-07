import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Copy, Database, MapPin, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";

const locationsMigrationSQL = `-- Locations Table for Dubai Nest Hub
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    properties_count INTEGER DEFAULT 0,
    price_range VARCHAR(100),
    features TEXT[] DEFAULT '{}',
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_locations_slug ON public.locations(slug);
CREATE INDEX IF NOT EXISTS idx_locations_published ON public.locations(published);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public locations are viewable by everyone"
    ON public.locations FOR SELECT
    USING (published = true);

CREATE POLICY "Authenticated users can view all locations"
    ON public.locations FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert locations"
    ON public.locations FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update locations"
    ON public.locations FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete locations"
    ON public.locations FOR DELETE
    USING (auth.role() = 'authenticated');

INSERT INTO public.locations (name, slug, description, image_url, properties_count, price_range, features, published) VALUES
('Downtown Dubai', 'downtown-dubai', 'Home to Burj Khalifa and Dubai Mall, the heart of the city', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c', 120, 'AED 800K - 15M', ARRAY['Burj Khalifa Views', 'Dubai Mall Access', 'Metro Connected', 'Premium Lifestyle'], true),
('Palm Jumeirah', 'palm-jumeirah', 'Iconic palm-shaped island with luxury beachfront living', 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5', 85, 'AED 2M - 50M', ARRAY['Beach Access', '5-Star Hotels', 'Luxury Villas', 'Water Sports'], true),
('Dubai Marina', 'dubai-marina', 'Waterfront community with stunning skyline views', 'https://images.unsplash.com/photo-1518684079-3c830dcef090', 150, 'AED 900K - 8M', ARRAY['Marina Walk', 'Restaurants & Cafes', 'Beach Proximity', 'Yacht Club'], true),
('Business Bay', 'business-bay', 'Modern business district with excellent connectivity', 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33', 95, 'AED 700K - 5M', ARRAY['Business Hub', 'Canal Views', 'Metro Access', 'Mixed-Use'], true),
('JBR', 'jbr', 'Jumeirah Beach Residence - beachfront living at its finest', 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745', 78, 'AED 1M - 6M', ARRAY['Beach Front', 'The Walk JBR', 'Retail Paradise', 'Vibrant Nightlife'], true),
('Arabian Ranches', 'arabian-ranches', 'Tranquil villa community with golf course', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9', 62, 'AED 1.5M - 10M', ARRAY['Golf Course', 'Family Community', 'Parks & Schools', 'Peaceful Living'], true)
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_locations_updated_at ON public.locations;
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;

const migrationSQL = `-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(15, 2),
  property_type TEXT NOT NULL,
  purpose TEXT NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT,
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  size_sqft DECIMAL(10, 2),
  size_sqm DECIMAL(10, 2),
  features JSONB DEFAULT '[]'::jsonb,
  amenities JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  featured_image TEXT,
  developer TEXT,
  completion_status TEXT,
  completion_date DATE,
  furnished TEXT,
  parking_spaces INTEGER,
  floor_number INTEGER,
  total_floors INTEGER,
  meta_title TEXT,
  meta_description TEXT,
  price_display TEXT,
  featured BOOLEAN DEFAULT false,
  featured_dubai BOOLEAN DEFAULT false,
  featured_abu_dhabi BOOLEAN DEFAULT false,
  featured_ras_al_khaimah BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  agent_name TEXT,
  agent_phone TEXT,
  agent_email TEXT
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published properties"
  ON public.properties FOR SELECT
  USING (published = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert properties"
  ON public.properties FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update properties"
  ON public.properties FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete properties"
  ON public.properties FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_properties_published ON public.properties(published);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON public.properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_featured_dubai ON public.properties(featured_dubai);
CREATE INDEX IF NOT EXISTS idx_properties_featured_abu_dhabi ON public.properties(featured_abu_dhabi);
CREATE INDEX IF NOT EXISTS idx_properties_featured_ras_al_khaimah ON public.properties(featured_ras_al_khaimah);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_purpose ON public.properties(purpose);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_slug ON public.properties(slug);

CREATE OR REPLACE FUNCTION update_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_properties_updated_at ON public.properties;
CREATE TRIGGER set_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION update_properties_updated_at();`;

const SetupDatabase = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<"idle" | "checking" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [tableExists, setTableExists] = useState(false);
  const [locationsTableExists, setLocationsTableExists] = useState(false);
  const [setupStep, setSetupStep] = useState<"check" | "setup" | "complete">("check");

  const checkTableExists = async () => {
    setStatus("checking");
    try {
      // Check properties table
      const { error: propertiesError } = await supabase
        .from("properties")
        .select("id")
        .limit(1);

      // Check locations table
      const { error: locationsError } = await supabase
        .from("locations")
        .select("id")
        .limit(1);

      const propertiesExists = !propertiesError || !propertiesError.message.includes("does not exist");
      const locationsExists = !locationsError || !locationsError.message.includes("does not exist");

      setTableExists(propertiesExists);
      setLocationsTableExists(locationsExists);

      if (propertiesExists && locationsExists) {
        setMessage("✅ All database tables are ready! You're good to go.");
        setStatus("success");
        setSetupStep("complete");
      } else {
        const missing = [];
        if (!propertiesExists) missing.push("Properties");
        if (!locationsExists) missing.push("Locations");
        setMessage(`Missing tables: ${missing.join(", ")}. Click the setup button below.`);
        setStatus("error");
        setSetupStep("setup");
      }
    } catch (error: any) {
      setMessage(`Error checking tables: ${error.message}`);
      setStatus("error");
      setSetupStep("setup");
    }
  };

  const copyToClipboard = (sql: string, type: string) => {
    navigator.clipboard.writeText(sql);
    toast({
      title: "Copied!",
      description: `${type} SQL migration copied to clipboard`,
    });
  };

  return (
    <Layout>
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="text-center mb-8">
          <Database className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-2">Database Setup</h1>
          <p className="text-muted-foreground">Set up your database tables in 2 simple steps</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step 1: Check Database Status</CardTitle>
            <CardDescription>
              Let's verify if all required tables exist in your database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkTableExists} disabled={status === "checking"} size="lg" className="w-full">
              {status === "checking" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Database className="mr-2 h-4 w-4" />
              Check Database Status
            </Button>

            {message && (
              <Alert variant={status === "success" ? "default" : "destructive"}>
                {status === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : status === "error" ? (
                  <XCircle className="h-4 w-4" />
                ) : null}
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {status !== "idle" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <Card className={tableExists ? "border-green-500" : "border-destructive"}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Properties Table
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tableExists ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        <span className="text-sm">Ready</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-destructive">
                        <XCircle className="h-4 w-4 mr-2" />
                        <span className="text-sm">Missing</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className={locationsTableExists ? "border-green-500" : "border-destructive"}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Locations Table
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {locationsTableExists ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        <span className="text-sm">Ready</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-destructive">
                        <XCircle className="h-4 w-4 mr-2" />
                        <span className="text-sm">Missing</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {setupStep === "setup" && (
          <>
            {!locationsTableExists && (
              <Card className="mb-6 border-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Step 2: Setup Locations Table
                  </CardTitle>
                  <CardDescription>
                    Create the locations table for managing Dubai neighborhoods
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertDescription className="text-sm">
                      <strong>Quick Setup (Non-Technical Users):</strong> Just follow these 4 simple steps!
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3 bg-muted p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Click the button below to copy the setup code</p>
                      </div>
                    </div>
                    <Button onClick={() => copyToClipboard(locationsMigrationSQL, "Locations")} variant="outline" className="w-full" size="lg">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Locations Setup Code
                    </Button>
                  </div>

                  <div className="space-y-3 bg-muted p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-2">Open Supabase SQL Editor (opens in new tab)</p>
                        <a
                          href="https://supabase.com/dashboard/project/_/sql/new"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="default" className="w-full" size="lg">
                            <Database className="mr-2 h-4 w-4" />
                            Open Supabase SQL Editor
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 bg-muted p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">In the SQL Editor:</p>
                        <ul className="text-xs mt-2 space-y-1 text-muted-foreground">
                          <li>• Paste the copied code (Ctrl+V or Cmd+V)</li>
                          <li>• Click the green <strong>"RUN"</strong> button in the bottom right</li>
                          <li>• Wait for "Success" message</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 bg-muted p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-2">Come back here and check status again</p>
                        <Button onClick={checkTableExists} variant="default" className="w-full" size="lg">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Verify Setup Complete
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Alert className="mt-4">
                    <AlertDescription className="text-xs">
                      <strong>Note:</strong> This will create the locations table with 6 sample Dubai locations (Downtown, Palm Jumeirah, Marina, etc.)
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {!tableExists && (
              <Card className="border-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Setup Properties Table
                  </CardTitle>
                  <CardDescription>
                    Create the properties table (if needed)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={() => copyToClipboard(migrationSQL, "Properties")} variant="outline" className="w-full">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Properties Setup Code
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Follow the same 4 steps above using this code instead.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {setupStep === "complete" && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                ✅ All Set! Database Ready
              </CardTitle>
              <CardDescription>Your database is fully configured and ready to use</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 mb-3">
                  <strong>Great job!</strong> All database tables have been successfully created. You can now manage:
                </p>
                <ul className="text-sm text-green-700 space-y-1 ml-4">
                  <li>✓ Properties (listings, apartments, villas)</li>
                  <li>✓ Locations (Dubai neighborhoods with 6 samples included)</li>
                  <li>✓ Blog posts and content</li>
                </ul>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <Button onClick={() => window.location.href = "/admin/dashboard"} size="lg" className="w-full">
                  Go to Admin Dashboard
                </Button>
                <Button onClick={() => window.location.href = "/admin/locations"} variant="outline" size="lg" className="w-full">
                  <MapPin className="mr-2 h-4 w-4" />
                  Manage Locations
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SetupDatabase;
