import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './newscard.css';

const RightColumn = () => {
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [activeSource, setActiveSource] = useState('tech'); // Default to technology section

  // Function to parse RSS feeds
  const parseRSS = async (url) => {
    try {
      // Using RSS to JSON API
      const response = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
      return response.data.items.map(item => ({
        title: item.title,
        description: item.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...',
        image: item.enclosure?.link || item.thumbnail || 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        link: item.link,
        pubDate: new Date(item.pubDate)
      }));
    } catch (error) {
      console.error('Error parsing RSS feed:', error);
      return [];
    }
  };

  // Function to fetch from GDELT Project
  const fetchGDELT = async () => {
    try {
      // GDELT provides news in various formats - using their GKG API
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=sourcecountry:USA&format=html&maxrecords=10&timespan=1d`;
      
      // Need to parse HTML response as GDELT doesn't have a direct JSON API
      const response = await axios.get(url);
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data, 'text/html');
      const articles = Array.from(doc.querySelectorAll('.article')).slice(0, 2);
      
      return articles.map(article => {
        const titleElement = article.querySelector('.title a');
        return {
          title: titleElement?.textContent || 'GDELT News Update',
          description: article.querySelector('.snippet')?.textContent || 'Latest international news from GDELT Project.',
          image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
          link: titleElement?.href || 'https://www.gdeltproject.org/',
          pubDate: new Date()
        };
      });
    } catch (error) {
      console.error('Error fetching from GDELT:', error);
      // Provide fallback global news if GDELT API fails
      return [
        {
          title: 'EU Reaches Climate Agreement with Major Asian Economies',
          description: 'New partnership focuses on renewable energy technology exchange and carbon reduction targets over the next decade.',
          image: 'https://images.unsplash.com/photo-1623177927129-3406b90d3023?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
          link: 'https://example.com/eu-climate-agreement',
          pubDate: new Date()
        },
        {
          title: 'UN Report: Global Water Scarcity Affecting 2.3 Billion People',
          description: 'Latest assessment highlights need for immediate action on water management infrastructure and conservation policies.',
          image: 'https://images.unsplash.com/photo-1581843481306-ea81e84a8e9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
          link: 'https://example.com/un-water-scarcity',
          pubDate: new Date()
        }
      ];
    }
  };

  // Function to fetch technology news
  const fetchTechNews = async () => {
    try {
      // Technology news from various sources
      const techNewsData = [
        {
          title: 'Apple Unveils New Machine Learning Framework for iOS Developers',
          description: 'The new framework promises to make on-device AI more accessible and efficient for app developers, with a focus on privacy and performance.',
          image: 'https://images.unsplash.com/photo-1530319067432-f2a729c03db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
          link: 'https://example.com/apple-ml-framework',
          pubDate: new Date()
        },
        {
          title: 'Microsofts Quantum Computing Division Achieves Key Milestone',
          description: 'Researchers have demonstrated a new approach to quantum error correction that could significantly improve the stability of quantum computations.',
          image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=1472&q=80',
          link: 'https://example.com/microsoft-quantum-milestone',
          pubDate: new Date()
        }
      ];
      
      // Try to fetch from RSS feeds as backup or additional sources
      try {
        const vergeRSS = await parseRSS('https://www.theverge.com/rss/index.xml');
        if (vergeRSS.length >= 2) {
          return vergeRSS.slice(0, 2);
        }
      } catch (e) {
        console.log('Falling back to prepared tech news');
      }
      
      return techNewsData;
    } catch (error) {
      console.error('Error fetching tech news:', error);
      return [];
    }
  };

  // Function to fetch from ArXiv API
  const fetchArXiv = async () => {
    try {
      // ArXiv API using their query interface
      const query = encodeURIComponent('cat:cs.AI OR cat:cs.LG');
      const response = await axios.get(
        `http://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&max_results=2`
      );
      
      // Parse XML response
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, "text/xml");
      const entries = xmlDoc.getElementsByTagName("entry");
      
      const results = [];
      for (let i = 0; i < entries.length && i < 2; i++) {
        const entry = entries[i];
        results.push({
          title: entry.getElementsByTagName("title")[0].textContent,
          description: entry.getElementsByTagName("summary")[0].textContent.substring(0, 150) + "...",
          image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
          link: entry.getElementsByTagName("id")[0].textContent,
          pubDate: new Date(entry.getElementsByTagName("published")[0].textContent)
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error fetching from ArXiv:', error);
      return [
        {
          title: 'Advances in Large Language Model Understanding and Generation',
          description: 'This paper explores recent developments in transformer architectures that enable better reasoning and content generation capabilities.',
          image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
          link: 'https://example.com/arxiv-llm-paper',
          pubDate: new Date()
        },
        {
          title: 'Novel Approach to Reinforcement Learning in Dynamic Environments',
          description: 'Researchers demonstrate a new algorithm that adapts more effectively to changing parameters in complex simulations and real-world scenarios.',
          image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
          link: 'https://example.com/arxiv-rl-paper',
          pubDate: new Date()
        }
      ];
    }
  };

  // Function to fetch from PubMed
  const fetchPubMed = async () => {
    try {
      // First get IDs
      const searchResponse = await axios.get(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=artificial+intelligence+medicine&retmode=json&retmax=2&sort=date`
      );
      
      const ids = searchResponse.data.esearchresult.idlist;
      
      // Then get details
      const detailsResponse = await axios.get(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
      );
      
      const results = [];
      ids.forEach(id => {
        const article = detailsResponse.data.result[id];
        results.push({
          title: article.title,
          description: article.description || 'Recent medical research publication from PubMed.',
          image: 'https://images.unsplash.com/photo-1576671414101-0579984cbe5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
          link: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
          pubDate: new Date(article.pubdate)
        });
      });
      
      return results;
    } catch (error) {
      console.error('Error fetching from PubMed:', error);
      return [
        {
          title: 'AI Applications in Early Cancer Detection: A Systematic Review',
          description: 'This comprehensive analysis evaluates the effectiveness of machine learning algorithms in identifying cancer biomarkers from medical imaging.',
          image: 'https://images.unsplash.com/photo-1576671414101-0579984cbe5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
          link: 'https://example.com/ai-cancer-detection'
        },
        {
          title: 'Neural Networks for Predicting Patient Outcomes in Emergency Care',
          description: 'Researchers developed a new model that analyzes vital signs and medical history to prioritize emergency department resources with promising results.',
          image: 'https://images.unsplash.com/photo-1516549655103-122715a617e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
          link: 'https://example.com/neural-networks-emergency'
        }
      ];
    }
  };

  // Function to fetch global news
  const fetchGlobalNews = async () => {
    // First try the GDELT API
    try {
      const gdeltNews = await fetchGDELT();
      if (gdeltNews.length >= 2) {
        return gdeltNews;
      }
    } catch (error) {
      console.error('Error fetching from GDELT for global news:', error);
    }
    
    // Fallback global news if API fails
    return [
      {
        title: 'EU Reaches Climate Agreement with Major Asian Economies',
        description: 'New partnership focuses on renewable energy technology exchange and carbon reduction targets over the next decade.',
        image: 'https://images.unsplash.com/photo-1623177927129-3406b90d3023?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        link: 'https://example.com/eu-climate-agreement',
        pubDate: new Date()
      },
      {
        title: 'UN Report: Global Water Scarcity Affecting 2.3 Billion People',
        description: 'Latest assessment highlights need for immediate action on water management infrastructure and conservation policies.',
        image: 'https://images.unsplash.com/photo-1581843481306-ea81e84a8e9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        link: 'https://example.com/un-water-scarcity',
        pubDate: new Date()
      }
    ];
  };

  // Function to fetch from multiple sources
  const fetchLatestNews = useCallback(async () => {
    setLoadingNews(true);
    try {
      let newsData = [];
      
      switch (activeSource) {
        case 'general':
          // For general news, use RSS feeds from major news outlets
          const cnnRss = await parseRSS('http://rss.cnn.com/rss/cnn_tech.rss');
          newsData = cnnRss.slice(0, 2);
          break;
          
        case 'tech':
          // Fetch technology news
          newsData = await fetchTechNews();
          break;
          
        case 'academic':
          // Use ArXiv for academic news
          newsData = await fetchArXiv();
          break;
          
        case 'medical':
          // Use PubMed for medical news
          newsData = await fetchPubMed();
          break;
          
        case 'global':
          // Use GDELT and fallback for global news
          newsData = await fetchGlobalNews();
          break;
          
        default:
          // Default to RSS feeds
          const bbcRss = await parseRSS('http://feeds.bbci.co.uk/news/technology/rss.xml');
          newsData = bbcRss.slice(0, 2);
      }
      
      // Ensure we have exactly 2 items
      newsData = newsData.slice(0, 2);
      
      // Sort by publication date, newest first
      newsData.sort((a, b) => b.pubDate - a.pubDate);
      
      setNews(newsData);
    } catch (error) {
      console.error('Error fetching news:', error);
      
      // Fallback news in case all APIs fail - always 2 items
      if (activeSource === 'tech') {
        setNews([
          {
            title: 'Googles New AI Model Can Code Complex Software in Minutes',
            description: 'The latest AI model shows remarkable abilities in understanding natural language specifications and generating production-quality code across multiple programming languages.',
            image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
            link: 'https://example.com/google-ai-coding'
          },
          {
            title: 'Breakthrough in Quantum Computing Promises Faster Problem-Solving',
            description: 'Quantum researchers have demonstrated a new algorithm that solves complex optimization problems exponentially faster than conventional computers.',
            image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=1472&q=80',
            link: 'https://example.com/quantum-breakthrough'
          }
        ]);
      } else if (activeSource === 'global') {
        setNews([
          {
            title: 'EU Reaches Climate Agreement with Major Asian Economies',
            description: 'New partnership focuses on renewable energy technology exchange and carbon reduction targets over the next decade.',
            image: 'https://images.unsplash.com/photo-1623177927129-3406b90d3023?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
            link: 'https://example.com/eu-climate-agreement'
          },
          {
            title: 'UN Report: Global Water Scarcity Affecting 2.3 Billion People',
            description: 'Latest assessment highlights need for immediate action on water management infrastructure and conservation policies.',
            image: 'https://images.unsplash.com/photo-1581843481306-ea81e84a8e9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
            link: 'https://example.com/un-water-scarcity'
          }
        ]);
      } else {
        setNews([
          {
            title: 'AI Research Shows Promise in Medical Diagnostics',
            description: 'New machine learning algorithms demonstrate 95% accuracy in early detection of certain conditions, potentially revolutionizing preventative care.',
            image: 'https://images.unsplash.com/photo-1576671414101-0579984cbe5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
            link: 'https://example.com/ai-medical-research'
          },
          {
            title: 'New Study Maps Climate Change Effects on Global Agriculture',
            description: 'Comprehensive research using satellite data and climate models provides detailed predictions for crop yields through 2050.',
            image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
            link: 'https://example.com/climate-agriculture-study'
          }
        ]);
      }
    }
    setLoadingNews(false);
  }, [activeSource]);

  useEffect(() => {
    fetchLatestNews();

    // Set a 2-minute refresh interval for news (120000 milliseconds)
    const newsInterval = setInterval(fetchLatestNews, 120000);

    return () => {
      clearInterval(newsInterval);
    };
  }, [fetchLatestNews]);

  return (
    <div className="right-column">
      <div className="news-header">
        <h2 className="recent-news-heading">Recent News</h2>
        <div className="news-sources-tabs">
          <button 
            className={`source-tab ${activeSource === 'general' ? 'active' : ''}`}
            onClick={() => setActiveSource('general')}>
            General
          </button>
          <button 
            className={`source-tab ${activeSource === 'tech' ? 'active' : ''}`}
            onClick={() => setActiveSource('tech')}>
            Technology
          </button>
          <button 
            className={`source-tab ${activeSource === 'academic' ? 'active' : ''}`}
            onClick={() => setActiveSource('academic')}>
            Academic
          </button>
          <button 
            className={`source-tab ${activeSource === 'medical' ? 'active' : ''}`}
            onClick={() => setActiveSource('medical')}>
            Medical
          </button>
          <button 
            className={`source-tab ${activeSource === 'global' ? 'active' : ''}`}
            onClick={() => setActiveSource('global')}>
            Global
          </button>
        </div>
      </div>
      
      <div className="news-cards-container">
        {loadingNews ? (
          // Show skeleton loaders - exactly 2 of them
          <>
            <div className="news-card-wrapper">
              <div className="news-card skeleton">
                <div className="skeleton-img"></div>
                <div className="news-content">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line short"></div>
                </div>
              </div>
            </div>
            <div className="news-card-wrapper">
              <div className="news-card skeleton">
                <div className="skeleton-img"></div>
                <div className="news-content">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line short"></div>
                </div>
              </div>
            </div>
          </>
        ) : (
          news.map((item, index) => (
            <div className="news-card-wrapper" key={index}>
              <div className="news-card">
                <img 
                  alt={item.title} 
                  src={item.image} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80';
                  }}
                />
                <div className="news-content">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  <a href={item.link} className="read-more" target="_blank" rel="noopener noreferrer">
                    Read more
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RightColumn;