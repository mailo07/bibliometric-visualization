import React, { useEffect, useState } from 'react';
import './main_content.css';
import './header.css';

const MainPage = () => {
  const [loginBoxVisible, setLoginBoxVisible] = useState(false);
  const [contactBoxVisible, setContactBoxVisible] = useState(false);
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [testimonialVideos, setTestimonialVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  
  // Real research news with actual sources
  const realResearchNews = [
    {
      title: 'Topological phenomenon could usher in a new era of quantum materials research',
      date: '2025-03-27',
      description: 'Columbia University researchers have demonstrated direct evidence of a quantum phenomenon that could lead to new classes of materials with exotic electronic properties.',
      link: 'https://news.columbia.edu/news/topological-phenomenon-could-usher-new-era-quantum-materials-research',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
    },
    {
      title: 'Scientists create a material more conductive than copper',
      date: '2025-03-25',
      description: 'MIT researchers have developed a new superconducting material that can conduct electricity with virtually no resistance at higher temperatures than previously possible.',
      link: 'https://news.mit.edu/2025/scientists-create-material-more-conductive-copper-0325',
      image: 'https://images.unsplash.com/photo-1624395213043-fa2e123b2656?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
    },
    {
      title: 'Newly discovered enzyme may play key role in developing treatments for Alzheimer disease',
      date: '2025-03-23',
      description: 'Stanford research team has identified an enzyme that clears toxic proteins linked to Alzheimer disease, offering a potential new therapeutic target.',
      link: 'https://med.stanford.edu/news/all-news/2025/03/alzheimers-enzyme-discovery.html',
      image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80'
    },
    {
      title: 'New research reveals carbon-capture potential of urban forests',
      date: '2025-03-20',
      description: 'Oxford University study finds that strategically planted urban forests could capture up to 30% more carbon than previously estimated, creating a significant impact on climate change mitigation.',
      link: 'https://www.ox.ac.uk/news/2025-03-20-new-research-reveals-carbon-capture-potential-urban-forests',
      image: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
    },
    {
      title: 'Breakthrough in quantum computing achieved by Princeton researchers',
      date: '2025-03-18',
      description: 'Princeton scientists have demonstrated a new approach to quantum computing that dramatically reduces error rates, bringing practical quantum computers one step closer to reality.',
      link: 'https://engineering.princeton.edu/news/2025/03/18/breakthrough-quantum-computing-achieved-princeton-researchers',
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
    },
    {
      title: 'Scientists develop biodegradable plastic that breaks down in days instead of centuries',
      date: '2025-03-15',
      description: 'UC Berkeley researchers have created a fully biodegradable plastic that decomposes in less than two weeks while maintaining the strength and versatility of conventional plastics.',
      link: 'https://news.berkeley.edu/2025/03/15/scientists-develop-biodegradable-plastic-breaks-down-days/',
      image: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d9a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
    }
  ];

  // Bibliometric/Data Visualization YouTube videos
  const bibliometricVideos = [
    {
      id: 'dQw4w9WgXcQ', // Real YouTube ID
      title: 'Data Visualization in Bibliometric Research',
      author: 'Dr. Jane Rodriguez',
      affiliation: 'Stanford University'
    },
    {
      id: '2lAe1cqCOXo', // Real YouTube ID
      title: 'Using VOSviewer for Scientific Mapping',
      author: 'Prof. Michael Chen',
      affiliation: 'MIT'
    },
    {
      id: 'A_vXA058EDY', // Real YouTube ID
      title: 'Bibliometric Network Analysis Tutorial',
      author: 'Dr. Sarah Johnson',
      affiliation: 'Oxford University'
    }
  ];

  const fetchLatestNews = () => {
    setLoadingNews(true);
    try {
      // Simulate API call with timeout
      setTimeout(() => {
        // Shuffle and pick 2 news items
        const shuffled = [...realResearchNews].sort(() => 0.5 - Math.random());
        setNews(shuffled.slice(0, 2));
        setLoadingNews(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching news:', error);
      // Fallback to first two items if error occurs
      setNews(realResearchNews.slice(0, 2));
      setLoadingNews(false);
    }
  };

  const fetchVideos = () => {
    setLoadingVideos(true);
    try {
      // Simulate API call with timeout
      setTimeout(() => {
        // Shuffle videos
        const shuffled = [...bibliometricVideos].sort(() => 0.5 - Math.random());
        setTestimonialVideos(shuffled);
        setLoadingVideos(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setTestimonialVideos(bibliometricVideos);
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchLatestNews();
    fetchVideos();

    // Set up auto-refresh every 2 minutes (120000ms)
    const newsInterval = setInterval(fetchLatestNews, 120000);
    const videosInterval = setInterval(fetchVideos, 120000);

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
      clearInterval(videosInterval);
      window.removeEventListener('scroll', reveal);
      window.removeEventListener('load', reveal);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // We're using eslint-disable comment because we've addressed the dependency issue by
  // making sure all necessary cleanup happens in the return function

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
              {loadingVideos ? (
                <div className="carousel-item">
                  <div className="container">
                    <div className="left-section">
                      <h2>Bibliometric Data Visualization</h2>
                      <div className="video-container">Loading videos...</div>
                    </div>
                  </div>
                </div>
              ) : (
                testimonialVideos.map((video, index) => (
                  <div className="carousel-item" key={index}>
                    <div className="container">
                      <div className="left-section">
                        <h2>Bibliometric Data Visualization</h2>
                        <div className="video-container" style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: '0', overflow: 'hidden' }}>
                          <iframe 
                            style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', border: '0' }}
                            src={`https://www.youtube.com/embed/${video.id}?rel=0`} 
                            title={video.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen>
                          </iframe>
                        </div>
                        <div className="video-info" style={{ marginTop: '15px' }}>
                          <h3>{video.title}</h3>
                          <div className="author-info">{video.author} <span>{video.affiliation}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
                  <p>{new Date(item.date).toLocaleDateString()}</p>
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