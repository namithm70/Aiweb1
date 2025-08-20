// Modern Login page with Glassmorphism Design

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  SparklesIcon, 
  DocumentTextIcon,
  LockClosedIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, user, loading, error, clearError } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();

    try {
      await login(email, password);
    } catch (err) {
      // Error is handled by the auth hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@example.com');
    setPassword('admin123');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="text-center">
          <div className="glass-card p-8">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-white/80 text-lg">Loading your experience...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Hero Section */}
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Welcome Content */}
        <div className="hidden lg:block space-y-8">
          <div className="glass-card p-8 floating">
            <div className="flex items-center mb-6">
              <SparklesIcon className="h-12 w-12 text-white mr-4" />
              <div>
                <h1 className="text-4xl font-bold gradient-text">PDF-QA</h1>
                <p className="text-white/70 text-lg">AI-Powered Document Intelligence</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="glass-button p-3">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Upload & Analyze</h3>
                  <p className="text-white/70">Upload PDFs and get instant AI-powered insights</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="glass-button p-3">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Smart Questions</h3>
                  <p className="text-white/70">Ask complex questions about your documents</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="glass-button p-3">
                  <LockClosedIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Secure & Private</h3>
                  <p className="text-white/70">Your documents are processed securely and privately</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-white font-semibold text-lg mb-4">🚀 Ready to get started?</h3>
            <p className="text-white/70 mb-4">Join thousands of users who are already using PDF-QA to extract insights from their documents.</p>
            <div className="flex items-center space-x-4 text-sm text-white/60">
              <span>✅ No credit card required</span>
              <span>✅ Free to start</span>
              <span>✅ Instant access</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="glass-card p-8 max-w-md w-full mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <SparklesIcon className="h-10 w-10 text-white mr-3" />
              <h2 className="text-3xl font-bold gradient-text">Welcome Back</h2>
            </div>
            <p className="text-white/70">Sign in to your PDF-QA account</p>
          </div>

          {error && (
            <div className="glass-card bg-red-500/20 border-red-500/30 p-4 mb-6">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-white/50" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input pl-10 w-full focus-ring"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-white/50" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pl-10 pr-10 w-full focus-ring"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-white/50 hover:text-white/80" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-white/50 hover:text-white/80" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-white/70">
                  Remember me
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full flex justify-center items-center py-3 text-lg font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="btn btn-ghost text-sm hover:underline"
              >
                Try Demo Account
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm">
              Don't have an account?{' '}
              <Link href="/register" className="text-white hover:text-orange-300 font-medium transition-colors">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-400/15 rounded-full blur-3xl floating"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-yellow-400/15 rounded-full blur-3xl floating" style={{ animationDelay: '-2s' }}></div>
        <div className="absolute top-1/2 left-3/4 w-80 h-80 bg-red-400/15 rounded-full blur-3xl floating" style={{ animationDelay: '-4s' }}></div>
      </div>
    </div>
  );
};

export default LoginPage;