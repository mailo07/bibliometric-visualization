import React, { useEffect, useState } from 'react';
import './MainPage.css';

const MainPage = () => {
  const [loginBoxVisible, setLoginBoxVisible] = useState(false);
  const [contactBoxVisible, setContactBoxVisible] = useState(false);

  useEffect(() => {
    // Navigation Toggle Script
    const tabs = document.querySelectorAll('.search-box .tabs button');
    const glider = document.querySelector('.search-box .tabs .glider');

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', function () {
        tabs.forEach(t => t.classList.remove('active'));
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

    // Form Submission Handling
    const searchForm = document.querySelector('.search-box .search-bar form');
    if (searchForm) {
      searchForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the default form submission

        const queryInput = searchForm.querySelector('input[name="query"]');
        const query = queryInput.value;

        // Redirect to the SearchPage with the query as a parameter
        window.location.href = `/search?query=${encodeURIComponent(query)}`;
      });
    }

    // Carousel Functionality
    const carousel = document.querySelector('.carousel');
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

    // Scroll Reveal Functionality
    function reveal() {
      var reveals = document.querySelectorAll('.reveal');
      for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        if (elementTop < windowHeight - 100) {
          reveals[i].classList.add('active');
        }
      }
    }
    window.addEventListener('scroll', reveal);
    window.addEventListener('load', reveal);

  }, []);

  const toggleLoginBox = () => {
    setLoginBoxVisible(!loginBoxVisible);
  };

  const toggleContactBox = () => {
    setContactBoxVisible(!contactBoxVisible);
  };

    return (
    <div>
      {/* Header Section */}
      <header className="header">
        <nav className="nav">
          <div className="header-buttons">
            <a href="/about" className="about-button">
              <i className="fas fa-info-circle"></i> About</a>
            <a href ="/register" className="register-button">
              <i className="fas fa-user"></i> Register
            </a>
            <button className="login-button" onClick={toggleLoginBox}>
              <i className="fas fa-sign-in-alt"></i> Login
            </button>
            <button className="contact-button" onClick={toggleContactBox}>
              <i className="fas fa-envelope"></i> Contact
            </button>
          </div>
        </nav>
        <div className="header-content">
          <h1>BIBLIOKNOW</h1>
          <p>
            Serves all scholarly work in the world as a free, open and secure
            digital public good, with user privacy a paramount focus.
          </p>
          <div className="search-box">
            <h2>Fostering Global Connections</h2>
            <h3>Start Your Search Here</h3>
            <div className="tabs">
              <button onClick={(e) => e.preventDefault()}>
                Authors
              </button>
              <button onClick={(e) => e.preventDefault()}>Fields</button>
              <button onClick={(e) => e.preventDefault()}>Scholarly works</button>
              <div className="glider"></div>
            </div>
            <div className="search-bar">
              <form action="" method="GET">
                <input
                  type="text"
                  name="query"
                  placeholder="Search by Keyword or Certain Field"
                />
                <button type="submit">Search</button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Login Box */}
      {loginBoxVisible && (
        <div className="dialog-overlay" onClick={toggleLoginBox}>
          <div className="signup-dialog" onClick={(e) => e.stopPropagation()}>
            <button onClick={toggleLoginBox} style={{ position: 'absolute', top: '10px', right: '10px' }}>X</button>
            <h1>Log-in to Biblioknow</h1>
            <form>
              <label>Email address or Username</label>
              <input type='text' />
              <label>Password</label>
              <input type='password' />
              <button type='submit'>Log in</button>
            </form>
          </div>
        </div>
      )}

      {/* Contact Box */}
      {contactBoxVisible && (
        <div className="dialog-overlay" onClick={toggleContactBox}>
          <div className="signup-dialog" onClick={(e) => e.stopPropagation()}>
            <button onClick={toggleContactBox} style={{ position: 'absolute', top: '10px', right: '10px' }}>X</button>
            <h2>Contact Information</h2>
            <p>
              For inquiries and support, please contact the admin at:
              <a href="mailto:Biblioknow00@outlook.com">
                BiblioKnow00@outlook.com
              </a>
              <br />
              You can also reach us at (+91) 123467890.
            </p>
            <p>
              For more information, visit our educational project page.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Sections */}
      <section className="bg-gray-100 py-12 text-center reveal">
     
          <h1 className="text-2xl md:text-3xl font-bold text-gray-600">
          OUR PRIMARY FOCUS AND OBJECTIVES</h1>
        <p className="text-lg text-gray-600 mt-2">
        To provide a platform for researchers, scholars, and academics to connect, collaborate,<br />
      and exchange knowledge. We aim to foster a collaborative environment
        where researchers can share their findings,  discover new insights,<br />
        and contribute to the advancement of knowledge.
        </p>
      </section>

      <section className="bg-gray-100 py-12 text-center reveal">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-600">
          Discover, Analyse, and Map Global Innovation Knowledge
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Connecting Worlds & Building Cultural Bridges
        </p>
      </section>

      {/* Carousel and News Section */}
      <div className="container reveal">
        <div className="left-column">
          <div
            className="carousel collaboration-carousel-slide temp-grid-8 item collaboration-carousel-slide--addPadding"
            data-autoplay="true"
            data-autoplay-interval="5000"
            data-autoplay-hover-pause="true"
          >
            <div className="carousel-inner">
              {/* Carousel Item 1 */}
              <div className="carousel-item">
                <div className="container">
                  <div className="left-section">
                    <h2>What Others Say</h2>
                    <div className="testimonial">
                      “I used BiblioKnow to run patent analyses for my PhD and it
                      was a critical factor of my successful thesis. The UX is
                      phenomenal and you are a pro after 5 minutes. The database
                      is reliable - I did several validation checks with
                      proprietary databases and found no inconsistencies...
                      Thanks BiblioKnow.”
                    </div>
                    <div className="author">
                      <img
                        alt="Portrait of Dr. Giulio Barth"
                        height="50"
                        src="https://via.placeholder.com/50"
                      />
                      <div className="author-info">
                        Dr. Giulio Barth
                        <span>McKinsey &amp; Company, Inc</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Carousel Item 2 */}
              <div className="carousel-item">
                <div className="container">
                  <div className="left-section">
                    <h2>What Others Say</h2>
                    <div className="testimonial">
                      “BiblioKnow has helped our research team immensely. The
                      detailed patent data and tools provided are simply
                      unparalleled.”
                    </div>
                    <div className="author">
                      <img
                        alt="Portrait of Dr. Jane Doe"
                        height="50"
                        src="https://via.placeholder.com/50"
                      />
                      <div className="author-info">
                        Dr. Jane Doe
                        <span>Harvard University</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Carousel Controls */}
            <div className="carousel-controls">
              <i className="fas fa-chevron-left" id="prev"></i>
              <i className="fas fa-chevron-right" id="next"></i>
            </div>
          </div>
        </div>

        {/* Right Column (News Section) */}
        <div className="right-column">
          <h2>Our Recent News</h2>
          {/* News Card 1 */}
          <div className="news-card">
            <img
              alt="Illustration of kitchen essentials"
              src="https://oaidalleapiprodscus.blob.core.windows.net/private/org-RcpoXHkzChYnDbFAyeQ8tamr/user-ehrvabJ3DufsCu8YJ7PqY5gl/img-jazbSXt8MqOKnfesm8dBpoJE.png?st=2024-09-14T14%3A27%3A36Z&amp;se=2024-09-14T16%3A27%3A36Z&amp;sp=r&amp;sv=2024-08-04&amp;sr=b&amp;rscd=inline&amp;rsct=image/png&amp;rsct=image/png&amp;skoid=d505667d-d6c1-4a0a-bac7-5c84a87759f8&amp;sktid=a48cca56-e6da-484e-a814-9c849652bcb3&amp;skt=2024-09-13T23%3A22%3A26Z&amp;ske=2024-09-14T23%3A22%3A26Z&amp;sks=b&amp;skv=2024-08-04&amp;sig=6NDp%2BLGXUR7gjnaahwLimcxbNkXGkSXFrfUYSe62hYQ%3D"
            />
            <div className="news-content">
              <h4>
                Kitchen Essentials: An Interview with Richard Jefferson of The
                Lens
              </h4>
              <p>11 Jul 2024 - Interview</p>
              <p>
                Today we are hearing from Richard Jefferson, the molecular
                biologist who is founder and CEO...
              </p>
            </div>
          </div>
          {/* News Card 2 */}
          <div className="news-card">
            <img
              alt="Illustration "
              src="https://oaidalleapiprodscus.blob.core.windows.net/private/org-RcpoXHkzChYnDbFAyeQ8"
            />
            <div className="news-content">
              <h4>The Lens Scales for Impact</h4>
              <p>13 June 2024 - Press Release</p>
              <p>
                Moore Foundation supports The Lens’ growth as the definitive
                open global innovation resource...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="footer-title">&copy; 2025 Biblioknow</div>
        <div className="footer-subtitle">
          Please Note: This is just an Educational Project. Not intended for real use
        </div>
        <div className="footer-content">
          <div className="footer-section">
            <h3>Location</h3>
            <p>India<br/>
              Meghalaya, 793017
            </p>
          </div>
          <div className="footer-section">
            <h3>Contact</h3>
            <p><a href="mailto:Biblioknow00@outlook.com">BiblioKnow00@outlook.com</a><br />
            (+91) 123467890
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;