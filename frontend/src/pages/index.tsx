// Dashboard page

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import { 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon, 
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatFileSize, formatDate } from '@/lib/api';

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

  const recentDocuments = documents
    .filter(doc => doc.status === 'ready')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const stats = [
    {
      name: 'Total Documents',
      value: documents.length,
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      name: 'Ready to Query',
      value: readyCount,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      name: 'Processing',
      value: processingCount,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      name: 'Failed',
      value: failedCount,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
  ];

  const quickActions = [
    {
      name: 'Upload Document',
      description: 'Upload a new PDF document for analysis',
      href: '/documents',
      icon: CloudArrowUpIcon,
      color: 'text-primary-600',
      bg: 'bg-primary-100',
    },
    {
      name: 'Start Chatting',
      description: 'Ask questions about your documents',
      href: '/chat',
      icon: ChatBubbleLeftRightIcon,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      name: 'Manage Documents',
      description: 'View and organize your documents',
      href: '/documents',
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.email.split('@')[0]}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's an overview of your document analysis workspace.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {docsLoading ? '...' : stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start">
                <div className={`flex-shrink-0 rounded-md p-3 ${action.bg}`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    {action.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Recent Documents</h2>
          <Link
            href="/documents"
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            View all
          </Link>
        </div>
        
        {docsLoading ? (
          <div className="card p-6 mt-4">
            <div className="flex items-center justify-center">
              <div className="spinner mr-2"></div>
              <span className="text-gray-600">Loading documents...</span>
            </div>
          </div>
        ) : recentDocuments.length > 0 ? (
          <div className="mt-4 card overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {recentDocuments.map((document) => (
                <li key={document.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {document.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(document.size)} • {document.page_count} pages • {formatDate(document.updated_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ready
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="card p-6 mt-4 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading your first PDF document.
            </p>
            <div className="mt-6">
              <Link
                href="/documents"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <CloudArrowUpIcon className="mr-2 h-4 w-4" />
                Upload Document
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Getting Started Guide */}
      {documents.length === 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Upload Documents</h3>
                <p className="text-sm text-gray-500">
                  Upload PDF documents that you want to analyze and ask questions about.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Wait for Processing</h3>
                <p className="text-sm text-gray-500">
                  Our system will extract and analyze the text from your documents.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Start Asking Questions</h3>
                <p className="text-sm text-gray-500">
                  Use the chat interface to ask questions and get answers with citations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
