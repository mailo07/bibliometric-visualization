// src/components/SearchPage/Sidebar.js
import React from 'react';
import './SearchPage.css';

const Sidebar = ({
  isFilterPanelVisible,
  toggleFilterPanel,
  navigateToHome,
  authorFilter,
  setAuthorFilter,
  titleFilter,
  setTitleFilter,
  journalFilter,
  setJournalFilter,
  dateRange,
  setDateRange,
  publisherFilter,
  setPublisherFilter,
  identifierTypes,
  handleIdentifierChange,
  applyFilters,
  resetAllFilters
}) => {
  return (
    <>
      <div className="side-menu">
        <button 
          className="mb-8 icon-button" 
          onClick={navigateToHome} 
          data-tooltip="Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
        </button>
        <button 
          className={`icon-button ${isFilterPanelVisible ? 'active' : ''}`} 
          onClick={toggleFilterPanel} 
          data-tooltip="Filters"
        >
          <svg xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" > 
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Filter Panel */}
      <div className={`filter-panel ${isFilterPanelVisible ? 'visible' : ''}`}>
        <div className="filter-panel-content">
          <h3 className="font-semibold text-purple-800 mb-4">Filters</h3>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-purple-600 mb-2">Authors</h4>
            <input
              type="text"
              placeholder="Filter by author"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-purple-600 mb-2">Title/Subject</h4>
            <input
              type="text"
              placeholder="Filter by title/subject"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-purple-600 mb-2">Journal</h4>
            <input
              type="text"
              placeholder="Filter by journal"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              value={journalFilter}
              onChange={(e) => setJournalFilter(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-purple-600 mb-2">Publisher</h4>
            <input
              type="text"
              placeholder="Filter by publisher"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              value={publisherFilter}
              onChange={(e) => setPublisherFilter(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-purple-600 mb-2">Date Range</h4>
            <div className="flex flex-col space-y-2">
              <input
                type="date"
                placeholder="Start date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
              <input
                type="date"
                placeholder="End date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-purple-600 mb-2">Identifiers</h4>
            <div className="checkbox-group">
              {Object.keys(identifierTypes).map((type) => (
                <div key={type} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`identifier-${type}`}
                    checked={identifierTypes[type]}
                    onChange={() => handleIdentifierChange(type)}
                  />
                  <label htmlFor={`identifier-${type}`} className="ml-2 text-gray-700">{type.toUpperCase()}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="filter-actions mt-6">
            <button 
              className="apply-btn"
              onClick={applyFilters}
            >
              Apply
            </button>
            <button 
              className="reset-btn"
              onClick={resetAllFilters}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;