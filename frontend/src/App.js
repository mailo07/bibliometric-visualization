// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import MainPage from './components/MainPage/MainPage';
import AboutPage from './components/AboutPage/AboutPage';
import ErrorPage from './components/ErrorPage/ErrorPage';
import ProfileHomePage from './components/ProfilePage/ProfileHomePage';
import RegisterLoginPage from './components/RegisterLoginPage/RegisterLoginPage';
import SearchPage from './components/SearchPage/SearchPage';
import AdminHomePage from './components/AdminPage/AdminHomePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/profile" element={<ProfileHomePage />} />
        <Route path="/registerlogin" element={<RegisterLoginPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="*" element={<ErrorPage />} />
        <Route path="/admin/*" element={<AdminHomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
