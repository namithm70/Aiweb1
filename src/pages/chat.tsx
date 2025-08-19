// Chat interface page

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../hooks/useDocuments';
import { useChat } from '../hooks/useChat';
import { 
  PaperAirplaneIcon,
  DocumentTextIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { ChatMessage, Citation } from '../types';
import Layout from '../components/Layout';

const ChatPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { documents } = useDocuments();
  const {
    messages,
    loading: chatLoading,
    selectedDocs,
    error: chatError,
    askQuestion,
    retryQuestion,
    clearMessages,
    clearError,
    setSelectedDocs,
    isWaitingForResponse
  } = useChat();
  
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const readyDocuments = documents.filter(doc => doc.status === 'ready');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isWaitingForResponse) return;

    const question = inputValue.trim();
    setInputValue('');
    clearError();
    
    await askQuestion(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleDocumentToggle = (docId: string) => {
    if (selectedDocs.includes(docId)) {
      setSelectedDocs(selectedDocs.filter(id => id !== docId));
    } else {
      setSelectedDocs([...selectedDocs, docId]);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
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

  if (readyDocuments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents ready</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload and process some PDF documents before you can start chatting.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/documents')}
              className="btn btn-primary"
            >
              Upload Documents
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto flex h-[calc(100vh-8rem)]">
      {/* Document Selector Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Document Selection</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedDocs.length === 0 ? 'All documents' : `${selectedDocs.length} selected`}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {readyDocuments.map((document) => (
              <label key={document.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedDocs.includes(document.id)}
                  onChange={() => handleDocumentToggle(document.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {document.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {document.page_count} pages • {document.chunk_count} chunks
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {selectedDocs.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setSelectedDocs([])}
              className="w-full btn btn-secondary text-sm"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Chat with Documents</h1>
              <p className="text-sm text-gray-500">
                Ask questions about your documents and get answers with citations
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="btn btn-secondary text-sm"
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Start a conversation</h3>
              <p className="mt-1 text-sm text-gray-500">
                Ask questions about your documents to get started.
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-400">Example questions:</p>
                <div className="space-y-1">
                  <button
                    onClick={() => setInputValue("What are the main topics covered in these documents?")}
                    className="block mx-auto text-xs text-primary-600 hover:text-primary-500"
                  >
                    "What are the main topics covered in these documents?"
                  </button>
                  <button
                    onClick={() => setInputValue("Can you summarize the key findings?")}
                    className="block mx-auto text-xs text-primary-600 hover:text-primary-500"
                  >
                    "Can you summarize the key findings?"
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageComponent
                  key={message.id}
                  message={message}
                  onRetry={() => retryQuestion(message.id)}
                  onCopy={copyToClipboard}
                />
              ))}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {chatError && (
          <div className="mx-4 mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-800">{chatError}</p>
                <button
                  onClick={clearError}
                  className="mt-1 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your documents..."
                disabled={isWaitingForResponse}
                rows={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isWaitingForResponse}
              className="btn btn-primary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWaitingForResponse ? (
                <div className="spinner"></div>
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      </div>
      </div>
    </Layout>
  );
};

// Message Component
interface MessageComponentProps {
  message: ChatMessage;
  onRetry: () => void;
  onCopy: (text: string) => void;
}

const MessageComponent: React.FC<MessageComponentProps> = ({ message, onRetry, onCopy }) => {
  const isUser = message.role === 'user';
  const isLoading = message.loading;

  return (
    <div className={`flex space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
        </div>
      )}
      
      <div className={`max-w-3xl ${isUser ? 'message-user' : isLoading ? 'message-loading' : 'message-assistant'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="typing-dots">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            ) : (
              <ReactMarkdown 
                className="prose prose-sm max-w-none"
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
          
          {!isLoading && !isUser && (
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={() => onCopy(message.content)}
                className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                title="Copy message"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
              <button
                onClick={onRetry}
                className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                title="Retry question"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-700 mb-2">Sources:</p>
            <div className="space-y-2">
              {message.citations.map((citation, index) => (
                <CitationComponent
                  key={index}
                  citation={citation}
                  index={index + 1}
                />
              ))}
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-2">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
          <UserIcon className="h-5 w-5 text-white" />
        </div>
      )}
    </div>
  );
};

// Citation Component
interface CitationComponentProps {
  citation: Citation;
  index: number;
}

const CitationComponent: React.FC<CitationComponentProps> = ({ citation, index }) => {
  return (
    <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded text-xs">
      <span className="citation">S{index}</span>
      <div className="flex-1">
        <p className="font-medium text-gray-700">{citation.doc_name}</p>
        <p className="text-gray-600 mb-1">Page {citation.page}</p>
        <p className="text-gray-500 italic">"{citation.excerpt}"</p>
      </div>
    </div>
  );
};

export default ChatPage;
