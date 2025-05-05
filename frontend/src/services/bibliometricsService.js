import axiosInstance from './axiosInstance';

// Cache setup with improved timeout logic
const searchCache = new Map();
const paperDetailsCache = new Map();
const metricsCache = new Map();
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * Safely process metrics data from search results
 * @param {Array} data - Array of search results
 * @returns {Object} Processed metrics
 */
const processMetricsData = (data) => {
  // Safe default values
  const defaultMetrics = {
    citationTrends: [],
    topAuthors: [{ name: "No author data", citations: 0 }],
    publicationDistribution: [{ name: "No publication data", count: 0 }],
    scholarlyWorks: 0,
    worksCited: 0,
    frequentlyCited: 0
  };
  
  // Make sure data is always an array
  const dataArray = Array.isArray(data) ? data : [];
  
  if (dataArray.length === 0) {
    // Return defaults with placeholder time series for empty data
    return {
      ...defaultMetrics,
      citationTrends: generatePlaceholderTimeSeries()
    };
  }
  
  try {
    // Process citation trends
    const yearCitations = {};
    
    dataArray.forEach(item => {
      try {
        // Extract year, with fallbacks
        let year = null;
        if (item.year) {
          year = String(item.year).match(/\d{4}/)?.[0] || String(item.year).substring(0, 4);
        } else if (item.publication_year) {
          year = String(item.publication_year).match(/\d{4}/)?.[0] || 
                 String(item.publication_year).substring(0, 4);
        } else if (item.published) {
          year = String(item.published).match(/\d{4}/)?.[0] || 
                 String(item.published).substring(0, 4);
        }
        
        // Extract citations, with fallbacks
        let citations = 0;
        if (item.cited_by !== undefined && item.cited_by !== null) {
          citations = Number(item.cited_by) || 0;
        } else if (item.citations !== undefined && item.citations !== null) {
          citations = Number(item.citations) || 0;
        } else if (item.citation_count !== undefined && item.citation_count !== null) {
          citations = Number(item.citation_count) || 0;
        }
        
        // Add to yearly totals if we have a valid year
        if (year && /^\d{4}$/.test(year)) {
          yearCitations[year] = (yearCitations[year] || 0) + citations;
        }
      } catch (e) {
        console.error('Error processing citation trend item:', e);
      }
    });
    // Convert to array and sort chronologically
    const citationTrends = Object.entries(yearCitations)
      .map(([year, citations]) => ({ year, citations }))
      .sort((a, b) => a.year.localeCompare(b.year));
    
    // Process authors
    const authorMap = {};
    
    dataArray.forEach(item => {
      try {
        // Extract authors, normalizing different formats
        let authorList = [];
        const authors = item.author || item.authors || item.author_name || '';
        
        if (typeof authors === 'string') {
          authorList = authors.split(',').map(a => a.trim()).filter(Boolean);
        } else if (Array.isArray(authors)) {
          authorList = authors
            .map(a => typeof a === 'string' ? a.trim() : 
              (a && typeof a === 'object' ? (a.name || a.full_name || a.author_name || '') : ''))
            .filter(Boolean);
        }
        
        // Extract citations as above
        let citations = 0;
        if (item.cited_by !== undefined && item.cited_by !== null) {
          citations = Number(item.cited_by) || 0;
        } else if (item.citations !== undefined && item.citations !== null) {
          citations = Number(item.citations) || 0;
        } else if (item.citation_count !== undefined && item.citation_count !== null) {
          citations = Number(item.citation_count) || 0;
        }
        
        // Add citations to each author
        authorList.forEach(author => {
          if (author && author !== 'N/A') {
            authorMap[author] = (authorMap[author] || 0) + citations;
          }
        });
      } catch (e) {
        console.error('Error processing author item:', e);
      }
    });
    
    // Convert to array and sort by citation count
    const topAuthors = Object.entries(authorMap)
      .map(([name, citations]) => ({ name, citations }))
      .sort((a, b) => b.citations - a.citations)
      .slice(0, 5);
    
    // Process publication sources
    const sourceMap = {};
    
    dataArray.forEach(item => {
      try {
        // Normalize source field with fallbacks
        const source = item.journal || item.publisher || item.source || 'Unknown';
        sourceMap[source] = (sourceMap[source] || 0) + 1;
      } catch (e) {
        console.error('Error processing publication source item:', e);
      }
    });
    
    // Convert to array and sort by count
    const publicationDistribution = Object.entries(sourceMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate total citations and frequently cited papers
    let worksCited = 0;
    let frequentlyCited = 0;
    
    dataArray.forEach(item => {
      let citations = 0;
      if (item.cited_by !== undefined && item.cited_by !== null) {
        citations = Number(item.cited_by) || 0;
      } else if (item.citations !== undefined && item.citations !== null) {
        citations = Number(item.citations) || 0;
      } else if (item.citation_count !== undefined && item.citation_count !== null) {
        citations = Number(item.citation_count) || 0;
      }
      
      worksCited += citations;
      if (citations > 10) {
        frequentlyCited++;
      }
    });
    
    // Combine everything into the final metrics object
    return {
      citationTrends: citationTrends.length > 0 ? citationTrends : generatePlaceholderTimeSeries(),
      topAuthors: topAuthors.length > 0 ? topAuthors : defaultMetrics.topAuthors,
      publicationDistribution: publicationDistribution.length > 0 
        ? publicationDistribution 
        : defaultMetrics.publicationDistribution,
      scholarlyWorks: dataArray.length,
      worksCited,
      frequentlyCited
    };
  } catch (error) {
    console.error('Error processing metrics data, using defaults:', error);
    return {
      ...defaultMetrics,
      citationTrends: generatePlaceholderTimeSeries()
    };
  }
};

/**
 * Generate placeholder time series for empty data
 * @returns {Array} Array of year/citation objects
 */
const generatePlaceholderTimeSeries = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => ({
    year: (currentYear - 4 + i).toString(),
    citations: 0
  }));
};

/**
 * Search for publications with improved error handling and caching
 * @param {string} query - Search query
 * @param {string} type - Search type
 * @param {number} page - Page number
 * @param {number} perPage - Results per page
 * @param {boolean} includeExternal - Include external sources
 * @param {Object} additionalParams - Additional search parameters
 * @returns {Promise<Object>} Search results and metadata
 */
export const search = async (query, type = 'all', page = 1, perPage = 20, includeExternal = true, additionalParams = {}) => {
  if (!query || typeof query !== 'string') {
    return {
      results: [],
      total: 0,
      page: 1,
      per_page: perPage,
      external_apis_used: false
    };
  }
  
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return {
      results: [],
      total: 0,
      page: 1,
      per_page: perPage,
      external_apis_used: false
    };
  }
  
  // Ensure perPage is a number
  const numPerPage = parseInt(perPage, 10) || 20;
  
  // Create a unique cache key that includes all parameters
  const cacheKey = `${normalizedQuery}-${type}-${page}-${numPerPage}-${includeExternal}-${JSON.stringify(additionalParams)}`;
  
  if (searchCache.has(cacheKey)) {
    console.log("Returning cached search results");
    return searchCache.get(cacheKey);
  }

  try {
    console.log(`Searching for "${normalizedQuery}" (page ${page}, perPage ${numPerPage})`);
    
    // Add a timeout parameter to reduce long-waiting requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Search request timed out')), 30000); // 30-second timeout
    });
    
    // Prepare search parameters
    const searchParams = { 
      query: normalizedQuery,
      page,
      per_page: numPerPage,
      include_external: includeExternal,
      t: Date.now() // Add timestamp to avoid stale cache issues
    };
    
    // Add any additional params from the filters
    if (additionalParams) {
      Object.assign(searchParams, additionalParams);
    }
    
    if (type !== 'all') {
      searchParams.source = type;
    }
    
    console.log("Search parameters:", searchParams);
    
    // The actual search request
    const searchPromise = axiosInstance.get('/search', {
      params: searchParams,
      // Increase timeout to handle potentially slow database queries
      timeout: 25000 // 25-second timeout
    });
    
    // Race the promises to implement timeout
    const response = await Promise.race([searchPromise, timeoutPromise]);

    if (response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }

    // Ensure we have a valid response structure
    if (!response.data) {
      throw new Error('Invalid response structure');
    }
    
    console.log(`Received ${response.data.results?.length || 0} results from API, total: ${response.data.total || 0}`);
    
    // Make sure results is always an array
    const results = Array.isArray(response.data.results) ? response.data.results : [];
    
    // Create normalized response
    const normalizedResponse = {
      ...response.data,
      results,
      total: response.data.total || results.length,
      page: response.data.page || page,
      per_page: response.data.per_page || numPerPage,
      external_apis_used: response.data.external_apis_used || false
    };

    // Store result in cache with expiration
    searchCache.set(cacheKey, normalizedResponse);
    setTimeout(() => searchCache.delete(cacheKey), CACHE_TIMEOUT);

    return normalizedResponse;
  } catch (error) {
    console.error('Search failed:', error);
    
    // Return standardized error response
    return {
      error: error.message || 'Search failed',
      results: [],
      total: 0,
      page: page,
      per_page: numPerPage,
      external_apis_used: false
    };
  }
};

/**
 * Get details for a specific paper with improved caching
 * @param {string} id - Paper ID
 * @param {string} source - Source of the paper
 * @returns {Promise<Object>} Paper details
 */
export const getPaperDetails = async (id, source) => {
  if (!id) {
    return null;
  }
  
  const cacheKey = `${id}-${source || ''}`;
  
  if (paperDetailsCache.has(cacheKey)) {
    return paperDetailsCache.get(cacheKey);
  }

  try {
    const response = await axiosInstance.get('/paper_details', {
      params: { 
        id, 
        source,
        t: Date.now() // Add timestamp to avoid stale cache
      },
      timeout: 15000 // 15-second timeout
    });
    
    if (!response.data) {
      throw new Error('Invalid response');
    }
    
    paperDetailsCache.set(cacheKey, response.data);
    setTimeout(() => paperDetailsCache.delete(cacheKey), CACHE_TIMEOUT);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching paper details:', error);
    return null;
  }
};

/**
 * Get bibliometric metrics for a search query with improved error handling
 * @param {string} query - Search query
 * @param {string} type - Search type
 * @returns {Promise<Object>} Metrics data
 */
export const getBibliometricMetrics = async (query, type = 'all') => {
  if (!query || typeof query !== 'string') {
    return {
      citationTrends: generatePlaceholderTimeSeries(),
      topAuthors: [{ name: "No data available", citations: 0 }],
      publicationDistribution: [{ name: "No data available", count: 0 }],
      scholarlyWorks: 0,
      worksCited: 0,
      frequentlyCited: 0
    };
  }
  
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return {
      citationTrends: generatePlaceholderTimeSeries(),
      topAuthors: [{ name: "No data available", citations: 0 }],
      publicationDistribution: [{ name: "No data available", count: 0 }],
      scholarlyWorks: 0,
      worksCited: 0,
      frequentlyCited: 0
    };
  }
  
  const cacheKey = `${normalizedQuery}-${type}`;
  
  if (metricsCache.has(cacheKey)) {
    return metricsCache.get(cacheKey);
  }

  try {
    // Try to get metrics from the API first
    const response = await axiosInstance.get('/metrics', {
      params: { 
        query: normalizedQuery,
        t: Date.now() // Add timestamp to avoid stale cache
      },
      timeout: 15000 // 15-second timeout
    });
    
    if (response.data && !response.data.error) {
      // If API returned metrics, use them
      const apiMetrics = response.data;
      
      // Ensure the metrics have the expected structure
      const validatedMetrics = {
        citationTrends: apiMetrics.citation_trends || generatePlaceholderTimeSeries(),
        topAuthors: apiMetrics.top_authors || [{ name: "No author data", citations: 0 }],
        publicationDistribution: apiMetrics.publication_distribution || [{ name: "No publication data", count: 0 }],
        scholarlyWorks: apiMetrics.scholarlyWorks || 0,
        worksCited: apiMetrics.worksCited || 0,
        frequentlyCited: apiMetrics.frequentlyCited || 0
      };
      
      // Cache the metrics
      metricsCache.set(cacheKey, validatedMetrics);
      setTimeout(() => metricsCache.delete(cacheKey), CACHE_TIMEOUT);
      
      return validatedMetrics;
    }
    
    // Fallback: Calculate metrics from search results
    const searchResults = await search(normalizedQuery, type, 1, 50, true);
    
    // Get results array, handling potential error
    const results = searchResults.error ? 
      (Array.isArray(searchResults.results) ? searchResults.results : []) : 
      (searchResults.results || []);

    // Process metrics from results
    const metrics = processMetricsData(results);
    
    // Cache the metrics
    metricsCache.set(cacheKey, metrics);
    setTimeout(() => metricsCache.delete(cacheKey), CACHE_TIMEOUT);
    
    return metrics;
  } catch (error) {
    console.error('Error fetching metrics:', error);
    
    // Return fallback metrics
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

// Additional data retrieval functions
export const getSummaryById = async (id) => {
  try {
    const response = await axiosInstance.get('/summary', {
      params: {
        id,
        t: Date.now()
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching work summary:', error);
    return null;
  }
};

export const getCleanedBibliometricData = async () => {
  try {
    const response = await axiosInstance.get('/cleaned_bibliometric_data');
    return response.data;
  } catch (error) {
    console.error('Error fetching cleaned bibliometric data:', error);
    return [];
  }
};

export const getCrossrefDataMultipleSubjects = async () => {
  try {
    const response = await axiosInstance.get('/crossref_data_multiple_subjects');
    return response.data;
  } catch (error) {
    console.error('Error fetching crossref data:', error);
    return [];
  }
};

export const getGoogleScholarData = async () => {
  try {
    const response = await axiosInstance.get('/google_scholar_data');
    return response.data;
  } catch (error) {
    console.error('Error fetching google scholar data:', error);
    return [];
  }
};

export const getOpenalexData = async () => {
  try {
    const response = await axiosInstance.get('/openalex_data');
    return response.data;
  } catch (error) {
    console.error('Error fetching openalex data:', error);
    return [];
  }
};

export const getScopusData = async () => {
  try {
    const response = await axiosInstance.get('/scopus_data');
    return response.data;
  } catch (error) {
    console.error('Error fetching scopus data:', error);
    return [];
  }
};

export const getScopusDataSept = async () => {
  try {
    const response = await axiosInstance.get('/scopus_data_sept');
    return response.data;
  } catch (error) {
    console.error('Error fetching scopus data sept:', error);
    return [];
  }
};

export const getBibliometricVideos = async () => {
  try {
    const response = await axiosInstance.get('/youtube_bibliometrics');
    return response.data;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
};