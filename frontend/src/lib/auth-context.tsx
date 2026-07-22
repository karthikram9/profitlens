import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, setAuthToken } from './api-client';

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  setAccessToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateAccessToken = (token: string | null) => {
    setAuthToken(token);
    setAccessTokenState(token);
  };

  const fetchUser = useCallback(async (token: string) => {
    try {
      setAuthToken(token);
      const userData = await apiRequest<User>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userData);
      updateAccessToken(token);
    } catch (err) {
      setUser(null);
      updateAccessToken(null);
    }
  }, []);

  const login = async (token: string) => {
    setIsLoading(true);
    updateAccessToken(token);
    await fetchUser(token);
    setIsLoading(false);
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (err) {
      // Ignore errors on logout
    }
    setUser(null);
    updateAccessToken(null);
  };

  useEffect(() => {
    // On mount, attempt silent refresh
    const initAuth = async () => {
      try {
        const data = await apiRequest<{ access_token: string }>('/auth/refresh', { method: 'POST' });
        updateAccessToken(data.access_token);
        await fetchUser(data.access_token);
      } catch (err) {
        // No valid refresh token
        updateAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, setAccessToken: updateAccessToken }}>
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
