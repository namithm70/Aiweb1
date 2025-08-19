// Modern Dashboard with Glassmorphism Design

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../hooks/useDocuments';
import { 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon, 
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SparklesIcon,
  RocketLaunchIcon,
  DocumentArrowUpIcon,
  BoltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { formatFileSize, formatDate } from '../lib/api';
import Layout from '../components/Layout';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { documents, loading: docsLoading, processingCount, readyCount, failedCount } = useDocuments();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="text-center">
          <div className="glass-card p-8">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-white/80 text-lg">Loading your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const recentDocuments = documents
    .filter(doc => doc.status === 'ready')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const stats = [
    {
      name: 'Total Documents',
      value: documents.length,
      icon: DocumentTextIcon,
      emoji: '📄',
      gradient: 'from-blue-400 to-blue-600',
      change: '+12%',
    },
    {
      name: 'Ready to Query',
      value: readyCount,
      icon: CheckCircleIcon,
      emoji: '✅',
      gradient: 'from-green-400 to-green-600',
      change: '+8%',
    },
    {
      name: 'Processing',
      value: processingCount,
      icon: ClockIcon,
      emoji: '⏳',
      gradient: 'from-yellow-400 to-orange-500',
      change: '2 active',
    },
    {
      name: 'AI Queries',
      value: readyCount * 3,
      icon: BoltIcon,
      emoji: '⚡',
      gradient: 'from-purple-400 to-pink-600',
      change: '+24%',
    },
  ];

  const quickActions = [
    {
      name: 'Upload Document',
      description: 'Add new PDFs for AI analysis',
      href: '/documents',
      icon: DocumentArrowUpIcon,
      emoji: '📤',
      gradient: 'from-blue-500 to-purple-600',
      tag: 'Popular',
    },
    {
      name: 'AI Chat',
      description: 'Ask questions about your documents',
      href: '/chat',
      icon: ChatBubbleLeftRightIcon,
      emoji: '🤖',
      gradient: 'from-green-500 to-teal-600',
      tag: 'New',
    },
    {
      name: 'Analytics',
      description: 'View document insights & stats',
      href: '/documents',
      icon: ChartBarIcon,
      emoji: '📊',
      gradient: 'from-purple-500 to-pink-600',
      tag: 'Pro',
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="glass-card p-8 floating">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Welcome back, {user.email?.split('@')[0]}! 👋
              </h1>
              <p className="text-white/80 text-lg">
                Your AI-powered document workspace is ready to go
              </p>
            </div>
            <div className="hidden md:block">
              <div className="glass-button p-4 glow">
                <SparklesIcon className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div 
              key={stat.name} 
              className="glass-card p-6 hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium mb-1">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-white mb-1">
                    {docsLoading ? '...' : stat.value}
                  </p>
                  <p className="text-green-300 text-sm">
                    {stat.change}
                  </p>
                </div>
                <div className={`glass-button p-3 bg-gradient-to-br ${stat.gradient} opacity-20`}>
                  <span className="text-2xl">{stat.emoji}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold gradient-text mb-6 flex items-center">
            <RocketLaunchIcon className="h-6 w-6 mr-2" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => (
              <Link 
                key={action.name} 
                href={action.href} 
                className="glass-card p-6 hover:scale-105 transition-all duration-300 group relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full glass-button text-white`}>
                    {action.tag}
                  </span>
                </div>
                
                <div className="flex items-start">
                  <div className={`glass-button p-4 bg-gradient-to-br ${action.gradient} opacity-20 group-hover:opacity-30 transition-opacity`}>
                    <span className="text-3xl">{action.emoji}</span>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {action.name}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Documents */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-2" />
              Recent Documents
            </h2>
            <Link
              href="/documents"
              className="btn btn-secondary text-sm hover:scale-105"
            >
              View All →
            </Link>
          </div>
          
          {docsLoading ? (
            <div className="glass-card p-8">
              <div className="flex items-center justify-center">
                <div className="spinner mr-3"></div>
                <span className="text-white/80">Loading documents...</span>
              </div>
            </div>
          ) : recentDocuments.length > 0 ? (
            <div className="glass-card p-6">
              <div className="space-y-4">
                {recentDocuments.map((document, index) => (
                  <div 
                    key={document.id} 
                    className="flex items-center justify-between p-4 glass-dark rounded-xl hover:bg-white/5 transition-colors"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="glass-button p-2 mr-4">
                        <DocumentTextIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">
                          {document.name}
                        </p>
                        <p className="text-white/60 text-sm">
                          📄 {formatFileSize(document.size)} • {document.page_count} pages • {formatDate(document.updated_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium glass-button bg-green-500/20 text-green-300">
                        ✅ Ready
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <div className="glass-button p-6 inline-flex items-center justify-center rounded-full mb-6">
                <DocumentTextIcon className="h-12 w-12 text-white/50" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No documents yet</h3>
              <p className="text-white/70 mb-6 max-w-sm mx-auto">
                Upload your first PDF document to get started with AI-powered analysis
              </p>
              <Link
                href="/documents"
                className="btn btn-primary inline-flex items-center glow"
              >
                <CloudArrowUpIcon className="mr-2 h-5 w-5" />
                Upload Your First Document
              </Link>
            </div>
          )}
        </div>

        {/* Getting Started Guide */}
        {documents.length === 0 && (
          <div className="glass-card p-8">
            <div className="flex items-center mb-6">
              <SparklesIcon className="h-8 w-8 text-white mr-3" />
              <h2 className="text-2xl font-bold gradient-text">Get Started in 3 Steps</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-dark p-6 rounded-xl text-center">
                <div className="glass-button w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">📤 Upload Documents</h3>
                <p className="text-white/70 text-sm">
                  Upload PDF documents for AI analysis and processing
                </p>
              </div>
              
              <div className="glass-dark p-6 rounded-xl text-center">
                <div className="glass-button w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-r from-green-500 to-teal-600">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">⏳ AI Processing</h3>
                <p className="text-white/70 text-sm">
                  Our AI extracts and analyzes text content automatically
                </p>
              </div>
              
              <div className="glass-dark p-6 rounded-xl text-center">
                <div className="glass-button w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-600">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">🤖 Ask Questions</h3>
                <p className="text-white/70 text-sm">
                  Chat with your documents and get instant answers
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;