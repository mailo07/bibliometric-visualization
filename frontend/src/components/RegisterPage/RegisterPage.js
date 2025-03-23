import React, { useState } from 'react';
import './RegisterPage.css';
import { FaUser, FaLock, FaEnvelope } from 'react-icons/fa';

    const RegisterPage = () => {
    const [isActive, setIsActive] = useState(false);

    const handleRegisterClick = () => {
    setIsActive(true);
    };

    const handleLoginClick = () => {
    setIsActive(false);
    };

    return (
    <div className="register-page-wrapper">
        <div className={`container ${isActive ? 'active' : ''}`}>
        <div className="form-box login">
            <form action="#">
            <h1>Login to Biblioknow</h1>
            <div className="input-box">
                <input type="text" placeholder="Username" required />
                <i><FaUser /></i>
            </div>
            <div className="input-box">
                <input type="password" placeholder="Password" required />
                <i><FaLock /></i>
            </div>
            <div className="forgot-link">
            <a href="/forgot-password">Forgot Password?</a>
            </div>
            <button type="submit" className="btn">Login</button>
        </form>
        </div>

        <div className="form-box register">
            <form action="#">
            <h1>Register with Biblioknow</h1>
            <div className="input-box">
                <input type="text" placeholder="Username" required />
                <i><FaUser /></i>
            </div>
            <div className="input-box">
                <input type="email" placeholder="Email" required />
                <i><FaEnvelope /></i>
            </div>
            <div className="input-box">
                <input type="password" placeholder="Password" required />
                <i><FaLock /></i>
            </div>
            <button type="submit" className="btn">Register</button>
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

export default RegisterPage;