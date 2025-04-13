import React, { useState, useEffect } from 'react';
import './RegisterLoginPage.css';
import { FaUser, FaLock, FaEnvelope, FaHome } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

// API base URL - change this to match your Flask server
const API_BASE_URL = 'http://localhost:5000';

const RegisterLoginPage = () => {
    const [isActive, setIsActive] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    
    // Form state management
    const [loginData, setLoginData] = useState({
        username: '',
        password: ''
    });
    
    const [registerData, setRegisterData] = useState({
        username: '',
        email: '',
        password: '',
        bio: '',
        profile_image: ''
    });
    
    // Error state management
    const [loginError, setLoginError] = useState('');
    const [registerError, setRegisterError] = useState('');
    const [registerSuccess, setRegisterSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check URL query parameters to determine which form to show
        const searchParams = new URLSearchParams(location.search);
        const showForm = searchParams.get('show');
        
        if (showForm === 'register') {
            setIsActive(true);
        } else if (showForm === 'login') {
            setIsActive(false);
        }
    }, [location.search]);

    const handleRegisterClick = () => {
        setIsActive(true);
        window.history.pushState({}, '', '/registerlogin?show=register');
    };

    const handleLoginClick = () => {
        setIsActive(false);
        window.history.pushState({}, '', '/registerlogin?show=login');
    };
    
    const handleHomeClick = () => {
        navigate('/');
    };
    
    const handleLoginChange = (e) => {
        const { name, value } = e.target;
        setLoginData({
            ...loginData,
            [name]: value
        });
    };
    
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        setIsLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, loginData);
            
            if (response.data.user && response.data.user.token) {
                // Store user data including token
                const userData = {
                    id: response.data.user.id,
                    username: response.data.user.username,
                    email: response.data.user.email,
                    bio: response.data.user.bio || '',
                    profile_image: response.data.user.profile_image || '',
                    token: response.data.user.token
                };

                localStorage.setItem('token', response.data.user.token);
                localStorage.setItem('user', JSON.stringify(userData));
                
                navigate('/profile');
            } else {
                throw new Error('Invalid response structure');
            }
        } catch (error) {
            console.error('Login error:', error);
            setLoginError(
                error.response?.data?.message || 
                error.message || 
                'Login failed. Please check your credentials and try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRegisterChange = (e) => {
        const { name, value } = e.target;
        setRegisterData({
            ...registerData,
            [name]: value
        });
    };
    
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setRegisterError('');
        setRegisterSuccess('');
        setIsLoading(true);
        
        try {
            // Validate input
            if (!registerData.username || !registerData.email || !registerData.password) {
                setRegisterError('All fields are required');
                setIsLoading(false);
                return;
            }
            
            if (registerData.password.length < 8) {
                setRegisterError('Password must be at least 8 characters long');
                setIsLoading(false);
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(registerData.email)) {
                setRegisterError('Please enter a valid email address');
                setIsLoading(false);
                return;
            }
            
            const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
                username: registerData.username,
                email: registerData.email,
                password: registerData.password,
                bio: registerData.bio || '',
                profile_image: registerData.profile_image || ''
            });
            
            setRegisterSuccess('Registration successful! You can now log in.');
            
            // Clear form
            setRegisterData({
                username: '',
                email: '',
                password: '',
                bio: '',
                profile_image: ''
            });
            
            // Switch to login form after successful registration
            setTimeout(() => {
                handleLoginClick();
            }, 2000);
            
        } catch (error) {
            console.error('Registration error:', error);
            
            if (error.response) {
                setRegisterError(error.response.data?.message || 'Registration failed. Please try again.');
                
                if (error.response.status === 409) {
                    setRegisterError('Username or email already exists. Please try another one.');
                }
            } else if (error.request) {
                setRegisterError('No response from server. Please check your connection.');
            } else {
                setRegisterError('Registration failed. Please try again later.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-page-wrapper">
            <div className={`container ${isActive ? 'active' : ''}`}>
                <div className="form-box login">
                    <form onSubmit={handleLoginSubmit}>
                        <h1>Login to Biblioknow</h1>
                        {loginError && <div className="error-message">{loginError}</div>}
                        <div className="input-box">
                            <input 
                                type="text" 
                                name="username"
                                placeholder="Username" 
                                value={loginData.username}
                                onChange={handleLoginChange}
                                required 
                            />
                            <i><FaUser /></i>
                        </div>
                        <div className="input-box">
                            <input 
                                type="password" 
                                name="password"
                                placeholder="Password" 
                                value={loginData.password}
                                onChange={handleLoginChange}
                                required 
                            />
                            <i><FaLock /></i>
                        </div>
                        <div className="forgot-link">
                            <a href="/forgot-password">Forgot Password?</a>
                        </div>
                        <button type="submit" className="btn" disabled={isLoading}>
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                        <div className="home-button-container">
                            <button type="button" className="home-btn" onClick={handleHomeClick}>
                                <FaHome />
                            </button>
                        </div>
                    </form>
                </div>

                <div className="form-box register">
                    <form onSubmit={handleRegisterSubmit}>
                        <h1>Register with Biblioknow</h1>
                        {registerError && <div className="error-message">{registerError}</div>}
                        {registerSuccess && <div className="success-message">{registerSuccess}</div>}
                        <div className="input-box">
                            <input 
                                type="text" 
                                name="username"
                                placeholder="Username" 
                                value={registerData.username}
                                onChange={handleRegisterChange}
                                required 
                            />
                            <i><FaUser /></i>
                        </div>
                        <div className="input-box">
                            <input 
                                type="email" 
                                name="email"
                                placeholder="Email" 
                                value={registerData.email}
                                onChange={handleRegisterChange}
                                required 
                            />
                            <i><FaEnvelope /></i>
                        </div>
                        <div className="input-box">
                            <input 
                                type="password" 
                                name="password"
                                placeholder="Password" 
                                value={registerData.password}
                                onChange={handleRegisterChange}
                                required 
                            />
                            <i><FaLock /></i>
                        </div>
                        <div className="input-box">
                            <input 
                                type="text" 
                                name="bio"
                                placeholder="Short bio (optional)" 
                                value={registerData.bio}
                                onChange={handleRegisterChange}
                            />
                            <i><FaUser /></i>
                        </div>
                        <button type="submit" className="btn" disabled={isLoading}>
                            {isLoading ? 'Registering...' : 'Register'}
                        </button>
                        <div className="home-button-container">
                            <button type="button" className="home-btn" onClick={handleHomeClick}>
                                <FaHome />
                            </button>
                        </div>
                    </form>
                </div>

                <div className="toggle-box">
                    <div className="toggle-panel toggle-left">
                        <h1>Hello, Welcome!</h1>
                        <p>Don't have an account?</p>
                        <button className="btn register-btn" onClick={handleRegisterClick}>Register</button>
                    </div>

                    <div className="toggle-panel toggle-right">
                        <h1>Welcome Back!</h1>
                        <p>Already have an account?</p>
                        <button className="btn login-btn" onClick={handleLoginClick}>Login</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterLoginPage;