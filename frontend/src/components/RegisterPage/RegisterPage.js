import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [terms, setTerms] = useState(false);
    const [showSignInDialog, setShowSignInDialog] = useState(false);
    const navigate = useNavigate();

    const handleRegisterClick = () => {
        alert("Registration would occur here, and data would be saved to a database. Since I can't do that, this is just a placeholder.  You would then be redirected to the home page.");
    };

    const handleAboutClick = () => {
        navigate('/about'); // Use navigate to go to the about page
    };

    const handleHomeClick = () => {
        navigate('/'); // Use navigate to go to the home page
    };

    const handleSignInClick = () => {
        setShowSignInDialog(true);
    };

    const handleCloseSignInDialog = () => {
        setShowSignInDialog(false);
    };

    const handleTermsClick = () => {
        alert("Terms and conditions would be displayed here.");
    };

    return (
        <div>
            <header className="bg-gray-800 bg-opacity-80 text-white p-6 flex justify-between items-center">
                <button className="flex items-center" onClick={handleHomeClick}>
                    <i className="fas fa-home text-xl"></i>
                    <span className="ml-2">Home</span>
                </button>
                <div className="flex items-center">
                    <button className="flex items-center" onClick={handleAboutClick}>
                        <span className="mr-2">About</span>
                        <i className="fas fa-info-circle text-xl"></i>
                    </button>
                </div>
            </header>
            <div className="flex justify-center mt-10">
                <div className="w-full max-w-4xl bg-white p-8 rounded shadow-md">
                    <h1 className="text-2xl font-bold mb-4">Register</h1>
                    <p className="mb-6 text-gray-700">
                        Your personal details are secure. We don't share or sell any knowledge of your use of The Lens. We don't keep track of what you do or use your email address (unless you ask us to) via your privacy settings.
                    </p>
                    <form>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="email">
                                Enter your Email
                                <span className="text-red-500">*</span>
                                <span className="text-gray-500 text-sm">(for non-commercial use, You must use your email affiliated with your non-profit or public-good institution)</span>
                            </label>
                            <div className="relative">
                                <input
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <i className="fas fa-envelope absolute right-3 top-3 text-gray-400"></i>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="username">
                                Choose your desired Username
                                <span className="text-red-500">*</span>
                                <span className="text-gray-500 text-sm">(please use only letters, numbers and underscores)</span>
                            </label>
                            <div className="relative">
                                <input
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                <i className="fas fa-user absolute right-3 top-3 text-gray-400"></i>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="password">
                                Create a password
                                <span className="text-red-500">*</span>
                                <i className="fas fa-info-circle text-gray-400"></i>
                            </label>
                            <div className="relative">
                                <input
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <i className="fas fa-lock absolute right-3 top-3 text-gray-400"></i>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="confirm-password">
                                Repeat your password
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <i className="fas fa-lock absolute right-3 top-3 text-gray-400"></i>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2">
                                Verifying you are a valid user
                            </label>
                            <div className="flex items-center">
                                <input
                                    className="mr-2 leading-tight"
                                    type="checkbox"
                                    id="terms"
                                    checked={terms}
                                    onChange={(e) => setTerms(e.target.checked)}
                                />
                                <button
                                    className="text-gray-500 terms-link"
                                    onClick={handleTermsClick}
                                >
                                    terms and conditions
                                </button>
                                <label className="text-gray-700" htmlFor="terms">
                                    Do you agree to the
                                    of using our services?
                                </label>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <button
                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                type="button"
                                onClick={handleRegisterClick}
                            >
                                Register
                            </button>
                        </div>
                    </form>
                </div>
                <div className="ml-8">
                    <SignInBox onSignInClick={handleSignInClick} />
                </div>
            </div>
            <footer className="bg-black text-white text-center py-10 mt-20">
                <p className="text-gray-500 text-sm">
                    This website is a just an educational project and is not meant for intended use. User discretion is advised.
                </p>
            </footer>
            {showSignInDialog && (
                <SignInDialog onClose={handleCloseSignInDialog} />
            )}
        </div>
    );
};

const SignInBox = ({ onSignInClick }) => {
    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-md w-full max-w-sm">
            <div className="bg-gray-200 text-gray-800 p-2 rounded-t-lg font-semibold">
                Already Registered?
            </div>
            <button
                className="w-full mt-4 py-2 border border-gray-400 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center"
                onClick={onSignInClick}
            >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Sign in
            </button>
            <p className="text-sm text-gray-600 mt-4">
                <span className="text-yellow-600 mr-1">⚠</span>
                Advice: It's a good practice to check up on your account settings from time to time, manage passwords, avatars, and privacy settings, etc., and unlock new coming features.
            </p>
        </div>
    );
};

const SignInDialog = ({ onClose }) => {
    return (
        <div className="dialog-overlay">
            <div className="signup-dialog">
                <button onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px' }}>X</button>
                <h2>Sign in</h2>
                <form>
                    <label>Email address or Username</label>
                    <input type="text" />
                    <label>Password</label>
                    <input type="password" />
                    <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">Sign in</button>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;