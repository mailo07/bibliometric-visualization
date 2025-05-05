import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper function for debug logging
  const logDebug = (message, data) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Auth] ${message}`, data || '');
    }
  };

  // Move checkAuthStatus into useCallback to use as a dependency
  const checkAuthStatus = useCallback(async (token) => {
    try {
      // First, set the authorization header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      logDebug('Checking auth status with token:', token.substring(0, 10) + '...');
      
      // Use direct URL
      const response = await axios.get('http://localhost:5000/api/profile');
      
      logDebug('Auth status response:', response.data);
      setCurrentUser(response.data);
      setLoading(false);
    } catch (error) {
      logDebug('Auth status check failed:', error);
      // If token is invalid, clear it
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setCurrentUser(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if user is already logged in on mount
    const token = localStorage.getItem('token');
    if (token) {
      checkAuthStatus(token);
    } else {
      setLoading(false);
    }
  }, [checkAuthStatus]); // Add checkAuthStatus as a dependency

  const login = async (username, password) => {
    try {
      setError('');
      logDebug('Attempting login for:', username);
      
      // Call login API with direct URL
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password
      });
      
      logDebug('Login response:', response.data);
      
      if (!response.data.user || !response.data.user.token) {
        throw new Error("Invalid server response - no token provided");
      }
      
      const { token } = response.data.user;
      const userData = response.data.user;
      
      localStorage.setItem('token', token);
      
      // Set auth header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      logDebug('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to login';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      logDebug('Registering new user:', userData.username);
      
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);
      logDebug('Registration response:', response.data);
      
      return response.data;
    } catch (error) {
      logDebug('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to register';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    logDebug('Logging out user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };
  
  const updateProfile = async (profileData) => {
    try {
      setError('');
      logDebug('Updating profile:', profileData);
      
      // Make sure we have the token header set
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      
      // Filter the profile data to only include valid fields
      const validData = {};
      if (profileData.username || profileData.userName) validData.username = profileData.username || profileData.userName;
      if (profileData.email) validData.email = profileData.email;
      if (profileData.bio) validData.bio = profileData.bio;
      
      logDebug('Filtered profile data:', validData);
      
      // Create a new instance of axios without defaults for this specific request
      const instance = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Use direct URL with PUT method
      const response = await instance.put('/profile', validData);
      
      logDebug('Profile update response:', response.data);
      
      // Update current user data with response
      if (response.data && response.data.user) {
        setCurrentUser(prev => ({...prev, ...response.data.user}));
      }
      
      return response.data;
    } catch (error) {
      logDebug('Profile update error:', error);
      const errorMessage = error.response?.data?.error || 
                         error.message || 
                         'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  const changePassword = async (passwordData) => {
    try {
      setError('');
      logDebug('Changing password');
      
      // Make sure we have the token header set
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      
      // Use direct URL
      const response = await axios({
        method: 'put',
        url: 'http://localhost:5000/api/password',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: passwordData
      });
      
      logDebug('Password change response:', response.data);
      
      return response.data;
    } catch (error) {
      logDebug('Password change error:', error);
      const errorMessage = error.response?.data?.error || 
                         error.message || 
                         'Failed to change password';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  const updateProfilePicture = async (formData) => {
    try {
      setError('');
      logDebug('Updating profile picture');
      
      // Make sure we have the token header set
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      
      // Use direct URL
      const response = await axios({
        method: 'post',
        url: 'http://localhost:5000/api/profile/picture',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        data: formData
      });
      
      logDebug('Profile picture update response:', response.data);
      
      // Update user data with new profile picture
      setCurrentUser(prev => ({
        ...prev,
        profile_picture: response.data.profile_picture
      }));
      
      return response.data;
    } catch (error) {
      logDebug('Profile picture update error:', error);
      const errorMessage = error.response?.data?.error || 
                         error.message || 
                         'Failed to update profile picture';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    updateProfilePicture,
    error,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}