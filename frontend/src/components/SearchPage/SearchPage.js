import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { search, getBibliometricMetrics, getPaperDetails } from '../../services/bibliometricsService';
import NetworkGraph from './NetworkGraph';
import Preloader from './Preloader';
import Sidebar from './Sidebar';
import LeftMenu from './LeftMenu';
import Pagination from './Pagination';
import SummaryTab from './SummaryTab';
import CitationMetrics from './CitationMetrics';
import SourceDebugger from './SourceDebugger';
import './SearchPage.css';

const SearchPage = () => {
  const [activeTab, setActiveTab] = useState('scholarlyWorks');
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState({ scholarlyWorks: 0, worksCited: 0, frequentlyCited: 0 });
  const [resultsPerPage, setResultsPerPage] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabTransition, setTabTransition] = useState(false);
  const [resultsTransition, setResultsTransition] = useState(false);
  const [bibliometricCharts, setBibliometricCharts] = useState({ 
    citationTrends: [], 
    topAuthors: [], 
    publicationDistribution: [] 
  });
  const [selectedWork, setSelectedWork] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({
    authorFilter: '',
    subjectFilter: '',
    dateRange: { start: '', end: '' },
    journalFilter: '',
    titleFilter: '',
    publisherFilter: '',
    identifierTypes: {
      doi: false,
      pmid: false,
      pmcid: false,
      arxiv: false,
      isbn: false
    }
  });

  // Get initial query from URL parameters - fixed dependency
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []); 
  const query = useMemo(() => queryParams.get('query') || '', [queryParams]);
  const pageParam = useMemo(() => parseInt(queryParams.get('page'), 10) || 1, [queryParams]);
  
  useEffect(() => { 
    setSearchQuery(query);
    if (pageParam !== currentPage) {
      setCurrentPage(pageParam);
    }
  }, [query, pageParam, currentPage]);
  
  // Enhanced fetchSearchResults function with better per_page handling
  const fetchSearchResults = useCallback(async (searchTerm, page = 1, additionalFilters = {}) => { 
    setLoading(true);
    setError(null);
    
    console.log(`Fetching search results for "${searchTerm}" on page ${page} with per_page=${resultsPerPage}`);
    console.log("Additional filters:", additionalFilters);
    
    try { 
      // Explicitly include the per_page parameter
      const searchParams = {
        page,
        per_page: resultsPerPage,
        include_external: true,
        ...additionalFilters
      };
      
      console.log("Final search params:", searchParams);
      
      const response = await search(searchTerm, 'all', page, resultsPerPage, true, searchParams);
      console.log("API response:", response);
      
      // Process results with proper fallbacks
      const processedResults = (response?.results || []).map(item => ({
        ...item,
        id: item.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
        title: item.title || 'Untitled',
        author: typeof item.author === 'string' ? item.author : 
               (Array.isArray(item.authors) ? item.authors.join(', ') : 'Unknown Author'),
        published: item.year || item.published || '',
        journal: item.journal || item.source || '',
        citation_count: item.citations || 0,
        abstract: item.abstract || '',
        doi: item.doi || '',
        source: item.source || 'unknown'
      }));

      console.log(`Processed ${processedResults.length} results`);
      setData(processedResults);
      setCurrentPage(page);
      
      // Use metrics from response or calculate fallback
      const responseMetrics = response?.metrics || {};
      setMetrics({
        scholarlyWorks: responseMetrics.scholarlyWorks || processedResults.length,
        worksCited: responseMetrics.worksCited || 
                   processedResults.reduce((sum, item) => sum + (parseInt(item.citation_count) || 0), 0),
        frequentlyCited: responseMetrics.frequentlyCited || 
                        processedResults.filter(item => (parseInt(item.citation_count) || 0) > 10).length
      });

      // Update charts with actual data
      setBibliometricCharts({
        citationTrends: responseMetrics.citation_trends || [],
        topAuthors: responseMetrics.top_authors || [],
        publicationDistribution: responseMetrics.publication_distribution || []
      });
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed');
      setData([]);
      setMetrics({ scholarlyWorks: 0, worksCited: 0, frequentlyCited: 0 });
      setBibliometricCharts({ 
        citationTrends: [], 
        topAuthors: [], 
        publicationDistribution: [] 
      });
    } finally {
      setLoading(false);
    }
  }, [resultsPerPage]);
  
  const fetchBibliometricMetrics = useCallback(async (searchTerm) => {
    try { 
      const chartsData = await getBibliometricMetrics(searchTerm);
      setBibliometricCharts(chartsData);
    } catch (error) {
      console.error('Failed to fetch bibliometric metrics:', error);
    }
  }, []);
  
  useEffect(() => {
    if (query) {
      // Include any URL filter params that might be present
      const filters = {};
      if (queryParams.get('year_from')) filters.year_from = queryParams.get('year_from');
      if (queryParams.get('year_to')) filters.year_to = queryParams.get('year_to');
      if (queryParams.get('author')) filters.authorFilter = queryParams.get('author');
      if (queryParams.get('journal')) filters.journalFilter = queryParams.get('journal');
      
      // Explicitly add per_page to filters
      filters.per_page = resultsPerPage;
      
      fetchSearchResults(query, pageParam, filters);
      fetchBibliometricMetrics(query);
    }
  }, [fetchSearchResults, fetchBibliometricMetrics, query, pageParam, queryParams, resultsPerPage]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const newUrl = `${window.location.pathname}?query=${encodeURIComponent(searchQuery.trim())}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      fetchSearchResults(searchQuery.trim(), 1, { per_page: resultsPerPage });
      fetchBibliometricMetrics(searchQuery.trim());
      setSelectedWork(null);
      setCurrentPage(1);
    }
  };
  
  const handleWorkSelection = async (work) => {
    try {
      setLoading(true);
      console.log("Selected work:", work);
      const details = await getPaperDetails(work.id || work.title, work.source);
      console.log("Paper details:", details);
      setSelectedWork({ ...work, ...details });
      handleTabSwitch('citation');
    } catch (error) {
      console.error('Failed to fetch paper details:', error);
      setSelectedWork(work);
      handleTabSwitch('citation');
    } finally {
      setLoading(false);
    }
  };
  
  const resetSelectedWork = () => {
    setSelectedWork(null);
  };
  
  // Apply filters from the sidebar
  const handleApplyFilters = (newFilters) => {
    console.log('Applying filters:', newFilters);
    setCurrentFilters(newFilters);
    // Reset to page 1 when filters change
    setCurrentPage(1);
    
    // Process filter values for backend
    const processedFilters = {...newFilters, per_page: resultsPerPage};
    
    // Apply year range formatting if needed
    if (newFilters.dateRange) {
      if (newFilters.dateRange.start) {
        processedFilters.year_from = newFilters.dateRange.start;
      }
      if (newFilters.dateRange.end) {
        processedFilters.year_to = newFilters.dateRange.end;
      }
    }
    
    // Now trigger a new search with the applied filters
    if (searchQuery.trim()) {
      const queryParams = new URLSearchParams(window.location.search);
      queryParams.set('query', searchQuery.trim());
      queryParams.set('page', '1'); // Reset to page 1 with new filters
      
      // Add filter parameters to URL
      if (processedFilters.year_from) queryParams.set('year_from', processedFilters.year_from);
      if (processedFilters.year_to) queryParams.set('year_to', processedFilters.year_to);
      if (processedFilters.authorFilter) queryParams.set('author', processedFilters.authorFilter);
      if (processedFilters.journalFilter) queryParams.set('journal', processedFilters.journalFilter);
      
      const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      fetchSearchResults(searchQuery.trim(), 1, processedFilters);
    }
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    const emptyFilters = {
      authorFilter: '',
      subjectFilter: '',
      dateRange: { start: '', end: '' },
      journalFilter: '',
      titleFilter: '',
      publisherFilter: '',
      identifierTypes: { doi: false, pmid: false, pmcid: false, arxiv: false, isbn: false },
      per_page: resultsPerPage
    };
    
    setCurrentFilters(emptyFilters);
    setCurrentPage(1);
    
    // Remove filter params from URL
    if (searchQuery.trim()) {
      const queryParams = new URLSearchParams();
      queryParams.set('query', searchQuery.trim());
      queryParams.set('page', '1');
      
      const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      
      // Reload search results without filters
      fetchSearchResults(searchQuery.trim(), 1, { per_page: resultsPerPage });
    }
  };
  
  // Apply clientside filters to search results
  const filteredData = useMemo(() => {
    console.log(`Client-side filtering ${data.length} results`);
    
    return data.filter((item) => {
      const { authorFilter, titleFilter, journalFilter, publisherFilter, dateRange, identifierTypes } = currentFilters;
      const authorMatch = !authorFilter || (item.author && item.author.toLowerCase().includes(authorFilter.toLowerCase()));
      const titleMatch = !titleFilter || (item.title && item.title.toLowerCase().includes(titleFilter.toLowerCase()));
      const journalMatch = !journalFilter || (item.journal && item.journal.toLowerCase().includes(journalFilter.toLowerCase()));
      const publisherMatch = !publisherFilter || (item.publisher && item.publisher.toLowerCase().includes(publisherFilter.toLowerCase()));
      
      // Date filtering
      let dateMatch = true;
      if (dateRange.start || dateRange.end) {
        // Extract year from published date
        const publishedYear = item.published ? parseInt(item.published.toString().substring(0, 4), 10) : 0;
        
        if (dateRange.start && dateRange.end) {
          const startYear = parseInt(dateRange.start, 10);
          const endYear = parseInt(dateRange.end, 10);
          dateMatch = publishedYear >= startYear && publishedYear <= endYear;
        } else if (dateRange.start) {
          const startYear = parseInt(dateRange.start, 10);
          dateMatch = publishedYear >= startYear;
        } else if (dateRange.end) {
          const endYear = parseInt(dateRange.end, 10);
          dateMatch = publishedYear <= endYear;
        }
      }
      
      // Identifier filtering
      const identifierMatch = !Object.values(identifierTypes).some(v => v) || (item.identifiers && (
          (identifierTypes.doi && item.identifiers.includes('doi')) || (identifierTypes.pmid && item.identifiers.includes('pmid')) ||
          (identifierTypes.pmcid && item.identifiers.includes('pmcid')) || (identifierTypes.arxiv && item.identifiers.includes('arxiv')) ||
          (identifierTypes.isbn && item.identifiers.includes('isbn'))
      ));
      return (authorMatch && titleMatch && journalMatch && publisherMatch && dateMatch && identifierMatch);
    });
  }, [data, currentFilters]);
  
  // Calculate total pages for pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / resultsPerPage));
  
  // Paginated data with memoization
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    console.log(`Paginating data: showing items ${startIndex}-${endIndex} of ${filteredData.length}`);
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, resultsPerPage]);
  
  // Enhanced page change handler
  const handlePageChange = (newPage) => {
    console.log(`Changing to page ${newPage}`);
    setCurrentPage(newPage);
    setResultsTransition(true);
    
    // Update URL to include page parameter
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('page', newPage.toString());
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    
    // Fetch results for the new page, including current filters
    if (searchQuery.trim()) {
      // Convert currentFilters to backend-compatible format
      const backendFilters = { 
        ...currentFilters,
        per_page: resultsPerPage
      };
      
      if (currentFilters.dateRange) {
        if (currentFilters.dateRange.start) {
          backendFilters.year_from = currentFilters.dateRange.start;
        }
        if (currentFilters.dateRange.end) {
          backendFilters.year_to = currentFilters.dateRange.end;
        }
      }
      
      fetchSearchResults(searchQuery.trim(), newPage, backendFilters);
    }
    
    // After transition effect
    setTimeout(() => { setResultsTransition(false); }, 300);
  };
  
  const navigateToHome = () => {
    window.location.href = '/';
  };
  
  const handleTabSwitch = (tab) => {
    if (activeTab !== tab) {
      setTabTransition(true);
      setTimeout(() => {
        setActiveTab(tab);
        setTimeout(() => { setTabTransition(false); }, 400);
      }, 400);
    }
  };
  
  const renderIdentifiers = (identifiers) => {
    if (!identifiers) return 'N/A';
    const parts = identifiers.split(',').map(part => part.trim());
    return parts.map((part, index) => {
      if (part.startsWith('https://')) {
        return (
          <React.Fragment key={index}>
            {index > 0 && ', '}
            <a href={part} className="identifier-link" target="_blank" rel="noopener noreferrer">
              {part}
            </a>
          </React.Fragment>
        );
      }
      return (
        <React.Fragment key={index}>
          {index > 0 && ', '}
          {part}
        </React.Fragment>
      );
    });
  };
  
  return (
    <div className="flex flex-col min-h-screen font-sans gradient-bg">
      <header className="bg-gradient-to-r from-indigo-700 to-purple-800 px-4 py-3 text-white flex items-center sticky top-0 z-50">
        <div className="flex-grow flex justify-center">
          <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <input 
              type="text" 
              placeholder="Search" 
              className="w-full bg-black/50 text-white placeholder-gray-400 rounded-full pl-4 pr-10 py-2 focus:outline-none" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
            <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
          
          {/* Results per page selector */}
          <div className="flex items-center ml-4">
            <label htmlFor="resultsPerPage" className="text-white mr-2 text-sm">Show:</label>
            <select 
              id="resultsPerPage"
              className="bg-black/50 text-white rounded px-2 py-1 text-sm focus:outline-none"
              value={resultsPerPage} 
              onChange={(e) => {
                const newValue = parseInt(e.target.value);
                setResultsPerPage(newValue);
                // Refetch with new per_page setting
                if (searchQuery.trim()) {
                  fetchSearchResults(searchQuery.trim(), 1, { ...currentFilters, per_page: newValue });
                }
              }}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
        <h1 className="ml-4 text-2xl font-bold">BIBLIOKNOW</h1>
      </header>
      <div className="flex flex-grow relative">
        <LeftMenu bibliometricCharts={bibliometricCharts} />
        <main className="main-column p-6">
          <CitationMetrics metrics={metrics} query={query} filteredData={filteredData} />
          <SourceDebugger data={data} />
          <div className="flex space-x-4 mb-4 border-b-2 border-gray-200">
            <button 
              className={`px-4 py-2 transition-all duration-800 ease-in-out ${activeTab === 'scholarlyWorks' ? 'border-b-2 border-purple-600 font-semibold text-purple-600' : 'text-gray-600 hover:text-purple-400'}`}
              onClick={() => handleTabSwitch('scholarlyWorks')}
            >
              Lists
            </button>
            <button 
              className={`px-4 py-2 transition-all duration-800 ease-in-out ${activeTab === 'citation' ? 'border-b-2 border-purple-600 font-semibold text-purple-600' : 'text-gray-600 hover:text-purple-400'}`}
              onClick={() => handleTabSwitch('citation')}
            >
              Summary
            </button>
            <button 
              className={`px-4 py-2 transition-all duration-800 ease-in-out ${activeTab === 'analysis' ? 'border-b-2 border-purple-600 font-semibold text-purple-600' : 'text-gray-600 hover:text-purple-400'}`}
              onClick={() => handleTabSwitch('analysis')}
            >
              Analysis
            </button>
          </div>
          
          {/* Enhanced loading indicator */}
          {loading && (
            <div className="relative">
              <Preloader />
              <p className="text-center text-gray-600 mt-4">
                Searching across multiple databases and APIs...
                <br />
                <span className="text-sm">This might take a moment for comprehensive results</span>
              </p>
            </div>
          )}
          
          {error && <p className="text-red-500 text-center">Error: {error}</p>}
          {!loading && !error && !query && data.length === 0 && (
            <div className="bg-white/90 shadow-md rounded p-4">
              <p className="text-gray-600">Enter a search query to see results</p>
            </div>
          )}
          <div className={`transition-opacity duration-800 ease-in-out ${tabTransition ? 'opacity-0' : 'opacity-100'}`}>
            {(!loading && !error && activeTab === 'scholarlyWorks') && (
              <div className={`results-container bg-white/90 shadow-md rounded p-4 overflow-x-auto transition-opacity duration-800 ease-in-out ${resultsTransition ? 'opacity-0' : 'opacity-100'}`}>
                {filteredData.length > 0 ? (
                  <>
                    <p className="text-gray-600 mb-2">Showing {paginatedData.length} of {filteredData.length} results</p>
                    <table className="w-full table-auto border-collapse">
                      <thead><tr className="bg-purple-100 text-left">
                        <th className="p-2 border font-semibold text-purple-800">Title</th>
                        <th className="p-2 border font-semibold text-purple-800">Author</th>
                        <th className="p-2 border font-semibold text-purple-800">Published</th>
                        <th className="p-2 border font-semibold text-purple-800">Journal / Source</th>
                        <th className="p-2 border font-semibold text-purple-800">Citations</th>
                      </tr></thead>
                      <tbody>{paginatedData.map((item) => (
                        <tr key={item.id || item.title} className="hover:bg-purple-50 cursor-pointer" onClick={() => handleWorkSelection(item)}>
                          <td className="p-2 border">{item.title}</td>
                          <td className="p-2 border">{item.author}</td>
                          <td className="p-2 border">{item.published}</td>
                          <td className="p-2 border">{item.journal}</td>
                          <td className="p-2 border">{item.citations || item.citation_count || 0}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                    <Pagination 
                      initialPage={currentPage} 
                      totalItems={filteredData.length} 
                      itemsPerPage={resultsPerPage} 
                      onPageChange={handlePageChange}
                      transitionEnabled={true}
                      totalPages={totalPages} // Now using the calculated total pages
                    />
                  </>
                ) : (
                  query && <p className="text-gray-600 text-center">No results found for your search query</p>
                )}
              </div>
            )}
            {(!loading && !error && activeTab === 'citation') && (
              <SummaryTab selectedWork={selectedWork} resetSelectedWork={resetSelectedWork} />
            )}
            {(!loading && !error && activeTab === 'analysis') && (
              <div className="bg-white/90 shadow-md rounded p-4">
                <h3 className="font-semibold text-purple-800 mb-4">Research Network</h3>
                <NetworkGraph searchResults={data} />
              </div>
            )}
          </div>
        </main>
        <Sidebar 
          navigateToHome={navigateToHome} 
          applyFiltersCallback={handleApplyFilters} 
          resetAllFiltersCallback={handleResetFilters}
          initialFilters={currentFilters} // Pass current filters for initialization 
        />
      </div>
      <footer className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white text-center py-10">
        <p className="text-gray-300 text-sm">This website is just an educational project and is not meant for intended use.</p>
      </footer>
    </div>
  );
};

export default SearchPage;