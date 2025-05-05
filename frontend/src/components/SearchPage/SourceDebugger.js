// src/components/SearchPage/SourceDebugger.js
import React from 'react';

const SourceDebugger = ({ data }) => {
  if (!data || data.length === 0) return null;
  
  // Count sources
  const sourceCounts = {};
  data.forEach(item => {
    const source = item.source || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });

  return (
    <div className="bg-white/90 shadow-md rounded p-2 mt-2 mb-4 text-xs">
      <h4 className="font-medium text-purple-700 mb-1">Source Distribution (Debug)</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
        {Object.entries(sourceCounts).map(([source, count]) => (
          <div key={source} className="flex justify-between bg-purple-50 px-2 py-1 rounded">
            <span className="font-medium">{source}:</span>
            <span className="font-bold">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourceDebugger;