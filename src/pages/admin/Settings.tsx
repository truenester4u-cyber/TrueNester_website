import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-gray-600">Manage site settings and configuration</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>Settings management is being developed</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">This feature is coming soon. Please check back later.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Settings;
