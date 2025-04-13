import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

function AdminLayout({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Call the onLogout prop function if it exists
    if (onLogout) {
      onLogout();
    }
    
    // Navigate to the main page
    navigate('/');
  };

  return (
    <div className="admin-layout">
      <nav className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <ul className="sidebar-menu">
          <li><Link to="/admin">Dashboard</Link></li>
          <li><Link to="/admin/users">User Management</Link></li>
          <li><Link to="/admin/reports">Reports</Link></li>
        </ul>
        <button onClick={handleLogout} className="admin-logout-button">Logout</button>
      </nav>
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;