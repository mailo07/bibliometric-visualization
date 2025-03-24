import React from 'react';
import './ErrorPage.css';
import { Link } from 'react-router-dom';

const ErrorPage = () => {
  const handleRedirectHome = () => {
    window.location.href = '/'; // Redirects to the home page
  };

  return (
    <div className="error-page-container">
      <div className="error-content">
        <h1 className="error-title">Oops! Page Not Found</h1>
        <img src="https://miro.medium.com/v2/resize:fit:1100/format:webp/1*467VzftfWmcP9Se9pUW7_A.gif" alt="404 Error" className="error-gif"/>
        <button className="home-button" onClick={handleRedirectHome}> <Link to="/" className="home-button">Go Home</Link></button>
       </div>
    </div>
  );
};

export default ErrorPage;

