// Type definitions for the PDF-QA application

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  is_active: boolean;
}

export interface Document {
  id: string;
  user_id: string;
  name: string;
  size: number;
  mime_type: string;
  status: 'processing' | 'ready' | 'failed';
  page_count?: number;
  chunk_count?: number;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface Citation {
  doc_id: string;
  doc_name: string;
  page: number;
  score: number;
  excerpt: string;
  char_start?: number;
  char_end?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  timestamp: string;
  loading?: boolean;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  usage?: {
    retrieved_docs: number;
    total_tokens: number;
  };
  latency_ms?: number;
  conversation_id?: string;
}

export interface StreamChunk {
  type: 'token' | 'citation' | 'complete' | 'error';
  content?: string;
  citation?: Citation;
  final_response?: ChatResponse;
  error?: string;
}

export interface QuestionRequest {
  question: string;
  doc_ids?: string[];
  k?: number;
  conversation_id?: string;
}

export interface UploadResponse {
  doc_id: string;
  status: string;
  message: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiError {
  detail: string;
  status?: number;
}

// UI State types
export interface DocumentListState {
  documents: Document[];
  loading: boolean;
  error?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  selectedDocs: string[];
  error?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error?: string;
}

export interface AppState {
  auth: AuthState;
  documents: DocumentListState;
  chat: ChatState;
}
