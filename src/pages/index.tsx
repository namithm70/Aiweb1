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
import { formatFileSize, formatDate } from '../hooks/api';
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
    return null; // Will redirect to login
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
      gradient: 'from-orange-400 to-red-500',
      change: '+12%',
    },
    {
      name: 'Ready to Query',
      value: readyCount,
      icon: CheckCircleIcon,
      emoji: '✅',
      gradient: 'from-green-400 to-emerald-500',
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
      gradient: 'from-purple-400 to-pink-500',
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
      gradient: 'from-orange-500 to-red-600',
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
              <div className="glass-button p-4 orange-glow">
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
                <div className={`glass-button p-3 bg-gradient-to-br ${stat.gradient} opacity-25`}>
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
                  <div className={`glass-button p-4 bg-gradient-to-br ${action.gradient} opacity-25 group-hover:opacity-35 transition-opacity`}>
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
        {recentDocuments.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-6 flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-2" />
              Recent Documents
            </h2>
            <div className="glass-card p-6">
              <div className="space-y-4">
                {recentDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 glass-button hover:bg-white/10 transition-all duration-200 rounded-xl">
                    <div className="flex items-center">
                      <div className="glass-button p-2 mr-4">
                        <DocumentTextIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{doc.name}</h3>
                        <p className="text-white/60 text-sm">
                          {formatFileSize(doc.size)} • {formatDate(doc.updated_at)}
                        </p>
                      </div>
                    </div>
                    <Link 
                      href={`/chat?doc=${doc.id}`}
                      className="glass-button px-4 py-2 text-sm hover:scale-105 transition-all duration-200"
                    >
                      Chat
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {processingCount > 0 && (
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-6 flex items-center">
              <ClockIcon className="h-6 w-6 mr-2" />
              Processing Documents
            </h2>
            <div className="glass-card p-6">
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="spinner mx-auto mb-4"></div>
                  <p className="text-white/80 text-lg mb-2">
                    {processingCount} document{processingCount > 1 ? 's' : ''} being processed
                  </p>
                  <p className="text-white/60 text-sm">
                    This may take a few minutes. You'll be notified when ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && !docsLoading && (
          <div className="glass-card p-12 text-center">
            <div className="glass-button p-6 mx-auto mb-6 w-24 h-24 flex items-center justify-center">
              <DocumentArrowUpIcon className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              No documents yet
            </h3>
            <p className="text-white/70 text-lg mb-8 max-w-md mx-auto">
              Upload your first PDF document to start asking questions and getting AI-powered insights.
            </p>
            <Link 
              href="/documents"
              className="btn btn-primary inline-flex items-center px-8 py-3 text-lg font-semibold"
            >
              <CloudArrowUpIcon className="h-5 w-5 mr-2" />
              Upload Your First Document
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;