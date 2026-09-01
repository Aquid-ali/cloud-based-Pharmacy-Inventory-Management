import React, { createContext, useState, useEffect } from 'react';
import { loginRequest, registerRequest, registerAdminRequest, logoutRequest, updateMeRequest } from '../services/authService';
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

  const login = async (credentials, { expectedRole } = {}) => {
    setLoading(true);
    try {
      const { data } = await loginRequest(credentials);
      const { user: loggedInUser, token } = data.data;

      if (expectedRole && loggedInUser.role !== expectedRole) {
        toast.error(
          expectedRole === 'Admin'
            ? 'This account is not an admin account.'
            : 'This is an admin account — use the admin sign-in instead.'
        );
        return false;
      }

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

  const registerAdmin = async (payload) => {
    setLoading(true);
    try {
      const { data } = await registerAdminRequest(payload);
      const { user: newUser, token } = data.data;
      localStorage.setItem('medichain_token', token);
      setUser(newUser);
      toast.success('Admin account and pharmacy created successfully!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Admin registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (payload) => {
    setLoading(true);
    try {
      const { data } = await updateMeRequest(payload);
      setUser(data.data.user);
      toast.success('Profile updated');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Merges a partial patch into the cached user (e.g. a freshly-updated pharmacy
  // sub-object) so every page reading from useAuth() re-renders with it
  // immediately, without needing a full re-login.
  const updateUser = (updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
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
    <AuthContext.Provider
      value={{ user, loading, login, register, registerAdmin, logout, updateProfile, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
