import React, { useEffect, useState, useCallback, useMemo } from 'react';
import './videos.css';

const LeftColumn = () => {
  const [bibliometricVideos, setBibliometricVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Use useMemo to memoize the videoLibrary
  const videoLibrary = useMemo(() => [
    {
      id: 'AJp-oNfO1n8',
      title: 'Bibliometric Analysis for Research Impact',
      author: 'Dr. Lisa Thompson',
      affiliation: 'Harvard University',
      source: 'https://www.youtube.com/watch?v=AJp-oNfO1n8'
    },
    {
      id: 'WqnrN_G4WHk',
      title: 'VOSviewer Bibliometric Network Analysis Tutorial',
      author: 'Prof. James Wilson',
      affiliation: 'Leiden University',
      source: 'https://www.youtube.com/watch?v=WqnrN_G4WHk'
    },
    {
      id: 'bNrZSdDVk1U',
      title: 'Introduction to Bibliometric Analysis using R',
      author: 'Dr. Sarah Johnson',
      affiliation: 'Stanford University',
      source: 'https://www.youtube.com/watch?v=bNrZSdDVk1U'
    },
    {
      id: 'OwT38BPHEuY',
      title: 'CiteSpace Tutorial for Science Mapping',
      author: 'Dr. Michael Chen',
      affiliation: 'Drexel University',
      source: 'https://www.youtube.com/watch?v=OwT38BPHEuY'
    },
    {
      id: 'E1SPQbbYpUs',
      title: 'Biblioshiny: A Web Interface for Bibliometrix',
      author: 'Prof. Emily Davis',
      affiliation: 'University of Naples',
      source: 'https://www.youtube.com/watch?v=E1SPQbbYpUs'
    }
  ], []); // Empty dependency array means it's only created once

  const fetchVideos = useCallback(() => {
    setLoadingVideos(true);
    try {
      setTimeout(() => {
        const shuffled = [...videoLibrary].sort(() => 0.5 - Math.random());
        setBibliometricVideos(shuffled.slice(0, 3));
        setCurrentVideoIndex(0);
        setLoadingVideos(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setBibliometricVideos(videoLibrary.slice(0, 3));
      setLoadingVideos(false);
    }
  }, [videoLibrary]); // Now this dependency won't change

  const nextVideo = () => {
    setCurrentVideoIndex((prevIndex) =>
      prevIndex === bibliometricVideos.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevVideo = () => {
    setCurrentVideoIndex((prevIndex) =>
      prevIndex === 0 ? bibliometricVideos.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
    fetchVideos();

    // Set a 2-minute refresh interval (120,000 ms) for videos as requested
    const videosInterval = setInterval(fetchVideos, 120000);

    return () => {
      clearInterval(videosInterval);
    };
  }, [fetchVideos]);

  return (
    <div className="left-column">
      <div className="carousel collaboration-carousel-slide temp-grid-8 item collaboration-carousel-slide--addPadding"
        data-autoplay="true" data-autoplay-interval="5000" data-autoplay-hover-pause="true">
        <div className="carousel-inner">
          {loadingVideos ? (
            <div className="carousel-item">
              <div className="container">
                <div className="left-section">
                  <h1>Bibliometric Data Visualization</h1>
                  <div className="video-container">Loading videos...</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="carousel-item">
              <div className="container">
                <div className="left-section">
                  <h2>Bibliometric Data Visualization</h2>
                  {/* Updated video carousel with reduced size and smarter look */}
                  <div className="video-carousel" style={{ maxWidth: '85%', margin: '0 auto' }}>
                    <div className="video-carousel-item">
                      <div className="video-container" style={{ position: 'relative', width: '100%', paddingBottom: '50%', height: '0', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                        <iframe 
                          style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', border: '0' }}
                          src={`https://www.youtube.com/embed/${bibliometricVideos[currentVideoIndex]?.id}?rel=0`} 
                          title={bibliometricVideos[currentVideoIndex]?.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen>
                        </iframe>
                      </div>
                      <div className="video-info" style={{ padding: '15px 5px', background: 'rgba(245,245,245,0.05)', borderRadius: '0 0 8px 8px', marginTop: '-5px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{bibliometricVideos[currentVideoIndex]?.title}</h3>
                        <div className="author-info" style={{ fontSize: '14px', color: '#ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{bibliometricVideos[currentVideoIndex]?.author}</span>
                          <span style={{ fontStyle: 'italic', fontSize: '13px' }}>{bibliometricVideos[currentVideoIndex]?.affiliation}</span>
                        </div>
                        <a 
                          href={bibliometricVideos[currentVideoIndex]?.source} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="read-more"
                          style={{ display: 'inline-block', marginTop: '10px', fontSize: '14px', textDecoration: 'none', color: '#26d0ce' }}
                        >
                          Watch on YouTube <i className="fas fa-external-link-alt" style={{ fontSize: '12px', marginLeft: '3px' }}></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="video-carousel-nav" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '15px' }}>
                    <button onClick={prevVideo} style={{ background: 'rgba(38, 208, 206, 0.2)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <span style={{ margin: '0 15px', fontSize: '14px', fontWeight: 'bold' }}>
                      {currentVideoIndex + 1} / {bibliometricVideos.length}
                    </span>
                    <button onClick={nextVideo} style={{ background: 'rgba(38, 208, 206, 0.2)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeftColumn;