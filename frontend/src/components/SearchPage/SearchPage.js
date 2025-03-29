// SearchPage.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  search, getBibliometricMetrics } from '../../services/apiService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import * as d3 from 'd3';
import './SearchPage.css';

const NetworkGraph = ({ data }) => {
  const width = 600;
  const height = 400;

  useEffect(() => {
    if (!data || !data.nodes || data.nodes.length === 0) return;

    const svg = d3.select('#network-graph')
      .attr('width', width)
      .attr('height', height);

    // Clear previous draws
    svg.selectAll('*').remove();

    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.value));

    const node = svg.append('g')
      .selectAll('circle')
      .data(data.nodes)
      .enter().append('circle')
      .attr('r', 5)
      .attr('fill', d => {
        if (d.type === 'paper') return '#9370DB'; // paper node
        if (d.type === 'author') return '#4CAF50'; // author node
        if (d.type === 'coauthor') return '#FF9800'; // co-author node
        return '#999';
      })
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('title')
      .text(d => d.id);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }, [data]);

  return <svg id="network-graph"></svg>;
};

const SearchPage = () => {
  const [activeTab, setActiveTab] = useState('scholarlyWorks');
  const [activeFilter, setActiveFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState([]);

  // Metrics that appear above the table
  const [metrics, setMetrics] = useState({
    scholarlyWorks: 0,
    worksCited: 0,
    frequentlyCited: 0
  });

  const [authorFilter, setAuthorFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [journalFilter, setJournalFilter] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [publisherFilter, setPublisherFilter] = useState('');
  const [identifierTypes, setIdentifierTypes] = useState({
    doi: false,
    pmid: false,
    pmcid: false,
    arxiv: false,
    isbn: false
  });
  const [resultsPerPage] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabTransition, setTabTransition] = useState(false);
  const [resultsTransition, setResultsTransition] = useState(false);

  // [ADDED] State to store the updated network data (papers, authors, co-authors, citations)
  const [networkData, setNetworkData] = useState(null);

  // [CHANGED] Instead of random data, we will fetch real chart data from the backend
  const [bibliometricCharts, setBibliometricCharts] = useState({
    citationTrends: [],
    topAuthors: [],
    publicationDistribution: []
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
      setData(results.data || results || []);

      // [ADDED] If your backend returns top-level metrics for the search,
      // you can store them here. Or set up your own data shape:
      setMetrics({
        scholarlyWorks: results.metrics?.totalWorks || 0,
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

  // [ADDED] A new function to fetch real bibliometric metrics from your backend
  // This should return data needed to populate charts, e.g. citation trends, top authors, etc.
  const fetchBibliometricMetrics = useCallback(async (searchTerm) => {
    try {
      // getBibliometricMetrics is a new function in apiService that calls e.g. /api/metrics?query=
      const chartsData = await getBibliometricMetrics(searchTerm);

      // Example shape from the backend:
      // {
      //   citationTrends: [ { year: 2020, citations: 40 }, ... ],
      //   topAuthors: [ { name: 'Alice', citations: 120 }, ... ],
      //   publicationDistribution: [ { name: 'Nature', count: 5 }, ... ]
      // }
      setBibliometricCharts(chartsData);
    } catch (error) {
      console.error('Failed to fetch bibliometric metrics:', error);
      // fallback or set some error state
    }
  }, []);

  // On component mount or when the query changes, fetch the search results & chart data
  useEffect(() => {
    if (query) {
      fetchSearchResults(query);
      fetchBibliometricMetrics(query); // [ADDED]
    }
  }, [fetchSearchResults, fetchBibliometricMetrics, query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const newUrl = `${window.location.pathname}?query=${encodeURIComponent(searchQuery.trim())}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      fetchSearchResults(searchQuery.trim());
      fetchBibliometricMetrics(searchQuery.trim());
    }
  };

  // Filter logic
  const filteredData = data.filter((item) => {
    const authorMatch = !authorFilter ||
      (item.author && item.author.toLowerCase().includes(authorFilter.toLowerCase()));
    const subjectMatch = !subjectFilter ||
      (item.title && item.title.toLowerCase().includes(subjectFilter.toLowerCase()));
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
            <a
              href={part}
              className="identifier-link"
              target="_blank"
              rel="noopener noreferrer"
            >
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

  // [ADDED] Enhanced network data generator to link co-authors and (optionally) citation relationships
  const generateNetworkData = useCallback((searchResults) => {
    const nodes = [];
    const links = [];
    const nodeMap = {}; // quick lookup to avoid duplicates

    // Helper to add node only if not present
    const addNode = (id, type) => {
      if (!nodeMap[id]) {
        nodeMap[id] = { id, type };
        nodes.push(nodeMap[id]);
      }
    };

    // First pass: add each paper node and its author(s)
    for (const result of searchResults) {
      // Paper node
      const paperTitle = result.title || 'Untitled';
      addNode(paperTitle, 'paper');

      // Authors
      if (result.author && result.author !== 'N/A') {
        const authorList = result.author.split(',').map(a => a.trim());
        authorList.forEach(authorName => {
          addNode(authorName, 'author');
          // Link paper -> author
          links.push({
            source: paperTitle,
            target: authorName,
            value: 1
          });
        });

        // [ADDED] Link co-authors to each other
        if (authorList.length > 1) {
          for (let i = 0; i < authorList.length; i++) {
            for (let j = i + 1; j < authorList.length; j++) {
              links.push({
                source: authorList[i],
                target: authorList[j],
                value: 1
              });
            }
          }
        }
      }

      // [OPTIONAL] If you have real citation data in your results,
      // e.g. a field "references" or "citedBy", you can link papers:
      // if (result.citedBy) {
      //   for (let citedPaper of result.citedBy) {
      //     addNode(citedPaper, 'paper');
      //     links.push({
      //       source: paperTitle,
      //       target: citedPaper,
      //       value: 1
      //     });
      //   }
      // }
    }

    return { nodes, links };
  }, []);

  // [CHANGED] We no longer generate random chart data. We rely on the real data from fetchBibliometricMetrics.
  // However, if you still want to process or unify that data further, you could do it here.
  // (We keep the function to not remove anything from the original code.)
  const generateBibliometricCharts = useCallback((searchResults) => {
    // If you need to do custom transformations of the data from the backend,
    // you can do it here. For now, we simply return what we already have.
    return bibliometricCharts;
  }, [bibliometricCharts]);

  // Whenever data changes, generate the network graph and unify charts
  useEffect(() => {
    if (data.length > 0) {
      const netData = generateNetworkData(data);
      setNetworkData(netData);

      const finalCharts = generateBibliometricCharts(data);
      setBibliometricCharts(finalCharts);
    }
  }, [data, generateNetworkData, generateBibliometricCharts]);

  const renderPaginationButtons = () => {
    if (totalPages === 0) return null;
    return (
      <div className="pagination-container">
        <button onClick={handlePrevPage} className="pagination-arrow" disabled={currentPage === 1}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
          let pageNumber;
          if (totalPages <= 5) {
            pageNumber = i + 1;
          } else {
            if (currentPage <= 3) {
              pageNumber = i + 1;
              if (i === 4) pageNumber = totalPages;
            } else if (currentPage >= totalPages - 2) {
              if (i === 0) pageNumber = 1;
              else pageNumber = totalPages - (4 - i);
            } else {
              if (i === 0) pageNumber = 1;
              else if (i === 4) pageNumber = totalPages;
              else pageNumber = currentPage + (i - 2);
            }
          }

          if (
            (i === 1 && pageNumber !== 2 && totalPages > 5) ||
            (i === 3 && pageNumber !== totalPages - 1 && totalPages > 5)
          ) {
            return (
              <span key={`ellipsis-${i}`} className="pagination-ellipsis">
                ...
              </span>
            );
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

        <button onClick={handleNextPage} className="pagination-arrow" disabled={currentPage === totalPages}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    );
  };

  const toggleFilter = (filterName) => {
    setActiveFilter(activeFilter === filterName ? null : filterName);
  };

  const handleIdentifierChange = (type) => {
    setIdentifierTypes({
      ...identifierTypes,
      [type]: !identifierTypes[type]
    });
  };

  const applyFilters = () => {
    setCurrentPage(1);
    setIsFilterPanelVisible(false);
  };

  const resetAllFilters = () => {
    setAuthorFilter('');
    setSubjectFilter('');
    setDateRange({ start: '', end: '' });
    setJournalFilter('');
    setTitleFilter('');
    setPublisherFilter('');
    setIdentifierTypes({
      doi: false,
      pmid: false,
      pmcid: false,
      arxiv: false,
      isbn: false
    });
    setCurrentPage(1);
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
          </form>
        </div>
        <h1 className="ml-4 text-2xl font-bold">BIBLIOKNOW</h1>
      </header>

      <div className="flex flex-grow relative">
        {/* [LEFT COLUMN] Bibliometric Insights and charts */}
        <aside className="left-column p-4 bg-white/90 shadow-md">
          <h3 className="font-semibold text-purple-800 mb-4">Bibliometric Insights</h3>
          <div className="space-y-4">
            {/* Citation Trends */}
            <div>
              <h4 className="text-sm font-medium text-purple-600 mb-2">Citation Trends</h4>
              <LineChart width={250} height={150} data={bibliometricCharts.citationTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="citations" stroke="#9370DB" />
              </LineChart>
            </div>

            {/* Top Authors by Citations */}
            <div>
              <h4 className="text-sm font-medium text-purple-600 mb-2">Top Authors by Citations</h4>
              <BarChart width={250} height={150} data={bibliometricCharts.topAuthors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="citations" fill="#9370DB" />
              </BarChart>
            </div>

            {/* Publication Distribution */}
            <div>
              <h4 className="text-sm font-medium text-purple-600 mb-2">Publication Distribution</h4>
              <PieChart width={250} height={200}>
                <Pie
                  data={bibliometricCharts.publicationDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {bibliometricCharts.publicationDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          </div>
        </aside>

        {/* MAIN COLUMN */}
        <main className={`main-column p-6 ${isFilterPanelVisible ? 'shifted' : ''}`}>
          {/* Quick metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-white/90 shadow-md p-4 rounded divide-x-2 divide-gray-200">
            <div className="text-center">
              <h3 className="font-semibold text-purple-800">Scholarly Works</h3>
              <p className="text-2xl font-bold">{metrics.scholarlyWorks}</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-purple-800">Works Cited</h3>
              <p className="text-2xl font-bold">{metrics.worksCited}</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-purple-800">Frequently Cited Works</h3>
              <p className="text-2xl font-bold">{metrics.frequentlyCited}</p>
            </div>
          </div>

          {/* Query info */}
          <div className="mb-6 bg-white/90 shadow-md p-4 rounded">
            <h3 className="font-semibold text-purple-800">Query Information</h3>
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
              className={`px-4 py-2 transition-all duration-800 ease-in-out ${
                activeTab === 'scholarlyWorks'
                  ? 'border-b-2 border-purple-600 font-semibold text-purple-600'
                  : 'text-gray-600 hover:text-purple-400'
              }`}
              onClick={() => handleTabSwitch('scholarlyWorks')}
            >
              Lists
            </button>
            <button
              className={`px-4 py-2 transition-all duration-800 ease-in-out ${
                activeTab === 'citation'
                  ? 'border-b-2 border-purple-600 font-semibold text-purple-600'
                  : 'text-gray-600 hover:text-purple-400'
              }`}
              onClick={() => handleTabSwitch('citation')}
            >
              Summary
            </button>
            <button
              className={`px-4 py-2 transition-all duration-800 ease-in-out ${
                activeTab === 'analysis'
                  ? 'border-b-2 border-purple-600 font-semibold text-purple-600'
                  : 'text-gray-600 hover:text-purple-400'
              }`}
              onClick={() => handleTabSwitch('analysis')}
            >
              Analysis
            </button>
          </div>

          {loading && <Preloader />}
          {error && <p className="text-red-500 text-center">Error: {error}</p>}

          {/* Empty state display */}
          {!loading && !error && !query && data.length === 0 && (
            <div className="bg-white/90 shadow-md rounded p-4">
              <p className="text-gray-600">Enter a search query to see results</p>
            </div>
          )}

          <div
            className={`transition-opacity duration-800 ease-in-out ${
              tabTransition ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {/* Tab 1: Scholarly Works */}
            {!loading && !error && activeTab === 'scholarlyWorks' && (
              <div
                className={`results-container bg-white/90 shadow-md rounded p-4 overflow-x-auto transition-opacity duration-800 ease-in-out ${
                  resultsTransition ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {filteredData.length > 0 ? (
                  <>
                    <table className="w-full table-auto border-collapse">
                      <thead>
                        <tr className="bg-purple-100 text-left">
                          <th className="p-2 border font-semibold text-purple-800">Title</th>
                          <th className="p-2 border font-semibold text-purple-800">Author</th>
                          <th className="p-2 border font-semibold text-purple-800">Published</th>
                          <th className="p-2 border font-semibold text-purple-800">
                            Journal / Source
                          </th>
                          <th className="p-2 border font-semibold text-purple-800">
                            Identifiers
                          </th>
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
                  </>
                ) : (
                  query && (
                    <p className="text-gray-600 text-center">
                      No results found for your search query
                    </p>
                  )
                )}
              </div>
            )}

            {/* Tab 2: Citation summary (currently a placeholder) */}
            {!loading && !error && activeTab === 'citation' && (
              <div className="bg-white/90 shadow-md rounded p-4">
                <p className="text-gray-600">Summary view content goes here...</p>
              </div>
            )}

            {/* Tab 3: Analysis (Network) */}
            {!loading && !error && activeTab === 'analysis' && networkData && (
              <div className="bg-white/90 shadow-md rounded p-4">
                <h3 className="font-semibold text-purple-800 mb-4">Research Network</h3>
                <NetworkGraph data={networkData} />
              </div>
            )}
          </div>
        </main>

        {/* FILTER PANEL */}
        <div className={`filter-panel ${isFilterPanelVisible ? 'visible' : ''}`}>
          <div className="filter-panel-content">
            <h2 className="font-semibold mb-4 text-purple-800">FILTERS</h2>
            <div className="space-y-4">
              <div>
                <button
                  className="flex justify-between w-full p-2 font-medium text-left text-gray-700"
                  onClick={() => toggleFilter('title')}
                >
                  <span>Title</span> <span>{activeFilter === 'title' ? '▼' : '▶'}</span>
                </button>
                <div
                  className={`collapse-content ${
                    activeFilter === 'title' ? 'open' : ''
                  }`}
                >
                  <input
                    type="text"
                    className="w-full border p-2 rounded mt-2"
                    placeholder="Search by title"
                    value={titleFilter}
                    onChange={(e) => setTitleFilter(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  className="flex justify-between w-full p-2 font-medium text-left text-gray-700"
                  onClick={() => toggleFilter('author')}
                >
                  <span>Author</span>
                  <span>{activeFilter === 'author' ? '▼' : '▶'}</span>
                </button>
                <div
                  className={`collapse-content ${
                    activeFilter === 'author' ? 'open' : ''
                  }`}
                >
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
                  onClick={() => toggleFilter('journal')}
                >
                  <span>Journal/Source</span>
                  <span>{activeFilter === 'journal' ? '▼' : '▶'}</span>
                </button>
                <div
                  className={`collapse-content ${
                    activeFilter === 'journal' ? 'open' : ''
                  }`}
                >
                  <input
                    type="text"
                    className="w-full border p-2 rounded mt-2"
                    placeholder="Search Journal/Source"
                    value={journalFilter}
                    onChange={(e) => setJournalFilter(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  className="flex justify-between w-full p-2 font-medium text-left text-gray-700"
                  onClick={() => toggleFilter('publisher')}
                >
                  <span>Publisher</span>
                  <span>{activeFilter === 'publisher' ? '▼' : '▶'}</span>
                </button>
                <div
                  className={`collapse-content ${
                    activeFilter === 'publisher' ? 'open' : ''
                  }`}
                >
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
                  onClick={() => toggleFilter('dateRange')}
                >
                  <span>Date Range</span>{' '}
                  <span>{activeFilter === 'dateRange' ? '▼' : '▶'}</span>
                </button>
                <div
                  className={`collapse-content ${
                    activeFilter === 'dateRange' ? 'open' : ''
                  }`}
                >
                  <label className="block mt-2">
                    <span className="text-gray-700">Start Date</span>
                    <input
                      type="date"
                      className="w-full border p-2 rounded mb-2"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, start: e.target.value })
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700">End Date</span>
                    <input
                      type="date"
                      className="w-full border p-2 rounded"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, end: e.target.value })
                      }
                    />
                  </label>
                </div>
              </div>

              <div>
                <button
                  className="flex justify-between w-full p-2 font-medium text-left text-gray-700"
                  onClick={() => toggleFilter('identifiers')}
                >
                  <span>Identifier Types</span>
                  <span>{activeFilter === 'identifiers' ? '▼' : '▶'}</span>
                </button>
                <div
                  className={`collapse-content ${
                    activeFilter === 'identifiers' ? 'open' : ''
                  }`}
                >
                  <div className="checkbox-group">
                    <div className="checkbox-item">
                      <input
                        type="checkbox"
                        id="doi"
                        checked={identifierTypes.doi}
                        onChange={() => handleIdentifierChange('doi')}
                      />
                      <label htmlFor="doi">DOI</label>
                    </div>
                    <div className="checkbox-item">
                      <input
                        type="checkbox"
                        id="pmid"
                        checked={identifierTypes.pmid}
                        onChange={() => handleIdentifierChange('pmid')}
                      />
                      <label htmlFor="pmid">PMID</label>
                    </div>
                    <div className="checkbox-item">
                      <input
                        type="checkbox"
                        id="pmcid"
                        checked={identifierTypes.pmcid}
                        onChange={() => handleIdentifierChange('pmcid')}
                      />
                      <label htmlFor="pmcid">PMCID</label>
                    </div>
                    <div className="checkbox-item">
                      <input
                        type="checkbox"
                        id="arxiv"
                        checked={identifierTypes.arxiv}
                        onChange={() => handleIdentifierChange('arxiv')}
                      />
                      <label htmlFor="arxiv">arXiv</label>
                    </div>
                    <div className="checkbox-item">
                      <input
                        type="checkbox"
                        id="isbn"
                        checked={identifierTypes.isbn}
                        onChange={() => handleIdentifierChange('isbn')}
                      />
                      <label htmlFor="isbn">ISBN</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="filter-actions">
                <button className="apply-btn" onClick={applyFilters}>
                  Apply Filters
                </button>
                <button className="reset-btn" onClick={resetAllFilters}>
                  Reset All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SIDE MENU */}
        <div className="side-menu">
          <button
            className="mb-8 icon-button"
            onClick={navigateToHome}
            data-tooltip="Home"
          >
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </button>
          <button
            className={`icon-button ${isFilterPanelVisible ? 'active' : ''}`}
            onClick={toggleFilterPanel}
            data-tooltip="Filters"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <footer className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white text-center py-10">
        <p className="text-gray-300 text-sm">
          This website is just an educational project and is not meant for
          intended use.
        </p>
      </footer>
    </div>
  );
};

export default SearchPage;
