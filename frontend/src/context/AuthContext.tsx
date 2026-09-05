import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, RoleType } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isInstructor: boolean;
  login: (credentials: { email: string; password: string; otp?: string }) => Promise<{ user: User; requires_totp_setup: boolean }>;
  loginWithGoogle: (idToken: string, otp?: string, mode?: 'login' | 'register') => Promise<{ user: User; requires_totp_setup: boolean }>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper for multi-tab isolated storage (sessionStorage prioritized over localStorage)
export const getStoredToken = (): string | null => {
  return sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
};

export const getStoredRefreshToken = (): string | null => {
  return sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token');
};

export const getStoredUser = (): User | null => {
  const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setAuthStorage = (tokens: { access: string; refresh: string }, user: User) => {
  sessionStorage.setItem('access_token', tokens.access);
  sessionStorage.setItem('refresh_token', tokens.refresh);
  sessionStorage.setItem('user', JSON.stringify(user));

  // Mirror to localStorage so new tabs can optionally pre-seed
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuthStorage = () => {
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
  sessionStorage.removeItem('user');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = useCallback(async () => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (token) {
      if (storedUser) {
        setUser(storedUser);
      }
      try {
        const response = await authService.getProfile();
        if (response.success && response.data) {
          setUser(response.data);
          sessionStorage.setItem('user', JSON.stringify(response.data));
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (err) {
        console.warn('Could not sync user profile from server:', err);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (credentials: { email: string; password: string; otp?: string }) => {
    const res = await authService.login(credentials);
    if (res.success && res.data) {
      const { user: userData, tokens, requires_totp_setup } = res.data;
      
      // If TOTP setup is required, we don't set auth storage yet, let the frontend handle the setup modal
      if (requires_totp_setup) {
        setAuthStorage(tokens, userData); // We still need the token to hit the setup API
        setUser(userData);
        return { user: userData, requires_totp_setup: true };
      }

      setAuthStorage(tokens, userData);
      setUser(userData);
      return { user: userData, requires_totp_setup: false };
    }
    throw new Error(res.error?.message || 'Login failed.');
  };

  const loginWithGoogle = async (idToken: string, otp?: string, mode: 'login' | 'register' = 'login') => {
    const res = await authService.googleLogin({ id_token: idToken, otp, mode });
    if (res.success && res.data) {
      const { user: userData, tokens, requires_totp_setup } = res.data;

      if (requires_totp_setup) {
        setAuthStorage(tokens, userData);
        setUser(userData);
        return { user: userData, requires_totp_setup: true };
      }

      setAuthStorage(tokens, userData);
      setUser(userData);
      return { user: userData, requires_totp_setup: false };
    }
    throw new Error(res.error?.message || 'Google authentication failed.');
  };

  const register = async (data: any) => {
    const res = await authService.register(data);
    if (res.success && res.data) {
      const { user: userData, tokens } = res.data;
      setAuthStorage(tokens, userData);
      setUser(userData);
      return userData;
    }
    throw new Error(res.error?.message || 'Registration failed.');
  };

  const logout = () => {
    clearAuthStorage();
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
        sessionStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch {
      // ignore
    }
  };

  const roles = user?.roles || [];
  const isSuperAdmin = user?.primary_role === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
  const isAdmin = isSuperAdmin || user?.primary_role === 'ADMIN' || roles.includes('ADMIN');
  const isInstructor = isAdmin || user?.primary_role === 'INSTRUCTOR' || roles.includes('INSTRUCTOR');

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        isSuperAdmin,
        isInstructor,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
