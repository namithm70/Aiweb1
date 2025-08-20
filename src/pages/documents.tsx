// Documents management page with Glassmorphism Design

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
  XCircleIcon,
  SparklesIcon,
  DocumentArrowUpIcon
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
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-400 animate-pulse" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-white/50" />;
    }
  };

  const getStatusText = (status: Document['status']) => {
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'ready':
        return 'text-green-300';
      case 'processing':
        return 'text-yellow-300';
      case 'failed':
        return 'text-red-300';
      default:
        return 'text-white/60';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="text-center">
          <div className="glass-card p-8">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-white/80 text-lg">Loading your documents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="glass-card p-8 floating">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Document Library
              </h1>
              <p className="text-white/80 text-lg">
                Upload and manage your PDF documents for AI analysis
              </p>
            </div>
            <div className="hidden md:block">
              <div className="glass-button p-4 orange-glow">
                <DocumentArrowUpIcon className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="glass-card p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold gradient-text mb-2">
              Upload Documents
            </h2>
            <p className="text-white/70">
              Drag and drop PDF files here or click to browse
            </p>
          </div>

          <div
            {...getRootProps()}
            className={`upload-area ${isDragActive ? 'active' : ''} ${uploading ? 'opacity-50' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <CloudArrowUpIcon className="h-16 w-16 text-white/60 mx-auto" />
              <div>
                <p className="text-lg font-medium text-white">
                  {isDragActive ? 'Drop files here' : 'Drag & drop PDF files here'}
                </p>
                <p className="text-white/60 text-sm mt-1">
                  or click to select files (max 100MB each)
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="glass-card bg-red-500/20 border-red-500/30 p-4 mt-6">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Upload Progress */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mt-6 space-y-3">
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="glass-button p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium">{fileName}</span>
                    <span className="text-white/60 text-sm">{progress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-2" />
              Your Documents ({documents.length})
            </h2>
          </div>

          {loading ? (
            <div className="glass-card p-8">
              <div className="flex items-center justify-center">
                <div className="spinner mr-3"></div>
                <span className="text-white/80">Loading documents...</span>
              </div>
            </div>
          ) : documents.length > 0 ? (
            <div className="grid gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="glass-card p-6 hover:scale-102 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="glass-button p-3 mr-4">
                        <DocumentTextIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{doc.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-white/60 mt-1">
                          <span>{formatFileSize(doc.size)}</span>
                          {doc.page_count && <span>{doc.page_count} pages</span>}
                          <span>{formatDate(doc.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(doc.status)}
                        <span className={`text-sm font-medium ${getStatusColor(doc.status)}`}>
                          {getStatusText(doc.status)}
                        </span>
                      </div>
                      
                      {doc.status === 'ready' && (
                        <button
                          onClick={() => router.push(`/chat?doc=${doc.id}`)}
                          className="btn btn-primary text-sm"
                        >
                          Chat
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteDocument(doc)}
                        className="glass-button p-2 text-white/60 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200"
                        title="Delete document"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  {doc.error && (
                    <div className="mt-4 glass-card bg-red-500/20 border-red-500/30 p-3">
                      <p className="text-red-200 text-sm">
                        <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                        {doc.error}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="glass-button p-6 mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                <DocumentTextIcon className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                No documents yet
              </h3>
              <p className="text-white/70 text-lg mb-8 max-w-md mx-auto">
                Upload your first PDF document to start asking questions and getting AI-powered insights.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DocumentsPage;
