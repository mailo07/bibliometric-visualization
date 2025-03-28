// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import MainPage from './components/MainPage/MainPage';
import AboutPage from './components/AboutPage/AboutPage';
import ErrorPage from './components/ErrorPage/ErrorPage';
import ProfilePage from './components/ProfilePage/ProfilePage';
import RegisterLoginPage from './components/RegisterLoginPage/RegisterLoginPage';
import SearchPage from './components/SearchPage/SearchPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/registerlogin" element={<RegisterLoginPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Router>
  );
}

export default App;
