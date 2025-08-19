import { useState } from 'react';
import { authApi, chatApi } from '../hooks/api';

const TestLoginPage = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Testing login...');
    
    try {
      const response = await authApi.login('admin@example.com', 'admin123');
      setResult(`✅ Login successful! User: ${JSON.stringify(response.user, null, 2)}\nToken: ${response.access_token}`);
    } catch (error: any) {
      setResult(`❌ Login failed: ${error.message || error}`);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testBackendHealth = async () => {
    setLoading(true);
    setResult('Testing backend health...');
    
    try {
      const response = await fetch('https://aiweb1-c965.onrender.com/');
      const data = await response.json();
      setResult(`✅ Backend healthy: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Backend error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testChat = async () => {
    setLoading(true);
    setResult('Testing chat...');
    
    try {
      // First login to get token
      const loginResponse = await authApi.login('admin@example.com', 'admin123');
      setResult(`✅ Login successful! Testing chat with token: ${loginResponse.access_token.substring(0, 20)}...`);
      
      // Test chat
      const stream = await chatApi.askQuestion({
        question: "Hello, this is a test question",
        doc_ids: [],
        k: 6
      });
      
      setResult(`✅ Chat stream created successfully! Stream type: ${typeof stream}`);
      
      // Try to read the stream
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        fullResponse += chunk;
        setResult(`✅ Chat response: ${fullResponse.substring(0, 200)}...`);
      }
      
    } catch (error: any) {
      setResult(`❌ Chat failed: ${error.message || error}`);
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Login & Chat Test Page</h1>
        
        <div className="space-y-4">
          <button
            onClick={testBackendHealth}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Backend Health
          </button>
          
          <button
            onClick={testLogin}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 ml-4"
          >
            Test Login
          </button>
          
          <button
            onClick={testChat}
            disabled={loading}
            className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50 ml-4"
          >
            Test Chat
          </button>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Result:</h2>
          <pre className="bg-white p-4 rounded border overflow-auto max-h-96">
            {result || 'No test run yet'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TestLoginPage;
