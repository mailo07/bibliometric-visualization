import React, { useEffect, useState } from 'react';
import './main_content.css';
import './header.css';

const MainPage = () => {
  const [loginBoxVisible, setLoginBoxVisible] = useState(false);
  const [contactBoxVisible, setContactBoxVisible] = useState(false);
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  // Research news with images from various universities
  const researchNews = [
    {
      title: 'Harvard Study Reveals New Quantum Computing Breakthrough',
      date: new Date().toLocaleDateString(),
      description: 'Researchers at Harvard have made significant progress in quantum error correction...',
      link: 'https://www.harvard.edu',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
    },
    {
      title: 'Stanford AI Research Shows Promise in Medical Diagnostics',
      date: new Date().toLocaleDateString(),
      description: 'Stanford researchers developed an AI system that can detect early signs of diseases with 95% accuracy...',
      link: 'https://news.stanford.edu',
      image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80'
    },
    {
      title: 'MIT Researchers Develop Revolutionary Battery Technology',
      date: new Date().toLocaleDateString(),
      description: 'New battery design from MIT could double electric vehicle range while reducing charging time...',
      link: 'https://news.mit.edu',
      image: 'https://images.unsplash.com/photo-1624395213043-fa2e123b2656?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
    },
    {
      title: 'Oxford Study Uncovers New Climate Change Patterns',
      date: new Date().toLocaleDateString(),
      description: 'Oxford climate scientists discover unexpected atmospheric patterns affecting global warming projections...',
      link: 'https://www.ox.ac.uk',
      image: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
    }
  ];

  const fetchLatestNews = () => {
    setLoadingNews(true);
    try {
      // Simulate API call with timeout
      setTimeout(() => {
        // Shuffle and pick 2 news items
        const shuffled = [...researchNews].sort(() => 0.5 - Math.random());
        setNews(shuffled.slice(0, 2));
        setLoadingNews(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching news:', error);
      // Fallback to first two items if error occurs
      setNews(researchNews.slice(0, 2));
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    // Initial news fetch
    fetchLatestNews();

    // Set up auto-refresh every minute (60000ms)
    const newsInterval = setInterval(fetchLatestNews, 60000);

    // Original functionality setup
    const tabs = document.querySelectorAll('.search-box .tabs button');
    const glider = document.querySelector('.search-box .tabs .glider');
    tabs.forEach((tab) => {
      tab.addEventListener('click', function () {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        glider.style.width = `${tab.offsetWidth}px`;
        glider.style.left = `${tab.offsetLeft}px`;
      });
    });

    if (tabs.length > 0) {
      tabs[0].classList.add('active');
      glider.style.width = `${tabs[0].offsetWidth}px`;
      glider.style.left = `${tabs[0].offsetLeft}px`;
    }

    const searchForm = document.querySelector('.search-box .search-bar form');
    if (searchForm) {
      searchForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const queryInput = searchForm.querySelector('input[name="query"]');
        const query = queryInput.value;
        window.location.href = `/search?query=${encodeURIComponent(query)}`;
      });
    }

    const carousel = document.querySelector('.carousel');
    if (carousel) {
      const carouselInner = carousel.querySelector('.carousel-inner');
      const prev = carousel.querySelector('#prev');
      const next = carousel.querySelector('#next');
      let index = 0;
      const items = carousel.querySelectorAll('.carousel-item');
      const totalItems = items.length;

      function updateCarousel() {
        carouselInner.style.transform = `translateX(-${index * 100}%)`;
      }

      next.addEventListener('click', function () {
        index = (index + 1) % totalItems;
        updateCarousel();
      });

      prev.addEventListener('click', function () {
        index = (index - 1 + totalItems) % totalItems;
        updateCarousel();
      });

      const autoplay = carousel.dataset.autoplay === 'true';
      const autoplayInterval = parseInt(carousel.dataset.autoplayInterval, 10);
      if (autoplay && autoplayInterval) {
        setInterval(function () {
          index = (index + 1) % totalItems;
          updateCarousel();
        }, autoplayInterval);
      }
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
      clearInterval(newsInterval);
      window.removeEventListener('scroll', reveal);
      window.removeEventListener('load', reveal);
    };
  }, []);

  const toggleLoginBox = () => {
    setLoginBoxVisible(!loginBoxVisible);
    setTimeout(() => {
      const overlay = document.querySelector('.dialog-overlay');
      if (overlay) {
        overlay.classList.toggle('active', !loginBoxVisible);
      }
    }, 10);
  };

  const toggleContactBox = () => {
    setContactBoxVisible(!contactBoxVisible);
    setTimeout(() => {
      const overlay = document.querySelector('.dialog-overlay');
      if (overlay) {
        overlay.classList.toggle('active', !contactBoxVisible);
      }
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
              <button onClick={(e) => e.preventDefault()}>Authors</button>
              <button onClick={(e) => e.preventDefault()}>Fields</button>
              <button onClick={(e) => e.preventDefault()}>Scholarly works</button>
              <div className="glider"></div>
            </div>
            <div className="search-bar">
              <form action="" method="GET">
                <input type="text" name="query" placeholder="Search by Keyword or Certain Field" />
                <button type="submit">Search</button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {loginBoxVisible && (
        <div className={`dialog-overlay ${loginBoxVisible ? 'active' : ''}`} onClick={toggleLoginBox}>
          <div className="signup-dialog" onClick={(e) => e.stopPropagation()}>
            <button onClick={toggleLoginBox} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#f5f5f5', cursor: 'pointer' }}> 
              <i className="fas fa-times"></i>
            </button>
            <h1>Log-in to Biblioknow</h1>
            <form>
              <label>Email address or Username</label>
              <input type="text" />
              <label>Password</label>
              <input type="password" />
              <button type="submit">Log in</button>
            </form>
            <p style={{ marginTop: '15px', textAlign: 'center' }}>
              Don't have an account? <a href="/register-login?show=register" style={{ color: '#26d0ce' }} onClick={handleRegisterClick}>Register here</a>
            </p>
          </div>
        </div>
      )}

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
        <div className="left-column">
          <div className="carousel collaboration-carousel-slide temp-grid-8 item collaboration-carousel-slide--addPadding"
            data-autoplay="true" data-autoplay-interval="5000" data-autoplay-hover-pause="true">
            <div className="carousel-inner">
              <div className="carousel-item">
                <div className="container">
                  <div className="left-section">
                    <h2>What Others Say</h2>
                    <div className="testimonial">"I us."</div>
                    <div className="author">
                      <img alt="Portrait of Dr. Giulio Barth" height="50" src="" />
                      <div className="author-info">Dr. Giulio Barth <span>McKinsey &amp; Company, Inc</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="carousel-item">
                <div className="container">
                  <div className="left-section">
                    <h2>What Others Say</h2>
                    <div className="testimonial">
                      "BiblioKnow has helped our research team immensely. The detailed patent data and tools provided are simply unparalleled."
                    </div>
                    <div className="author">
                      <img alt="Portrait of Dr. Jane Doe" height="50" src="https://via.placeholder.com/50" />
                      <div className="author-info">Dr. Jane Doe <span>Harvard University</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="carousel-controls">
              <i className="fas fa-chevron-left" id="prev"></i>
              <i className="fas fa-chevron-right" id="next"></i>
            </div>
          </div>
        </div>
        <div className="right-column">
          <h2>Latest Research News</h2>
          {loadingNews ? (
            <div className="news-card">
              <div className="news-content">
                <p>Loading the latest research updates...</p>
              </div>
            </div>
          ) : (
            news.map((item, index) => (
              <div className="news-card" key={index}>
                <img 
                  alt={item.title} 
                  src={item.image} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
                  }}
                />
                <div className="news-content">
                  <h4><a href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</a></h4>
                  <p>{item.date}</p>
                  <p>{item.description}</p>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="read-more">
                    Read Full Research
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
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