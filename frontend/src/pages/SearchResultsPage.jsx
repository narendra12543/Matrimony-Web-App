import React from 'react';
import { useLocation } from 'react-router-dom';

const SearchResultsPage = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('query');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Search Results for "{query}"</h1>
      <p>This is where your search results will be displayed.</p>
      {/* You will fetch and display actual search results here */}
    </div>
  );
};

export default SearchResultsPage;