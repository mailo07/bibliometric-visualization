import React, { useState, useEffect, useCallback } from 'react';
import { search } from '../../services/apiService';
import './SearchPage.css';

const SearchPage = () => {
    const [activeTab, setActiveTab] = useState("scholarlyWorks");
    const [activeFilter, setActiveFilter] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState([]);
    const [metrics, setMetrics] = useState({});
    const [authorFilter, setAuthorFilter] = useState('');
    const [publisherFilter, setPublisherFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [flags, setFlags] = useState({ flag1: false, flag2: false });
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [resultsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tabTransition, setTabTransition] = useState(false);
    const [resultsTransition, setResultsTransition] = useState(false);
    
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
            setData(results);
            setMetrics({
                scholarlyWorks: Math.floor(Math.random() * 100000000),
                worksCitedByPatents: Math.floor(Math.random() * 100000000),
                citingPatents: Math.floor(Math.random() * 100000000),
                patentCitations: Math.floor(Math.random() * 100000000),
            });
        } catch (err) {
            setError(err.message || 'An error occurred during the search.');
            setData([]);
            setMetrics({});
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        if (query) {
            fetchSearchResults(query);
        }
    }, [fetchSearchResults, query]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Update URL with the new search query
            const newUrl = `${window.location.pathname}?query=${encodeURIComponent(searchQuery.trim())}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
            fetchSearchResults(searchQuery.trim());
        }
    };

    const filteredData = data.filter((item) => {
        const authorMatch = !authorFilter || (item.author && item.author.toLowerCase().includes(authorFilter.toLowerCase()));
        const subjectMatch = !subjectFilter || (item.title && item.title.toLowerCase().includes(subjectFilter.toLowerCase()));
        return authorMatch && subjectMatch;
    });

    const totalPages = Math.ceil(filteredData.length / resultsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage);

    const handlePageClick = (pageNumber) => {
        // Add transition effect for pagination
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

    const toggleFilterPanel = () => {
        setIsFilterPanelVisible(!isFilterPanelVisible);
    };
    
    const handleTabSwitch = (tab) => {
        if (activeTab !== tab) {
            setTabTransition(true);
            setTimeout(() => {
                setActiveTab(tab);
                setTimeout(() => {
                    setTabTransition(false);
                }, 400); // Increased duration for more relaxed animation
            }, 400); // Increased duration for more relaxed animation
        }
    };
    
    const renderIdentifiers = (identifiers) => {
        if (!identifiers) return 'N/A';
        const parts = identifiers.split(',').map(part => part.trim());
        return parts.map((part, index) => {
            // Check if the part is a URL starting with https://
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

    const renderPaginationButtons = () => {
        if (totalPages === 0) return null;
        
        return (
            <div className="pagination-container">
                {/* Previous button */}
                <button 
                    onClick={handlePrevPage} 
                    className="pagination-arrow"
                    disabled={currentPage === 1}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                        // If 5 or fewer pages, show all
                        pageNumber = i + 1;
                    } else {
                        // For more than 5 pages, create a smart window
                        if (currentPage <= 3) {
                            // Near the start
                            pageNumber = i + 1;
                            if (i === 4) pageNumber = totalPages;
                        } else if (currentPage >= totalPages - 2) {
                            // Near the end
                            if (i === 0) pageNumber = 1;
                            else pageNumber = totalPages - (4 - i);
                        } else {
                            // In the middle
                            if (i === 0) pageNumber = 1;
                            else if (i === 4) pageNumber = totalPages;
                            else pageNumber = currentPage + (i - 2);
                        }
                    }
                    
                    // Add ellipsis
                    if ((i === 1 && pageNumber !== 2 && totalPages > 5) || 
                        (i === 3 && pageNumber !== totalPages - 1 && totalPages > 5)) {
                        return <span key={`ellipsis-${i}`} className="pagination-ellipsis">...</span>;
                    }
                    
                    return (
                        <button 
                            key={pageNumber} 
                            onClick={() => handlePageClick(pageNumber)}
                            className={`pagination-button ${currentPage === pageNumber ? 'active' : ''}`}
                        >
                            {pageNumber}
                        </button>
                    );
                })}
                
                <button 
                    onClick={handleNextPage} 
                    className="pagination-arrow" 
                    disabled={currentPage === totalPages}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        );
    };

    const toggleFilter = (filterName) => {
        setActiveFilter(activeFilter === filterName ? null : filterName);
    };

    const clearFilters = () => {
        setAuthorFilter('');
        setPublisherFilter('');
        setSubjectFilter('');
        setFlags({ flag1: false, flag2: false });
        setDateRange({ start: '', end: '' });
    };
    
    const Preloader = () => (
        <div className="preloader">
            <div className="spinner"></div>
            <p>Loading search results...</p>
        </div>
    );

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
                        <button 
                            type="submit" 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </button>
                    </form>
                </div>
                <h1 className="ml-4 text-2xl font-bold">BIBLIOKNOW</h1>
            </header>
            
            <div className="flex flex-grow relative">
                <aside className={`left-column p-4 bg-white/90 shadow-md`}>
                    <h3 className="font-semibold text-purple-800 mb-4">Chart Visualization of Citation Counts</h3>
                    <div className="h-64 bg-gray-200 flex items-center justify-center">
                        <p className="text-gray-700">[Chart/Plot for citation metrics goes here]</p>
                    </div>
                </aside>
                
                <main className={`main-column p-6 ${isFilterPanelVisible ? 'shifted' : ''}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-white/90 shadow-md p-4 rounded divide-x-2 divide-gray-200">
                        <div className="text-center">
                            <h3 className="font-semibold text-purple-800">Scholarly Works</h3>
                            <p className="text-2xl font-bold">{metrics.scholarlyWorks}</p>
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-purple-800">Works Cited by Patents</h3>
                            <p className="text-2xl font-bold">{metrics.worksCitedByPatents}</p>
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-purple-800">Citing Patents</h3>
                            <p className="text-2xl font-bold">{metrics.citingPatents}</p>
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-purple-800">Patent Citations</h3>
                            <p className="text-2xl font-bold">{metrics.patentCitations}</p>
                        </div>
                    </div>
                    
                    <div className="mb-6 bg-white/90 shadow-md p-4 rounded">
                        <h3 className="font-semibold text-purple-800">Query Information</h3>
                        <p className="text-gray-700">Query Name: <span className="font-medium">{query}</span></p>
                        <p className="text-gray-700">Total Results: <span className="font-medium">{filteredData.length}</span></p>
                    </div>
                    
                    <div className="flex space-x-4 mb-4 border-b-2 border-gray-200">
                        <button 
                            className={`px-4 py-2 transition-all duration-800 ease-in-out ${
                                activeTab === "scholarlyWorks" 
                                    ? "border-b-2 border-purple-600 font-semibold text-purple-600"
                                    : "text-gray-600 hover:text-purple-400"
                            }`} 
                            onClick={() => handleTabSwitch("scholarlyWorks")}
                        >
                            Scholarly Works
                        </button>
                        <button 
                            className={`px-4 py-2 transition-all duration-800 ease-in-out ${
                                activeTab === "citation" 
                                    ? "border-b-2 border-purple-600 font-semibold text-purple-600"
                                    : "text-gray-600 hover:text-purple-400"
                            }`}
                            onClick={() => handleTabSwitch("citation")}
                        >
                            Citation
                        </button>
                        <button 
                            className={`px-4 py-2 transition-all duration-800 ease-in-out ${
                                activeTab === "analysis" 
                                    ? "border-b-2 border-purple-600 font-semibold text-purple-600"
                                    : "text-gray-600 hover:text-purple-400"
                            }`}
                            onClick={() => handleTabSwitch("analysis")}
                        >
                            Analysis
                        </button>
                    </div>
                    
                    {loading && <Preloader />}
                    
                    {error && <p className="text-red-500 text-center">Error: {error}</p>}
                    
                    <div className={`transition-opacity duration-800 ease-in-out ${tabTransition ? 'opacity-0' : 'opacity-100'}`}>
                        {!loading && !error && activeTab === "scholarlyWorks" && (
                            <div className={`results-container bg-white/90 shadow-md rounded p-4 overflow-x-auto transition-opacity duration-800 ease-in-out ${resultsTransition ? 'opacity-0' : 'opacity-100'}`}>
                                <table className="w-full table-auto border-collapse">
                                    <thead>
                                        <tr className="bg-purple-100 text-left">
                                            <th className="p-2 border font-semibold text-purple-800">Title</th>
                                            <th className="p-2 border font-semibold text-purple-800">Author</th>
                                            <th className="p-2 border font-semibold text-purple-800">Published</th>
                                            <th className="p-2 border font-semibold text-purple-800">Journal / Source</th>
                                            <th className="p-2 border font-semibold text-purple-800">Identifiers</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedData.map((item) => (
                                            <tr key={item.title} className="hover:bg-purple-50">
                                                <td className="p-2 border">{item.title}</td>
                                                <td className="p-2 border">{item.author}</td>
                                                <td className="p-2 border">{item.published}</td>
                                                <td className="p-2 border">{item.journal}</td>
                                                <td className="p-2 border">{renderIdentifiers(item.identifiers)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {renderPaginationButtons()}
                            </div>
                        )}
                        
                        {!loading && !error && activeTab !== "scholarlyWorks" && (
                            <div className="bg-white/90 shadow-md rounded p-4">
                                <p className="text-gray-600">
                                    {activeTab === "citation" ? "Citation view content goes here..." : "Analysis content goes here..."}
                                </p>
                            </div>
                        )}
                    </div>
                </main>
                
                <div className={`filter-panel ${isFilterPanelVisible ? 'visible' : ''}`}>
                    <div className="filter-panel-content">
                        <h2 className="font-semibold mb-4 text-purple-800">FILTERS</h2>
                        <div className="space-y-4">
                            <div>
                                <button 
                                    className="flex justify-between w-full p-2 font-medium text-left text-gray-700" 
                                    onClick={() => toggleFilter('dateRange')}
                                >
                                    <span>Date Range</span>
                                    <span>{activeFilter === 'dateRange' ? "▼" : "▶"}</span>
                                </button>
                                <div className={`collapse-content ${activeFilter === 'dateRange' ? 'open' : ''}`}>
                                    <label className="block mt-2">
                                        <span className="text-gray-700">Start Date</span>
                                        <input 
                                            type="date" 
                                            className="w-full border p-2 rounded mb-2" 
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-gray-700">End Date</span>
                                        <input 
                                            type="date" 
                                            className="w-full border p-2 rounded" 
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                        />
                                    </label>
                                </div>
                            </div>
                            
                            <div>
                                <button 
                                    className="flex justify-between w-full p-2 font-medium text-left text-gray-700" 
                                    onClick={() => toggleFilter('author')}
                                >
                                    <span>Author</span>
                                    <span>{activeFilter === 'author' ? "▼" : "▶"}</span>
                                </button>
                                <div className={`collapse-content ${activeFilter === 'author' ? 'open' : ''}`}>
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 rounded mt-2" 
                                        placeholder="Search Author" 
                                        value={authorFilter}
                                        onChange={(e) => setAuthorFilter(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <button 
                                    className="flex justify-between w-full p-2 font-medium text-left text-gray-700"
                                    onClick={() => toggleFilter('subject')}
                                >
                                    <span>Subject Matter</span>
                                    <span>{activeFilter === 'subject' ? "▼" : "▶"}</span>
                                </button>
                                <div className={`collapse-content ${activeFilter === 'subject' ? 'open' : ''}`}>
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 rounded mt-2"
                                        placeholder="Search Subject Matter" 
                                        value={subjectFilter} 
                                        onChange={(e) => setSubjectFilter(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            {(authorFilter || subjectFilter || dateRange.start || dateRange.end) && (
                                <button 
                                    className="w-full mt-4 p-2 bg-red-500 text-white rounded hover:bg-red-600" 
                                    onClick={clearFilters}
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="side-menu">
                    <button className="mb-8 icon-button" onClick={navigateToHome}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="icon-text">Home</span>
                    </button>
                    <button 
                        className={`icon-button ${isFilterPanelVisible ? 'active' : ''}`} 
                        onClick={toggleFilterPanel}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <span className="icon-text">Filter</span>
                    </button>
                </div>
            </div>
            
            <footer className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white text-center py-10">
                <p className="text-gray-300 text-sm">This website is just an educational project and is not meant for intended used.</p>
            </footer>
        </div>
    );
};

export default SearchPage;