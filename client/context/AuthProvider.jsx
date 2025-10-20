import React, { createContext, useContext, useState, useEffect } from 'react';
import { authClient } from '../api/authClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      if (authClient.isAuthenticated()) {
        try {
          const response = await authClient.getProfile();

          if (response.success) {
            setUser(response.data.user);
          } else {
            authClient.clearTokens();
          }
        } catch (error) {
          authClient.clearTokens();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authClient.login(email, password);

      if (response.success) {
        setUser(response.data.user);
        return { success: true };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      setError('Login failed');
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await authClient.logout();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
