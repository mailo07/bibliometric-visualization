import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import profileBackground from '../../assets/forest.jpg';

const UserProfile = ({ username, handleSignOut, navigateToChangePassword, navigateToUpdate, profileImage }) => {
    const [passwordVisible, setPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const hiddenPassword = "•".repeat(10);

    return (
        <div className="profilePage-container">
            <div className="profilePage-header-link">
                <a href="/" className="profilePage-home-link">
                    <i className="ri-home-line"></i>
                </a>
            </div>
            
            <h1 className="profilePage__title">User Profile</h1>
            
            <div className="profilePage-header-info">
                {profileImage ? (
                    <img src={profileImage} alt="Profile" className="profilePage-image" />
                ) : (
                    <div className="profilePage-image">
                        <i className="ri-user-3-line profilePage-image-icon"></i>
                    </div>
                )}
                <div>
                    <h2 className="profilePage-username">{username}</h2>
                    <p className="profilePage-email">JohnDoe1234@example.com</p>
                </div>
            </div>

            <div className="profilePage__content">
                <div className="profilePage-info-section">
                    <h3 className="profilePage-info-title">Profile Information</h3>
                    
                    <div className="profilePage__box">
                        <i className="ri-user-3-line profilePage__icon"></i>
                        <div className="profilePage__box-input">
                            <input type="text" className="profilePage__input" value={username} disabled placeholder=" " />
                            <label className="profilePage__label">Username</label>
                        </div>
                    </div>
                    
                    <div className="profilePage__box">
                        <i className="ri-mail-line profilePage__icon"></i>
                        <div className="profilePage__box-input">
                            <input type="email" className="profilePage__input" value="JohnDoe1234@example.com" disabled placeholder=" " />
                            <label className="profilePage__label">Email</label>
                        </div>
                    </div>
                    
                    <div className="profilePage__box">
                        <i className="ri-calendar-line profilePage__icon"></i>
                        <div className="profilePage__box-input">
                            <input type="text" className="profilePage__input" value="2025-03-04 10:13:17" disabled placeholder=" " />
                            <label className="profilePage__label">Account Created</label>
                        </div>
                    </div>
                    
                    <div className="profilePage__box">
                        <i className="ri-lock-2-line profilePage__icon"></i>
                        <div className="profilePage__box-input">
                            <input 
                                type={passwordVisible ? "text" : "password"} 
                                className="profilePage__input" 
                                value={passwordVisible ? "password123" : hiddenPassword} 
                                disabled 
                                placeholder=" " 
                            />
                            <label className="profilePage__label">Password</label>
                            <i 
                                className={`${passwordVisible ? 'ri-eye-line' : 'ri-eye-off-line'} profilePage__eye`}
                                onClick={togglePasswordVisibility}
                            ></i>
                        </div>
                    </div>
                </div>
            </div>

            <div className="profilePage-actions">
                <button onClick={navigateToUpdate} className="profilePage__button profilePage-update-button">
                    Update Profile
                </button>
                <button onClick={navigateToChangePassword} className="profilePage__button profilePage-password-button">
                    Change Password
                </button>
                <button onClick={handleSignOut} className="profilePage__button profilePage-logout-button">
                    Sign Out
                </button>
            </div>
        </div>
    );
};

const ChangePasswordDialog = ({ isOpen, onClose, onSave }) => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const handleSave = () => {
        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }
        
        if (newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters");
            return;
        }
        
        onSave(newPassword);
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="profilePage-change-password-dialog">
            <div className="profilePage-change-password-content profilePage-container">
                <h2 className="profilePage__title">Change Password</h2>
                
                <div className="profilePage__box">
                    <i className="ri-lock-2-line profilePage__icon"></i>
                    <div className="profilePage__box-input">
                        <input 
                            type="password" 
                            className="profilePage__input" 
                            placeholder=" "
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <label className="profilePage__label">New Password</label>
                    </div>
                </div>
                
                <div className="profilePage__box">
                    <i className="ri-lock-2-line profilePage__icon"></i>
                    <div className="profilePage__box-input">
                        <input 
                            type="password" 
                            className="profilePage__input" 
                            placeholder=" "
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <label className="profilePage__label">Confirm Password</label>
                    </div>
                </div>
                
                {passwordError && <p className="profilePage-error-message">{passwordError}</p>}
                
                <div className="profilePage-change-password-actions">
                    <button onClick={onClose} className="profilePage__button profilePage-cancel-button">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="profilePage__button profilePage-save-button">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

const UpdateProfileDialog = ({ isOpen, onClose, onSave, profileImageProp }) => {
    const [newUsername, setNewUsername] = useState("");
    const [newEmail, setNewEmail] = useState("JohnDoe1234@example.com");
    const [selectedImage, setSelectedImage] = useState(profileImageProp);
    const [newProfileImage, setNewProfileImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const image = URL.createObjectURL(e.target.files[0]);
            setSelectedImage(image);
            setNewProfileImage(image);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        
        try {
            // Simulate API call to save profile data
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock database update
            const profileData = {
                newUsername: newUsername || undefined,
                newEmail: newEmail,
                newProfileImage
            };
            
            // Save to local storage to simulate database persistence
            if (newUsername) localStorage.setItem('username', newUsername);
            if (newEmail) localStorage.setItem('email', newEmail);
            if (newProfileImage) localStorage.setItem('profileImage', newProfileImage);
            
            onSave(profileData);
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setIsLoading(false);
            onClose();
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="profilePage-change-password-dialog">
            <div className="profilePage-change-password-content profilePage-container">
                <h2 className="profilePage__title">Update Profile</h2>
                
                <div className="profilePage-image-upload">
                    {selectedImage && (
                        <img src={selectedImage} alt="Profile Preview" className="profilePage-image-preview" />
                    )}
                    <div className="profilePage__box profilePage-image-upload-box">
                        <i className="ri-image-line profilePage__icon"></i>
                        <div className="profilePage__box-input">
                            <input 
                                type="file" 
                                id="profile-image-input"
                                onChange={handleImageChange}
                                className="profilePage-file-input"
                                accept="image/*"
                            />
                            <label htmlFor="profile-image-input" className="profilePage-file-input-label">
                                Choose Profile Picture
                            </label>
                        </div>
                    </div>
                </div>
                
                <div className="profilePage__box">
                    <i className="ri-user-3-line profilePage__icon"></i>
                    <div className="profilePage__box-input">
                        <input 
                            type="text" 
                            className="profilePage__input" 
                            placeholder=" "
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                        />
                        <label className="profilePage__label">New Username</label>
                    </div>
                </div>
                
                <div className="profilePage__box">
                    <i className="ri-mail-line profilePage__icon"></i>
                    <div className="profilePage__box-input">
                        <input 
                            type="email" 
                            className="profilePage__input" 
                            placeholder=" "
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                        />
                        <label className="profilePage__label">New Email</label>
                    </div>
                </div>
                
                <div className="profilePage-change-password-actions">
                    <button 
                        onClick={onClose} 
                        className="profilePage__button profilePage-cancel-button"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="profilePage__button profilePage-save-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProfilePage = () => {
    const [username, setUsername] = useState("JohnDoe");
    const [profileImage, setProfileImage] = useState(null);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isUpdateProfileOpen, setIsUpdateProfileOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    // Load data from localStorage on component mount (simulating database)
    useEffect(() => {
        const savedUsername = localStorage.getItem('username');
        const savedProfileImage = localStorage.getItem('profileImage');
        
        if (savedUsername) setUsername(savedUsername);
        if (savedProfileImage) setProfileImage(savedProfileImage);
    }, []);

    const handleSignOut = () => {
        // Simulate signing out
        // In a real app, you would clear auth tokens, etc.
        setTimeout(() => {
            // Redirect to main page
            window.location.href = '/';
        }, 1000);
    };

    const navigateToChangePassword = () => {
        setIsChangePasswordOpen(true);
    };

    const toggleUpdateProfile = () => {
        setIsUpdateProfileOpen(true);
    };

    const closeUpdateProfile = () => {
        setIsUpdateProfileOpen(false);
    };

    const handleUpdateProfileSave = (profileData) => {
        // Update the state with the new profile information
        if (profileData.newUsername) {
            setUsername(profileData.newUsername);
        }
        if (profileData.newProfileImage) {
            setProfileImage(profileData.newProfileImage);
        }

        // Show success message
        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => {
            setSuccessMessage("");
        }, 3000);
    };

    const handlePasswordChange = (newPassword) => {
        // In a real app, you would make an API call to update the password in the database
        localStorage.setItem('passwordUpdated', 'true');
        
        // Show success message
        setSuccessMessage("Password changed successfully!");
        setTimeout(() => {
            setSuccessMessage("");
        }, 3000);
    };

    return (
        <div className="profilePage">
           <img src={profileBackground} className="profilePage__img" alt="Background" />
            
            <div className="profilePage-content">
                {successMessage && (
                    <div className="profilePage-success-message">
                        {successMessage}
                    </div>
                )}
                
                <UserProfile
                    username={username}
                    handleSignOut={handleSignOut}
                    navigateToUpdate={toggleUpdateProfile}
                    profileImage={profileImage}
                    navigateToChangePassword={navigateToChangePassword}
                />
                
                <ChangePasswordDialog
                    isOpen={isChangePasswordOpen}
                    onClose={() => setIsChangePasswordOpen(false)}
                    onSave={handlePasswordChange}
                />
                
                <UpdateProfileDialog
                    isOpen={isUpdateProfileOpen}
                    onClose={closeUpdateProfile}
                    onSave={handleUpdateProfileSave}
                    profileImageProp={profileImage}
                />
            </div>
        </div>
    );
};

export default ProfilePage;