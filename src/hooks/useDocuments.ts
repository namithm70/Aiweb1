// Documents management hook

import { useState, useEffect } from 'react';
import { Document, DocumentListState } from '../types';
import { documentApi, handleApiError } from './api';

export const useDocuments = () => {
  const [state, setState] = useState<DocumentListState>({
    documents: [],
    loading: false,
    error: undefined,
  });

  const loadDocuments = async () => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const documents = await documentApi.getDocuments();
      setState({
        documents,
        loading: false,
        error: undefined,
      });
    } catch (error) {
      const apiError = handleApiError(error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError.detail,
      }));
    }
  };

  const uploadDocument = async (
    file: File,
    onProgress?: (progress: number) => void
  ) => {
    try {
      const response = await documentApi.uploadDocument(file, onProgress);
      
      // Add the new document to the list with processing status
      const newDocument: Document = {
        id: response.doc_id,
        user_id: '', // Will be filled by the backend
        name: file.name,
        size: file.size,
        mime_type: file.type,
        status: 'processing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        documents: [newDocument, ...prev.documents],
      }));

      // Start polling for status updates
      pollDocumentStatus(response.doc_id);

      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      await documentApi.deleteDocument(docId);
      setState(prev => ({
        ...prev,
        documents: prev.documents.filter(doc => doc.id !== docId),
      }));
    } catch (error) {
      throw handleApiError(error);
    }
  };

  const updateDocumentStatus = (docId: string, updates: Partial<Document>) => {
    setState(prev => ({
      ...prev,
      documents: prev.documents.map(doc =>
        doc.id === docId ? { ...doc, ...updates } : doc
      ),
    }));
  };

  const pollDocumentStatus = async (docId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        updateDocumentStatus(docId, { 
          status: 'failed', 
          error: 'Processing timeout' 
        });
        return;
      }

      try {
        const document = await documentApi.getDocumentStatus(docId);
        updateDocumentStatus(docId, document);

        if (document.status === 'processing') {
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        }
      } catch (error) {
        updateDocumentStatus(docId, { 
          status: 'failed', 
          error: 'Status check failed' 
        });
      }
    };

    poll();
  };

  const getDocumentsByStatus = (status: Document['status']) => {
    return state.documents.filter(doc => doc.status === status);
  };

  const getDocumentById = (docId: string) => {
    return state.documents.find(doc => doc.id === docId);
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: undefined }));
  };

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  return {
    ...state,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    updateDocumentStatus,
    getDocumentsByStatus,
    getDocumentById,
    clearError,
    // Computed values
    processingCount: getDocumentsByStatus('processing').length,
    readyCount: getDocumentsByStatus('ready').length,
    failedCount: getDocumentsByStatus('failed').length,
  };
};
