// CitationMetrics.js
import React from 'react';

const CitationMetrics = ({ metrics, query, filteredData }) => {
  return (
    <>
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
      <div className="mb-6 bg-white/90 shadow-md p-4 rounded">
        <h3 className="font-semibold text-purple-800">Query Information</h3>
        <p className="text-gray-700">
          Query Name: <span className="font-medium">{query}</span>
        </p>
        <p className="text-gray-700">
          Total Results: <span className="font-medium">{filteredData.length}</span>
        </p>
      </div>
    </>
  );
};

export default CitationMetrics;