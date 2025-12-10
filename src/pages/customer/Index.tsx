import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Scissors, Clock, QrCode, MapPin, Users, TrendingUp, LogIn, LayoutDashboard, User, Settings, LogOut } from 'lucide-react';
import heroImage from "@/assets/hero-barber.jpg";
import ShopList from '@/components/customer/ShopList';
import ServiceSelection from '@/components/customer/ServiceSelection';
import QueueStatus from '@/components/customer/QueueStatus';
import AppointmentConfirmation from '@/components/customer/AppointmentConfirmation';
import ProfileSettings from '@/components/customer/ProfileSettings';
import ActiveQueueBanner from '@/components/customer/ActiveQueueBanner';
import MyAppointments from '@/components/customer/MyAppointments';
import { useAuth } from '@/hooks/useMockAuth';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar } from 'lucide-react';
const Index = () => {
  const [view, setView] = useState('home'); // home, shops, service, queue, appointment-confirm, profile, appointments
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [appointmentData, setAppointmentData] = useState(null);
  const {
    user,
    isShopOwner,
    userRole,
    loading,
    signOut
  } = useAuth();
  const navigate = useNavigate();

  // Redirect shop owners to dashboard
  useEffect(() => {
    if (!loading && user && isShopOwner) {
      navigate('/dashboard');
    }
  }, [user, isShopOwner, loading, navigate]);
  const handleShopSelect = shop => {
    setSelectedShop(shop);
    setView('service');
  };
  const handleServiceSelect = (service, data) => {
    // Check if data is an appointment (has scheduledDate or appointment_date) or a queue
    const isAppointment = data && (
      data.scheduledDate || 
      data.appointment_date || 
      data._id?.toString().startsWith('appointment_') ||
      data.id?.toString().startsWith('appointment_')
    );
    
    if (isAppointment) {
      setSelectedService(service);
      setAppointmentData(data);
      setView('appointment-confirm');
    } else {
      setSelectedService(service);
      setQueueData(data);
      setView('queue');
    }
  };
  const handleBackToShops = () => {
    setView('shops');
    setSelectedShop(null);
    setSelectedService(null);
    setQueueData(null);
  };

  const handleQueueClick = (queue: any, service: any, shop: any) => {
    setQueueData(queue);
    setSelectedService(service);
    setSelectedShop(shop);
    setView('queue');
  };
  if (view === 'shops') {
    return <ShopList onShopSelect={handleShopSelect} onBack={() => setView('home')} />;
  }
  if (view === 'service' && selectedShop) {
    return <ServiceSelection shop={selectedShop} onServiceSelect={handleServiceSelect} onBack={handleBackToShops} />;
  }
  if (view === 'queue' && queueData) {
    return <QueueStatus queueData={queueData} service={selectedService} shop={selectedShop} onBack={handleBackToShops} />;
  }
  if (view === 'appointment-confirm' && appointmentData && selectedShop) {
    return (
      <AppointmentConfirmation 
        appointment={appointmentData}
        shop={selectedShop}
        services={Array.isArray(selectedService) ? selectedService : [selectedService]}
        onBack={handleBackToShops}
        onViewAppointments={() => setView('appointments')}
      />
    );
  }
  if (view === 'profile') {
    return <ProfileSettings onBack={() => setView('home')} />;
  }
  if (view === 'appointments' && user) {
    return <MyAppointments onBack={() => setView('home')} userId={user.id} />;
  }
  return <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            
            <span className="font-bold text-xl">Winqroo</span>
          </div>
          
          <div className="flex items-center gap-3">
            {user && !isShopOwner && (
              <ActiveQueueBanner 
                customerName={user.name} 
                onQueueClick={handleQueueClick}
              />
            )}
            
            {user ? (
              <>
                {isShopOwner && (
                  <Button variant="default" onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                )}
                <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline">{user?.name || 'User'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setView('appointments')}>
                      <Calendar className="w-4 h-4 mr-2" />
                      My Appointments
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setView('profile')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button variant="default" onClick={() => navigate('/auth')}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt="Modern salon shop interior" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background"></div>
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Scissors className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Smart Queue Management</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Skip The Wait.<br />Book Your Cut.
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join the queue remotely, track your position in real-time, and walk in exactly when it's your turn.
          </p>
          
          <div className="flex justify-center">
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setView('shops')}>
              Find A Salon
              <MapPin className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Three simple steps to a better salon experience</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 bg-card border-border hover:border-primary/50 transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <MapPin className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Find Your Shop</h3>
              <p className="text-muted-foreground">Browse nearby salon shops or scan their QR code when you arrive.</p>
            </Card>

            <Card className="p-8 bg-card border-border hover:border-primary/50 transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Scissors className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Pick Your Service</h3>
              <p className="text-muted-foreground">Choose from available services and join the queue instantly.</p>
            </Card>

            <Card className="p-8 bg-card border-border hover:border-primary/50 transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Track Your Turn</h3>
              <p className="text-muted-foreground">See your position and estimated wait time in real-time.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="flex items-center justify-center mb-4">
                <Users className="w-12 h-12 text-primary" />
              </div>
              <div className="text-5xl font-bold text-primary mb-2">2,500+</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
            
            <div>
              <div className="flex items-center justify-center mb-4">
                <Scissors className="w-12 h-12 text-primary" />
              </div>
              <div className="text-5xl font-bold text-primary mb-2">150+</div>
              <div className="text-muted-foreground">Partner Salons</div>
            </div>
            
            <div>
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="w-12 h-12 text-primary" />
              </div>
              <div className="text-5xl font-bold text-primary mb-2">25 min</div>
              <div className="text-muted-foreground">Avg. Time Saved</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to skip the wait?</h2>
          <p className="text-xl text-muted-foreground mb-10">Join thousands of customers who've ditched the waiting room.</p>
          
          <Button size="lg" className="text-lg px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setView('shops')}>
            Get Started Now
          </Button>
        </div>
      </section>
    </div>;
};
export default Index;