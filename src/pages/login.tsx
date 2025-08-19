// Modern Login page with Glassmorphism Design

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
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
                  <p className="text-white/70">Your documents are processed securely</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="glass-card p-8 hover:scale-105 transition-all duration-500">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 glass-button rounded-full mb-6 glow">
                <SparklesIcon className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold gradient-text mb-2">
                Welcome Back
              </h2>
              <p className="text-white/70">
                Sign in to continue your AI journey
              </p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
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
                    className="glass-input w-full pl-10 focus-ring"
                    placeholder="Enter your email"
                  />
                </div>
                
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
                    className="glass-input w-full pl-10 pr-12 focus-ring"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:scale-110 transition-transform"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-white/70 hover:text-white" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-white/70 hover:text-white" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="glass-dark p-4 rounded-xl border border-red-400/20">
                  <p className="text-red-300 text-sm text-center">⚠️ {error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !email || !password}
                className="btn btn-primary w-full py-4 text-lg font-semibold glow disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Sign In
                  </>
                )}
              </button>

              {/* Quick Demo Access */}
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center">
                  <div className="border-t border-white/20 flex-grow"></div>
                  <span className="px-4 text-white/60 text-sm">Quick Access</span>
                  <div className="border-t border-white/20 flex-grow"></div>
                </div>
                
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="btn btn-secondary w-full text-sm hover:scale-105"
                >
                  🚀 Try Demo Account
                </button>
                
                <p className="text-xs text-white/60">
                  Demo: admin@example.com / admin123
                </p>
              </div>

              <div className="text-center pt-4">
                <p className="text-white/70">
                  New to PDF-QA?{' '}
                  <Link 
                    href="/register"
                    className="font-semibold text-white hover:text-white/80 underline transition-colors"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;