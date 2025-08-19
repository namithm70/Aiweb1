// Modern Layout with Glassmorphism Design

import React, { ReactNode, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  DocumentArrowUpIcon,
  ChatBubbleOvalLeftIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, emoji: '🏠' },
    { name: 'Documents', href: '/documents', icon: DocumentArrowUpIcon, emoji: '📂' },
    { name: 'AI Chat', href: '/chat', icon: ChatBubbleOvalLeftIcon, emoji: '🤖' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // If user is not authenticated, return minimal layout
  if (!user) {
    return (
      <div className="min-h-screen relative">
        {/* Floating Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl floating"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl floating" style={{ animationDelay: '-2s' }}></div>
          <div className="absolute top-1/2 left-3/4 w-80 h-80 bg-pink-400/10 rounded-full blur-3xl floating" style={{ animationDelay: '-4s' }}></div>
        </div>
        
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl floating"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl floating" style={{ animationDelay: '-2s' }}></div>
        <div className="absolute top-1/2 left-3/4 w-80 h-80 bg-pink-400/10 rounded-full blur-3xl floating" style={{ animationDelay: '-4s' }}></div>
      </div>

      {/* Mobile sidebar */}
      <div className={`lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 flex z-50">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full">
            <div className="glass-dark h-full flex flex-col">
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  className="glass-button p-2 text-white hover:scale-110"
                  onClick={() => setSidebarOpen(false)}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-1 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-6 mb-8">
                  <SparklesIcon className="h-8 w-8 text-white mr-3" />
                  <h1 className="text-2xl font-bold gradient-text">PDF-QA</h1>
                </div>
                
                <nav className="px-4 space-y-2">
                  {navigation.map((item) => {
                    const isActive = router.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`${
                          isActive
                            ? 'glass-button bg-white/20 text-white'
                            : 'glass-button hover:bg-white/10 text-white/80 hover:text-white'
                        } group flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200`}
                      >
                        <span className="text-2xl mr-3">{item.emoji}</span>
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-40">
        <div className="glass-dark h-full flex flex-col m-4 rounded-3xl">
          <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-8 mb-8">
              <SparklesIcon className="h-10 w-10 text-white mr-4" />
              <h1 className="text-3xl font-bold gradient-text">PDF-QA</h1>
            </div>
            
            <nav className="flex-1 px-6 space-y-3">
              {navigation.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'glass-button bg-white/20 text-white border-white/30 glow'
                        : 'glass-button hover:bg-white/10 text-white/80 hover:text-white border-white/10 hover:border-white/20'
                    } group flex items-center px-6 py-4 text-lg font-medium rounded-xl transition-all duration-300 hover:scale-105`}
                  >
                    <span className="text-3xl mr-4">{item.emoji}</span>
                    <div className="flex flex-col">
                      <span>{item.name}</span>
                      {isActive && <span className="text-xs text-white/60">Currently active</span>}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* User Section */}
          <div className="flex-shrink-0 p-6">
            <div className="glass-card p-4 hover:scale-105 transition-all duration-300">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 glass-button flex items-center justify-center rounded-full">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-lg font-medium text-white truncate">
                    👋 {user.email?.split('@')[0]}
                  </p>
                  <p className="text-sm text-white/60 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-3 glass-button p-2 text-white/80 hover:text-white hover:bg-red-500/20 transition-all duration-200"
                  title="Sign out"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-80 flex flex-col flex-1 relative z-10">
        {/* Top bar for mobile */}
        <div className="lg:hidden">
          <div className="glass fixed top-0 w-full z-30">
            <div className="flex items-center justify-between px-4 py-4">
              <button
                type="button"
                className="glass-button p-2 text-white hover:scale-110"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <div className="flex items-center">
                <SparklesIcon className="h-6 w-6 text-white mr-2" />
                <h1 className="text-xl font-bold gradient-text">PDF-QA</h1>
              </div>
              <button
                onClick={handleLogout}
                className="glass-button p-2 text-white/80 hover:text-white hover:bg-red-500/20"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 lg:pt-8 pt-24">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;