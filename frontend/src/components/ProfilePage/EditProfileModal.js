// EditProfileModal.js - Clean Implementation
import React, { useState, useEffect } from 'react';
import './EditProfileModal.css';

const EditProfileModal = ({ 
  userData, 
  onClose, 
  onSave, 
  onChangePassword, 
  activeTab = 'profile',
  generalError = ''
}) => {
  const [formData, setFormData] = useState({
    fullName: userData?.fullName || '',
    email: userData?.email || '',
    username: userData?.username || '',
    bio: userData?.bio || '',
    location: userData?.location || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localGeneralError, setLocalGeneralError] = useState('');
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [tabTransition, setTabTransition] = useState('');
  
  // Handle active tab changes from props
  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        fullName: userData.fullName || '',
        email: userData.email || '',
        username: userData.username || '',
        bio: userData.bio || '',
        location: userData.location || ''
      }));
    }
  }, [userData]);
  
  // Handle external error updates
  useEffect(() => {
    if (generalError) {
      setLocalGeneralError(generalError);
    }
  }, [generalError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (passwordError) setPasswordError('');
    if (localGeneralError) setLocalGeneralError('');
  };

  const handleTabChange = (tab) => {
    setTabTransition(tab === 'profile' ? 'slide-left' : 'slide-right');
    setTimeout(() => {
      setCurrentTab(tab);
      setTabTransition('');
    }, 150);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (currentTab === 'profile') {
        await onSave({
          fullName: formData.fullName,
          email: formData.email,
          username: formData.username,
          bio: formData.bio,
          location: formData.location
        });
      } else {
        if (formData.newPassword !== formData.confirmPassword) {
          setPasswordError("Passwords don't match");
          setIsSubmitting(false);
          return;
        }
        
        if (formData.newPassword.length < 8) {
          setPasswordError("Password must be at least 8 characters");
          setIsSubmitting(false);
          return;
        }
        
        await onChangePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });
        
        // Clear password fields after successful change
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error.message || 'An error occurred. Please try again.';
      
      if (currentTab === 'password') {
        setPasswordError(errorMessage);
      } else {
        setLocalGeneralError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="modal-content bg-gray-800 rounded-lg shadow-xl w-full max-w-lg relative transform transition-all">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-white" 
          disabled={isSubmitting}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-2">Edit Profile</h2>
          <p className="text-gray-400 mb-6">Update your profile information or change your password.</p>
          
          <div className="flex mb-6 bg-gray-700 rounded-md">
            <button 
              className={`flex-1 py-3 rounded-md flex items-center justify-center transition-all duration-300 ${currentTab === 'profile' ? 'bg-gray-600 text-white' : 'text-gray-300'}`}
              onClick={() => handleTabChange('profile')} 
              disabled={isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg> 
              Profile
            </button>

            <button 
              className={`flex-1 py-3 rounded-md flex items-center justify-center transition-all duration-300 ${currentTab === 'password' ? 'bg-gray-600 text-white' : 'text-gray-300'}`}
              onClick={() => handleTabChange('password')} 
              disabled={isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg> 
              Password
            </button>
          </div>
          
          {localGeneralError && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
              {localGeneralError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className={`tab-content ${tabTransition}`}>
              {currentTab === 'profile' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-200 mb-1" htmlFor="fullName">Full Name</label>
                    <input 
                      type="text" 
                      id="fullName" 
                      name="fullName" 
                      value={formData.fullName} 
                      onChange={handleChange} 
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      disabled={isSubmitting} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 mb-1" htmlFor="email">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white" 
                      disabled={isSubmitting} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 mb-1" htmlFor="username">Username</label>
                    <input 
                      type="text" 
                      id="username" 
                      name="username" 
                      value={formData.username} 
                      onChange={handleChange} 
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white" 
                      disabled={isSubmitting} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 mb-1" htmlFor="bio">Bio</label>
                    <textarea 
                      id="bio" 
                      name="bio" 
                      value={formData.bio} 
                      onChange={handleChange} 
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white" 
                      rows="3" 
                      disabled={isSubmitting} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 mb-1" htmlFor="location">Location</label>
                    <input 
                      type="text" 
                      id="location" 
                      name="location" 
                      value={formData.location} 
                      onChange={handleChange} 
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      disabled={isSubmitting} 
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-200 mb-1" htmlFor="currentPassword">Current Password</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        id="currentPassword" 
                        name="currentPassword" 
                        value={formData.currentPassword} 
                        onChange={handleChange} 
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white pr-10"
                        placeholder="Enter your current password" 
                        disabled={isSubmitting} 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 mb-1" htmlFor="newPassword">New Password</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        id="newPassword" 
                        name="newPassword" 
                        value={formData.newPassword} 
                        onChange={handleChange} 
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white pr-10"
                        placeholder="Enter your new password" 
                        disabled={isSubmitting} 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 mb-1" htmlFor="confirmPassword">Confirm Password</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        id="confirmPassword" 
                        name="confirmPassword" 
                        value={formData.confirmPassword} 
                        onChange={handleChange} 
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white pr-10" 
                        placeholder="Confirm your new password"
                        disabled={isSubmitting} 
                        required 
                      />
                    </div>
                  </div>
                  
                  {passwordError && (
                    <div className="text-red-400 text-sm mt-4 bg-red-100 bg-opacity-20 p-2 rounded border border-red-400">
                      {passwordError}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50" 
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {currentTab === 'profile' ? 'Saving...' : 'Updating...'}
                  </>
                ) : currentTab === 'profile' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Save Changes
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;