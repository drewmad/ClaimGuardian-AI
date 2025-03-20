import React from 'react';
import Link from 'next/link';
import { formatDate, formatFileSize } from '@/lib/utils';
import { Button } from '../shared/Button';

// Document type interface
interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: string;
  uploadDate: string | Date;
  description?: string | null;
  url?: string; // Temporary URL for viewing
  isAnalyzed: boolean;
  policyId?: string | null;
  claimId?: string | null;
}

interface DocumentListProps {
  documents: Document[];
  onDelete?: (id: string) => void;
  onAnalyze?: (id: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DocumentList({
  documents,
  onDelete,
  onAnalyze,
  isLoading = false,
  emptyMessage = "No documents found"
}: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Helper function to determine icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return '📷';
    } else if (fileType.includes('pdf')) {
      return '📄';
    } else if (fileType.includes('word')) {
      return '📝';
    } else if (fileType.includes('excel')) {
      return '📊';
    }
    return '📎';
  };

  // Format document type for display
  const formatDocumentType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {documents.map(doc => (
          <li key={doc.id} className="py-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 text-2xl">
                {getFileIcon(doc.fileType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.fileName}
                  </p>
                  <p className="text-xs text-gray-500 whitespace-nowrap">
                    {typeof doc.uploadDate === 'string' 
                      ? doc.uploadDate 
                      : formatDate(doc.uploadDate)}
                  </p>
                </div>
                <div className="mt-1">
                  <p className="text-xs text-gray-500">
                    {formatDocumentType(doc.documentType)} • {formatFileSize(doc.fileSize)}
                  </p>
                  {doc.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {doc.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 flex space-x-2">
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    View
                  </a>
                )}
                
                {!doc.isAnalyzed && onAnalyze && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAnalyze(doc.id)}
                  >
                    Analyze
                  </Button>
                )}
                
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(doc.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 