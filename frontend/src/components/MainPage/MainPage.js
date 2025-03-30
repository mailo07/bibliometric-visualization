import React, { useEffect, useState } from 'react';
import './main_content.css';
import './header.css';
import LeftColumn from './bibliometricVideos';
import RightColumn from './rightcolumn';

const MainPage = () => {
  const [contactBoxVisible, setContactBoxVisible] = useState(false);
  const [searchType, setSearchType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const toggleContactBox = () => {
    setContactBoxVisible(!contactBoxVisible);
    setTimeout(() => {
      const overlay = document.querySelector('.dialog-overlay');
      if (overlay) overlay.classList.toggle('active', !contactBoxVisible);
    }, 10);
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    window.location.href = '/registerlogin?show=login';
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    window.location.href = '/registerlogin?show=register';
  };

  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    const tabs = document.querySelectorAll('.search-box .tabs button');
    const glider = document.querySelector('.search-box .tabs .glider');
    tabs.forEach((tab) => tab.classList.remove('active'));
    const activeTab = Array.from(tabs).find(tab => {
      const tabText = tab.textContent.toLowerCase();
      return tabText.includes(type);
    });
    if (activeTab) {
      activeTab.classList.add('active');
      glider.style.width = `${activeTab.offsetWidth}px`;
      glider.style.left = `${activeTab.offsetLeft}px`;
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      let endpoint = '/search';
      if (searchType === 'authors') endpoint = '/search/authors';
      else if (searchType === 'fields') endpoint = '/search/fields';
      else if (searchType === 'works') endpoint = '/search/works';
      
      window.location.href = `/search?query=${encodeURIComponent(searchQuery)}&type=${searchType}`;
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const tabs = document.querySelectorAll('.search-box .tabs button');
    const glider = document.querySelector('.search-box .tabs .glider');
    tabs.forEach((tab) => {
      tab.addEventListener('click', function() {
        const tabText = tab.textContent.toLowerCase();
        let type = 'all';
        if (tabText.includes('authors')) type = 'authors';
        else if (tabText.includes('fields')) type = 'fields';
        else if (tabText.includes('works')) type = 'works';
        handleSearchTypeChange(type);
      });
    });

    if (tabs.length > 0) {
      tabs[0].classList.add('active');
      glider.style.width = `${tabs[0].offsetWidth}px`;
      glider.style.left = `${tabs[0].offsetLeft}px`;
    }

    function reveal() {
      const reveals = document.querySelectorAll('.reveal');
      for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        if (elementTop < windowHeight - 100) {
          reveals[i].classList.add('active');
        }
      }
    }

    window.addEventListener('scroll', reveal);
    window.addEventListener('load', reveal);

    return () => {
      window.removeEventListener('scroll', reveal);
      window.removeEventListener('load', reveal);
    };
  }, []);

  return (
    <div className="MainPage">
      <header className="header">
        <nav className="nav">
          <div className="header-buttons">
            <a href="/about" className="about-button">
              <i className="fas fa-info-circle"></i> About
            </a>
            <a href="/register-login?show=register" className="register-button" onClick={handleRegisterClick}>
              <i className="fas fa-user"></i> Register
            </a>
            <button className="login-button" onClick={handleLoginClick}>
              <i className="fas fa-sign-in-alt"></i> Login
            </button>
            <button className="contact-button" onClick={toggleContactBox}>
              <i className="fas fa-envelope"></i> Contact
            </button>
          </div>
        </nav>
        <div className="header-content">
          <h1>BIBLIOKNOW</h1>
          <p>Serves all scholarly work in the world as a free, open and secure digital public good, with user privacy a paramount focus.</p>
          <div className="search-box">
            <h2>Fostering Global Connections</h2>
            <h3>Start Your Search Here</h3>
            <div className="tabs">
              <button onClick={(e) => { e.preventDefault(); handleSearchTypeChange('authors'); }}>
                Authors
              </button>
              <button onClick={(e) => { e.preventDefault(); handleSearchTypeChange('fields'); }}>
                Fields
              </button>
              <button onClick={(e) => { e.preventDefault(); handleSearchTypeChange('works'); }}>
                Scholarly works
              </button>
              <div className="glider"></div>
            </div>
            <div className="search-bar">
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  name="query"
                  placeholder="Search by Keyword or Certain Field"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" disabled={searchLoading}>
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {contactBoxVisible && (
        <div className={`dialog-overlay ${contactBoxVisible ? 'active' : ''}`} onClick={toggleContactBox}>
          <div className="signup-dialog" onClick={(e) => e.stopPropagation()}>
            <button onClick={toggleContactBox} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#f5f5f5', cursor: 'pointer' }}>
              <i className="fas fa-times"></i>
            </button>
            <h2>Contact Information</h2>
            <p>
              For inquiries and support, please contact the admin at:{' '}
              <a href="mailto:Biblioknow00@outlook.com" style={{ color: '#26d0ce' }}>BiblioKnow00@outlook.com</a>
              <br />
              You can also reach us at (+91) 123467890.
            </p>
            <p>For more information, visit our educational project page.</p>
          </div>
        </div>
      )}

      <section className="py-12 text-center reveal">
        <h1 className="text-2xl md:text-3xl font-bold">OUR PRIMARY FOCUS AND OBJECTIVES</h1>
        <p className="text-lg mt-2">
          To provide a platform for researchers, scholars, and academics to
          connect, collaborate, <br /> and exchange knowledge. We aim to foster a collaborative environment
          where researchers can share their findings, discover new insights, <br /> and contribute to the advancement of knowledge.
        </p>
      </section>

      <section className="py-12 text-center reveal">
        <h1 className="text-2xl md:text-3xl font-bold">Discover, Analyse, and Map Global Innovation Knowledge</h1>
        <p className="text-lg mt-2">Connecting Worlds &amp; Building Cultural Bridges</p>
      </section>

      <div className="container reveal">
        <LeftColumn />
        <RightColumn />
      </div>

      <div className="footer">
        <div className="footer-title">&copy; 2025 Biblioknow</div>
        <div className="footer-subtitle">Please Note: This is just an Educational Project. Not intended for real use</div>
        <div className="footer-content">
          <div className="footer-section">
            <h3>Location</h3>
            <p>India<br />Meghalaya, 793017</p>
          </div>
          <div className="footer-section">
            <h3>Contact</h3>
            <p>
              <a href="mailto:Biblioknow00@outlook.com">BiblioKnow00@outlook.com</a>
              <br />(+91) 123467890
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;