import React, { useState, useEffect, useCallback } from 'react';
import { search } from '../../services/apiService'; // Import search
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
    const [flags, setFlags] = useState({
        flag1: false,
        flag2: false
    });
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });
    const [resultsPerPage] = useState(10); // Use useState for const values
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const queryParams = new URLSearchParams(window.location.search);
    const query = queryParams.get('query');

    const fetchSearchResults = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await search(query); // Use search
            setData(data);
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
        const authorMatch = !authorFilter || (item.author && item.author.toLowerCase().includes(authorFilter.toLowerCase()));
        const subjectMatch = !subjectFilter || (item.title && item.title.toLowerCase().includes(subjectFilter.toLowerCase()));
        const publisherMatch = true; // Placeholder
        const dateMatch = true; // Placeholder
        const flag1Match = true; // Placeholder
        const flag2Match = true; // Placeholder

        return authorMatch && subjectMatch && publisherMatch && flag1Match && flag2Match && dateMatch;
    });

    const totalPages = Math.ceil(filteredData.length / resultsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage);

    const handlePageClick = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const renderPaginationButtons = () => {
        let buttons = [];

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
            {/* Header */}
            <header className="bg-gray-800 p-4 text-white flex justify-between items-center">
                <h1 className="text-2xl font-bold">BiblioKnow Search</h1>
            </header>

            {/* Main Content */}
            <div className="flex flex-grow flex-wrap">
                {/* Left Sidebar */}
                <aside className="w-16 bg-gray-800 text-white flex flex-col items-center py-4">
                    <button className="mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                    </button>
                    <button className="mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 7a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 7a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
                        </svg>
                    </button>
                </aside>

                {/* Filter Section */}
                <aside className="w-full md:w-1/6 p-4 bg-white shadow-md">
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
                </aside>

                {/* Main Section */}
                <main className="flex-1 p-6">
                    {/* Metrics Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-white shadow-md p-4 rounded divide-x-2 divide-gray-200">
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

                    {/* Query Section */}
                    <div className="mb-6 bg-white shadow-md p-4 rounded">
                        <h3 className="font-semibold text-gray-600">Query Information</h3>
                        <p className="text-gray-700">
                            Query Name: <span className="font-medium">{query}</span>
                        </p>
                        <p className="text-gray-700">
                            Total Results: <span className="font-medium">{filteredData.length}</span>
                        </p>
                    </div>

                    {/* Tabs for Display Options */}
                    <div className="flex space-x-4 mb-4 border-b-2 border-gray-200">
                        <button
                            className={`px-4 py-2 ${activeTab === "scholarlyWorks" ? "border-b-2 border-teal-600 font-semibold text-teal-600" : "text-gray-600"}`}
                            onClick={() => setActiveTab("scholarlyWorks")}
                        >
                            Scholarly Works
                        </button>
                        <button
                            className={`px-4 py-2 ${activeTab === "citation" ? "border-b-2 border-teal-600 font-semibold text-teal-600" : "text-gray-600"}`}
                            onClick={() => setActiveTab("citation")}
                        >
                            Citation
                        </button>
                        <button
                            className={`px-4 py-2 ${activeTab === "analysis" ? "border-b-2 border-teal-600 font-semibold text-teal-600" : "text-gray-600"}`}
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

                    {/* Placeholder content for Citation and Analysis tabs */}
                    {!loading && !error && activeTab !== "scholarlyWorks" && (
                        <div className="bg-white shadow-md rounded p-4">
                            <p className="text-gray-600">
                                {activeTab === "citation" ? "Citation view content goes here..." : "Analysis content goes here..."}
                            </p>
                        </div>
                    )}
                </main>

                {/* Side Panel */}
                <aside className="w-full md:w-1/6 p-4 bg-white shadow-md">
                    <h3 className="font-semibold mb-4">Co-Authors of Papers</h3>
                    <p className="text-gray-700">Content about co-authors here.</p>
                    <h3 className="font-semibold mt-6 mb-4">Countries</h3>
                    <p className="text-gray-700">Content about countries here.</p>
                </aside>
            </div>

            {/* Footer */}
            <footer className="bg-black text-white text-center py-10 mt-20">
                <p className="text-gray-500 text-sm">
                    This website is a just an educational project and is not meant for intended use. User discretion is advised.
                </p>
            </footer>
        </div>
    );
};

export default SearchPage;