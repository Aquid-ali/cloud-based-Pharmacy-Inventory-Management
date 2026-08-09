import React, { createContext, useState, useEffect } from 'react';
import { loginRequest, registerRequest, logoutRequest } from '../services/authService';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('medichain_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('medichain_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('medichain_user');
    }
  }, [user]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const { data } = await loginRequest(credentials);
      const { user: loggedInUser, token } = data.data;
      localStorage.setItem('medichain_token', token);
      setUser(loggedInUser);
      toast.success('Welcome back!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const { data } = await registerRequest(payload);
      const { user: newUser, token } = data.data;
      localStorage.setItem('medichain_token', token);
      setUser(newUser);
      toast.success('Account created successfully!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } catch (error) {
      // Non-fatal - proceed with client-side logout regardless
    } finally {
      localStorage.removeItem('medichain_token');
      setUser(null);
      toast.success('Logged out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
