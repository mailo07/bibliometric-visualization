// apiService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Flask backend base URL

// Helper function to process metrics data
const processMetricsData = (data) => {
  // Process citation trends
  const citationTrends = data.reduce((acc, item) => {
    const year = item.year || item.publication_year || item.published;
    if (year) {
      const yearStr = String(year).substring(0, 4); // Get just the year part
      const existing = acc.find(x => x.year === yearStr);
      if (existing) {
        existing.citations += item.cited_by || item.citations || item.citation_count || 0;
      } else {
        acc.push({
          year: yearStr,
          citations: item.cited_by || item.citations || item.citation_count || 0
        });
      }
    }
    return acc;
  }, []).sort((a, b) => a.year - b.year);

  // Process top authors
  const authorMap = data.reduce((map, item) => {
    const authors = item.author || item.authors || item.author_name;
    if (authors) {
      const authorList = typeof authors === 'string' ? authors.split(',').map(a => a.trim()) : [];
      const citations = item.cited_by || item.citations || item.citation_count || 0;
      
      authorList.forEach(author => {
        if (author && author !== 'N/A') {
          if (!map[author]) {
            map[author] = 0;
          }
          map[author] += citations;
        }
      });
    }
    return map;
  }, {});

  const topAuthors = Object.entries(authorMap)
    .map(([name, citations]) => ({ name, citations }))
    .sort((a, b) => b.citations - a.citations)
    .slice(0, 5); // Top 5 authors

  // Process publication distribution (by source)
  const sourceMap = data.reduce((map, item) => {
    const source = item.journal || item.publisher || item.source || 'Unknown';
    if (!map[source]) {
      map[source] = 0;
    }
    map[source]++;
    return map;
  }, {});

  const publicationDistribution = Object.entries(sourceMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 sources

  return {
    citationTrends,
    topAuthors,
    publicationDistribution
  };
};

export const search = async (query) => {
  try {
    const response = await axios.get(`${API_URL}/search`, {
      params: { query },
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching search data:', error);
    throw error;
  }
};

// 📘 Cleaned Bibliometric Data
export const getCleanedBibliometricData = async () => {
  try {
    const response = await axios.get(`${API_URL}/cleaned_bibliometric_data`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cleaned bibliometric data:', error);
    throw error;
  }
};

// 🔬 CrossRef Data
export const getCrossrefDataMultipleSubjects = async () => {
  try {
    const response = await axios.get(`${API_URL}/crossref_data_multiple_subjects`);
    return response.data;
  } catch (error) {
    console.error('Error fetching crossref data:', error);
    throw error;
  }
};

// 🎓 Google Scholar Data
export const getGoogleScholarData = async () => {
  try {
    const response = await axios.get(`${API_URL}/google_scholar_data`);
    return response.data;
  } catch (error) {
    console.error('Error fetching google scholar data:', error);
    throw error;
  }
};

// 🌐 OpenAlex Data
export const getOpenalexData = async () => {
  try {
    const response = await axios.get(`${API_URL}/openalex_data`);
    return response.data;
  } catch (error) {
    console.error('Error fetching openalex data:', error);
    throw error;
  }
};

// 📚 Scopus Data
export const getScopusData = async () => {
  try {
    const response = await axios.get(`${API_URL}/scopus_data`);
    return response.data;
  } catch (error) {
    console.error('Error fetching scopus data:', error);
    throw error;
  }
};

// 📘 Scopus Data (September Version)
export const getScopusDataSept = async () => {
  try {
    const response = await axios.get(`${API_URL}/scopus_data_sept`);
    return response.data;
  } catch (error) {
    console.error('Error fetching scopus data sept:', error);
    throw error;
  }
};

// 🎥 (Optional) YouTube Bibliometrics Data
export const getBibliometricVideos = async () => {
  try {
    const response = await axios.get(`${API_URL}/youtube_bibliometrics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw error;
  }
};

export const getBibliometricMetrics = async (query) => {
  try {
    // First get all the search results
    const searchResults = await search(query);
    
    // If we have results, process them into metrics
    if (searchResults && searchResults.length > 0) {
      const metrics = processMetricsData(searchResults);
      
      // Calculate summary metrics
      const scholarlyWorks = searchResults.length;
      const worksCited = searchResults.reduce((sum, item) => {
        return sum + (item.cited_by || item.citations || item.citation_count || 0);
      }, 0);
      const frequentlyCited = searchResults.filter(item => {
        return (item.cited_by || item.citations || item.citation_count || 0) > 10;
      }).length;
      
      return {
        ...metrics,
        scholarlyWorks,
        worksCited,
        frequentlyCited
      };
    }
    
    // Return empty/default values if no results
    return {
      citationTrends: [],
      topAuthors: [],
      publicationDistribution: [],
      scholarlyWorks: 0,
      worksCited: 0,
      frequentlyCited: 0
    };
    
  } catch (error) {
    console.error('Error fetching bibliometric metrics:', error);
    return {
      citationTrends: [],
      topAuthors: [],
      publicationDistribution: [],
      scholarlyWorks: 0,
      worksCited: 0,
      frequentlyCited: 0
    };
  }
};