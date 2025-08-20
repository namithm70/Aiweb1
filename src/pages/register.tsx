// Register page with Glassmorphism Design

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  SparklesIcon, 
  UserPlusIcon,
  EnvelopeIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const { register, user, loading, error, clearError } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setValidationError('Please fill in all fields');
      return false;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register(email, password);
    } catch (err) {
      // Error is handled by the auth hook
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="text-center">
          <div className="glass-card p-8">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-white/80 text-lg">Setting up your account...</p>
          </div>
        </div>
      </div>
    );
  }

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-md w-full mx-auto">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <SparklesIcon className="h-10 w-10 text-white mr-3" />
              <h2 className="text-3xl font-bold gradient-text">Create Account</h2>
            </div>
            <p className="text-white/70">Join PDF-QA and start analyzing your documents</p>
          </div>

          {displayError && (
            <div className="glass-card bg-red-500/20 border-red-500/30 p-4 mb-6">
              <p className="text-red-200 text-sm">{displayError}</p>
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pl-10 pr-10 w-full focus-ring"
                  placeholder="Create a password"
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
              <p className="text-xs text-white/60 mt-1">Must be at least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-white/50" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input pl-10 pr-10 w-full focus-ring"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-white/50 hover:text-white/80" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-white/50 hover:text-white/80" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-white/70">
                I agree to the{' '}
                <a href="#" className="text-white hover:text-orange-300 underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-white hover:text-orange-300 underline">
                  Privacy Policy
                </a>
              </label>
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
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="h-5 w-5 mr-2" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-white hover:text-orange-300 font-medium transition-colors">
                Sign in here
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

export default RegisterPage;
