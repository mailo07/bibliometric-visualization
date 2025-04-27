// src/components/SearchPage/SummaryTab.js
import React, { useState, useEffect } from 'react';
import { getSummaryById } from '../../services/bibliometricsService';
import Preloader from './Preloader';

const SummaryTab = ({ selectedWork, resetSelectedWork }) => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!selectedWork) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await getSummaryById(selectedWork.id);
        setSummaryData(data);
      } catch (err) {
        console.error('Error fetching summary data:', err);
        setError('Failed to load summary. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [selectedWork]);

  if (!selectedWork) {
    return (
      <div className="bg-white/90 shadow-md rounded p-6 text-center">
        <p className="text-gray-600">Select a scholarly work from the list to view its summary</p>
      </div>
    );
  }

  if (loading) {
    return <Preloader />;
  }

  if (error) {
    return (
      <div className="bg-white/90 shadow-md rounded p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-purple-800 text-xl">{selectedWork.title}</h3>
          <button 
            onClick={resetSelectedWork}
            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            Back to results
          </button>
        </div>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 shadow-md rounded p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-purple-800 text-xl">{selectedWork.title}</h3>
        <button 
          onClick={resetSelectedWork}
          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          Back to results
        </button>
      </div>

      {summaryData ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-purple-700">Authors</h4>
              <p>{selectedWork.author || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-purple-700">Published</h4>
              <p>{selectedWork.published || 'N/A'}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-purple-700">Journal/Source</h4>
            <p>{selectedWork.journal || 'N/A'}</p>
          </div>

          <div>
            <h4 className="font-medium text-purple-700">Abstract</h4>
            <p className="text-gray-700">{summaryData.abstract || 'No abstract available'}</p>
          </div>

          {summaryData.keywords && (
            <div>
              <h4 className="font-medium text-purple-700">Keywords</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {summaryData.keywords.map((keyword, index) => (
                  <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-purple-700">Citations</h4>
              <p>{summaryData.citations || 0}</p>
            </div>
            <div>
              <h4 className="font-medium text-purple-700">Impact Factor</h4>
              <p>{summaryData.impact_factor || 'N/A'}</p>
            </div>
          </div>

          {summaryData.doi && (
            <div>
              <h4 className="font-medium text-purple-700">DOI</h4>
              <a 
                href={`https://doi.org/${summaryData.doi}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {summaryData.doi}
              </a>
            </div>
          )}

          {summaryData.references && summaryData.references.length > 0 && (
            <div>
              <h4 className="font-medium text-purple-700">Key References</h4>
              <ul className="list-disc pl-5 text-gray-700">
                {summaryData.references.slice(0, 5).map((reference, index) => (
                  <li key={index}>{reference}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-600">No summary data available for this work.</p>
      )}
    </div>
  );
};

export default SummaryTab;