import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'shop_owner';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isShopOwner: boolean;
  userRole: 'customer' | 'shop_owner' | null;
  signIn: (email: string, password: string) => Promise<{ error?: { message: string } }>;
  signUp: (email: string, password: string, role: 'customer' | 'shop_owner', name: string) => Promise<{ error?: { message: string } }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('winqroo_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('winqroo_user');
        localStorage.removeItem('winqroo_token');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: { message: string } }> => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // If API fails, try mock authentication
        const mockUsers = JSON.parse(localStorage.getItem('winqroo_mock_users') || '[]');
        const foundUser = mockUsers.find((u: User & { password: string }) => u.email === email && u.password === password);
        
        if (!foundUser) {
          return { error: { message: 'Invalid email or password' } };
        }

        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem('winqroo_user', JSON.stringify(userWithoutPassword));
        return {};
      }

      const data = await response.json();
      if (data.error) {
        return { error: { message: data.error } };
      }

      // Store token and user
      if (data.token) {
        localStorage.setItem('winqroo_token', data.token);
      }
      setUser(data.user);
      localStorage.setItem('winqroo_user', JSON.stringify(data.user));
      return {};
    } catch (error) {
      // Fallback to mock authentication if API is not available
      const mockUsers = JSON.parse(localStorage.getItem('winqroo_mock_users') || '[]');
      const foundUser = mockUsers.find((u: User & { password: string }) => u.email === email && u.password === password);
      
      if (!foundUser) {
        return { error: { message: 'Invalid email or password' } };
      }

      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('winqroo_user', JSON.stringify(userWithoutPassword));
      return {};
    }
  };

  const signUp = async (
    email: string,
    password: string,
    role: 'customer' | 'shop_owner',
    name: string
  ): Promise<{ error?: { message: string } }> => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, name }),
      });

      if (!response.ok) {
        // If API fails, use mock registration
        const mockUsers = JSON.parse(localStorage.getItem('winqroo_mock_users') || '[]');
        
        if (mockUsers.some((u: User & { password: string }) => u.email === email)) {
          return { error: { message: 'Email already registered' } };
        }

        const newUser: User & { password: string } = {
          id: `user_${Date.now()}`,
          name,
          email,
          role,
          password,
        };

        mockUsers.push(newUser);
        localStorage.setItem('winqroo_mock_users', JSON.stringify(mockUsers));

        const { password: _, ...userWithoutPassword } = newUser;
        setUser(userWithoutPassword);
        localStorage.setItem('winqroo_user', JSON.stringify(userWithoutPassword));
        return {};
      }

      const data = await response.json();
      if (data.error) {
        return { error: { message: data.error } };
      }

      // Store token and user
      if (data.token) {
        localStorage.setItem('winqroo_token', data.token);
      }
      setUser(data.user);
      localStorage.setItem('winqroo_user', JSON.stringify(data.user));
      return {};
    } catch (error) {
      // Fallback to mock registration if API is not available
      const mockUsers = JSON.parse(localStorage.getItem('winqroo_mock_users') || '[]');
      
      if (mockUsers.some((u: User & { password: string }) => u.email === email)) {
        return { error: { message: 'Email already registered' } };
      }

      const newUser: User & { password: string } = {
        id: `user_${Date.now()}`,
        name,
        email,
        role,
        password,
      };

      mockUsers.push(newUser);
      localStorage.setItem('winqroo_mock_users', JSON.stringify(mockUsers));

      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      localStorage.setItem('winqroo_user', JSON.stringify(userWithoutPassword));
      return {};
    }
  };

  const signOut = async (): Promise<void> => {
    setUser(null);
    localStorage.removeItem('winqroo_user');
    localStorage.removeItem('winqroo_token');
  };

  const isShopOwner = user?.role === 'shop_owner';
  const userRole = user?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isShopOwner,
        userRole,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

