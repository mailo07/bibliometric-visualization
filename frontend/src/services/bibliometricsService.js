import axiosInstance from './axiosInstance';

// Cache setup
const searchCache = new Map();
const paperDetailsCache = new Map();
const metricsCache = new Map();

const processMetricsData = (data) => {
  const dataArray = Array.isArray(data) ? data : [];
  
  const citationTrends = dataArray.reduce((acc, item) => {
    const year = item.year || item.publication_year || item.published || '';
    if (year) {
      const yearStr = String(year).match(/\d{4}/)?.[0] || String(year).substring(0, 4);
      if (yearStr && /^\d{4}$/.test(yearStr)) {
        const citations = Number(item.cited_by || item.citations || item.citation_count || 0);
        const existing = acc.find(x => x.year === yearStr);
        if (existing) {
          existing.citations += citations;
        } else {
          acc.push({ year: yearStr, citations });
        }
      }
    }
    return acc;
  }, []).sort((a, b) => a.year.localeCompare(b.year));

  const authorMap = dataArray.reduce((map, item) => {
    let authors = item.author || item.authors || item.author_name || '';
    let authorList = [];
    
    if (typeof authors === 'string') {
      authorList = authors.split(',').map(a => a.trim());
    } else if (Array.isArray(authors)) {
      authorList = authors.map(a => typeof a === 'string' ? a.trim() : 
                             (a.name || a.full_name || a.author_name || ''));
    }
    
    const citations = Number(item.cited_by || item.citations || item.citation_count || 0);

    authorList.forEach(author => {
      if (author && author !== 'N/A') map[author] = (map[author] || 0) + citations;
    });
    
    return map;
  }, {});

  let topAuthors = Object.entries(authorMap)
    .map(([name, citations]) => ({ name, citations }))
    .sort((a, b) => b.citations - a.citations)
    .slice(0, 5);
    
  if (topAuthors.length === 0) {
    topAuthors = [{ name: "No author data", citations: 0 }];
  }

  const sourceMap = dataArray.reduce((map, item) => {
    const source = item.journal || item.publisher || item.source || 'Unknown';
    map[source] = (map[source] || 0) + 1;
    return map;
  }, {});

  let publicationDistribution = Object.entries(sourceMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
    
  if (publicationDistribution.length === 0) {
    publicationDistribution = [{ name: "No publication data", count: 0 }];
  }

  if (citationTrends.length === 0) {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      citationTrends.push({ year: (currentYear - 4 + i).toString(), citations: 0 });
    }
  }

  return { citationTrends, topAuthors, publicationDistribution };
};

const generatePlaceholderTimeSeries = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => ({
    year: (currentYear - 4 + i).toString(),
    citations: 0
  }));
};

export const search = async (query, type = 'all', page = 1, perPage = 10, includeExternal = true) => {
  const cacheKey = `${query}-${type}-${page}-${perPage}-${includeExternal}`;
  
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  try {
    const response = await axiosInstance.get('/search', {
      params: { 
        query: query.trim(),
        page,
        per_page: perPage,
        include_external: includeExternal
      }
    });

    if (response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }

    if (!response.data?.results) {
      throw new Error('Invalid response structure');
    }

    searchCache.set(cacheKey, response.data);
    setTimeout(() => searchCache.delete(cacheKey), 300000);

    return response.data;
  } catch (error) {
    console.error('Search failed:', error);
    if (error.response?.data) {
      return {
        ...error.response.data,
        results: [],
        total: 0,
        page: 1,
        per_page: perPage,
        external_apis_used: false
      };
    }
    return {
      error: 'Network error',
      message: error.message,
      results: [],
      total: 0,
      page: 1,
      per_page: perPage,
      external_apis_used: false
    };
  }
};

export const getPaperDetails = async (id, source) => {
  const cacheKey = `${id}-${source}`;
  
  if (paperDetailsCache.has(cacheKey)) {
    return paperDetailsCache.get(cacheKey);
  }

  try {
    const response = await axiosInstance.get('/paper_details', {
      params: { id, source }
    });
    
    paperDetailsCache.set(cacheKey, response.data);
    setTimeout(() => paperDetailsCache.delete(cacheKey), 300000);
    return response.data;
  } catch (error) {
    console.error('Error fetching paper details:', error);
    throw error;
  }
};

export const getBibliometricMetrics = async (query, type = 'all') => {
  const cacheKey = `${query}-${type}`;
  
  if (metricsCache.has(cacheKey)) {
    return metricsCache.get(cacheKey);
  }

  try {
    const searchResults = await search(query, type);
    if (searchResults.error) {
      throw new Error(searchResults.message);
    }

    const metrics = processMetricsData(searchResults.results);
    
    const result = {
      ...metrics,
      scholarlyWorks: searchResults.results.length,
      worksCited: searchResults.results.reduce((sum, item) => sum + (item.citation_count || 0), 0),
      frequentlyCited: searchResults.results.filter(item => (item.citation_count || 0) > 10).length
    };
    
    metricsCache.set(cacheKey, result);
    setTimeout(() => metricsCache.delete(cacheKey), 300000);
    return result;
  } catch (error) {
    console.error('Error fetching metrics:', error);
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

export const getSummaryById = async (id) => {
  try {
    const response = await axiosInstance.get(`/work_summary/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching work summary:', error);
    throw error;
  }
};

export const getCleanedBibliometricData = async () => {
  try {
    const response = await axiosInstance.get('/cleaned_bibliometric_data');
    return response.data;
  } catch (error) {
    console.error('Error fetching cleaned bibliometric data:', error);
    throw error;
  }
};

export const getCrossrefDataMultipleSubjects = async () => {
  try {
    const response = await axiosInstance.get('/crossref_data_multiple_subjects');
    return response.data;
  } catch (error) {
    console.error('Error fetching crossref data:', error);
    throw error;
  }
};

export const getGoogleScholarData = async () => {
  try {
    const response = await axiosInstance.get('/google_scholar_data');
    return response.data;
  } catch (error) {
    console.error('Error fetching google scholar data:', error);
    throw error;
  }
};

export const getOpenalexData = async () => {
  try {
    const response = await axiosInstance.get('/openalex_data');
    return response.data;
  } catch (error) {
    console.error('Error fetching openalex data:', error);
    throw error;
  }
};

export const getScopusData = async () => {
  try {
    const response = await axiosInstance.get('/scopus_data');
    return response.data;
  } catch (error) {
    console.error('Error fetching scopus data:', error);
    throw error;
  }
};

export const getScopusDataSept = async () => {
  try {
    const response = await axiosInstance.get('/scopus_data_sept');
    return response.data;
  } catch (error) {
    console.error('Error fetching scopus data sept:', error);
    throw error;
  }
};

export const getBibliometricVideos = async () => {
  try {
    const response = await axiosInstance.get('/youtube_bibliometrics');
    return response.data;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw error;
  }
};