// src/components/SearchPage/Pagination.js
import React from 'react';
import './SearchPage.css';
const Pagination = ({ 
  currentPage, 
  totalPages, 
  handlePageClick, 
  handlePrevPage, 
  handleNextPage 
}) => {
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