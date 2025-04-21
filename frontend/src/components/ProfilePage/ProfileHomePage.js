import React, { useState, useEffect } from 'react';
import ProfileCard from './ProfileCard';
import EditProfileModal from './EditProfileModal';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ProfileHomePage = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
      // Redirect to login page if not logged in
      navigate('/registerlogin?show=login');
      return;
    }
    
    // Update user data from localStorage
    if (user) {
      setUserData({
        fullName: user.fullName || user.username || 'Your Name',
        email: user.email || 'yourmail@example.com',
        username: user.username || 'YourName123',
        bio: user.bio || 'Enter Your Bio',
        location: user.location || 'Country, State',
        memberSince: user.memberSince || new Date().toLocaleDateString(),
        occupation: user.occupation || 'Your Occupation'
      });
    }
    
    // Optional: Verify token validity with the backend
    // This could be added to ensure the token is still valid
  }, [navigate]);

  const handleEditProfile = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveChanges = (updatedData) => {
    const newUserData = { ...userData, ...updatedData };
    setUserData(newUserData);
    
    // Update localStorage with new user data
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...storedUser, ...updatedData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    setIsModalOpen(false);
    
    // Optional: Update user data on the backend
    // You could add an API call here to update the user's profile on the server
  };
  
  const handleChangePassword = () => {
    // Implement password change functionality here
    // Could navigate to a password change page or open a modal
    alert('Password change functionality will be implemented here.');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700">
      <div className="container mx-auto px-4 py-8"> <h1 className="text-4xl font-bold text-white text-center mb-8">Your Profile</h1>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex justify-center" >
          <ProfileCard userData={userData} onEditProfile={handleEditProfile} onChangePassword={handleChangePassword}/>
        </motion.div>
        
        <div className="text-center mt-8 text-white text-sm"> © 2025 Biblioknow. This is just an educational project. </div>
      </div>

      {isModalOpen && ( <EditProfileModal  userData={userData}  onClose={handleCloseModal} onSave={handleSaveChanges} />)}
    </div>
  );
};

export default ProfileHomePage;