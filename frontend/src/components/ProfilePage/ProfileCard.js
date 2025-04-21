import React from 'react';
import { motion } from 'framer-motion';
import './ProfileCard.css';
import './EditProfileModal.css';
import './ChangePasswordModal.css';

const ProfileCard = ({ userData, onEditProfile, onChangePassword, onLogout, onProfilePictureChange }) => {
  return (
    <motion.div
      className="profile-card"
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="profile-header">
        <div className="avatar-container">
          <div className="avatar">
            {userData.profilePicture ? (
              <img 
                src={userData.profilePicture} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-purple-500 text-white text-4xl font-bold">
                {userData.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <label className="edit-avatar-button">
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={onProfilePictureChange}
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </label>
        </div>
        
        <h2 className="profile-name">{userData.fullName}</h2>
        
        <div className="profile-details">
          <div className="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" className="detail-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <span className="detail-text">{userData.email}</span>
          </div>
          
          <div className="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" className="detail-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="detail-text">Member since {userData.memberSince}</span>
          </div>
          
          <div className="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" className="detail-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="detail-text">{userData.location}</span>
          </div>
          
          <div className="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" className="detail-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="detail-text">{userData.bio}</span>
          </div>
        </div>
      </div>
      
      <div className="profile-footer">
        <div className="flex gap-4">
          <motion.button 
            onClick={onEditProfile}
            className="edit-profile-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="edit-profile-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Profile
          </motion.button>
          
          <motion.button 
            onClick={onChangePassword}
            className="edit-profile-button bg-blue-600 hover:bg-blue-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="edit-profile-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Change Password
          </motion.button>

          <motion.button 
            onClick={onLogout}
            className="edit-profile-button bg-red-600 hover:bg-red-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="edit-profile-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Logout
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCard;