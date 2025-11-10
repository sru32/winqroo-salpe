import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, User } from "lucide-react";

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--gradient-welcome)' }}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-bold text-foreground mb-6 tracking-tight">
              Welcome to <span className="bg-gradient-to-r from-blue-primary to-blue-accent bg-clip-text text-transparent">Winqroo</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">Your smart queue management solution</p>
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Customer Card */}
            <Card
              className="group relative overflow-hidden cursor-pointer border-2 border-border hover:border-blue-primary transition-all duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-sm bg-card/80"
              style={{ background: 'var(--gradient-card)' }}
              onClick={() => navigate('/customer')}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: 'var(--glow-primary)' }} />

              <CardHeader className="text-center pb-6 pt-8 relative z-10">
                <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-br from-blue-primary/20 to-blue-primary/5 flex items-center justify-center border-2 border-blue-primary/30 group-hover:border-blue-primary transition-all duration-300 group-hover:scale-110">
                  <User className="w-12 h-12 text-blue-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <CardTitle className="text-3xl mb-3 text-foreground">I'm a Customer</CardTitle>
                <CardDescription className="text-base text-muted-foreground">Find nearby barbershops and join queues instantly</CardDescription>
              </CardHeader>

              <CardContent className="text-center pb-8 relative z-10">
                <Button
                  size="lg"
                  className="w-full group-hover:shadow-lg transition-all duration-300"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    navigate('/customer');
                  }}
                >
                  Continue as Customer
                </Button>
              </CardContent>
            </Card>

            {/* Salon Owner Card */}
            <Card
              className="group relative overflow-hidden cursor-pointer border-2 border-border hover:border-blue-accent transition-all duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-sm bg-card/80"
              style={{ background: 'var(--gradient-card)' }}
              onClick={() => navigate('/auth')}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: 'var(--glow-accent)' }} />

              <CardHeader className="text-center pb-6 pt-8 relative z-10">
                <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-br from-blue-accent/20 to-blue-accent/5 flex items-center justify-center border-2 border-blue-accent/30 group-hover:border-blue-accent transition-all duration-300 group-hover:scale-110">
                  <Scissors className="w-12 h-12 text-blue-accent group-hover:scale-110 transition-transform duration-300" />
                </div>
                <CardTitle className="text-3xl mb-3 text-foreground">I'm a Salon Owner</CardTitle>
                <CardDescription className="text-base text-muted-foreground">Manage your shop and customer queues efficiently</CardDescription>
              </CardHeader>

              <CardContent className="text-center pb-8 relative z-10">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full group-hover:shadow-lg transition-all duration-300 bg-secondary/80 hover:bg-secondary"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    navigate('/auth');
                  }}
                >
                  Continue as Owner
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;