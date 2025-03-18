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
        <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 shadow-md w-full max-w-2xl mx-auto mt-16">
            <div className="flex items-center mb-6">
                {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-24 h-24 rounded-full object-cover mr-4" />
                ) : (
                    <i className="fas fa-user-circle text-6xl text-gray-600 mr-4"></i>
                )}
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{username}</h1>
                    <p className="text-gray-600">JohnDoe1234@example.com</p>
                </div>
            </div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Profile Information</h2>
                <div className="flex flex-col space-y-4">
                    <div className="flex justify-between">
                        <span className="font-bold text-gray-700">Username:</span>
                        <span className="text-gray-600">{username}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold text-gray-700">Email:</span>
                        <span className="text-gray-600">JohnDoe1234@example.com</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold text-gray-700">Account Created:</span>
                        <span className="text-gray-600">2025-03-04 10:13:17</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-700">Password:</span>
                        <div className="flex items-center">
                            <span className="text-gray-600 cursor-pointer" onClick={togglePasswordVisibility}>
                                {passwordVisible ? "Show password" : hiddenPassword}
                            </span>
                            <button
                                onClick={navigateToChangePassword}
                                className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                style={{ fontSize: "1.2em" }}
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between mt-8">
                <button
                    onClick={navigateToUpdate}
                    className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800 transition-colors"
                >
                    Update Profile
                </button>
                <button
                    onClick={handleSignOut}
                    className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800 transition-colors"
                >
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
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            Change Password
                        </h3>
                        <div className="mt-2">
                            <input
                                type="password"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={handleSave}
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
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
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            Update Profile
                        </h3>
                        <div className="mt-2">
                            <div className="mb-4">
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="new-profile-picture">
                                    Change Profile Picture
                                </label>
                                <input type="file" id="new-profile-picture" onChange={handleImageChange} />
                                {selectedImage && <img src={selectedImage} alt="Profile Preview" className="mt-2 w-24 h-24 rounded-full object-cover" />}
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="new-username">New Username</label>
                                <input
                                    type="text"
                                    id="new-username"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="new-email">New Email</label>
                                <input
                                    type="email"
                                    id="new-email"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={handleSave}
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
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
        <div className="font-sans min-h-screen flex flex-col" style={{
            backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1502700807168-484a3e7889d0?q=80&w=2074&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}>
            <header className="bg-gray-800 bg-opacity-80 text-white p-6 flex justify-between items-center">
                <Link to="/" className="flex items-center">
                    <i className="fas fa-home text-xl"></i>
                    <span className="ml-2">Home</span>
                </Link>
            </header>
            <div className="flex-grow">
                <UserProfile
                    username={username}
                    handleSignOut={handleSignOut}
                    navigateToUpdate={toggleUpdateProfile}
                    profileImage={profileImage}
                    navigateToChangePassword={navigateToChangePassword}
                />
            </div>
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
            <footer className="bg-black text-white text-center py-10 mt-auto">
                <p className="text-gray-500 text-sm">This website is a just an educational project and is not meant for intended use. User discretion is advised.</p>
            </footer>
        </div>
    );
};

export default ProfilePage;