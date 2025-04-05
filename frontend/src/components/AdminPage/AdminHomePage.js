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
  const [healthMetrics, setHealthMetrics] = useState({
    cpu: { usage: 0, total: 100, status: 'normal' },
    memory: { usage: 0, total: 0, status: 'normal' },
    disk: { usage: 0, total: 0, status: 'normal' },
    network: { current: 0, max: 1000, status: 'normal' }
  });
  
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch system health data
  useEffect(() => {
    const fetchSystemData = async () => {
      setIsLoading(true);
      try {
        const [healthData, logsData] = await Promise.all([
          getSystemHealth(),
          getActivityLogs()
        ]);
        
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
      setHealthMetrics(data);
      setLastUpdated(new Date().toLocaleTimeString());
    }, 30000);
    
    return () => clearPolling();
  }, []);

  const calculatePercentage = (used, total) => {
    return Math.round((used / total) * 100);
  };
  
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  const getProgressBarColor = (status) => {
    switch (status) {
      case 'critical':
        return '#ff6b6b';
      case 'warning':
        return '#ffa502';
      default:
        return 'linear-gradient(90deg, #3498db, #2ecc71)';
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        {lastUpdated && <span className="last-updated">Last updated: {lastUpdated}</span>}
      </div>
      
      <div className="system-health">
        <div className="section-header">
          <h2>System Health</h2>
          <button 
            className="refresh-button"
            onClick={() => window.location.reload()}
          >
            <i className="refresh-icon">↻</i> Refresh
          </button>
        </div>
        
        {isLoading ? (
          <div className="loading-indicator">Loading system metrics...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <h3>CPU Usage</h3>
                <div className={`status-indicator status-${healthMetrics.cpu.status}`}></div>
              </div>
              <div className="metric-value">
                {healthMetrics.cpu.usage.toFixed(1)}% / {healthMetrics.cpu.total}%
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${healthMetrics.cpu.usage}%`,
                    background: getProgressBarColor(healthMetrics.cpu.status)
                  }}
                ></div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-header">
                <h3>Memory Usage</h3>
                <div className={`status-indicator status-${healthMetrics.memory.status}`}></div>
              </div>
              <div className="metric-value">
                {calculatePercentage(healthMetrics.memory.usage, healthMetrics.memory.total)}% / 100%
                <div className="metric-subtext">
                  {formatBytes(healthMetrics.memory.usage)} / {formatBytes(healthMetrics.memory.total)}
                </div>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${calculatePercentage(healthMetrics.memory.usage, healthMetrics.memory.total)}%`,
                    background: getProgressBarColor(healthMetrics.memory.status)
                  }}
                ></div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-header">
                <h3>Disk Space</h3>
                <div className={`status-indicator status-${healthMetrics.disk.status}`}></div>
              </div>
              <div className="metric-value">
                {calculatePercentage(healthMetrics.disk.usage, healthMetrics.disk.total)}% / 100%
                <div className="metric-subtext">
                  {formatBytes(healthMetrics.disk.usage)} / {formatBytes(healthMetrics.disk.total)}
                </div>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${calculatePercentage(healthMetrics.disk.usage, healthMetrics.disk.total)}%`,
                    background: getProgressBarColor(healthMetrics.disk.status)
                  }}
                ></div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-header">
                <h3>Network Traffic</h3>
                <div className={`status-indicator status-${healthMetrics.network.status}`}></div>
              </div>
              <div className="metric-value">
                {healthMetrics.network.current} MB / {healthMetrics.network.max} MB
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(calculatePercentage(healthMetrics.network.current, healthMetrics.network.max), 100)}%`,
                    background: getProgressBarColor(healthMetrics.network.status)
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="activity-log">
        <div className="section-header">
          <h2>Recent Activity</h2>
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
            {activityLogs.length > 0 ? (
              activityLogs.map((log, index) => (
                <tr key={index}>
                  <td>{log.event}</td>
                  <td>
                    <span className={`badge ${log.type.toLowerCase()}`}>
                      {log.type}
                    </span>
                  </td>
                  <td>{log.service}</td>
                  <td>{new Date(log.timestamp * 1000).toLocaleTimeString()}</td>
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