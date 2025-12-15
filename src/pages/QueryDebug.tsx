import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function QueryDebug() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      const output: Record<string, any> = {};
      setLoading(true);

      try {
        // Check auth state
        const { data: { user } } = await supabase.auth.getUser();
        output.user = user ? { id: user.id, email: user.email, authenticated: true } : { authenticated: false };

        // Get session info
        const { data: { session } } = await supabase.auth.getSession();
        output.session = {
          hasSession: !!session,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
          accessToken: session?.access_token ? session.access_token.substring(0, 20) + "..." : null,
        };

        // Test basic query without any filters
        console.log("Testing basic properties query (no filters)...");
        const { data: basicData, error: basicError, status: basicStatus } = await (supabase as any)
          .from("properties")
          .select("id, title, published")
          .limit(3);

        output.basicQuery = {
          status: basicStatus,
          error: basicError ? { message: basicError.message, code: basicError.code, hint: basicError.hint, details: basicError.details } : null,
          dataCount: basicData?.length || 0,
          firstItem: basicData?.[0] || null,
        };

        // Test with published filter
        console.log("Testing published filter...");
        const { data: publishedData, error: publishedError, status: publishStatus } = await (supabase as any)
          .from("properties")
          .select("id, title, published")
          .eq("published", true)
          .limit(3);

        output.publishedFilter = {
          status: publishStatus,
          error: publishedError ? { message: publishedError.message, code: publishedError.code, hint: publishedError.hint, details: publishedError.details } : null,
          dataCount: publishedData?.length || 0,
          firstItem: publishedData?.[0] || null,
        };

        // Test with featured filter
        console.log("Testing featured filter...");
        const { data: featuredData, error: featuredError, status: featuredStatus } = await (supabase as any)
          .from("properties")
          .select("id, title, featured_dubai, featured_abu_dhabi")
          .eq("published", true)
          .eq("featured_dubai", true)
          .limit(3);

        output.featuredFilter = {
          status: featuredStatus,
          error: featuredError ? { message: featuredError.message, code: featuredError.code, hint: featuredError.hint, details: featuredError.details } : null,
          dataCount: featuredData?.length || 0,
          firstItem: featuredData?.[0] || null,
        };

        // Diagnose RLS
        output.diagnosis = {
          suggestion: basicError?.message?.includes("policy") 
            ? "❌ RLS POLICY ISSUE DETECTED: Properties table has Row Level Security that blocks authenticated users"
            : basicData?.length === 0
            ? "⚠️ NO DATA: Query succeeded but returned no results. Check if properties exist and are published."
            : "✅ QUERIES WORKING: Properties are loading correctly",
        };

      } catch (err: any) {
        output.exception = {
          message: err.message,
          stack: err.stack,
        };
      } finally {
        setResults(output);
        setLoading(false);
      }
    };

    runTests();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Query Debug Page</h1>
      <p className="text-gray-600 mb-6">This page tests Supabase queries to diagnose property loading issues</p>
      
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          <p>Running tests...</p>
        </div>
      ) : (
        <div>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <p className="text-sm font-semibold text-blue-900">
              {results.diagnosis?.suggestion}
            </p>
          </div>

          <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-auto max-h-96 mb-6">
            <pre className="text-xs font-mono">{JSON.stringify(results, null, 2)}</pre>
          </div>

          {results.diagnosis?.suggestion?.includes("RLS POLICY") && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
              <h3 className="font-bold text-red-900 mb-2">🔧 How to Fix:</h3>
              <ol className="text-sm text-red-800 space-y-2 list-decimal list-inside">
                <li>Go to Supabase Dashboard → Your Project → SQL Editor</li>
                <li>Copy and run the SQL from <code className="bg-red-100 px-2 py-1">DISABLE_RLS_PROPERTIES.sql</code></li>
                <li>This will disable Row Level Security on the properties table</li>
                <li>Refresh this page to verify the fix</li>
              </ol>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <Button onClick={() => window.location.reload()}>Refresh Tests</Button>
        <Button variant="outline" onClick={() => window.location.href = "/"}>Back to Home</Button>
      </div>
    </div>
  );
}
