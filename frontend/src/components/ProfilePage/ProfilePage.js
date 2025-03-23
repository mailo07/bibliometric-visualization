import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ProfilePage.css';

const UserProfile = ({ username, handleSignOut, navigateToChangePassword, navigateToUpdate, profileImage }) => {
    const [passwordVisible, setPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const hiddenPassword = "•".repeat(10);

    return (
        <div className="container">
            <h1 className="login__title">User Profile</h1>
            
            <div className="profile-header">
                {profileImage ? (
                    <img src={profileImage} alt="Profile" className="profile-image" />
                ) : (
                    <i className="ri-user-3-line profile-image-icon"></i>
                )}
                <div>
                    <h2 className="profile-username">{username}</h2>
                    <p className="profile-email">JohnDoe1234@example.com</p>
                </div>
            </div>

            <div className="login__content">
                <div className="profile-info-section">
                    <h3 className="profile-info-title">Profile Information</h3>
                    
                    <div className="login__box">
                        <i className="ri-user-3-line login__icon"></i>
                        <div className="login__box-input">
                            <input type="text" className="login__input" value={username} disabled placeholder=" " />
                            <label className="login__label">Username</label>
                        </div>
                    </div>
                    
                    <div className="login__box">
                        <i className="ri-mail-line login__icon"></i>
                        <div className="login__box-input">
                            <input type="email" className="login__input" value="JohnDoe1234@example.com" disabled placeholder=" " />
                            <label className="login__label">Email</label>
                        </div>
                    </div>
                    
                    <div className="login__box">
                        <i className="ri-calendar-line login__icon"></i>
                        <div className="login__box-input">
                            <input type="text" className="login__input" value="2025-03-04 10:13:17" disabled placeholder=" " />
                            <label className="login__label">Account Created</label>
                        </div>
                    </div>
                    
                    <div className="login__box">
                        <i className="ri-lock-2-line login__icon"></i>
                        <div className="login__box-input">
                            <input 
                                type={passwordVisible ? "text" : "password"} 
                                className="login__input" 
                                value={passwordVisible ? "password123" : hiddenPassword} 
                                disabled 
                                placeholder=" " 
                            />
                            <label className="login__label">Password</label>
                            <i 
                                className={`${passwordVisible ? 'ri-eye-line' : 'ri-eye-off-line'} login__eye`}
                                onClick={togglePasswordVisibility}
                            ></i>
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-actions">
                <button onClick={navigateToUpdate} className="login__button update-button">
                    Update Profile
                </button>
                <button onClick={navigateToChangePassword} className="login__button password-button">
                    Change Password
                </button>
                <button onClick={handleSignOut} className="login__button logout-button">
                    Sign Out
                </button>
            </div>
        </div>
    );
};

const ChangePasswordDialog = ({ isOpen, onClose, onSave }) => {
    const [newPassword, setNewPassword] = useState("");

    const handleSave = () => {
        onSave(newPassword);
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="change-password-dialog">
            <div className="change-password-content container">
                <h2 className="login__title">Change Password</h2>
                
                <div className="login__box">
                    <i className="ri-lock-2-line login__icon"></i>
                    <div className="login__box-input">
                        <input 
                            type="password" 
                            className="login__input" 
                            placeholder=" "
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <label className="login__label">New Password</label>
                    </div>
                </div>
                
                <div className="change-password-actions">
                    <button onClick={onClose} className="login__button cancel-button">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="login__button save-button">
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

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const image = URL.createObjectURL(e.target.files[0]);
            setSelectedImage(image);
            setNewProfileImage(image);
        }
    };

    const handleSave = () => {
        onSave({
            newUsername,
            newEmail,
            newProfileImage
        });
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="change-password-dialog">
            <div className="change-password-content container">
                <h2 className="login__title">Update Profile</h2>
                
                <div className="profile-image-upload">
                    {selectedImage && (
                        <img src={selectedImage} alt="Profile Preview" className="profile-image-preview" />
                    )}
                    <div className="login__box image-upload-box">
                        <i className="ri-image-line login__icon"></i>
                        <div className="login__box-input">
                            <input 
                                type="file" 
                                id="profile-image-input"
                                onChange={handleImageChange}
                                className="file-input"
                            />
                            <label htmlFor="profile-image-input" className="file-input-label">
                                Choose Profile Picture
                            </label>
                        </div>
                    </div>
                </div>
                
                <div className="login__box">
                    <i className="ri-user-3-line login__icon"></i>
                    <div className="login__box-input">
                        <input 
                            type="text" 
                            className="login__input" 
                            placeholder=" "
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                        />
                        <label className="login__label">New Username</label>
                    </div>
                </div>
                
                <div className="login__box">
                    <i className="ri-mail-line login__icon"></i>
                    <div className="login__box-input">
                        <input 
                            type="email" 
                            className="login__input" 
                            placeholder=" "
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                        />
                        <label className="login__label">New Email</label>
                    </div>
                </div>
                
                <div className="change-password-actions">
                    <button onClick={onClose} className="login__button cancel-button">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="login__button save-button">
                        Save
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

    const handleSignOut = () => {
        alert("Signing out. Since I cannot persist data, this is just a demo.");
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

        alert("Profile updated successfully!");
    };

    return (
        <div className="login">
            <img 
                src="https://images.unsplash.com/photo-1502700807168-484a3e7889d0?q=80&w=2074&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                className="login__img" 
                alt="Background" 
            />
            
            <div className="page-content">
                <header className="page-header">
                    <Link to="/" className="home-link">
                        <i className="ri-home-line"></i>
                        <span>Home</span>
                    </Link>
                </header>
                
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
                    onSave={(newPassword) => {
                        alert("Password changed successfully! (Not really, though.)");
                    }}
                />
                
                <UpdateProfileDialog
                    isOpen={isUpdateProfileOpen}
                    onClose={closeUpdateProfile}
                    onSave={handleUpdateProfileSave}
                    profileImageProp={profileImage}
                />
                
                <footer className="page-footer">
                    <p>This website is just an educational project and is not meant for intended use. User discretion is advised.</p>
                </footer>
            </div>
        </div>
    );
};

export default ProfilePage;