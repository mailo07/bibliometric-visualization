// Fixed ProfileHomePage.js
import React, { useState, useEffect, useCallback } from 'react';
import ProfileCard from './ProfileCard';
import EditProfileModal from './EditProfileModal';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Make sure this matches your actual API URL
const API_BASE_URL = 'http://localhost:5000/api';

const ProfileHomePage = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    username: '',
    bio: '',
    location: '',
    memberSince: '',
    occupation: '',
    profilePicture: null
  });

  // Enhanced error handling and debugging for profile fetch
  const fetchUserProfile = useCallback(async (token) => {
    if (!token) {
      console.error('No token available for profile fetch');
      navigate('/registerlogin?show=login');
      return;
    }
    
    try {
      console.log("Fetching profile with token:", token.substring(0, 10) + "...");
      setIsLoading(true);
      
      const response = await axios.get(`${API_BASE_URL}/profile`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log("Profile data received:", response.data);
      const profileData = response.data;
      
      // Map backend field names to frontend field names
      setUserData({
        fullName: profileData.full_name || profileData.username || '',
        email: profileData.email || '',
        username: profileData.username || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        memberSince: profileData.member_since || new Date().toLocaleDateString(),
        occupation: profileData.occupation || '',
        profilePicture: profileData.profile_picture || null
      });
      
      localStorage.setItem('user', JSON.stringify(profileData));
      setGeneralError(''); // Clear any previous errors
    } catch (error) {
      console.error('Profile fetch error:', error);
      console.error('Response data:', error.response?.data);
      console.error('Status code:', error.response?.status);
      
      // Handle different error scenarios
      if (error.response?.status === 401) {
        console.log('Authentication failed, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/registerlogin?show=login');
      } else {
        const errorMessage = error.response?.data?.error || 
                             error.message || 
                             'Failed to load profile data. Please try again.';
        setGeneralError(`Profile Error: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/registerlogin?show=login');
      return;
    }
    
    // Use stored data immediately for better UX
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (Object.keys(storedUser).length > 0) {
      console.log('Using stored user data for initial render');
      setUserData({
        fullName: storedUser.full_name || storedUser.username || '',
        email: storedUser.email || '',
        username: storedUser.username || '',
        bio: storedUser.bio || '',
        location: storedUser.location || '',
        memberSince: storedUser.member_since || new Date().toLocaleDateString(),
        occupation: storedUser.occupation || '',
        profilePicture: storedUser.profile_picture || null
      });
    }
    
    // Then fetch fresh data
    fetchUserProfile(token);
  }, [navigate, fetchUserProfile]);

  const handleEditProfile = () => {
    setModalType('profile');
    setIsModalOpen(true);
    setGeneralError('');
  };

  const handleChangePassword = () => {
    setModalType('password');
    setIsModalOpen(true);
    setGeneralError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setGeneralError('');
  };

  // Improved error handling for profile updates
  const handleSaveChanges = async (updatedData) => {
    try {
      setGeneralError('');
      setSuccessMessage('');
      setIsSubmitting(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      
      console.log('Sending profile update:', updatedData);
      
      // Make sure field names match what backend expects
      const response = await axios.put(`${API_BASE_URL}/profile`, {
        // Use snake_case for backend API
        full_name: updatedData.fullName,
        email: updatedData.email,
        username: updatedData.username,
        bio: updatedData.bio,
        location: updatedData.location,
        occupation: updatedData.occupation
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Profile update response:', response.data);
      
      const updatedUser = {
        ...userData,
        fullName: response.data.user.full_name,
        email: response.data.user.email,
        username: response.data.user.username,
        bio: response.data.user.bio,
        location: response.data.user.location,
        occupation: response.data.user.occupation
      };
      
      setUserData(updatedUser);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsModalOpen(false);
      
      setSuccessMessage(response.data.message || 'Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Update error:', error);
      console.error('Response data:', error.response?.data);
      
      const errorMsg = error.response?.data?.error || 
                     error.response?.data?.message || 
                     error.message ||
                     'Failed to update profile';
      setGeneralError(`Update Error: ${errorMsg}`);
      
      // Check for specific error types
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setTimeout(() => navigate('/registerlogin?show=login'), 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Improved error handling for password changes
  const handleChangePasswordSubmit = async (passwordData) => {
    try {
      setGeneralError('');
      setIsSubmitting(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      
      console.log('Sending password change request');
      
      const response = await axios.put(`${API_BASE_URL}/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Password change response:', response.data);
      
      setIsModalOpen(false);
      setSuccessMessage(response.data.message || 'Password changed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      return true;
    } catch (error) {
      console.error('Password change error:', error);
      console.error('Response data:', error.response?.data);
      
      const errorMsg = error.response?.data?.error || 
                     error.message ||
                     'Failed to change password';
                     
      // Check for authentication errors
      if (error.response?.status === 401 && 
          error.response?.data?.error === 'Current password is incorrect') {
        throw new Error('Current password is incorrect');
      } else if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setTimeout(() => navigate('/registerlogin?show=login'), 2000);
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw new Error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/registerlogin?show=login');
  };

  // Improved error handling for profile picture uploads
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setGeneralError('');
      setSuccessMessage('');
      
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setGeneralError('Only JPG, PNG and GIF files are allowed');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setGeneralError('File size must be less than 5MB');
        return;
      }
      
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      
      console.log('Uploading profile picture');
      
      const response = await axios.post(`${API_BASE_URL}/profile/picture`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Profile picture response:', response.data);
      
      const updatedUser = { 
        ...userData, 
        profilePicture: response.data.profile_picture 
      };
      setUserData(updatedUser);
      
      // Update local storage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...storedUser,
        profile_picture: response.data.profile_picture
      }));
      
      setSuccessMessage('Profile picture updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Profile picture error:', error);
      console.error('Response data:', error.response?.data);
      
      const errorMsg = error.response?.data?.error || 
                     error.message ||
                     'Failed to update profile picture';
      setGeneralError(`Image Error: ${errorMsg}`);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setTimeout(() => navigate('/registerlogin?show=login'), 2000);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white text-center mb-8">Your Profile</h1>
        
        {successMessage && (
          <div className="bg-green-500 text-white px-4 py-2 rounded mb-4 text-center">
            {successMessage}
          </div>
        )}
        
        {generalError && (
          <div className="bg-red-500 text-white px-4 py-2 rounded mb-4 text-center">
            {generalError}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center">
            <div className="bg-white bg-opacity-10 p-8 rounded-lg shadow-xl text-white text-center">
              <svg className="animate-spin h-10 w-10 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p>Loading your profile...</p>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }} 
            className="flex justify-center"
          >
            <ProfileCard 
              userData={userData} 
              onEditProfile={handleEditProfile} 
              onChangePassword={handleChangePassword} 
              onLogout={handleLogout} 
              onProfilePictureChange={handleProfilePictureChange} 
            />
          </motion.div>
        )}
        
        <div className="text-center mt-8 text-white text-sm">
          © 2025 Biblioknow. This is just an educational project.
        </div>
      </div>

      {isModalOpen && (
        <EditProfileModal 
          userData={userData} 
          onClose={handleCloseModal} 
          onSave={handleSaveChanges} 
          onChangePassword={handleChangePasswordSubmit} 
          activeTab={modalType === 'password' ? 'password' : 'profile'}
          generalError={generalError}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default ProfileHomePage;