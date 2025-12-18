import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, MapPin, Eye, AlertCircle, Building2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Location {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  properties_count: number;
  price_range: string;
  features: string[];
  published: boolean;
  city: string;
  created_at: string;
  updated_at: string;
}

const Locations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tableNotFound, setTableNotFound] = useState(false);
  const [needsCityMigration, setNeedsCityMigration] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleRefresh = async () => {
    console.log("Manual refresh triggered");
    setTableNotFound(false);
    setLoading(true);
    
    toast({
      title: "Refreshing...",
      description: "Reconnecting to database...",
    });
    
    // Wait a moment to allow any schema updates
    await new Promise(resolve => setTimeout(resolve, 1000));
    await fetchLocations();
  };

  const runCityMigration = async () => {
    try {
      toast({
        title: "Running Migration...",
        description: "Adding city column to locations table...",
      });

      // Add city column
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE locations ADD COLUMN IF NOT EXISTS city VARCHAR(100);
          CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
          UPDATE locations SET city = 'Dubai' WHERE name ILIKE '%Dubai%' AND city IS NULL;
          UPDATE locations SET city = 'Abu Dhabi' WHERE name ILIKE '%Abu Dhabi%' AND city IS NULL;
          UPDATE locations SET city = 'Ras Al Khaimah' WHERE (name ILIKE '%Ras Al Khaimah%' OR name ILIKE '%RAK%') AND city IS NULL;
          UPDATE locations SET city = 'Umm Al Quwain' WHERE (name ILIKE '%Umm Al Quwain%' OR name ILIKE '%UAQ%') AND city IS NULL;
        `
      });

      if (alterError) {
        throw alterError;
      }

      toast({
        title: "Success!",
        description: "City column added successfully. Refreshing...",
      });

      // Refresh the page
      await handleRefresh();
    } catch (error: any) {
      console.error("Migration error:", error);
      toast({
        title: "Manual Migration Required",
        description: "Please run the migration SQL in Supabase dashboard. Check RUN_THIS_MIGRATION.sql file.",
        variant: "destructive",
      });
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setTableNotFound(false);
      
      console.log("Fetching locations from Supabase...");
      
      const { data, error, status } = await supabase
        .from("locations")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("Supabase response:", { data, error, status });

      if (error) {
        console.error("Locations fetch error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Check if table doesn't exist - check multiple error patterns
        const tableNotExistsErrors = [
          "does not exist",
          "schema cache",
          "relation",
          "PGRST204",
          "42P01",
          "not found"
        ];
        
        const isTableMissing = tableNotExistsErrors.some(pattern => 
          error.message?.toLowerCase().includes(pattern.toLowerCase()) ||
          error.code === pattern ||
          error.details?.toLowerCase().includes(pattern.toLowerCase())
        );

        if (isTableMissing) {
          console.error("Table not found - showing setup screen");
          setTableNotFound(true);
          setLoading(false);
          return;
        }
        
        // If it's another error, throw it
        throw error;
      }

      console.log(`Successfully loaded ${data?.length || 0} locations`);
      setLocations(data || []);
      setTableNotFound(false);
      
      // Check if city column exists
      if (data && data.length > 0 && !data[0].hasOwnProperty('city')) {
        setNeedsCityMigration(true);
      } else {
        setNeedsCityMigration(false);
      }
      
      toast({
        title: "Success",
        description: data && data.length > 0 
          ? `Loaded ${data.length} location${data.length !== 1 ? 's' : ''}` 
          : "No locations found. Click 'Add Location' to create one.",
      });
    } catch (error: any) {
      console.error("Fetch locations error:", error);
      
      // Check if it's a city column error
      if (error.message?.includes("city") || error.message?.includes("column")) {
        setNeedsCityMigration(true);
        toast({
          title: "Migration Needed",
          description: "City column not found. Please run the migration.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error Loading Locations",
          description: error.message || "Failed to fetch locations. Check browser console for details.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("locations").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Location deleted successfully",
      });

      fetchLocations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("locations")
        .update({ published: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Location ${!currentStatus ? "published" : "unpublished"} successfully`,
      });

      fetchLocations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading && !tableNotFound) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading locations...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (tableNotFound) {
    return (
      <AdminLayout>
        <div className="space-y-6 max-w-2xl mx-auto mt-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>🚨 Locations Table Not Found</AlertTitle>
            <AlertDescription>
              The database table for locations doesn't exist. You must create it in Supabase first.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>🔧 Setup Required - Follow These Steps</CardTitle>
              <CardDescription>
                This is a ONE-TIME setup that takes 2 minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="bg-orange-50 border-2 border-orange-200 p-4 rounded-lg space-y-3">
                <p className="text-sm font-bold text-orange-900">⚠️ IMPORTANT: You MUST run SQL in Supabase</p>
                <p className="text-xs text-orange-800">The app cannot create tables automatically. You need to execute the SQL script in Supabase dashboard (it's very easy, just copy and paste!).</p>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <p className="text-sm font-bold">📋 Simple 4-Step Process:</p>
                <div className="space-y-2">
                  <div className="flex gap-3 items-start">
                    <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                    <p className="text-sm text-muted-foreground">Click "Go to Database Setup" below</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                    <p className="text-sm text-muted-foreground">Click "Check Database Status" (you'll see what's missing)</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                    <p className="text-sm text-muted-foreground">Copy the SQL code → Open Supabase → Paste → Click RUN</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                    <p className="text-sm text-muted-foreground">Wait 15 seconds, come back here, click "Refresh"</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleRefresh} 
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "⏳ Checking..." : "🔄 Refresh (After Setup Complete)"}
                </Button>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-xs text-blue-900">
                  <strong>🎁 What you'll get:</strong> After setup, you'll have 6 sample Dubai locations (Downtown, Marina, Palm Jumeirah, etc.) ready to use!
                </AlertDescription>
              </Alert>

              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  Need help? Check browser console (F12) for error details
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  // If city migration is needed, show a warning banner
  if (needsCityMigration) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Locations Management</h1>
            <p className="text-muted-foreground mt-2">
              Database migration required
            </p>
          </div>

          <Alert variant="destructive" className="border-2">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">⚠️ City Column Missing</AlertTitle>
            <AlertDescription className="space-y-4 mt-3">
              <p>The locations table needs a <code className="bg-black/10 px-2 py-1 rounded">city</code> column for the new city-based organization feature.</p>
              
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg space-y-3">
                <p className="font-semibold">📋 Quick Fix - Copy & Run in Supabase:</p>
                <div className="bg-white dark:bg-black p-3 rounded border font-mono text-xs overflow-x-auto">
                  <pre>{`ALTER TABLE locations ADD COLUMN IF NOT EXISTS city VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
UPDATE locations SET city = 'Dubai' WHERE name ILIKE '%Dubai%' AND city IS NULL;
UPDATE locations SET city = 'Abu Dhabi' WHERE name ILIKE '%Abu Dhabi%' AND city IS NULL;
UPDATE locations SET city = 'Ras Al Khaimah' WHERE (name ILIKE '%Ras Al Khaimah%' OR name ILIKE '%RAK%') AND city IS NULL;
UPDATE locations SET city = 'Umm Al Quwain' WHERE (name ILIKE '%Umm Al Quwain%' OR name ILIKE '%UAQ%') AND city IS NULL;`}</pre>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button 
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  variant="default"
                >
                  Open Supabase Dashboard
                </Button>
                <Button onClick={handleRefresh} variant="outline">
                  I've Run It - Refresh Now
                </Button>
              </div>

              <div className="text-sm space-y-2">
                <p className="font-semibold">Steps:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Click "Open Supabase Dashboard" above</li>
                  <li>Go to SQL Editor in the left sidebar</li>
                  <li>Copy the SQL code from the box above</li>
                  <li>Paste it in the SQL Editor</li>
                  <li>Click "RUN" button</li>
                  <li>Come back here and click "I've Run It - Refresh Now"</li>
                </ol>
              </div>

              <p className="text-xs">💡 This is a one-time setup. After this, you'll see 3 city cards (Dubai, Abu Dhabi, Ras Al Khaimah) for organized location management.</p>
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">New City-Based Organization</h3>
              <p className="text-muted-foreground mb-4">
                Once migration is complete, you'll be able to organize locations by city
              </p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const dubaiLocations = locations.filter(loc => loc.city === 'Dubai');
  const abuDhabiLocations = locations.filter(loc => loc.city === 'Abu Dhabi');
  const rakLocations = locations.filter(loc => loc.city === 'Ras Al Khaimah');
  const uaqLocations = locations.filter(loc => loc.city === 'Umm Al Quwain');

  const renderCityCard = (city: string, cityLocations: Location[], emoji: string) => (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Building2 className="h-6 w-6" />
              {emoji} {city}
            </CardTitle>
            <CardDescription className="mt-2">
              {cityLocations.length} location{cityLocations.length !== 1 ? 's' : ''} · 
              {' '}{cityLocations.filter(l => l.published).length} published
            </CardDescription>
          </div>
          <Button 
            onClick={() => navigate(`/admin/locations/new?city=${encodeURIComponent(city)}`)}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {cityLocations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No locations in {city} yet</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Add areas and neighborhoods for {city}
            </p>
            <Button 
              onClick={() => navigate(`/admin/locations/new?city=${encodeURIComponent(city)}`)}
              variant="outline"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Location
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {cityLocations.map((location) => (
              <div key={location.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  {location.image_url ? (
                    <img
                      src={location.image_url}
                      alt={location.name}
                      className="w-20 h-16 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base truncate">{location.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">{location.slug}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{location.properties_count} properties</span>
                          <span>•</span>
                          <span>{location.price_range}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant={location.published ? "default" : "secondary"}
                          className="cursor-pointer text-xs"
                          onClick={() => togglePublish(location.id, location.published)}
                        >
                          {location.published ? (
                            <>
                              <Eye className="mr-1 h-3 w-3" />
                              Live
                            </>
                          ) : (
                            "Draft"
                          )}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/locations/edit/${location.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(location.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Locations Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage locations and sub-areas by city
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        {locations.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start by adding locations for Dubai, Abu Dhabi, Ras Al Khaimah, or Umm Al Quwain
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button onClick={() => navigate("/admin/locations/new?city=Dubai")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Dubai Location
                  </Button>
                  <Button onClick={() => navigate("/admin/locations/new?city=Abu%20Dhabi")} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Abu Dhabi Location
                  </Button>
                  <Button onClick={() => navigate("/admin/locations/new?city=Ras%20Al%20Khaimah")} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add RAK Location
                  </Button>
                  <Button onClick={() => navigate("/admin/locations/new?city=Umm%20Al%20Quwain")} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add UAQ Location
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {renderCityCard("Dubai", dubaiLocations, "🏙️")}
            {renderCityCard("Abu Dhabi", abuDhabiLocations, "🏛️")}
            {renderCityCard("Ras Al Khaimah", rakLocations, "🏔️")}
            {renderCityCard("Umm Al Quwain", uaqLocations, "🏖️")}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              location from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Locations;
