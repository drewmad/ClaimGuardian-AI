'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOnClickOutside } from '@/hooks/use-click-outside';

export default function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Close results dropdown when clicking outside
  useOnClickOutside(searchRef, () => setIsResultsOpen(false));
  
  // Memoize the search function to prevent recreation on every render
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsResultsOpen(false);
      return;
    }
    
    try {
      setIsSearching(true);
      setError(null);
      
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`,
        { signal: abortController.signal }
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setSearchResults(data.results);
      setIsResultsOpen(true);
    } catch (err) {
      // Only set error if it's not an abort error
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        console.error('Search error:', err);
        setError('Failed to search');
      }
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  // Debounced search
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);
    
    return () => {
      clearTimeout(debounceTimeout);
      // Cancel any in-flight requests when query changes or component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [query, performSearch]);
  
  // Handle form submission - go to search results page
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setIsResultsOpen(false);
  };
  
  return (
    <div ref={searchRef} className="relative w-full max-w-xl">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg 
              className="w-5 h-5 text-gray-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
          
          <input
            type="search"
            className="block w-full p-3 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search for policies, claims, documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0 || isSearching) {
                setIsResultsOpen(true);
              }
            }}
          />
          
          {isSearching && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg 
                className="animate-spin h-5 w-5 text-gray-400" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>
      </form>
      
      {/* Search results dropdown */}
      {isResultsOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-96 overflow-auto">
          {error ? (
            <div className="p-4 text-red-500 text-sm">{error}</div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm">
              {query.trim() ? 'No results found.' : 'Start typing to search...'}
            </div>
          ) : (
            <div>
              <ul>
                {searchResults.map((result) => (
                  <li key={`${result.type}-${result.id}`} className="border-b last:border-b-0">
                    <Link
                      href={result.link}
                      className="block p-4 hover:bg-gray-50"
                      onClick={() => setIsResultsOpen(false)}
                    >
                      <div className="flex items-start">
                        {/* Icon based on result type */}
                        <div className="mr-3 mt-0.5">
                          {result.type === 'policy' ? (
                            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          ) : result.type === 'claim' ? (
                            <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        
                        <div>
                          <div className="font-medium text-sm">{result.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {result.description}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(result.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              
              {/* View all results link */}
              <div className="p-3 border-t text-center">
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => setIsResultsOpen(false)}
                >
                  View all results
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 