// Chat interface page with Glassmorphism Design

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
  ClipboardDocumentIcon,
  SparklesIcon
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
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="text-center">
          <div className="glass-card p-8">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-white/80 text-lg">Loading your chat...</p>
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
      <div className="flex flex-col h-[calc(100vh-200px)]">
        {/* Header */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <SparklesIcon className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-3xl font-bold gradient-text">AI Chat</h1>
                <p className="text-white/70">
                  Ask questions about your documents and get instant AI-powered answers
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowDocumentSelector(!showDocumentSelector)}
                className="btn btn-secondary text-sm"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                {selectedDocs.length > 0 ? `${selectedDocs.length} selected` : 'Select Docs'}
              </button>
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  className="btn btn-ghost text-sm"
                >
                  Clear Chat
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Document Selector */}
        {showDocumentSelector && (
          <div className="glass-card p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Select Documents to Query</h3>
            {readyDocuments.length === 0 ? (
              <p className="text-white/60">No documents available. Please upload some PDFs first.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {readyDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleDocumentToggle(doc.id)}
                    className={`glass-button p-3 text-left transition-all duration-200 ${
                      selectedDocs.includes(doc.id)
                        ? 'bg-white/25 border-white/40 orange-glow'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-white mr-2" />
                      <span className="text-white text-sm truncate">{doc.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-6">
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="glass-button p-6 mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Start a conversation
                </h3>
                <p className="text-white/70 text-lg mb-8 max-w-md mx-auto">
                  Ask questions about your documents and get instant AI-powered answers with citations.
                </p>
                {readyDocuments.length === 0 && (
                  <div className="glass-card bg-yellow-500/20 border-yellow-500/30 p-4">
                    <p className="text-yellow-200 text-sm">
                      <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                      No documents available. Please upload some PDFs first.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`message ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="glass-button p-2 rounded-full">
                      {message.role === 'user' ? (
                        <UserIcon className="h-5 w-5 text-white" />
                      ) : (
                        <SparklesIcon className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white/80">
                          {message.role === 'user' ? 'You' : 'AI Assistant'}
                        </span>
                        {message.role === 'assistant' && (
                          <button
                            onClick={() => copyToClipboard(message.content)}
                            className="glass-button p-1 text-white/60 hover:text-white"
                            title="Copy to clipboard"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      {message.loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="typing-dots">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                          </div>
                          <span className="text-white/60 text-sm">AI is thinking...</span>
                        </div>
                      ) : (
                        <div className="prose prose-invert max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="text-white mb-3">{children}</p>,
                              strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="text-white/80 italic">{children}</em>,
                              code: ({ children }) => (
                                <code className="bg-white/10 text-white px-2 py-1 rounded text-sm">
                                  {children}
                                </code>
                              ),
                              pre: ({ children }) => (
                                <pre className="bg-white/10 text-white p-4 rounded-lg overflow-x-auto">
                                  {children}
                                </pre>
                              ),
                              ul: ({ children }) => <ul className="text-white list-disc list-inside mb-3">{children}</ul>,
                              ol: ({ children }) => <ol className="text-white list-decimal list-inside mb-3">{children}</ol>,
                              li: ({ children }) => <li className="text-white mb-1">{children}</li>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}

                      {/* Citations */}
                      {message.citations && message.citations.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-white/60 text-sm mb-2">Sources:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.citations.map((citation, citationIndex) => (
                              <button
                                key={citationIndex}
                                className="citation"
                                onClick={() => {
                                  // Handle citation click - could open document or scroll to specific page
                                  console.log('Citation clicked:', citation);
                                }}
                              >
                                {citation.doc_name} (p. {citation.page})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                                             {/* Retry button for failed messages */}
                       {message.role === 'assistant' && !message.loading && (
                         <div className="mt-3">
                           <button
                             onClick={() => retryQuestion(message.id)}
                             className="btn btn-ghost text-sm"
                           >
                             <ArrowPathIcon className="h-4 w-4 mr-1" />
                             Retry
                           </button>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error Display */}
        {chatError && (
          <div className="glass-card bg-red-500/20 border-red-500/30 p-4 mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-300 mr-2" />
              <p className="text-red-200 text-sm">{chatError}</p>
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  readyDocuments.length === 0
                    ? "Upload some documents first to start chatting..."
                    : "Ask a question about your documents..."
                }
                disabled={isWaitingForResponse || readyDocuments.length === 0}
                className="glass-input w-full resize-none focus-ring"
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isWaitingForResponse || readyDocuments.length === 0}
              className="btn btn-primary px-6 py-3 disabled:opacity-50"
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
    </Layout>
  );
};

export default ChatPage;
