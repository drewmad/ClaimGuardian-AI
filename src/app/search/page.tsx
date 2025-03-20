'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface SearchResult {
  id: string;
  type: 'policy' | 'claim' | 'document';
  title: string;
  description: string;
  date: string;
  link: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTypes, setActiveTypes] = useState<string[]>(['policy', 'claim', 'document']);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  
  // Get search query from URL
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  
  // Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      if (status !== 'authenticated' || !query.trim()) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        const typeParam = activeTypes.length === 3 ? '' : `&types=${activeTypes.join(',')}`;
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}${typeParam}&page=${page}&limit=20`);
        
        if (!response.ok) {
          throw new Error('Search failed');
        }
        
        const data = await response.json();
        setResults(data.results);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [query, activeTypes, page, status]);
  
  // Toggle result type filter
  const toggleType = (type: string) => {
    if (activeTypes.includes(type)) {
      // Don't allow removing the last type
      if (activeTypes.length > 1) {
        setActiveTypes(activeTypes.filter((t) => t !== type));
      }
    } else {
      setActiveTypes([...activeTypes, type]);
    }
  };
  
  // If not authenticated, show login message
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Not Authenticated</h2>
          <p className="text-gray-600">Please log in to search.</p>
          <Link 
            href="/auth/login" 
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Search Results</h1>
      {query && (
        <p className="text-gray-600 mb-6">
          Showing results for: <span className="font-medium">{query}</span>
        </p>
      )}
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => toggleType('policy')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            activeTypes.includes('policy')
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Policies
        </button>
        <button
          onClick={() => toggleType('claim')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            activeTypes.includes('claim')
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Claims
        </button>
        <button
          onClick={() => toggleType('document')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            activeTypes.includes('document')
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Documents
        </button>
      </div>
      
      {/* Results or loading/error state */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-md">
          {error}
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-md shadow">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          <h2 className="mt-4 text-lg font-semibold">No results found</h2>
          <p className="text-gray-500 mt-1">
            {query.trim() 
              ? `No matches found for "${query}". Try a different search term or filter.` 
              : 'Enter a search term to find policies, claims, and documents.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-md shadow overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <p className="text-gray-600">
                Found {pagination.total} result{pagination.total !== 1 ? 's' : ''}
              </p>
            </div>
            
            <ul className="divide-y divide-gray-200">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <Link
                    href={result.link}
                    className="block p-6 hover:bg-gray-50"
                  >
                    <div className="flex items-start">
                      {/* Icon based on result type */}
                      <div className="mr-4 mt-1">
                        {result.type === 'policy' ? (
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        ) : result.type === 'claim' ? (
                          <div className="bg-yellow-100 p-2 rounded-lg">
                            <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                        ) : (
                          <div className="bg-green-100 p-2 rounded-lg">
                            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <h2 className="text-lg font-semibold">{result.title}</h2>
                          <span className="text-sm text-gray-500">
                            {new Date(result.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{result.description}</p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {result.type === 'policy' 
                              ? 'Policy' 
                              : result.type === 'claim' 
                                ? 'Claim' 
                                : 'Document'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="inline-flex rounded-md shadow" aria-label="Pagination">
                <Link
                  href={`/search?q=${encodeURIComponent(query)}&page=${Math.max(1, pagination.page - 1)}`}
                  className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                    pagination.page === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </Link>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => {
                    // Show first page, last page, and pages around current page
                    const delta = 1; // How many pages to show on each side of current page
                    return p === 1 || 
                           p === pagination.totalPages || 
                           (p >= pagination.page - delta && p <= pagination.page + delta);
                  })
                  .map((p, i, arr) => {
                    // Add ellipsis
                    const showEllipsisAfter = i < arr.length - 1 && arr[i + 1] - p > 1;
                    
                    return (
                      <React.Fragment key={p}>
                        <Link
                          href={`/search?q=${encodeURIComponent(query)}&page=${p}`}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                            p === pagination.page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </Link>
                        
                        {showEllipsisAfter && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        )}
                      </React.Fragment>
                    );
                  })}
                
                <Link
                  href={`/search?q=${encodeURIComponent(query)}&page=${Math.min(pagination.totalPages, pagination.page + 1)}`}
                  className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                    pagination.page === pagination.totalPages 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </Link>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
} 