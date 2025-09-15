import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [tenant, setTenant] = useState(() => {
    const raw = localStorage.getItem('tenant');
    return raw ? JSON.parse(raw) : null;
  });

  const isAuthenticated = Boolean(token);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    if (tenant) {
      localStorage.setItem('tenant', JSON.stringify(tenant));
    } else {
      localStorage.removeItem('tenant');
    }
  }, [tenant]);

  const login = (data) => {
    setToken(data.token);
    setTenant(data.tenant);
  };

  const logout = () => {
    setToken(null);
    setTenant(null);
  };

  const value = useMemo(() => ({
    token,
    tenant,
    isAuthenticated,
    login,
    logout
  }), [token, tenant, isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}