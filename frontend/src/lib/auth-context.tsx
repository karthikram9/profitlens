import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, setAuthTokenCallback } from './api-client';

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

  // Sync token to api-client
  useEffect(() => {
    setAuthTokenCallback(() => accessToken);
  }, [accessToken]);

  const fetchUser = useCallback(async (token: string) => {
    try {
      const userData = await apiRequest<User>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userData);
      setAccessTokenState(token);
    } catch (err) {
      setUser(null);
      setAccessTokenState(null);
    }
  }, []);

  const login = async (token: string) => {
    setIsLoading(true);
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
    setAccessTokenState(null);
  };

  useEffect(() => {
    // On mount, attempt silent refresh
    const initAuth = async () => {
      try {
        const data = await apiRequest<{ access_token: string }>('/auth/refresh', { method: 'POST' });
        await fetchUser(data.access_token);
      } catch (err) {
        // No valid refresh token
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, setAccessToken: setAccessTokenState }}>
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
