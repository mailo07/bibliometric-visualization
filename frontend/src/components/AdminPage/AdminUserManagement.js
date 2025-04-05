// src/components/Admin/AdminUserManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import './AdminUserManagement.css';
import axios from 'axios';

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
  
  const API_URL = 'http://localhost:5000/api';
  const itemsPerPage = 5;

  // Function to fetch users from API - wrapped in useCallback
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const statusFilter = activeTab === 'All Users' ? '' : activeTab;
      
      const response = await axios.get(`${API_URL}/users`, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          status: statusFilter,
          search: searchTerm
        }
      });
      
      // Extract data from response
      const { data } = response;
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      setLoading(false);
    }
  }, [activeTab, currentPage, searchTerm, API_URL, itemsPerPage]);

  // Fetch users on component mount and when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Stats calculation
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.status === 'Active').length;
  const inactiveUsers = users.filter(user => user.status === 'Inactive').length;
  const suspendedUsers = users.filter(user => user.status === 'Suspended').length;

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
      await axios.delete(`${API_URL}/users/${userToDelete.id}`);
      
      // Refresh user list after deletion
      fetchUsers();
      
      // Close modal
      handleCloseDeleteModal();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
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
    
    return (
      <span className={`status-badge ${className}`}>
        {status}
      </span>
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
          <span className="stat-value">{totalUsers}</span>
        </div>
        <div className="stat-card">
          <h3>Active Users</h3>
          <span className="stat-value active">{activeUsers}</span>
        </div>
        <div className="stat-card">
          <h3>Inactive Users</h3>
          <span className="stat-value inactive">{inactiveUsers}</span>
        </div>
        <div className="stat-card">
          <h3>Suspended Users</h3>
          <span className="stat-value suspended">{suspendedUsers}</span>
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
              <th>
                <input type="checkbox" />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
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
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{renderStatusBadge(user.status)}</td>
                  <td>{user.lastLogin}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="admin-btn admin-btn-sm"
                        onClick={() => handleOpenDeleteModal(user)}
                      >
                        <i className="ellipsis-icon">...</i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <div className="table-footer">
          <div className="results-info">
            {users.length > 0 
              ? `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, users.length)} of ${users.length} results` 
              : 'No results to display'}
          </div>
          <div className="pagination">
            {renderPaginationButtons()}
          </div>
        </div>
      </div>
      
      {/* Delete User Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h2>Delete User</h2>
            <p>Are you sure you want to delete user: <strong>{userToDelete?.name}</strong>?</p>
            <p>This action cannot be undone.</p>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <button 
                className="admin-btn" 
                onClick={handleCloseDeleteModal}
              >
                Cancel
              </button>
              <button 
                className="admin-btn" 
                style={{ backgroundColor: '#e74c3c', color: 'white' }}
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