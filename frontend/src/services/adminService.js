import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin'; // Note the /admin prefix

// Activity Logs Endpoints
export const getActivityLogs = async (page = 1, limit = 10, filters = {}) => {
  try {
    const response = await axios.get(`${API_URL}/activity-logs`, {
      params: {
        page,
        limit,
        ...filters
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
};

// System Events Endpoints
export const getSystemEvents = async (page = 1, limit = 10, severity = '') => {
  try {
    const response = await axios.get(`${API_URL}/system-events`, {
      params: {
        page,
        limit,
        severity
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching system events:', error);
    throw error;
  }
};

// System Health Endpoint
export const getSystemHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/system-health`);
    return response.data;
  } catch (error) {
    console.error('Error fetching system health:', error);
    throw error;
  }
};

// Additional admin reporting endpoints can be added here
export const getUserActivityMetrics = async (timeRange = 'week') => {
  try {
    const response = await axios.get(`${API_URL}/user-metrics`, {
      params: { timeRange }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    throw error;
  }
};

// Polling function for system health
export const pollSystemHealth = (callback, interval = 30000) => {
  const fetchData = async () => {
    try {
      const data = await getSystemHealth();
      callback(data);
    } catch (error) {
      console.error('Error in system health polling:', error);
    }
  };

  // Fetch immediately on start
  fetchData();
  
  // Then set up interval
  const timerId = setInterval(fetchData, interval);
  
  return () => clearInterval(timerId);
};