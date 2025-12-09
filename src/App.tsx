import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useMockAuth";
import Welcome from "./pages/Welcome";
import Index from "./pages/customer/Index";
import Auth from "./pages/barber/Auth";
import DashboardLayout from "./pages/barber/DashboardLayout";
import Dashboard from "./pages/barber/Dashboard";
import QueueManagement from "./pages/barber/QueueManagement";
import AppointmentManagement from "./pages/barber/AppointmentManagement";
import ServiceManagement from "./pages/barber/ServiceManagement";
import ShopSettings from "./pages/barber/ShopSettings";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/customer" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="queue" element={<QueueManagement />} />
              <Route path="appointments" element={<AppointmentManagement />} />
              <Route path="services" element={<ServiceManagement />} />
              <Route path="shop" element={<ShopSettings />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
);

export default App;
