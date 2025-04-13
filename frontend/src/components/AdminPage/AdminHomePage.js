import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { getSystemHealth, getActivityLogs, pollSystemHealth } from '../../services/adminService';
import './AdminHomePage.css';

// Admin Components
import AdminLayout from './AdminLayout';
import AdminUserManagement from './AdminUserManagement';
import AdminReports from './AdminReports';
import AdminLogin from './AdminLogin';

function AdminHomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (status) => {
    setIsAuthenticated(status);
    if (status) {
      navigate('/admin');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate('/admin/login');
  };

  return (
    <div className="admin-container">
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/admin" replace />
            ) : (
              <AdminLogin onLogin={handleLogin} />
            )
          } 
        />
        
        <Route 
          path="/*" 
          element={
            isAuthenticated ? (
              <AdminLayout onLogout={handleLogout}>
                <Outlet />
              </AdminLayout>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<AdminUserManagement />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>
      </Routes>
    </div>
  );
}

// Dashboard Component
function Dashboard() {
  // Initialize with empty structures instead of mock data
  const [healthMetrics, setHealthMetrics] = useState({
    cpu: { usage: 0, cores: 0, threads: 0, status: 'normal' },
    memory: { total: 0, available: 0, used: 0, percent: 0, status: 'normal' },
    disk: { total: 0, used: 0, free: 0, percent: 0, status: 'normal' },
    network: { bytes_sent: 0, bytes_recv: 0, status: 'normal' },
    system: { uptime: '', processes: 0 },
    timestamp: ''
  });
  
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('All Activities');

  // Fetch system health data
  useEffect(() => {
    const fetchSystemData = async () => {
      setIsLoading(true);
      try {
        const [healthData, logsData] = await Promise.all([
          getSystemHealth(),
          getActivityLogs()
        ]);
        
        // Use API data directly without mixing with mock data
        setHealthMetrics(healthData);
        setActivityLogs(logsData);
        setLastUpdated(new Date().toLocaleTimeString());
        setError(null);
      } catch (err) {
        console.error('Failed to fetch system data:', err);
        setError('Failed to load system metrics. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSystemData();
    
    // Set up polling for health metrics
    const clearPolling = pollSystemHealth((data) => {
      // Use API data directly
      setHealthMetrics(data);
      setLastUpdated(new Date().toLocaleTimeString());
    }, 30000);
    
    return () => clearPolling();
  }, []);
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'success';
    }
  };

  const getIconForStatus = (status) => {
    switch (status) {
      case 'critical':
        return '⚠️';
      case 'warning':
        return '⚠️';
      default:
        return '✓';
    }
  };

  // New sample logs for "All Activities"
  const newAllActivitiesLogs = [
    {
      event: "API request to /api/users - GET",
      type: "Info",
      service: "API Gateway",
      timestamp: Math.floor(Date.now() / 1000) - 120 // 2 minutes ago
    },
    {
      event: "Search query executed: 'machine learning'",
      type: "Info",
      service: "Search Service",
      timestamp: Math.floor(Date.now() / 1000) - 360 // 6 minutes ago
    },
    {
      event: "File upload completed: research_paper.pdf",
      type: "Success",
      service: "Storage Service",
      timestamp: Math.floor(Date.now() / 1000) - 900 // 15 minutes ago
    },
    {
      event: "Cache refreshed for bibliometric data",
      type: "Info",
      service: "Cache Service",
      timestamp: Math.floor(Date.now() / 1000) - 1500 // 25 minutes ago
    }
  ];

  // Old logs moved to "System" tab
  const systemLogs = [
    {
      event: "System backup completed successfully",
      type: "Success",
      service: "Backup Service",
      timestamp: Math.floor(Date.now() / 1000) - 1800 // 30 minutes ago
    },
    {
      event: "User login failed: too many attempts",
      type: "Warning",
      service: "Auth Service",
      timestamp: Math.floor(Date.now() / 1000) - 2400 // 40 minutes ago
    },
    {
      event: "Database connection timeout",
      type: "Error",
      service: "Database",
      timestamp: Math.floor(Date.now() / 1000) - 3000 // 50 minutes ago
    },
    {
      event: "New user registered",
      type: "Info",
      service: "User Service",
      timestamp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
    }
  ];

  const filterLogs = (logs) => {
    if (activeTab === 'All Activities') {
      // Return API logs if available, otherwise use new sample logs
      return activityLogs.length > 0 ? activityLogs : newAllActivitiesLogs;
    } else if (activeTab === 'System') {
      // Return the system logs
      return systemLogs;
    } else {
      // For Errors and Warnings tabs
      const typeMap = {
        'Errors': 'error',
        'Warnings': 'warning',
      };
      
      const apiLogs = activityLogs.length > 0 ? activityLogs : newAllActivitiesLogs;
      return apiLogs.filter(log => log.type.toLowerCase() === typeMap[activeTab]?.toLowerCase());
    }
  };

  const filteredLogs = filterLogs(activityLogs);

  // Format bytes for network display
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
        </div>
        {lastUpdated && <span className="last-updated">Last updated: {lastUpdated}</span>}
      </div>
      
      <div className="system-health">
        <div className="section-header">
          <div>
            <h2>System Health</h2>
            <p className="metric-subtext">Current status of system resources and components</p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading-indicator">Loading system metrics...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <h3>
                  <span className="metric-icon">⚙️</span> CPU Usage
                </h3>
                <span className={`badge ${getStatusClass(healthMetrics.cpu?.status)}`}>
                  {healthMetrics.cpu?.status}
                </span>
              </div>
              <div className="metric-icon-value">
                {getIconForStatus(healthMetrics.cpu?.status)}
              </div>
              <div className="metric-value">
                {healthMetrics.cpu?.usage || 0}% 
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${healthMetrics.cpu?.usage || 0}%`,
                  }}
                ></div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-header">
                <h3>
                  <span className="metric-icon">💾</span> Memory Usage
                </h3>
                <span className={`badge ${getStatusClass(healthMetrics.memory?.status)}`}>
                  {healthMetrics.memory?.status}
                </span>
              </div>
              <div className="metric-icon-value">
                {getIconForStatus(healthMetrics.memory?.status)}
              </div>
              <div className="metric-value">
                {healthMetrics.memory?.percent || 0}%
              </div>
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${healthMetrics.memory?.status === 'warning' ? 'warning' : ''}`}
                  style={{ 
                    width: `${healthMetrics.memory?.percent || 0}%`,
                  }}
                ></div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-header">
                <h3>
                  <span className="metric-icon">💿</span> Disk Space
                </h3>
                <span className={`badge ${getStatusClass(healthMetrics.disk?.status)}`}>
                  {healthMetrics.disk?.status}
                </span>
              </div>
              <div className="metric-icon-value">
                {getIconForStatus(healthMetrics.disk?.status)}
              </div>
              <div className="metric-value">
                {healthMetrics.disk?.percent || 0}%
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${healthMetrics.disk?.percent || 0}%`,
                  }}
                ></div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-header">
                <h3>
                  <span className="metric-icon">📶</span> Network Traffic
                </h3>
                <span className={`badge ${getStatusClass(healthMetrics.network?.status)}`}>
                  {healthMetrics.network?.status}
                </span>
              </div>
              <div className="metric-icon-value">
                {getIconForStatus(healthMetrics.network?.status)}
              </div>
              <div className="metric-value">
                {formatBytes(healthMetrics.network?.bytes_recv || 0)} received / 
                {formatBytes(healthMetrics.network?.bytes_sent || 0)} sent
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: '50%',  // Fixed width since we don't have a percentage for network
                  }}
                ></div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <h3>
                  <span className="metric-icon">🌡️</span> Temperature
                </h3>
                <span className={`badge ${getStatusClass('warning')}`}>
                  {healthMetrics.cpu?.temperature ? 
                    (healthMetrics.cpu.temperature > 70 ? 'critical' : 
                     healthMetrics.cpu.temperature > 50 ? 'warning' : 'normal') : 
                    'warning'}
                </span>
              </div>
              <div className="metric-icon-value">
                {getIconForStatus(healthMetrics.cpu?.temperature > 70 ? 'critical' : 
                                  healthMetrics.cpu?.temperature > 50 ? 'warning' : 'normal')}
              </div>
              <div className="metric-value">
                {healthMetrics.cpu?.temperature || 'N/A'}°C
              </div>
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${healthMetrics.cpu?.temperature > 70 ? 'critical' : 
                             healthMetrics.cpu?.temperature > 50 ? 'warning' : ''}`}
                  style={{ 
                    width: `${healthMetrics.cpu?.temperature ? 
                            (healthMetrics.cpu.temperature / 100) * 100 : 50}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="activity-log">
        <div className="section-header">
          <div>
            <h2>Activity Log</h2>
          </div>
        </div>

        <div className="activity-tabs">
          <button 
            className={`tab-button ${activeTab === 'All Activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('All Activities')}
          >
            All Activities
          </button>
          <button 
            className={`tab-button ${activeTab === 'Errors' ? 'active' : ''}`}
            onClick={() => setActiveTab('Errors')}
          >
            Errors
          </button>
          <button 
            className={`tab-button ${activeTab === 'Warnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('Warnings')}
          >
            Warnings
          </button>
          <button 
            className={`tab-button ${activeTab === 'System' ? 'active' : ''}`}
            onClick={() => setActiveTab('System')}
          >
            System
          </button>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Type</th>
              <th>Service</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, index) => (
                <tr key={index}>
                  <td>
                    <div className="log-event">
                      <span className={`status-dot ${log.type.toLowerCase()}`}></span>
                      {log.event}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${log.type.toLowerCase()}`}>
                      {log.type}
                    </span>
                  </td>
                  <td>{log.service}</td>
                  <td>{new Date(log.timestamp * 1000).toLocaleTimeString()} - 4/1/2025</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-data-message">
                  {isLoading ? 'Loading activity logs...' : 'No activity logs found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminHomePage;