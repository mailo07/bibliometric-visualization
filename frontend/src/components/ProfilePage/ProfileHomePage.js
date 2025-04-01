import React, { useState } from 'react';
import ProfileCard from './ProfileCard';
import EditProfileModal from './EditProfileModal';
import { motion } from 'framer-motion';

const ProfileHomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userData, setUserData] = useState({
    fullName: 'Your Name',
    email: 'yourmail@example.com',
    username: 'YourName123',
    bio: 'Enter Your Bio',
    location: 'Country, State',
    memberSince: 'Dates',
    occupation: 'Your Occupation'
  });

  const handleEditProfile = () => {
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white text-center mb-8">Your Profile</h1>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <ProfileCard userData={userData} onEditProfile={handleEditProfile} />
        </motion.div>
        
        <div className="text-center mt-8 text-white text-sm">
          © 2025 Biblioknow. This is just an educational project.
        </div>
      </div>

      {isModalOpen && (
        <EditProfileModal 
          userData={userData} 
          onClose={handleCloseModal} 
          onSave={handleSaveChanges} 
        />
      )}
    </div>
  );
};

export default ProfileHomePage;