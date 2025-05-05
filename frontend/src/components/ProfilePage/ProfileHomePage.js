// ProfileHomePage.js
import React, { useState, useEffect } from 'react';
import ProfileCard from './ProfileCard';
import EditProfileModal from './EditProfileModal';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth_context';

const ProfileHomePage = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    updateProfile, 
    changePassword, 
    updateProfilePicture, 
    logout,
    error: authError 
  } = useAuth();
  
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

  // Effect to update local userData when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setUserData({
        fullName: currentUser.full_name || '',
        email: currentUser.email || '',
        username: currentUser.username || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        memberSince: formatDate(currentUser.member_since) || new Date().toLocaleDateString(),
        occupation: currentUser.occupation || '',
        profilePicture: currentUser.profile_picture || null
      });
      
      setIsLoading(false);
    }
  }, [currentUser]);

  // Set general error when auth error occurs
  useEffect(() => {
    if (authError) {
      setGeneralError(authError);
    }
  }, [authError]);

  // Helper function to format date 
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

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

  // Profile update handler
  const handleSaveChanges = async (updatedData) => {
    try {
      setGeneralError('');
      setSuccessMessage('');
      setIsSubmitting(true);
      
      console.log('Sending profile update:', updatedData);
      
      // Send only the fields our backend expects
      const profileData = {};
      if (updatedData.username) profileData.username = updatedData.username;
      if (updatedData.email) profileData.email = updatedData.email;
      if (updatedData.bio) profileData.bio = updatedData.bio;
      
      console.log('Filtered profile data:', profileData);
      
      const response = await updateProfile(profileData);
      console.log('Profile update response:', response);
      
      // Update local user data
      setUserData({
        ...userData,
        fullName: response.user.full_name || '',
        email: response.user.email || '',
        username: response.user.username || '',
        bio: response.user.bio || '',
        location: response.user.location || '',
        occupation: response.user.occupation || ''
      });
      
      setIsModalOpen(false);
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      return true;
    } catch (error) {
      console.error('Update error:', error);
      
      const errorMsg = error.message || 'Failed to update profile';
      setGeneralError(errorMsg);
      
      if (error.response?.status === 401) {
        setTimeout(() => {
          logout();
          navigate('/registerlogin?show=login');
        }, 2000);
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password change handler
  const handleChangePasswordSubmit = async (passwordData) => {
    try {
      setGeneralError('');
      setIsSubmitting(true);
      
      console.log('Sending password change request');
      
      const response = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      console.log('Password change response:', response);
      
      setIsModalOpen(false);
      setSuccessMessage('Password changed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      return true;
    } catch (error) {
      console.error('Password change error:', error);
      
      const errorMsg = error.message || 'Failed to change password';
                     
      // Check for authentication errors
      if (error.response?.status === 401 && 
          error.response?.data?.error === 'Current password is incorrect') {
        throw new Error('Current password is incorrect');
      } else if (error.response?.status === 401) {
        setTimeout(() => {
          logout();
          navigate('/registerlogin?show=login');
        }, 2000);
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw new Error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/registerlogin?show=login');
  };

  // Profile picture update handler
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
      
      console.log('Uploading profile picture');
      
      const response = await updateProfilePicture(formData);
      
      console.log('Profile picture response:', response);
      
      // Update local user data with new profile picture
      setUserData({ 
        ...userData, 
        profilePicture: response.profile_picture 
      });
      
      setSuccessMessage('Profile picture updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Profile picture error:', error);
      
      const errorMsg = error.message || 'Failed to update profile picture';
      setGeneralError(errorMsg);
      
      if (error.response?.status === 401) {
        setTimeout(() => {
          logout();
          navigate('/registerlogin?show=login');
        }, 2000);
      }
    }
  };

  // If no token exists, redirect to login page
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/registerlogin?show=login');
    }
  }, [navigate]);

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