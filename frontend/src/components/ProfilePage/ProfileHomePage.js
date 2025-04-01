// ProfileHomePage.js
import React, { useState } from 'react';
import ProfileCard from './ProfileCard';
import EditProfileModal from './EditProfileModal';
import { motion } from 'framer-motion';
import './ProfileHomePage.css';

const ProfileHomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  const [userData, setUserData] = useState({
    fullName: 'Your Name',
    email: 'yourmail@example.com',
    username: 'YourName123',
    bio: 'Enter Your Bio',
    location: 'Country, State',
    memberSince: 'Dates',
    occupation: 'Your Occupation example'
  });

  const handleEditProfile = () => {
    setActiveTab('profile');
    setIsModalOpen(true);
  };

  const handleChangePassword = () => {
    setActiveTab('password');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveChanges = (updatedData) => {
    setUserData({ ...userData, ...updatedData });
    setIsModalOpen(false);
  };

  return (
    <div className="ProfileHomePage">
      <div className="container">
        <h1>Your Profile</h1>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="profile-container"
        >
          <ProfileCard 
            userData={userData} 
            onEditProfile={handleEditProfile} 
            onChangePassword={handleChangePassword}
          />
        </motion.div>
        
        <div className="footer">
          © 2025 Biblioknow. This is just an educational project.
        </div>
      </div>

      {isModalOpen && (
        <EditProfileModal 
          userData={userData} 
          onClose={handleCloseModal} 
          onSave={handleSaveChanges}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
    </div>
  );
};

export default ProfileHomePage;