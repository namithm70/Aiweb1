// Documents management page

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../hooks/useDocuments';
import { 
  CloudArrowUpIcon,
  DocumentTextIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { formatFileSize, formatDate } from '../hooks/api';
import { Document } from '../types';
import Layout from '../components/Layout';

const DocumentsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { 
    documents, 
    loading, 
    error, 
    uploadDocument, 
    deleteDocument, 
    clearError 
  } = useDocuments();
  const router = useRouter();

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setUploading(true);
    clearError();

    for (const file of acceptedFiles) {
      try {
        await uploadDocument(file, (progress) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        });
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    }

    setUploading(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 5,
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: uploading
  });

  const handleDeleteDocument = async (doc: Document) => {
    if (confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      try {
        await deleteDocument(doc.id);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: Document['status']) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'ready':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'processing':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="mt-2 text-gray-600">
          Upload and manage your PDF documents for analysis.
        </p>
      </div>

      {/* Upload Area */}
      <div className="card p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Documents</h2>
        
        <div
          {...getRootProps()}
          className={`upload-area ${isDragActive ? 'active' : ''} ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <input {...getInputProps()} />
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            {isDragActive ? (
              <p className="text-sm text-gray-600">
                Drop the PDF files here...
              </p>
            ) : (
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF files only, up to 100MB each
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mt-4 space-y-2">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="flex items-center space-x-3">
                <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileName}
                    </p>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={clearError}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Your Documents</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading documents...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {documents.map((document) => (
                <li key={document.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      {getStatusIcon(document.status)}
                      <div className="ml-4 min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {document.name}
                          </p>
                          <span className={getStatusBadge(document.status)}>
                            {document.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-gray-500">
                            {formatFileSize(document.size)}
                          </p>
                          {document.page_count && (
                            <p className="text-xs text-gray-500">
                              {document.page_count} pages
                            </p>
                          )}
                          {document.chunk_count && (
                            <p className="text-xs text-gray-500">
                              {document.chunk_count} chunks
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatDate(document.updated_at)}
                          </p>
                        </div>
                        {document.error && (
                          <p className="text-xs text-red-600 mt-1">
                            Error: {document.error}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleDeleteDocument(document)}
                        className="p-2 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md"
                        title="Delete document"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="p-6 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload your first PDF document to get started.
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      {documents.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="card p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Ready</p>
                <p className="text-lg font-semibold text-gray-900">
                  {documents.filter(d => d.status === 'ready').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Processing</p>
                <p className="text-lg font-semibold text-gray-900">
                  {documents.filter(d => d.status === 'processing').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-lg font-semibold text-gray-900">
                  {documents.filter(d => d.status === 'failed').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default DocumentsPage;
