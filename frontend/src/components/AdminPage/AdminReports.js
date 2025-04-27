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

function AdminReports() {
  const [timeRange, setTimeRange] = useState('week');
  const [activityLogs, setActivityLogs] = useState([]);
  const [systemEvents, setSystemEvents] = useState([]);
  const [chartData, setChartData] = useState({
    week: [],
    month: []
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
          const logs = await adminService.getActivityLogs({ limit: 10 });
          setActivityLogs(logs.logs || []);
        } catch (err) {
          console.error('Error loading activity logs:', err);
          setActivityLogs([]);
        } finally {
          setLoading(prev => ({ ...prev, logs: false }));
        }

        // Fetch system events
        try {
          const events = await adminService.getSystemEvents({ limit: 10 });
          setSystemEvents(events.events || []);
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
            week: metrics.weeklyData || [],
            month: metrics.monthlyData || []
          });
        } catch (err) {
          console.error('Error loading metrics:', err);
          setChartData({
            week: [],
            month: []
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

  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getSeverityClass = (severity) => {
    return `severity-${severity.toLowerCase()}`;
  };

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
                    <tr key={index}>
                      <td>{formatDate(log.timestamp)}</td>
                      <td>{log.user?.email || log.user?.username || 'System'}</td>
                      <td>{log.action || 'Unknown action'}</td>
                      <td>{log.ip_address || 'N/A'}</td>
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
                    <tr key={index}>
                      <td>{formatDate(event.timestamp)}</td>
                      <td>{event.message || event.event_type || 'Unknown event'}</td>
                      <td className={getSeverityClass(event.severity)}>
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