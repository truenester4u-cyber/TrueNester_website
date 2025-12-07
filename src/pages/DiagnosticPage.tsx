import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DiagnosticPage = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, floor_plans, payment_plan, handover_date")
        .limit(10);

      if (error) {
        console.error("Error fetching properties:", error);
        return;
      }

      console.log("Raw database response:", data);
      setProperties(data || []);
    } catch (error) {
      console.error("Exception:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkColumns = async () => {
    try {
      // Try to query the columns
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .limit(1);

      if (error) {
        console.error("❌ Error checking columns:", error);
        return;
      }

      if (data && data[0]) {
        const columns = Object.keys(data[0]);
        console.log("✅ Available columns in properties table:", columns);
        console.log("✅ Has floor_plans?", columns.includes("floor_plans"));
        console.log("✅ Has payment_plan?", columns.includes("payment_plan"));
        console.log("✅ Has handover_date?", columns.includes("handover_date"));
        console.log("✅ Sample record:", data[0]);
      }
    } catch (error) {
      console.error("Exception checking columns:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Database Diagnostic Tool</CardTitle>
          <p className="text-sm text-muted-foreground">
            Check if floor_plans, payment_plan, and handover_date columns exist and have data
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={fetchProperties} disabled={loading}>
              {loading ? "Loading..." : "Refresh Properties"}
            </Button>
            <Button onClick={checkColumns} variant="outline">
              Check Columns
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Open browser console (F12) to see detailed logs
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              <div className="font-semibold">
                Found {properties.length} properties
              </div>

              {properties.map((prop) => (
                <Card key={prop.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold">Title:</span> {prop.title}
                      </div>
                      <div>
                        <span className="font-semibold">ID:</span> {prop.id}
                      </div>
                      <div>
                        <span className="font-semibold">Floor Plans:</span>{" "}
                        {prop.floor_plans ? (
                          <pre className="bg-muted p-2 rounded mt-1 text-xs overflow-auto">
                            {JSON.stringify(prop.floor_plans, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-red-500">NULL or Empty</span>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold">Payment Plan:</span>{" "}
                        {prop.payment_plan || (
                          <span className="text-muted-foreground">NULL</span>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold">Handover Date:</span>{" "}
                        {prop.handover_date || (
                          <span className="text-muted-foreground">NULL</span>
                        )}
                      </div>
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            console.log("Full property object:", prop);
                            console.log("floor_plans type:", typeof prop.floor_plans);
                            console.log("floor_plans is array?", Array.isArray(prop.floor_plans));
                          }}
                        >
                          Log to Console
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticPage;
