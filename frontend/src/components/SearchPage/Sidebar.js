// src/components/SearchPage/Sidebar.js
import React, { useState, useEffect } from 'react';
import './Sidebar.css';

const Sidebar = ({
  navigateToHome,
  applyFiltersCallback,
  resetAllFiltersCallback,
  initialFilters = {}
}) => {
  // Sidebar visibility state
  const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(false);
  
  // Filter states with initial values from props if available
  const [authorFilter, setAuthorFilter] = useState(initialFilters.authorFilter || '');
  const [subjectFilter, setSubjectFilter] = useState(initialFilters.subjectFilter || '');
  const [dateRange, setDateRange] = useState(initialFilters.dateRange || { start: '', end: '' });
  const [journalFilter, setJournalFilter] = useState(initialFilters.journalFilter || '');
  const [titleFilter, setTitleFilter] = useState(initialFilters.titleFilter || '');
  const [publisherFilter, setPublisherFilter] = useState(initialFilters.publisherFilter || '');
  const [identifierTypes, setIdentifierTypes] = useState(initialFilters.identifierTypes || {
    doi: false,
    pmid: false,
    pmcid: false,
    arxiv: false,
    isbn: false
  });
  
  // Validation state
  const [dateRangeError, setDateRangeError] = useState('');
  
  // Update local state when initialFilters change
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setAuthorFilter(initialFilters.authorFilter || '');
      setSubjectFilter(initialFilters.subjectFilter || '');
      setDateRange(initialFilters.dateRange || { start: '', end: '' });
      setJournalFilter(initialFilters.journalFilter || '');
      setTitleFilter(initialFilters.titleFilter || '');
      setPublisherFilter(initialFilters.publisherFilter || '');
      setIdentifierTypes(initialFilters.identifierTypes || {
        doi: false,
        pmid: false,
        pmcid: false,
        arxiv: false,
        isbn: false
      });
    }
  }, [initialFilters]);

  const toggleFilterPanel = () => {
    setIsFilterPanelVisible(!isFilterPanelVisible);
  };

  const handleIdentifierChange = (type) => {
    setIdentifierTypes({
      ...identifierTypes,
      [type]: !identifierTypes[type]
    });
  };
  
  const handleDateRangeChange = (field, value) => {
    setDateRange({
      ...dateRange,
      [field]: value
    });
    
    // Clear any error when user modifies date
    setDateRangeError('');
  };
  
  const validateFilters = () => {
    // Reset error state
    setDateRangeError('');
    
    // Validate date range
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      if (startDate > endDate) {
        setDateRangeError('Start date must be before end date');
        return false;
      }
    }
    
    return true;
  };

  const applyFilters = () => {
    // Validate filters before applying
    if (!validateFilters()) {
      return;
    }
    
    // Prepare date range for backend (convert to year if needed)
    let processedDateRange = { ...dateRange };
    
    if (dateRange.start) {
      // Extract the year if it's a full date
      const startYear = new Date(dateRange.start).getFullYear();
      processedDateRange.start = startYear.toString();
    }
    
    if (dateRange.end) {
      // Extract the year if it's a full date
      const endYear = new Date(dateRange.end).getFullYear();
      processedDateRange.end = endYear.toString();
    }
    
    // Construct filter object to pass back
    const filters = {
      authorFilter,
      subjectFilter,
      dateRange: processedDateRange,
      journalFilter,
      titleFilter,
      publisherFilter,
      identifierTypes,
      // Add year_from and year_to for backend compatibility
      year_from: processedDateRange.start || '',
      year_to: processedDateRange.end || ''
    };
    
    // Pass filters to parent component
    applyFiltersCallback(filters);
    setIsFilterPanelVisible(false);
  };

  const resetAllFilters = () => {
    // Reset all filter state
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
    setDateRangeError('');
    
    // Notify parent component
    resetAllFiltersCallback();
  };
  
  // Count active filters to show to user
  const countActiveFilters = () => {
    let count = 0;
    
    if (authorFilter) count++;
    if (subjectFilter) count++;
    if (titleFilter) count++;
    if (journalFilter) count++;
    if (publisherFilter) count++;
    if (dateRange.start || dateRange.end) count++;
    if (Object.values(identifierTypes).some(v => v)) count++;
    
    return count;
  };

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
          {countActiveFilters() > 0 && (
            <span className="filter-badge">{countActiveFilters()}</span>
          )}
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
                className={`w-full px-3 py-2 border ${dateRangeError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500`}
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
              />
              <input
                type="date"
                placeholder="End date"
                className={`w-full px-3 py-2 border ${dateRangeError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500`}
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
              />
              {dateRangeError && (
                <p className="text-red-500 text-xs mt-1">{dateRangeError}</p>
              )}
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