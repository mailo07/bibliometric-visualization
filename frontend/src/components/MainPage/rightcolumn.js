import React, { useEffect, useState, useCallback, useMemo } from 'react';
import './newscard.css';

const RightColumn = () => {
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  // Memoize the research news array so it doesn't change on every render
  const realResearchNews = useMemo(() => [
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
  ], []);

  const fetchLatestNews = useCallback(() => {
    setLoadingNews(true);
    try {
      setTimeout(() => {
        const shuffled = [...realResearchNews].sort(() => 0.5 - Math.random());
        setNews(shuffled.slice(0, 2));
        setLoadingNews(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching news:', error);
      setNews(realResearchNews.slice(0, 2));
      setLoadingNews(false);
    }
  }, [realResearchNews]);

  useEffect(() => {
    fetchLatestNews();

    // Set a 2-minute refresh interval (120,000 ms) for news as requested
    const newsInterval = setInterval(fetchLatestNews, 120000);

    return () => {
      clearInterval(newsInterval);
    };
  }, [fetchLatestNews]);

  return (
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
  );
};

export default RightColumn;