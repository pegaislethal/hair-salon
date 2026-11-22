'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, refreshToken: string, userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isSubAdmin: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('iris_access_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await authService.getCurrentUser();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('iris_user', JSON.stringify(res.data));
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial check from localStorage for fast initial render
    const cachedUser = localStorage.getItem('iris_user');
    const token = localStorage.getItem('iris_access_token');
    if (token && cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {
        // invalid cached json
      }
    }
    refreshUser();
  }, [refreshUser]);

  const login = (token: string, refreshToken: string, userData: User) => {
    localStorage.setItem('iris_access_token', token);
    localStorage.setItem('iris_refresh_token', refreshToken);
    localStorage.setItem('iris_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore logout network errors
    } finally {
      localStorage.removeItem('iris_access_token');
      localStorage.removeItem('iris_refresh_token');
      localStorage.removeItem('iris_user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('iris_user', JSON.stringify(userData));
  };

  const isAuthenticated = !!user;
  const isSuperAdmin = user?.role === 'super_admin';
  const isSubAdmin = user?.role === 'sub_admin';
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        refreshUser,
        isAuthenticated,
        isSuperAdmin,
        isSubAdmin,
        isCustomer,
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
