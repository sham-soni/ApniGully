'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { safeStorage } from '@/lib/storage';

interface User {
  id: string;
  phone: string;
  name: string;
  avatar?: string;
  language: string;
  isVerified: boolean;
  trustScore: number;
  memberships?: any[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = safeStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const userData = await api.get<User>('/users/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUser(userData);
    } catch (error) {
      safeStorage.removeItem('token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (authToken: string, userData: User) => {
    safeStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    safeStorage.removeItem('token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
