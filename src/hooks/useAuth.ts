// Authentication hook

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { authApi, setAuthToken, handleApiError } from './api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: undefined,
  });

  useEffect(() => {
    // Initialize auth state on mount
    const initAuth = async () => {
      const savedToken = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        try {
          setAuthToken(savedToken);
          const user = JSON.parse(savedUser);
          setState({
            user,
            token: savedToken,
            loading: false,
            error: undefined,
          });
        } catch (error) {
          // Token or user data is invalid
          setAuthToken(null);
          localStorage.removeItem('user');
          setState({
            user: null,
            token: null,
            loading: false,
            error: undefined,
          });
        }
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const response = await authApi.login(email, password);
      setAuthToken(response.access_token);
      
      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setState({
        user: response.user,
        token: response.access_token,
        loading: false,
        error: undefined,
      });
    } catch (error) {
      const apiError = handleApiError(error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError.detail,
      }));
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const response = await authApi.register(email, password);
      setAuthToken(response.access_token);
      
      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setState({
        user: response.user,
        token: response.access_token,
        loading: false,
        error: undefined,
      });
    } catch (error) {
      const apiError = handleApiError(error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError.detail,
      }));
      throw error;
    }
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('user');
    setState({
      user: null,
      token: null,
      loading: false,
      error: undefined,
    });
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: undefined }));
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
