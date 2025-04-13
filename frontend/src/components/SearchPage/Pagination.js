import React, { useState, useEffect } from 'react';
import './Pagination.css';

const Pagination = ({ 
  initialPage = 1,
  totalItems,
  itemsPerPage,
  onPageChange,
  transitionEnabled = true
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [resultsTransition, setResultsTransition] = useState(false);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    // Reset to page 1 when total items change significantly
    if (initialPage !== currentPage) {
      setCurrentPage(initialPage);
    }
  }, [initialPage, totalItems]);

  const handlePageClick = (pageNumber) => {
    if (transitionEnabled) {
      setResultsTransition(true);
      setTimeout(() => {
        setCurrentPage(pageNumber);
        onPageChange(pageNumber);
        setTimeout(() => {
          setResultsTransition(false);
        }, 300);
      }, 300);
    } else {
      setCurrentPage(pageNumber);
      onPageChange(pageNumber);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      if (transitionEnabled) {
        setResultsTransition(true);
        setTimeout(() => {
          const newPage = currentPage - 1;
          setCurrentPage(newPage);
          onPageChange(newPage);
          setTimeout(() => {
            setResultsTransition(false);
          }, 300);
        }, 300);
      } else {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
        onPageChange(newPage);
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      if (transitionEnabled) {
        setResultsTransition(true);
        setTimeout(() => {
          const newPage = currentPage + 1;
          setCurrentPage(newPage);
          onPageChange(newPage);
          setTimeout(() => {
            setResultsTransition(false);
          }, 300);
        }, 300);
      } else {
        const newPage = currentPage + 1;
        setCurrentPage(newPage);
        onPageChange(newPage);
      }
    }
  };

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

export default Pagination;