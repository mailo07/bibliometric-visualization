import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const processMetricsData = (data) => {
  // Make sure data is an array
  const dataArray = Array.isArray(data) ? data : [];
  
  // Process citation trends with more robust property access
  const citationTrends = dataArray.reduce((acc, item) => {
    const year = item.year || item.publication_year || item.published || '';
    if (year) {
      // Extract first 4 digits for year (handles both date strings and numbers)
      const yearStr = String(year).match(/\d{4}/)?.[0] || String(year).substring(0, 4);
      if (yearStr && /^\d{4}$/.test(yearStr)) {
        const citations = Number(item.cited_by || item.citations || item.citation_count || 0);
        const existing = acc.find(x => x.year === yearStr);
        if (existing) {
          existing.citations += citations;
        } else {
          acc.push({
            year: yearStr,
            citations: citations
          });
        }
      }
    }
    return acc;
  }, []).sort((a, b) => a.year.localeCompare(b.year));

  // Process author data with more robust handling
  const authorMap = dataArray.reduce((map, item) => {
    let authors = item.author || item.authors || item.author_name || '';
    let authorList = [];
    
    // Handle different author formats (string, array, comma-separated)
    if (typeof authors === 'string') {
      authorList = authors.split(',').map(a => a.trim());
    } else if (Array.isArray(authors)) {
      authorList = authors.map(a => typeof a === 'string' ? a.trim() : 
                             (a.name || a.full_name || a.author_name || ''));
    }
    
    const citations = Number(item.cited_by || item.citations || item.citation_count || 0);

    authorList.forEach(author => {
      if (author && author !== 'N/A') {
        if (!map[author]) {
          map[author] = 0;
        }
        map[author] += citations;
      }
    });
    
    return map;
  }, {});

  // Create top authors array with meaningful default if empty
  let topAuthors = Object.entries(authorMap)
    .map(([name, citations]) => ({ name, citations }))
    .sort((a, b) => b.citations - a.citations)
    .slice(0, 5);
    
  // Add placeholder data if no authors found
  if (topAuthors.length === 0) {
    topAuthors = [{ name: "No author data", citations: 0 }];
  }

  // Process publication sources with more robust handling
  const sourceMap = dataArray.reduce((map, item) => {
    const source = item.journal || item.publisher || item.source || 'Unknown';
    if (!map[source]) {
      map[source] = 0;
    }
    map[source]++;
    return map;
  }, {});

  // Create publication distribution with meaningful default if empty
  let publicationDistribution = Object.entries(sourceMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
    
  // Add placeholder data if no publications found
  if (publicationDistribution.length === 0) {
    publicationDistribution = [{ name: "No publication data", count: 0 }];
  }

  // If citation trends is empty, add some placeholder data to show the chart structure
  if (citationTrends.length === 0) {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      citationTrends.push({
        year: (currentYear - 4 + i).toString(),
        citations: 0
      });
    }
  }

  return {
    citationTrends,
    topAuthors,
    publicationDistribution
  };
};

// Helper function to generate placeholder time series data
const generatePlaceholderTimeSeries = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 5; i++) {
    years.push({
      year: (currentYear - 4 + i).toString(),
      citations: 0
    });
  }
  return years;
};

export const search = async (query, type = 'all') => {
  try {
    let endpoint = '/search';
    if (type === 'authors') endpoint = '/search/authors';
    else if (type === 'fields') endpoint = '/search/fields';
    else if (type === 'works') endpoint = '/search/works';

    const response = await axios.get(`${API_URL}${endpoint}`, {
      params: { query },
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching search data:', error);
    throw error;
  }
};

export const getSummaryById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/work_summary/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching work summary:', error);
    throw error;
  }
};

export const getCleanedBibliometricData = async () => {
  try {
    const response = await axios.get(`${API_URL}/cleaned_bibliometric_data`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cleaned bibliometric data:', error);
    throw error;
  }
};

export const getCrossrefDataMultipleSubjects = async () => {
  try {
    const response = await axios.get(`${API_URL}/crossref_data_multiple_subjects`);
    return response.data;
  } catch (error) {
    console.error('Error fetching crossref data:', error);
    throw error;
  }
};

export const getGoogleScholarData = async () => {
  try {
    const response = await axios.get(`${API_URL}/google_scholar_data`);
    return response.data;
  } catch (error) {
    console.error('Error fetching google scholar data:', error);
    throw error;
  }
};

export const getOpenalexData = async () => {
  try {
    const response = await axios.get(`${API_URL}/openalex_data`);
    return response.data;
  } catch (error) {
    console.error('Error fetching openalex data:', error);
    throw error;
  }
};

export const getScopusData = async () => {
  try {
    const response = await axios.get(`${API_URL}/scopus_data`);
    return response.data;
  } catch (error) {
    console.error('Error fetching scopus data:', error);
    throw error;
  }
};

export const getScopusDataSept = async () => {
  try {
    const response = await axios.get(`${API_URL}/scopus_data_sept`);
    return response.data;
  } catch (error) {
    console.error('Error fetching scopus data sept:', error);
    throw error;
  }
};

export const getBibliometricVideos = async () => {
  try {
    const response = await axios.get(`${API_URL}/youtube_bibliometrics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw error;
  }
};

export const getBibliometricMetrics = async (query, type = 'all') => {
  try {
    const searchResults = await search(query, type);
    
    // Ensure search results is an array
    const resultsArray = Array.isArray(searchResults) ? searchResults : [];

    if (resultsArray.length > 0) {
      const metrics = processMetricsData(resultsArray);
      
      const scholarlyWorks = resultsArray.length;
      const worksCited = resultsArray.reduce((sum, item) => {
        return sum + Number(item.cited_by || item.citations || item.citation_count || 0);
      }, 0);
      const frequentlyCited = resultsArray.filter(item => {
        return Number(item.cited_by || item.citations || item.citation_count || 0) > 10;
      }).length;
      
      return {
        ...metrics,
        scholarlyWorks,
        worksCited,
        frequentlyCited
      };
    }

    // Return default data structure with empty arrays and placeholders
    return {
      citationTrends: generatePlaceholderTimeSeries(),
      topAuthors: [{ name: "No data available", citations: 0 }],
      publicationDistribution: [{ name: "No data available", count: 1 }],
      scholarlyWorks: 0,
      worksCited: 0,
      frequentlyCited: 0
    };
  } catch (error) {
    console.error('Error fetching bibliometric metrics:', error);
    // Return default data structure even on error
    return {
      citationTrends: generatePlaceholderTimeSeries(),
      topAuthors: [{ name: "Error loading data", citations: 0 }],
      publicationDistribution: [{ name: "Error loading data", count: 1 }],
      scholarlyWorks: 0,
      worksCited: 0,
      frequentlyCited: 0
    };
  }
};

// Get all users with filtering, pagination and search
export const getUsers = async (page = 1, limit = 10, status = '', search = '') => {
  try {
    const response = await axios.get(`${API_URL}/users`, {
      params: {
        page,
        limit,
        status,
        search
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Delete a user by ID
export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Update user status
export const updateUserStatus = async (userId, status) => {
  try {
    const response = await axios.patch(`${API_URL}/users/${userId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

// Update user role
export const updateUserRole = async (userId, role) => {
  try {
    const response = await axios.patch(`${API_URL}/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};