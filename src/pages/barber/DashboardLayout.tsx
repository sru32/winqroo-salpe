import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/barber/DashboardSidebar';
import { useAuth } from '@/hooks/useMockAuth';
import { Loader2 } from 'lucide-react';
const DashboardLayout = () => {
  const {
    user,
    loading,
    isShopOwner
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (!isShopOwner) {
        navigate('/');
      }
    }
  }, [user, loading, isShopOwner, navigate]);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }
  if (!user || !isShopOwner) {
    return null;
  }
  return <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border flex items-center px-6 bg-card">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold ml-4">Winqroo</h1>
          </header>

          <main className="flex-1 p-6 bg-background overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>;
};
export default DashboardLayout;