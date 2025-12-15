import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/contexts/AuthContext.v2";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated } = useAuth();

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("🔐 AdminLayout: Not authenticated, redirecting to /admin/login");
      navigate("/admin/login", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Show loading state (with max 3 second visual timeout)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden">
        <AdminSidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-14 flex items-center border-b bg-background px-4 flex-shrink-0">
            <SidebarTrigger />
            <div className="ml-4">
              <h1 className="text-xl font-bold text-gradient-primary">TRUE NESTER Admin</h1>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-muted/20">
            <div className="h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
