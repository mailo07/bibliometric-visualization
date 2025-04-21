import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already logged in on mount
    const token = localStorage.getItem('token');
    if (token) {
      checkAuthStatus(token);
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async (token) => {
    try {
      const response = await axios.get('/api/user/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Auth status check failed:', error);
      // If token is invalid, clear it
      localStorage.removeItem('token');
      setCurrentUser(null);
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError('');
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Failed to login');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      const response = await axios.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.error || 'Failed to register');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    error,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}