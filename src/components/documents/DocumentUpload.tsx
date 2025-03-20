import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../shared/Button';
import { Loading } from '../shared/Loading';

// Document type enum matching our Prisma schema
type DocumentType = 
  | 'POLICY'
  | 'CLAIM'
  | 'IDENTITY'
  | 'PROOF_OF_LOSS'
  | 'ESTIMATE'
  | 'INVOICE'
  | 'RECEIPT'
  | 'PHOTO'
  | 'OTHER';

// Props for the component
interface DocumentUploadProps {
  onUploadComplete?: (documentId: string) => void;
  documentType: DocumentType;
  policyId?: string;
  claimId?: string;
  maxSizeMB?: number;
  allowedFileTypes?: string[];
  multiple?: boolean;
}

export function DocumentUpload({
  onUploadComplete,
  documentType,
  policyId,
  claimId,
  maxSizeMB = 10, // Default 10MB max
  allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf'],
  multiple = false,
}: DocumentUploadProps) {
  // State for managing uploads
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // Calculate max size in bytes
  const maxSize = maxSizeMB * 1024 * 1024;

  // Handle dropped files
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(file => {
        if (file.file.size > maxSize) {
          return `${file.file.name} exceeds the maximum size of ${maxSizeMB}MB`;
        }
        if (!allowedFileTypes.includes(file.file.type)) {
          return `${file.file.name} is not an allowed file type`;
        }
        return `${file.file.name} could not be uploaded`;
      });
      setError(errors.join('. '));
      return;
    }

    // Clear previous errors
    setError(null);
    
    // Handle accepted files
    setFiles(prevFiles => (multiple ? [...prevFiles, ...acceptedFiles] : acceptedFiles));
  }, [maxSize, allowedFileTypes, multiple, maxSizeMB]);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple,
  });

  // Remove a file from the list
  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Handle file upload
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const uploadPromises = files.map(async (file, index) => {
        // Create form data for the file
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        
        if (policyId) formData.append('policyId', policyId);
        if (claimId) formData.append('claimId', claimId);

        // Upload the file
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        // Update progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        return await response.json();
      });

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);
      
      // Notify of completion
      setSuccess(`Successfully uploaded ${results.length} file${results.length !== 1 ? 's' : ''}`);
      setFiles([]);
      setUploadProgress({});
      
      // Call the completion callback with the first document ID
      if (results.length > 0 && onUploadComplete) {
        onUploadComplete(results[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  // Format file size for display
  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {/* Dropzone area */}
      <div
        {...getRootProps()}
        className={`p-6 border-2 border-dashed rounded-md text-center cursor-pointer ${
          isDragActive 
            ? 'border-primary bg-primary/10' 
            : 'border-gray-300 hover:border-primary'
        }`}
      >
        <input {...getInputProps()} />
        
        {isDragActive ? (
          <p className="text-primary">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-gray-700 mb-2">
              Drag & drop files here, or click to select files
            </p>
            <p className="text-sm text-gray-500">
              Allowed file types: {allowedFileTypes.join(', ')}<br />
              Maximum file size: {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium text-gray-900 mb-2">Selected Files</h3>
          <ul className="divide-y divide-gray-200">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="py-3 flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                {uploadProgress[file.name] ? (
                  <div className="w-16 bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress[file.name]}%` }}
                    ></div>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error and success messages */}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-2 text-sm text-green-600">{success}</p>}

      {/* Upload button */}
      <div className="mt-4">
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          isLoading={uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
        </Button>
      </div>
    </div>
  );
} 