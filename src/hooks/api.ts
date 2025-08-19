// API utilities for communicating with the backend

import axios, { AxiosResponse } from 'axios';
import { 
  User, 
  Document, 
  AuthResponse, 
  UploadResponse, 
  QuestionRequest,
  ApiError 
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    api.defaults.headers.Authorization = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  } else {
    delete api.defaults.headers.Authorization;
    localStorage.removeItem('auth_token');
  }
};

// Initialize token from localStorage on module load
if (typeof window !== 'undefined') {
  const savedToken = localStorage.getItem('auth_token');
  if (savedToken) {
    setAuthToken(savedToken);
  }
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      setAuthToken(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API functions

// Authentication
export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
    });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

// Documents
export const documentApi = {
  async uploadDocument(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  async getDocuments(): Promise<Document[]> {
    const response = await api.get<{ documents: Document[] }>('/documents');
    return response.data.documents;
  },

  async deleteDocument(docId: string): Promise<void> {
    await api.delete(`/documents/${docId}`);
  },

  async getDocumentStatus(docId: string): Promise<Document> {
    const response = await api.get<Document>(`/documents/${docId}`);
    return response.data;
  },
};

// Chat
export const chatApi = {
  async askQuestion(request: QuestionRequest): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to ask question');
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    return response.body;
  },

  // Parse streaming response
  async* parseStreamingResponse(stream: ReadableStream<Uint8Array>) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              yield data;
            } catch (e) {
              console.warn('Failed to parse streaming data:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};

// Health check
export const healthApi = {
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await api.get<{ status: string; timestamp: string }>('/health');
    return response.data;
  },
};

// Error handling utility
export const handleApiError = (error: any): ApiError => {
  if (error.response?.data?.detail) {
    return {
      detail: error.response.data.detail,
      status: error.response.status,
    };
  } else if (error.message) {
    return {
      detail: error.message,
      status: error.response?.status,
    };
  } else {
    return {
      detail: 'An unexpected error occurred',
      status: 500,
    };
  }
};

// Utility to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Utility to format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export default api;
