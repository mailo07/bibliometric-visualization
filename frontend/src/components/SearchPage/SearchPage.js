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

    const queryParams = new URLSearchParams(window.location.search);
    const query = queryParams.get('query');

    const fetchSearchResults = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const results = await search(query);
            setData(results);

            // Placeholder metrics
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
    }, [query]);

    useEffect(() => {
        fetchSearchResults();
    }, [fetchSearchResults]);

    const filteredData = data.filter((item) => {
        const authorMatch =
            !authorFilter ||
            (item.author && item.author.toLowerCase().includes(authorFilter.toLowerCase()));
        const subjectMatch =
            !subjectFilter ||
            (item.title && item.title.toLowerCase().includes(subjectFilter.toLowerCase()));

        // Publisher/date/flags can be added similarly if needed
        return authorMatch && subjectMatch;
    });

    const totalPages = Math.ceil(filteredData.length / resultsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * resultsPerPage,
        currentPage * resultsPerPage
    );

    const handlePageClick = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const renderPaginationButtons = () => {
        const buttons = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                buttons.push(
                    <button
                        key={i}
                        onClick={() => handlePageClick(i)}
                        className={`pagination-button ${currentPage === i ? 'active' : ''}`}
                    >
                        {i}
                    </button>
                );
            }
        } else {
            let startPage = Math.max(2, currentPage - 2);
            let endPage = Math.min(totalPages - 1, currentPage + 2);

            if (currentPage > 4) {
                buttons.push(<span key="ellipsis-start" className="pagination-info">...</span>);
            }

            for (let i = startPage; i <= endPage; i++) {
                buttons.push(
                    <button
                        key={i}
                        onClick={() => handlePageClick(i)}
                        className={`pagination-button ${currentPage === i ? 'active' : ''}`}
                    >
                        {i}
                    </button>
                );
            }

            if (currentPage < totalPages - 3) {
                buttons.push(<span key="ellipsis-end" className="pagination-info">...</span>);
            }

            buttons.push(
                <button
                    key={totalPages}
                    onClick={() => handlePageClick(totalPages)}
                    className={`pagination-button ${currentPage === totalPages ? 'active' : ''}`}
                >
                    {totalPages}
                </button>
            );
        }

        return buttons;
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

    return (
        <div className="flex flex-col min-h-screen font-sans">
            {/* HEADER with search bar centered, BIBLIOKNOW on the right */}
            <header className="bg-gray-800 px-4 py-3 text-white flex items-center">
                {/* Centered Search Bar */}
                <div className="flex-grow flex justify-center">
                    <div className="relative w-full max-w-md">
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full bg-black text-white placeholder-gray-400 
                                       rounded-full pl-4 pr-10 py-2 focus:outline-none"
                        />
                        {/* Magnifying Glass Button */}
                        <button
                            type="button"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 
                                       text-gray-400 hover:text-white"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </button>
                    </div>
                </div>
                <h1 className="ml-4 text-2xl font-bold">BIBLIOKNOW</h1>
            </header>

            {/* Main Content: 3 columns, all flex-grow so they expand to the footer */}
            <div className="flex flex-grow">
                {/* Left Column: Chart */}
                <aside className="w-full md:w-2/6 p-4 bg-white shadow-md">
                    <h3 className="font-semibold text-gray-600 mb-4">
                        Chart Visualization of Citation Counts
                    </h3>
                    <div className="h-64 bg-gray-200 flex items-center justify-center">
                        <p className="text-gray-700">
                            [Chart/Plot for citation metrics goes here]
                        </p>
                    </div>
                </aside>

                {/* Middle Column: Metrics, Query Info, Tabs, Results */}
                <main className="w-full md:w-3/6 p-6">
                    {/* Citation Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-white shadow-md p-4 rounded divide-x-2 divide-gray-200">
                        <div className="text-center">
                            <h3 className="font-semibold text-gray-600">Scholarly Works</h3>
                            <p className="text-2xl font-bold">{metrics.scholarlyWorks}</p>
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-gray-600">Works Cited by Patents</h3>
                            <p className="text-2xl font-bold">{metrics.worksCitedByPatents}</p>
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-gray-600">Citing Patents</h3>
                            <p className="text-2xl font-bold">{metrics.citingPatents}</p>
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-gray-600">Patent Citations</h3>
                            <p className="text-2xl font-bold">{metrics.patentCitations}</p>
                        </div>
                    </div>

                    {/* Query Information */}
                    <div className="mb-6 bg-white shadow-md p-4 rounded">
                        <h3 className="font-semibold text-gray-600">Query Information</h3>
                        <p className="text-gray-700">
                            Query Name: <span className="font-medium">{query}</span>
                        </p>
                        <p className="text-gray-700">
                            Total Results: <span className="font-medium">{filteredData.length}</span>
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-4 mb-4 border-b-2 border-gray-200">
                        <button
                            className={`px-4 py-2 ${
                                activeTab === "scholarlyWorks"
                                    ? "border-b-2 border-teal-600 font-semibold text-teal-600"
                                    : "text-gray-600"
                            }`}
                            onClick={() => setActiveTab("scholarlyWorks")}
                        >
                            Scholarly Works
                        </button>
                        <button
                            className={`px-4 py-2 ${
                                activeTab === "citation"
                                    ? "border-b-2 border-teal-600 font-semibold text-teal-600"
                                    : "text-gray-600"
                            }`}
                            onClick={() => setActiveTab("citation")}
                        >
                            Citation
                        </button>
                        <button
                            className={`px-4 py-2 ${
                                activeTab === "analysis"
                                    ? "border-b-2 border-teal-600 font-semibold text-teal-600"
                                    : "text-gray-600"
                            }`}
                            onClick={() => setActiveTab("analysis")}
                        >
                            Analysis
                        </button>
                    </div>

                    {/* Tab Content */}
                    {loading && <p className="text-center">Loading search results...</p>}
                    {error && <p className="text-red-500 text-center">Error: {error}</p>}

                    {!loading && !error && activeTab === "scholarlyWorks" && (
                        <div className="bg-white shadow-md rounded p-4 overflow-x-auto">
                            <table className="w-full table-auto border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 text-left">
                                        <th className="p-2 border font-semibold text-gray-700">Title</th>
                                        <th className="p-2 border font-semibold text-gray-700">Author</th>
                                        <th className="p-2 border font-semibold text-gray-700">Published</th>
                                        <th className="p-2 border font-semibold text-gray-700">Journal / Source</th>
                                        <th className="p-2 border font-semibold text-gray-700">Identifiers</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.map((item) => (
                                        <tr key={item.title} className="hover:bg-gray-50">
                                            <td className="p-2 border">{item.title}</td>
                                            <td className="p-2 border">{item.author}</td>
                                            <td className="p-2 border">{item.published}</td>
                                            <td className="p-2 border">{item.journal}</td>
                                            <td className="p-2 border">{item.identifiers}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            <div className="pagination-container mt-4 flex justify-center">
                                {renderPaginationButtons()}
                            </div>
                        </div>
                    )}

                    {!loading && !error && activeTab !== "scholarlyWorks" && (
                        <div className="bg-white shadow-md rounded p-4">
                            <p className="text-gray-600">
                                {activeTab === "citation"
                                    ? "Citation view content goes here..."
                                    : "Analysis content goes here..."}
                            </p>
                        </div>
                    )}
                </main>

                {/* Filters Column */}
                <div className="bg-white text-black flex-1 p-4">
                    <h2 className="font-semibold mb-4">FILTERS</h2>
                    <div className="space-y-4">
                        <div>
                            <button
                                className="flex justify-between w-full p-2 font-medium text-left text-gray-700"
                                onClick={() => toggleFilter('dateRange')}
                            >
                                <span>Date Range</span>
                                <span>{activeFilter === 'dateRange' ? ">" : ">"}</span>
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
                                onClick={() => toggleFilter('flags')}
                            >
                                <span>Flags</span>
                                <span>{activeFilter === 'flags' ? ">" : ">"}</span>
                            </button>
                            <div className={`collapse-content ${activeFilter === 'flags' ? 'open' : ''}`}>
                                <div className="flex items-center space-x-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="flag1"
                                        checked={flags.flag1}
                                        onChange={(e) => setFlags({ ...flags, flag1: e.target.checked })}
                                    />
                                    <label htmlFor="flag1">Flag 1</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="flag2"
                                        checked={flags.flag2}
                                        onChange={(e) => setFlags({ ...flags, flag2: e.target.checked })}
                                    />
                                    <label htmlFor="flag2">Flag 2</label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                className="flex justify-between w-full p-2 font-medium text-left text-gray-700"
                                onClick={() => toggleFilter('author')}
                            >
                                <span>Author</span>
                                <span>{activeFilter === 'author' ? ">" : ">"}</span>
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
                                onClick={() => toggleFilter('publisher')}
                            >
                                <span>Publisher</span>
                                <span>{activeFilter === 'publisher' ? ">" : ">"}</span>
                            </button>
                            <div className={`collapse-content ${activeFilter === 'publisher' ? 'open' : ''}`}>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded mt-2"
                                    placeholder="Search Publisher"
                                    value={publisherFilter}
                                    onChange={(e) => setPublisherFilter(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                className="flex justify-between w-full p-2 font-medium text-left text-gray-700"
                                onClick={() => toggleFilter('subject')}
                            >
                                <span>Subject Matter</span>
                                <span>{activeFilter === 'subject' ? ">" : ">"}</span>
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

                        {(authorFilter || publisherFilter || subjectFilter || flags.flag1 || flags.flag2 || dateRange.start || dateRange.end) && (
                            <button
                                className="w-full mt-4 p-2 bg-red-500 text-white rounded hover:bg-red-600"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Slim additional panel at the far right with icons */}
                <div className="bg-gray-800 text-white w-16 flex flex-col items-center py-6">
                    {/* Home Icon */}
                    <button className="mb-8">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7m-7-7v18"
                            />
                        </svg>
                    </button>

                    {/* Three-dash (hamburger) icon */}
                    <button>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Footer with no extra margin-top so main content touches it */}
            <footer className="bg-black text-white text-center py-10">
                <p className="text-gray-500 text-sm">
                    This website is just an educational project and is not meant for intended use. User discretion is advised.
                </p>
            </footer>
        </div>
    );
};

export default SearchPage;
