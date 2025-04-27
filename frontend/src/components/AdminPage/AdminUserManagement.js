// src/components/Admin/AdminUserManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import './AdminUserManagement.css';
import * as adminService from '../../services/adminService';

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('All Users');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    suspendedUsers: 0
  });
  
  const itemsPerPage = 5;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const statusFilter = activeTab === 'All Users' ? '' : activeTab;
      
      const response = await adminService.getUsers({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter,
        search: searchTerm
      });
      
      setUsers(response.users || []);
      setTotalPages(response.pages || 1);
      
      // Fetch stats if on first page and all users
      if (currentPage === 1 && activeTab === 'All Users') {
        const statsResponse = await adminService.getUserStats();
        setStats({
          totalUsers: statsResponse.total_users || 0,
          activeUsers: statsResponse.active_users || 0,
          inactiveUsers: statsResponse.inactive_users || 0,
          suspendedUsers: statsResponse.suspended_users || 0
        });
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      setLoading(false);
    }
  }, [activeTab, currentPage, searchTerm, itemsPerPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchUsers();
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Open delete modal
  const handleOpenDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Close delete modal
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await adminService.deleteUser(userToDelete.id);
      fetchUsers();
      handleCloseDeleteModal();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  // Suspend user
  const handleSuspendUser = async (userId) => {
    try {
      await adminService.suspendUser(userId);
      fetchUsers();
    } catch (err) {
      console.error('Error suspending user:', err);
      setError('Failed to suspend user. Please try again.');
    }
  };

  // Unsuspend user
  const handleUnsuspendUser = async (userId) => {
    try {
      await adminService.unsuspendUser(userId);
      fetchUsers();
    } catch (err) {
      console.error('Error unsuspending user:', err);
      setError('Failed to unsuspend user. Please try again.');
    }
  };

  // Update user role
  const handleUpdateRole = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role. Please try again.');
    }
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    let className = '';
    switch(status) {
      case 'Active':
        className = 'status-active';
        break;
      case 'Inactive':
        className = 'status-inactive';
        break;
      case 'Suspended':
        className = 'status-suspended';
        break;
      default:
        className = '';
    }
    
    return <span className={`status-badge ${className}`}>{status}</span>;
  };

  // Render action buttons based on user status
  const renderActionButtons = (user) => {
    return (
      <div className="action-buttons">
        {user.status === 'Suspended' ? (
          <button 
            className="admin-btn admin-btn-sm admin-btn-success"
            onClick={() => handleUnsuspendUser(user.id)}
          >
            Unsuspend
          </button>
        ) : (
          <button 
            className="admin-btn admin-btn-sm admin-btn-warning"
            onClick={() => handleSuspendUser(user.id)}
          >
            Suspend
          </button>
        )}
        <button 
          className="admin-btn admin-btn-sm admin-btn-danger"
          onClick={() => handleOpenDeleteModal(user)}
        >
          Delete
        </button>
        <select
          className="admin-btn admin-btn-sm"
          value={user.role}
          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
        >
          <option value="user">User</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    );
  };

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    
    // Previous button
    buttons.push(
      <button 
        key="prev" 
        className="pagination-btn" 
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
      >
        Previous
      </button>
    );
    
    // First page
    buttons.push(
      <button
        key="1"
        className={`pagination-btn ${currentPage === 1 ? 'active' : ''}`}
        onClick={() => handlePageChange(1)}
      >
        1
      </button>
    );
    
    // Ellipsis if needed
    if (currentPage > 3) {
      buttons.push(<button key="ellipsis1" className="pagination-btn">...</button>);
    }
    
    // Pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i <= 1 || i >= totalPages) continue;
      buttons.push(
        <button
          key={i}
          className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    
    // Ellipsis if needed
    if (currentPage < totalPages - 2) {
      buttons.push(<button key="ellipsis2" className="pagination-btn">...</button>);
    }
    
    // Last page if not the first page
    if (totalPages > 1) {
      buttons.push(
        <button
          key={totalPages}
          className={`pagination-btn ${currentPage === totalPages ? 'active' : ''}`}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }
    
    // Next button
    buttons.push(
      <button
        key="next"
        className="pagination-btn"
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
      >
        Next
      </button>
    );
    
    return buttons;
  };

  return (
    <div className="admin-user-management">
      <h1>User Management</h1>
      <p className="subtitle">Manage system users, permissions, and access controls</p>
      
      {/* User Stats Cards */}
      <div className="user-stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <span className="stat-value">{stats.totalUsers}</span>
        </div>
        <div className="stat-card">
          <h3>Active Users</h3>
          <span className="stat-value active">{stats.activeUsers}</span>
        </div>
        <div className="stat-card">
          <h3>Inactive Users</h3>
          <span className="stat-value inactive">{stats.inactiveUsers}</span>
        </div>
        <div className="stat-card">
          <h3>Suspended Users</h3>
          <span className="stat-value suspended">{stats.suspendedUsers}</span>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="user-tabs">
        <button 
          className={`tab-btn ${activeTab === 'All Users' ? 'active' : ''}`}
          onClick={() => handleTabChange('All Users')}
        >
          All Users
        </button>
        <button 
          className={`tab-btn ${activeTab === 'Active' ? 'active' : ''}`}
          onClick={() => handleTabChange('Active')}
        >
          Active
        </button>
        <button 
          className={`tab-btn ${activeTab === 'Inactive' ? 'active' : ''}`}
          onClick={() => handleTabChange('Inactive')}
        >
          Inactive
        </button>
        <button 
          className={`tab-btn ${activeTab === 'Suspended' ? 'active' : ''}`}
          onClick={() => handleTabChange('Suspended')}
        >
          Suspended
        </button>
        
        <div className="table-actions">
          <button className="admin-btn admin-btn-primary" onClick={handleRefresh}>
            <i className="refresh-icon"></i> Refresh
          </button>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="table-toolbar">
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm} 
            onChange={handleSearch} 
            className="search-input" 
          />
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      
      {/* Users Table */}
      <div className="user-list">
        <table className="admin-table">
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Activity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No users found
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td><input type="checkbox" /></td>
                  <td>{user.full_name || user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{renderStatusBadge(user.status)}</td>
                  <td>
                    {user.last_activity ? 
                      new Date(user.last_activity).toLocaleString() : 
                      'Never'}
                  </td>
                  <td>
                    {renderActionButtons(user)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <div className="table-footer">
          <div className="results-info">
            {users.length > 0 ? 
              `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, users.length)} of ${users.length} results` : 
              'No results to display'}
          </div>
          <div className="pagination">
            {renderPaginationButtons()}
          </div>
        </div>
      </div>
      
      {/* Delete User Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Delete User</h2>
            <p>Are you sure you want to delete user: <strong>{userToDelete?.full_name || userToDelete?.username}</strong>?</p>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="admin-btn" onClick={handleCloseDeleteModal}>
                Cancel
              </button>
              <button 
                className="admin-btn admin-btn-danger" 
                onClick={handleDeleteUser}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUserManagement;