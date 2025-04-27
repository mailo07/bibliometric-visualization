// src/services/adminService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// System Health Functions
export const getSystemHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/system-health`);
    return response.data;
  } catch (error) {
    console.error('Error fetching system health:', error);
    throw error;
  }
};

export const pollSystemHealth = (callback, interval = 30000) => {
  let isActive = true;
  
  const fetchHealth = async () => {
    if (!isActive) return;
    
    try {
      const healthData = await getSystemHealth();
      callback(healthData);
    } catch (error) {
      console.error('Error polling system health:', error);
    }
    
    if (isActive) {
      setTimeout(fetchHealth, interval);
    }
  };
  
  // Initial fetch
  fetchHealth();
  
  // Return cleanup function
  return () => {
    isActive = false;
  };
};

// Existing User Management Functions
export const getUsers = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/users`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUser = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const suspendUser = async (userId) => {
  try {
    const response = await axios.post(`${API_URL}/users/${userId}/suspend`);
    return response.data;
  } catch (error) {
    console.error('Error suspending user:', error);
    throw error;
  }
};

export const unsuspendUser = async (userId) => {
  try {
    const response = await axios.post(`${API_URL}/users/${userId}/unsuspend`);
    return response.data;
  } catch (error) {
    console.error('Error unsuspending user:', error);
    throw error;
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const response = await axios.put(`${API_URL}/users/${userId}/update-role`, { role });
    return response.data;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const getUserStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/users/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

export const getActivityLogs = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/activity-logs`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
};

export const getSystemEvents = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/system-events`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching system events:', error);
    throw error;
  }
};

export const getUserActivityMetrics = async () => {
  try {
    const response = await axios.get(`${API_URL}/user-activity-metrics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user activity metrics:', error);
    throw error;
  }
};