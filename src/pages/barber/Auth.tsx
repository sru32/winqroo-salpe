import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useMockAuth';
import { toast } from 'sonner';
import { Scissors, Loader2, User, Store, Info } from 'lucide-react';
const Auth = () => {
  const navigate = useNavigate();
  const {
    signIn,
    signUp,
    userRole
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer' as 'customer' | 'shop_owner',
    name: ''
  });
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    const {
      error
    } = await signIn(loginData.email, loginData.password);
    setLoading(false);
    if (error) {
      toast.error(error.message || 'Failed to sign in');
      return;
    }
    toast.success('Welcome back!');

    // Wait a moment for role to be checked
    setTimeout(() => {
      if (userRole === 'shop_owner') {
        navigate('/dashboard');
      } else {
        navigate('/customer');
      }
    }, 500);
  };
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupData.email || !signupData.password || !signupData.confirmPassword || !signupData.name) {
      toast.error('Please fill in all fields');
      return;
    }
    if (!signupData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (signupData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const {
      error
    } = await signUp(signupData.email, signupData.password, signupData.role, signupData.name.trim());
    setLoading(false);
    if (error) {
      toast.error(error.message || 'Failed to sign up');
      return;
    }
    toast.success(`Account created successfully as ${signupData.role === 'shop_owner' ? 'Shop Owner' : 'Customer'}!`);

    // Redirect based on role
    setTimeout(() => {
      if (signupData.role === 'shop_owner') {
        navigate('/dashboard');
      } else {
        navigate('/customer');
      }
    }, 500);
  };
  return <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          
          <h1 className="text-3xl font-bold mb-2">Winqroo</h1>
          <p className="text-muted-foreground">Sign in to manage your shop or join queues</p>
        </div>

        <Card className="p-6 bg-card border-border">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="your@email.com" value={loginData.email} onChange={e => setLoginData({
                  ...loginData,
                  email: e.target.value
                })} disabled={loading} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={loginData.password} onChange={e => setLoginData({
                  ...loginData,
                  password: e.target.value
                })} disabled={loading} />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </> : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-3">
                  <Label>I am a...</Label>
                  <RadioGroup value={signupData.role} onValueChange={(value: 'customer' | 'shop_owner') => setSignupData({
                  ...signupData,
                  role: value
                })} disabled={loading}>
                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="customer" id="customer" />
                      <Label htmlFor="customer" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">Customer</div>
                          <div className="text-sm text-muted-foreground">Join queues and book services</div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="shop_owner" id="shop_owner" />
                      <Label htmlFor="shop_owner" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Store className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">Shop Owner</div>
                          <div className="text-sm text-muted-foreground">Manage your barbershop</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input id="signup-name" type="text" placeholder="Enter your full name" value={signupData.name} onChange={e => setSignupData({
                  ...signupData,
                  name: e.target.value
                })} disabled={loading} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="your@email.com" value={signupData.email} onChange={e => setSignupData({
                  ...signupData,
                  email: e.target.value
                })} disabled={loading} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" placeholder="••••••••" value={signupData.password} onChange={e => setSignupData({
                  ...signupData,
                  password: e.target.value
                })} disabled={loading} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input id="signup-confirm" type="password" placeholder="••••••••" value={signupData.confirmPassword} onChange={e => setSignupData({
                  ...signupData,
                  confirmPassword: e.target.value
                })} disabled={loading} />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </> : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>;
};
export default Auth;