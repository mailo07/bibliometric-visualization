// src/components/SearchPage/SearchPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { search, getBibliometricMetrics } from '../../services/apiService';
import NetworkGraph from './NetworkGraph';
import Preloader from './Preloader';
import Sidebar from './Sidebar';
import LeftMenu from './LeftMenu';
import Pagination from './Pagination';
import SummaryTab from './SummaryTab';
import './SearchPage.css';

const SearchPage = () => {
  const [activeTab, setActiveTab] = useState('scholarlyWorks');
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState({
    scholarlyWorks: 0,
    worksCited: 0,
    frequentlyCited: 0
  });
  // Filter states removed - now managed in Sidebar.js
  const [resultsPerPage] = useState(4);
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
  // New state for selected scholarly work
  const [selectedWork, setSelectedWork] = useState(null);
  
  // Current filter state (received from Sidebar)
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

  const queryParams = new URLSearchParams(window.location.search);
  const query = queryParams.get('query') || '';

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  const fetchSearchResults = useCallback(async (searchTerm) => {
    setLoading(true);
    setError(null);
    try {
      const results = await search(searchTerm);
      
      // Ensure each item has an ID
      const resultsWithIds = Array.isArray(results) ? results.map((item, index) => ({
        ...item,
        id: item.id || item.doi || `result-${index}`
      })) : [];
      
      setData(resultsWithIds);
      setMetrics({
        scholarlyWorks: results.metrics?.totalWorks || (Array.isArray(results) ? results.length : 0),
        worksCited: results.metrics?.worksCited || 0,
        frequentlyCited: results.metrics?.frequentlyCited || 0
      });
    } catch (err) {
      setError(err.message || 'An error occurred during the search.');
      setData([]);
      setMetrics({
        scholarlyWorks: 0,
        worksCited: 0,
        frequentlyCited: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

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
      fetchSearchResults(query);
      fetchBibliometricMetrics(query);
    }
  }, [fetchSearchResults, fetchBibliometricMetrics, query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const newUrl = `${window.location.pathname}?query=${encodeURIComponent(searchQuery.trim())}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      fetchSearchResults(searchQuery.trim());
      fetchBibliometricMetrics(searchQuery.trim());
      setSelectedWork(null); // Reset selected work when performing a new search
    }
  };

  const handleWorkSelection = (work) => {
    setSelectedWork(work);
    handleTabSwitch('citation'); // Switch to the Summary tab
  };

  const resetSelectedWork = () => {
    setSelectedWork(null);
  };

  const filteredData = data.filter((item) => {
    const { 
      authorFilter, 
      titleFilter, 
      journalFilter, 
      publisherFilter, 
      dateRange, 
      identifierTypes 
    } = currentFilters;

    const authorMatch = !authorFilter ||
      (item.author && item.author.toLowerCase().includes(authorFilter.toLowerCase()));
    const subjectMatch = !titleFilter ||
      (item.title && item.title.toLowerCase().includes(titleFilter.toLowerCase()));
    const journalMatch = !journalFilter ||
      (item.journal && item.journal.toLowerCase().includes(journalFilter.toLowerCase()));
    const titleMatch = !titleFilter ||
      (item.title && item.title.toLowerCase().includes(titleFilter.toLowerCase()));
    const publisherMatch = !publisherFilter ||
      (item.publisher && item.publisher.toLowerCase().includes(publisherFilter.toLowerCase()));

    const dateMatch = !dateRange.start || !dateRange.end ||
      (item.published &&
        new Date(item.published) >= new Date(dateRange.start) &&
        new Date(item.published) <= new Date(dateRange.end));

    const identifierMatch =
      !Object.values(identifierTypes).some(v => v) ||
      (item.identifiers && (
        (identifierTypes.doi && item.identifiers.includes('doi')) ||
        (identifierTypes.pmid && item.identifiers.includes('pmid')) ||
        (identifierTypes.pmcid && item.identifiers.includes('pmcid')) ||
        (identifierTypes.arxiv && item.identifiers.includes('arxiv')) ||
        (identifierTypes.isbn && item.identifiers.includes('isbn'))
      ));

    return (
      authorMatch &&
      subjectMatch &&
      journalMatch &&
      titleMatch &&
      publisherMatch &&
      dateMatch &&
      identifierMatch
    );
  });

  const totalPages = Math.ceil(filteredData.length / resultsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  );

  const handlePageClick = (pageNumber) => {
    setResultsTransition(true);
    setTimeout(() => {
      setCurrentPage(pageNumber);
      setTimeout(() => {
        setResultsTransition(false);
      }, 300);
    }, 300);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setResultsTransition(true);
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setTimeout(() => {
          setResultsTransition(false);
        }, 300);
      }, 300);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setResultsTransition(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setTimeout(() => {
          setResultsTransition(false);
        }, 300);
      }, 300);
    }
  };

  const navigateToHome = () => {
    window.location.href = '/';
  };

  const handleApplyFilters = (newFilters) => {
    setCurrentFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setCurrentFilters({
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
    setCurrentPage(1);
  };

  const handleTabSwitch = (tab) => {
    if (activeTab !== tab) {
      setTabTransition(true);
      setTimeout(() => {
        setActiveTab(tab);
        setTimeout(() => {
          setTabTransition(false);
        }, 400);
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
            <a href={part} className="identifier-link" target="_blank" rel="noopener noreferrer" > {part} </a>
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

  const generateBibliometricCharts = useCallback((searchResults) => {
    return bibliometricCharts;
  }, [bibliometricCharts]);

  useEffect(() => {
    if (data.length > 0) {
      const finalCharts = generateBibliometricCharts(data);
      setBibliometricCharts(finalCharts);
    }
  }, [data, generateBibliometricCharts]);

  return (
    <div className="flex flex-col min-h-screen font-sans gradient-bg">
      <header className="bg-gradient-to-r from-indigo-700 to-purple-800 px-4 py-3 text-white flex items-center sticky top-0 z-50">
        <div className="flex-grow flex justify-center">
          <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <input type="text" placeholder="Search" className="w-full bg-black/50 text-white placeholder-gray-400 rounded-full pl-4 pr-10 py-2 focus:outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /> <line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> </button>
          </form>
        </div> <h1 className="ml-4 text-2xl font-bold">BIBLIOKNOW</h1>
      </header>

      <div className="flex flex-grow relative">
        <LeftMenu bibliometricCharts={bibliometricCharts} />

        <main className={`main-column p-6`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-white/90 shadow-md p-4 rounded divide-x-2 divide-gray-200">
            <div className="text-center"> <h3 className="font-semibold text-purple-800">Scholarly Works</h3>
              <p className="text-2xl font-bold">{metrics.scholarlyWorks}</p>
            </div>
            <div className="text-center"> <h3 className="font-semibold text-purple-800">Works Cited</h3>
              <p className="text-2xl font-bold">{metrics.worksCited}</p>
            </div>
            <div className="text-center"> <h3 className="font-semibold text-purple-800">Frequently Cited Works</h3>
              <p className="text-2xl font-bold">{metrics.frequentlyCited}</p>
            </div>
          </div>

          <div className="mb-6 bg-white/90 shadow-md p-4 rounded">
            <h3 className="font-semibold text-purple-800">Query Information</h3>
            <p className="text-gray-700"> Query Name: <span className="font-medium">{query}</span></p>
            <p className="text-gray-700"> Total Results: <span className="font-medium">{filteredData.length}</span></p>
          </div>

          <div className="flex space-x-4 mb-4 border-b-2 border-gray-200">
            <button className={`px-4 py-2 transition-all duration-800 ease-in-out ${activeTab === 'scholarlyWorks' ? 'border-b-2 border-purple-600 font-semibold text-purple-600' : 'text-gray-600 hover:text-purple-400' }`}onClick={() => handleTabSwitch('scholarlyWorks')}>Lists</button>
            <button className={`px-4 py-2 transition-all duration-800 ease-in-out ${ activeTab === 'citation' ? 'border-b-2 border-purple-600 font-semibold text-purple-600' :'text-gray-600 hover:text-purple-400' }`} onClick={() => handleTabSwitch('citation')} > Summary </button>
            <button className={`px-4 py-2 transition-all duration-800 ease-in-out ${ activeTab === 'analysis' ? 'border-b-2 border-purple-600 font-semibold text-purple-600' : 'text-gray-600 hover:text-purple-400'}`} onClick={() => handleTabSwitch('analysis')} > Analysis </button> 
          </div>

          {loading && <Preloader />} {error && <p className="text-red-500 text-center">Error: {error}</p>}

          {!loading && !error && !query && data.length === 0 && ( <div className="bg-white/90 shadow-md rounded p-4"> <p className="text-gray-600">Enter a search query to see results</p> </div>)}

          <div className={`transition-opacity duration-800 ease-in-out ${ tabTransition ? 'opacity-0' : 'opacity-100' }`} >
            {!loading && !error && activeTab === 'scholarlyWorks' && (
              <div className={`results-container bg-white/90 shadow-md rounded p-4 overflow-x-auto transition-opacity duration-800 ease-in-out ${ resultsTransition ? 'opacity-0' : 'opacity-100' }`}>
                {filteredData.length > 0 ? (
                  <>
                    <table className="w-full table-auto border-collapse">
                      <thead> <tr className="bg-purple-100 text-left">
                          <th className="p-2 border font-semibold text-purple-800">Title</th>
                          <th className="p-2 border font-semibold text-purple-800">Author</th>
                          <th className="p-2 border font-semibold text-purple-800">Published</th>
                          <th className="p-2 border font-semibold text-purple-800"> Journal / Source</th>
                          <th className="p-2 border font-semibold text-purple-800"> Identifiers</th>
                        </tr> </thead>
                      <tbody>
                        {paginatedData.map((item) => (
                          <tr 
                            key={item.id || item.title} 
                            className="hover:bg-purple-50 cursor-pointer" 
                            onClick={() => handleWorkSelection(item)}
                          >
                            <td className="p-2 border">{item.title}</td>
                            <td className="p-2 border">{item.author}</td>
                            <td className="p-2 border">{item.published}</td>
                            <td className="p-2 border">{item.journal}</td>
                            <td className="p-2 border">{renderIdentifiers(item.identifiers)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <Pagination currentPage={currentPage} totalPages={totalPages} handlePageClick={handlePageClick} handlePrevPage={handlePrevPage} handleNextPage={handleNextPage} />
                  </>
                ) : (
                  query && ( <p className="text-gray-600 text-center"> No results found for your search query</p>)
                )}
              </div>
            )}

            {!loading && !error && activeTab === 'citation' && (
              <SummaryTab selectedWork={selectedWork} resetSelectedWork={resetSelectedWork} />
            )}

            {!loading && !error && activeTab === 'analysis' && (
              <div className="bg-white/90 shadow-md rounded p-4"> <h3 className="font-semibold text-purple-800 mb-4">Research Network</h3> <NetworkGraph searchResults={data} /></div>
            )}
          </div>
        </main>

        <Sidebar navigateToHome={navigateToHome} applyFiltersCallback={handleApplyFilters} resetAllFiltersCallback={handleResetFilters} /> </div>

      <footer className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white text-center py-10">
        <p className="text-gray-300 text-sm"> This website is just an educational project and is not meant for intended use. </p>
      </footer>
    </div>
  );
};

export default SearchPage;