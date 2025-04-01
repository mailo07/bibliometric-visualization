import React, { useState, useEffect } from 'react';
import './RegisterLoginPage.css';
import { FaUser, FaLock, FaEnvelope, FaHome } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
        profile_image: '' // Default empty, could add file upload later
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
        // Update URL without reloading
        window.history.pushState({}, '', '/registerlogin?show=register');
    };

    const handleLoginClick = () => {
        setIsActive(false);
        // Update URL without reloading
        window.history.pushState({}, '', '/registerlogin?show=login');
    };
    
    const handleHomeClick = () => {
        navigate('/');
    };
    
    // Login form handlers
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
            const response = await axios.post('/api/auth/login', loginData);
            
            // Log successful login attempt (on server-side)
            console.log('User logged in:', loginData.username);
            
            // Store JWT token in localStorage
            localStorage.setItem('token', response.data.token);
            
            // Also store basic user info (non-sensitive)
            localStorage.setItem('user', JSON.stringify({
                id: response.data.user.id,
                username: response.data.user.username,
                email: response.data.user.email
            }));
            
            // Redirect to dashboard or home page
            navigate('/dashboard');
        } catch (error) {
            // Log failed login attempt (securely on server, but basic logging here)
            console.error('Login failed:', error.response?.data?.message || error.message);
            
            setLoginError(error.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Register form handlers
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
            
            // Make API call to backend registration endpoint
            const response = await axios.post('/api/auth/register', {
                username: registerData.username,
                email: registerData.email,
                password: registerData.password,
                bio: registerData.bio || '',
                profile_image: registerData.profile_image || ''
            });
            
            console.log('Registration successful:', response.data);
            
            setRegisterSuccess('Registration successful! You can now log in.');
            
            // Clear form
            setRegisterData({
                username: '',
                email: '',
                password: '',
                bio: '',
                profile_image: ''
            });
            
            // Automatically switch to login form after successful registration
            setTimeout(() => {
                handleLoginClick();
            }, 2000);
            
        } catch (error) {
            console.error('Registration error:', error.response?.data?.message || error.message);
            setRegisterError(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-page-wrapper">
            <div className={`container ${isActive ? 'active' : ''}`}>
                <div className="form-box login">
                    <form action="#" onSubmit={handleLoginSubmit}>
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
                    <form action="#" onSubmit={handleRegisterSubmit}>
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