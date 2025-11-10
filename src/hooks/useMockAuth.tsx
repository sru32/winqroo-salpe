import React, { createContext, useContext, useEffect, useState } from 'react';
import { mockDb } from '@/services/mockData';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, role: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isShopOwner: boolean;
  isCustomer: boolean;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'barberqueue_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        
        // Update "John Customer" to "Abdul" if found
        if (sessionData.user.name === 'John Customer') {
          sessionData.user.name = 'Abdul';
          localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
          
          // Also update in mockDb if exists
          const dbUser = mockDb.getUserByEmail(sessionData.user.email);
          if (dbUser) {
            mockDb.updateUser(sessionData.user.id, { name: 'Abdul' });
          }
        }
        
        setUser(sessionData.user);
        setSession(sessionData);
        setUserRole(sessionData.user.role);
      } catch (error) {
        console.error('Error loading session:', error);
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const existingUser = mockDb.getUserByEmail(email);
      
      if (!existingUser) {
        return { error: new Error('Invalid credentials') };
      }

      const sessionData = {
        user: existingUser,
        access_token: 'mock_token_' + Date.now(),
      };

      setUser(existingUser);
      setSession(sessionData);
      setUserRole(existingUser.role);
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, role: string, name: string) => {
    try {
      const existingUser = mockDb.getUserByEmail(email);
      
      if (existingUser) {
        return { error: new Error('User already exists') };
      }

      const newUser = mockDb.createUser({
        email,
        role,
        name,
      });

      // If shop owner, create a shop and link it
      if (role === 'shop_owner') {
        const qrCode = `SHOP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const shop = mockDb.createShop({
          name: 'My Barber Shop',
          address: '',
          qr_code: qrCode,
          rating: 4.5,
          phone: '',
          description: '',
          latitude: null,
          longitude: null,
          distance: null,
          opening_hours: {
            monday: '9:00 AM - 6:00 PM',
            tuesday: '9:00 AM - 6:00 PM',
            wednesday: '9:00 AM - 6:00 PM',
            thursday: '9:00 AM - 6:00 PM',
            friday: '9:00 AM - 6:00 PM',
            saturday: '9:00 AM - 5:00 PM',
            sunday: 'Closed'
          }
        });

        mockDb.createShopOwner({
          user_id: newUser.id,
          shop_id: shop.id,
        });
      }

      const sessionData = {
        user: newUser,
        access_token: 'mock_token_' + Date.now(),
      };

      setUser(newUser);
      setSession(sessionData);
      setUserRole(newUser.role);
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setUserRole(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const isShopOwner = userRole === 'shop_owner';
  const isCustomer = userRole === 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        isShopOwner,
        isCustomer,
        userRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
