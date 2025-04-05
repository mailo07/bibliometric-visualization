// src/components/Admin/AdminReports.js
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import * as adminService from '../../services/adminService';
import './AdminReports.css';

const generatePlaceholderData = (type) => {
  if (type === 'week') {
    return Array(7).fill(0).map((_, i) => ({
      name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
      users: 0,
      sessions: 0
    }));
  }
  return Array(4).fill(0).map((_, i) => ({
    name: `Week ${i+1}`,
    users: 0,
    sessions: 0
  }));
};

function AdminReports() {
  const [timeRange, setTimeRange] = useState('week');
  const [activityLogs, setActivityLogs] = useState([]);
  const [systemEvents, setSystemEvents] = useState([]);
  const [chartData, setChartData] = useState({
    week: generatePlaceholderData('week'),
    month: generatePlaceholderData('month')
  });
  const [loading, setLoading] = useState({
    logs: true,
    events: true,
    metrics: true
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        
        // Fetch activity logs
        try {
          const logs = await adminService.getActivityLogs();
          setActivityLogs(logs.data || []);
        } catch (err) {
          console.error('Error loading activity logs:', err);
          setActivityLogs([]);
        } finally {
          setLoading(prev => ({ ...prev, logs: false }));
        }

        // Fetch system events
        try {
          const events = await adminService.getSystemEvents();
          setSystemEvents(events.data || []);
        } catch (err) {
          console.error('Error loading system events:', err);
          setSystemEvents([]);
        } finally {
          setLoading(prev => ({ ...prev, events: false }));
        }

        // Fetch metrics
        try {
          const metrics = await adminService.getUserActivityMetrics();
          setChartData({
            week: metrics.weeklyData || generatePlaceholderData('week'),
            month: metrics.monthlyData || generatePlaceholderData('month')
          });
        } catch (err) {
          console.error('Error loading metrics:', err);
          setChartData({
            week: generatePlaceholderData('week'),
            month: generatePlaceholderData('month')
          });
        } finally {
          setLoading(prev => ({ ...prev, metrics: false }));
        }

      } catch (err) {
        setError('Failed to load dashboard data. Please try again.');
        console.error('Dashboard error:', err);
      }
    };

    fetchData();
  }, []);

  const isLoading = loading.logs || loading.events || loading.metrics;

  return (
    <div className="admin-reports">
      <h1>Reports Dashboard</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="time-range-selector">
        <button
          className={`time-range-btn ${timeRange === 'week' ? 'active' : ''}`}
          onClick={() => setTimeRange('week')}
        >
          Weekly
        </button>
        <button
          className={`time-range-btn ${timeRange === 'month' ? 'active' : ''}`}
          onClick={() => setTimeRange('month')}
        >
          Monthly
        </button>
      </div>

      <div className="chart-container">
        <h3 className="chart-title">User Activity ({timeRange})</h3>
        {loading.metrics ? (
          <div className="loading-message">Loading chart data...</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData[timeRange]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" fill="#8884d8" name="Unique Users" />
              <Bar dataKey="sessions" fill="#82ca9d" name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="stats-grid">
        <div className="chart-container compact-table">
          <h3 className="chart-title">Recent Activity Logs</h3>
          {loading.logs ? (
            <div className="loading-message">Loading activity logs...</div>
          ) : activityLogs.length > 0 ? (
            <div className="logs-table">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map((log, index) => (
                    <tr key={log._id || log.id || index}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.user?.email || log.userEmail || 'N/A'}</td>
                      <td>{log.action || 'Unknown action'}</td>
                      <td>{log.ipAddress || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data-message">No activity logs available</div>
          )}
        </div>

        <div className="chart-container compact-table">
          <h3 className="chart-title">System Events</h3>
          {loading.events ? (
            <div className="loading-message">Loading system events...</div>
          ) : systemEvents.length > 0 ? (
            <div className="events-table">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {systemEvents.map((event, index) => (
                    <tr key={event._id || event.id || index}>
                      <td>{new Date(event.timestamp).toLocaleString()}</td>
                      <td>{event.message || event.description || 'Unknown event'}</td>
                      <td className={`severity-${event.severity?.toLowerCase() || 'info'}`}>
                        {event.severity || 'INFO'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data-message">No system events available</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminReports;