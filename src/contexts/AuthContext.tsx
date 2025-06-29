
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (userType: 'management' | 'student', email: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (userType: 'management' | 'student', email: string) => {
    // Store user info in localStorage for session persistence
    const userInfo = { 
      email, 
      role: userType,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('hostel_user', JSON.stringify(userInfo));
    
    // Create a mock user for demonstration
    const mockUser = {
      id: `${userType}_${Date.now()}`,
      email,
      user_metadata: { role: userType }
    } as User;
    
    setUser(mockUser);
  };

  const logout = () => {
    localStorage.removeItem('hostel_user');
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
