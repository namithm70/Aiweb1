// Chat management hook

import { useState, useCallback } from 'react';
import { ChatMessage, ChatState, QuestionRequest, Citation } from '../types';
import { chatApi, handleApiError } from './api';

export const useChat = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    loading: false,
    selectedDocs: [],
    error: undefined,
  });

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }));

    return newMessage.id;
  }, []);

  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    }));
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.id !== messageId),
    }));
  }, []);

  const setSelectedDocs = useCallback((docIds: string[]) => {
    setState(prev => ({
      ...prev,
      selectedDocs: docIds,
    }));
  }, []);

  const askQuestion = useCallback(async (question: string) => {
    if (!question.trim()) return;

    setState(prev => ({ ...prev, loading: true, error: undefined }));

    // Add user message
    const userMessageId = addMessage({
      role: 'user',
      content: question,
    });

    // Add loading assistant message
    const assistantMessageId = addMessage({
      role: 'assistant',
      content: '',
      loading: true,
    });

    try {
      const request: QuestionRequest = {
        question,
        doc_ids: state.selectedDocs.length > 0 ? state.selectedDocs : undefined,
        k: 6,
      };

      const stream = await chatApi.askQuestion(request);
      const responseGenerator = chatApi.parseStreamingResponse(stream);

      let fullResponse = '';
      const citations: Citation[] = [];
      let isFirstToken = true;

      for await (const chunk of responseGenerator) {
        if (chunk.type === 'token' && chunk.content) {
          if (isFirstToken) {
            // Remove loading state on first token
            updateMessage(assistantMessageId, { loading: false });
            isFirstToken = false;
          }
          
          fullResponse += chunk.content;
          updateMessage(assistantMessageId, { content: fullResponse });
        } else if (chunk.type === 'citation' && chunk.citation) {
          citations.push(chunk.citation);
        } else if (chunk.type === 'complete' && chunk.final_response) {
          // Update with final response and citations
          updateMessage(assistantMessageId, {
            content: chunk.final_response.answer,
            citations: chunk.final_response.citations,
            loading: false,
          });
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Unknown error occurred');
        }
      }

      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      const apiError = handleApiError(error);
      
      // Update assistant message with error
      updateMessage(assistantMessageId, {
        content: `Sorry, I encountered an error: ${apiError.detail}`,
        loading: false,
      });

      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError.detail,
      }));
    }
  }, [state.selectedDocs, addMessage, updateMessage]);

  const retryQuestion = useCallback((messageId: string) => {
    const message = state.messages.find(msg => msg.id === messageId);
    if (message && message.role === 'user') {
      // Remove the failed assistant response
      const assistantMessageIndex = state.messages.findIndex(
        (msg, index) => index > state.messages.findIndex(m => m.id === messageId) && 
                      msg.role === 'assistant'
      );
      
      if (assistantMessageIndex !== -1) {
        const assistantMessage = state.messages[assistantMessageIndex];
        removeMessage(assistantMessage.id);
      }

      // Re-ask the question
      askQuestion(message.content);
    }
  }, [state.messages, askQuestion, removeMessage]);

  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      error: undefined,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: undefined }));
  }, []);

  // Get messages by type
  const getUserMessages = useCallback(() => {
    return state.messages.filter(msg => msg.role === 'user');
  }, [state.messages]);

  const getAssistantMessages = useCallback(() => {
    return state.messages.filter(msg => msg.role === 'assistant');
  }, [state.messages]);

  const getLastMessage = useCallback(() => {
    return state.messages[state.messages.length - 1];
  }, [state.messages]);

  const getMessagePairs = useCallback(() => {
    const pairs: Array<{ user: ChatMessage; assistant?: ChatMessage }> = [];
    const userMessages = getUserMessages();
    const assistantMessages = getAssistantMessages();

    userMessages.forEach((userMsg, index) => {
      const assistantMsg = assistantMessages[index];
      pairs.push({ user: userMsg, assistant: assistantMsg });
    });

    return pairs;
  }, [getUserMessages, getAssistantMessages]);

  return {
    ...state,
    askQuestion,
    retryQuestion,
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,
    clearError,
    setSelectedDocs,
    // Computed values
    getUserMessages,
    getAssistantMessages,
    getLastMessage,
    getMessagePairs,
    hasMessages: state.messages.length > 0,
    isWaitingForResponse: state.loading || state.messages.some(msg => msg.loading),
  };
};
