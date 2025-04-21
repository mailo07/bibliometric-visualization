import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import './videos.css';

const LeftColumn = () => {
  const [bibliometricVideos, setBibliometricVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true); // Now used for autoplay toggle
  const autoplayTimerRef = useRef(null);

  // Updated videoLibrary with real academic videos
  const videoLibrary = useMemo(() => [
    {
      id: 'mtLPd2u4DiA',
      title: 'Research Ethics | Ethics in Research',
      author: 'SciToons',
      source: 'https://www.youtube.com/watch?v=mtLPd2u4DiA',
      description: 'This video explains the importance of ethics in research and how to conduct research ethically.'
    },
    {
      id: '8AKdsDMPv20',
      title: 'What is academic Integrity?',
      author: 'RMIT University Library',
      source: 'https://www.youtube.com/watch?v=8AKdsDMPv20',
      description: 'Learn about academic integrity, what it means, and why it matters in educational settings.'
    },
    {
      id: 'UiyKfYh5BJM',
      title: 'Bibliometrics in under 2 minutes',
      author: 'Leeds University Library',
      source: 'https://www.youtube.com/watch?v=UiyKfYh5BJM',
      description: 'Analysis of citations to find out what\'s popular in research and scholarly communication.'
    },
    {
      id: 'wBux-te-uxE',
      title: 'Bibliometrics (1): Concepts in literature reviews',
      author: 'U RESEARCH HUB',
      source: 'https://www.youtube.com/watch?v=wBux-te-uxE',
      description: 'An introduction to bibliometric analysis concepts and their application in literature reviews.'
    },
    {
      id: 'X3paOmcrTjQ',
      title: 'Data Science In 5 Minutes | Data Science For Beginners | What Is Data Science?',
      author: 'SimplilearnOfficial',
      source: 'https://www.youtube.com/watch?v=X3paOmcrTjQ',
      description: 'A quick introduction to data science concepts and applications for beginners.'
    },
    {
      id: 'JW49jg7SUUE',
      title: 'Farmer cinematic video || Village of Assam || Agriculture cinematic video',
      author: 'Cinematic World',
      source: 'https://www.youtube.com/watch?v=JW49jg7SUUE',
      description: 'A cinematic exploration of farming life and agricultural practices in the villages of Assam.'
    }
  ], []);

  const fetchVideos = useCallback(() => {
    setLoadingVideos(true);
    try {
      setTimeout(() => {
        setBibliometricVideos([...videoLibrary]);
        setCurrentVideoIndex(0);
        setLoadingVideos(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setBibliometricVideos(videoLibrary);
      setLoadingVideos(false);
    }
  }, [videoLibrary]);

  const nextVideo = useCallback(() => {
    setCurrentVideoIndex((prevIndex) =>
      prevIndex === bibliometricVideos.length - 1 ? 0 : prevIndex + 1
    );
  }, [bibliometricVideos.length]);

  const toggleAutoplay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // Set up autoplay functionality with 20 seconds interval
  useEffect(() => {
    if (isPlaying && bibliometricVideos.length > 0) {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
      
      autoplayTimerRef.current = setInterval(() => {
        nextVideo();
      }, 20000); // 20 seconds autoplay interval
    } else if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
    }

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [isPlaying, bibliometricVideos.length, nextVideo]);

  useEffect(() => {
    fetchVideos();
    const videosInterval = setInterval(fetchVideos, 120000);
    return () => {
      clearInterval(videosInterval);
    };
  }, [fetchVideos]);

  // Background color change effect
  useEffect(() => {
    const colors = ['#c394f8', '#428aa6', '#94f8c3', '#f8c394'];
    document.body.style.backgroundColor = colors[currentVideoIndex % colors.length];
    document.body.style.transition = 'background-color .4s ease-in';
    
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.transition = '';
    };
  }, [currentVideoIndex]);

  const goToVideo = (index) => {
    setCurrentVideoIndex(index);
  };

  return (
    <div className="left-column">
      <div className="video-section">
        <h2 className="video-section-title">Check out these <span style={{ color: 'purple', fontWeight: 'bold' }}>Videos</span></h2>
        
        {loadingVideos ? (
          <div className="loading-videos">
            <p>Loading videos...</p>
          </div>
        ) : (
          <div className="left-aligned-container">
            {/* Carousel Container */}
            <div className="carousel-container">
              {/* Radio buttons for carousel navigation */}
              {bibliometricVideos.map((video, index) => (
                <input 
                  key={`radio-${index}`}
                  type="radio" 
                  name="slider" 
                  id={`item-${index + 1}`} 
                  checked={index === currentVideoIndex}
                  onChange={() => goToVideo(index)}
                />
              ))}
              
              <div className="cards">
                {bibliometricVideos.map((video, index) => (
                  <label 
                    className={`card ${index === currentVideoIndex ? 'active' : ''}`} 
                    htmlFor={`item-${index + 1}`}
                    id={`video-${index + 1}`}
                    key={video.id}
                  >
                    <div className="video-wrapper">
                      <iframe 
                        src={`https://www.youtube.com/embed/${video.id}?rel=0&autoplay=${index === currentVideoIndex ? '1' : '0'}&mute=1`} 
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen>
                      </iframe>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Video Description Container */}
            <div className="video-description-container">
              <h3 className="video-title">{bibliometricVideos[currentVideoIndex]?.title}</h3>
              <p className="video-author">{bibliometricVideos[currentVideoIndex]?.author}</p>
              <p className="video-description">{bibliometricVideos[currentVideoIndex]?.description}</p>
              <button 
                className="autoplay-toggle"
                onClick={toggleAutoplay}
              >
                {isPlaying ? 'Pause Autoplay' : 'Resume Autoplay'}
              </button>
            </div>
            
            {/* Only ellipses for navigation */}
            <div className="ellipses-navigation">
              {bibliometricVideos.map((_, index) => (
                <button
                  key={index}
                  className={`nav-dot ${index === currentVideoIndex ? 'active' : ''}`}
                  onClick={() => goToVideo(index)}
                  aria-label={`Go to video ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftColumn;