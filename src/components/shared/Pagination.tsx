import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string; // Optional: If not provided, will use current path with query params
  onPageChange?: (page: number) => void; // Optional: For client-side pagination
  showPageNumbers?: boolean; // Whether to show page numbers or just prev/next
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  onPageChange,
  showPageNumbers = true,
  className = '',
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // No pagination needed for single page
  if (totalPages <= 1) return null;
  
  // Handle page change based on mode (client-side or URL-based)
  const handlePageClick = (page: number) => {
    if (page === currentPage) return;
    
    if (onPageChange) {
      // Client-side pagination
      onPageChange(page);
    } else if (baseUrl) {
      // URL is provided directly
      router.push(`${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${page}`);
    } else {
      // Use current URL with updated page parameter
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', page.toString());
      router.push(`${pathname}?${params.toString()}`);
    }
  };
  
  // Create array of pages to show
  const getPageNumbers = () => {
    // For fewer pages, show all
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // For many pages, show first, last, and around current
    const pages = [];
    if (currentPage <= 3) {
      // Near start: show 1,2,3,4,5,...,last
      pages.push(1, 2, 3, 4, 5, null, totalPages);
    } else if (currentPage >= totalPages - 2) {
      // Near end: show 1,...,last-4,last-3,last-2,last-1,last
      pages.push(1, null, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      // Middle: show 1,...,current-1,current,current+1,...,last
      pages.push(1, null, currentPage - 1, currentPage, currentPage + 1, null, totalPages);
    }
    
    return pages;
  };
  
  // Generate link for a page
  const createPageLink = (page: number | null) => {
    if (page === null) {
      // Ellipsis
      return (
        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
          ...
        </span>
      );
    }
    
    return (
      <button
        onClick={() => handlePageClick(page)}
        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium
          ${page === currentPage
            ? 'z-10 bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        aria-current={page === currentPage ? 'page' : undefined}
      >
        {page}
      </button>
    );
  };
  
  return (
    <nav className={`flex justify-center ${className}`} aria-label="Pagination">
      <div className="inline-flex rounded-md shadow-sm -space-x-px">
        {/* Previous button */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 text-sm font-medium
            ${currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
        >
          <span className="sr-only">Previous</span>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Page numbers */}
        {showPageNumbers && getPageNumbers().map((page, index) => (
          <span key={`page-${index}`}>{createPageLink(page)}</span>
        ))}
        
        {/* Next button */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 text-sm font-medium
            ${currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
        >
          <span className="sr-only">Next</span>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </nav>
  );
} 