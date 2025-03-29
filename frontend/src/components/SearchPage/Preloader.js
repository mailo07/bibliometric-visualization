// src/components/SearchPage/Preloader.js
import React from 'react';
import './SearchPage.css';

const Preloader = () => {
  return (
    <div className="preloader">
      <div className="spinner"></div>
      <p className="text-gray-600">Loading results...</p>
    </div>
  );
};

export default Preloader;