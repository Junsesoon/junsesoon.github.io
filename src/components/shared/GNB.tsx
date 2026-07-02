'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PORTFOLIO_MENU, BLOG_MENU, PORTFOLIO2_MENU, ENABLE_MODE_TOGGLE } from '@/constants';

interface GNBProps {
  isAdmin?: boolean;
}

const GNBContent: React.FC<GNBProps> = ({ isAdmin: initialIsAdmin }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Hide GNB on portfolio2 pages
  if (pathname.startsWith('/portfolio2')) {
    return null;
  }

  const isSkilltree = pathname === '/skilltree';
  const isDarkTheme = pathname.startsWith('/portfolio2');
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin ?? false);

  useEffect(() => {
    if (initialIsAdmin !== undefined) {
      setIsAdmin(initialIsAdmin);
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.isAdmin);
        }
      } catch (error) {
        console.error('Failed to fetch admin status in GNB:', error);
      }
    };

    checkAdminStatus();
  }, [initialIsAdmin]);

  const getMode = () => {
    if (pathname.startsWith('/portfolio2')) {
      return 'portfolio2';
    }
    return pathname.startsWith('/portfolio') ? 'portfolio' : 'blog';
  };

  const mode = getMode();
  const currentMenu =
    mode === 'portfolio2'
      ? PORTFOLIO2_MENU
      : mode === 'portfolio'
      ? PORTFOLIO_MENU
      : BLOG_MENU;

  const handleModeSwitch = (newMode: 'blog' | 'portfolio' | 'portfolio2') => {
    setIsOpen(false);
    if (newMode === 'portfolio') {
      router.push('/portfolio');
    } else if (newMode === 'portfolio2') {
      router.push('/portfolio2');
    } else {
      router.push('/');
    }
  };

  const showBlogButton = pathname.startsWith('/portfolio');
  const showPortfolioButton = !pathname.startsWith('/portfolio') || pathname.startsWith('/portfolio2');
  const showPortfolio2Button = !pathname.startsWith('/portfolio2');

  const isLinkActive = (href: string, exact?: boolean) => {
    if (href.includes('#')) {
      return false;
    }
    const linkPath = href.split('?')[0];

    if (exact) {
      return pathname === linkPath;
    }

    if (linkPath === '/') {
      return pathname === linkPath;
    }

    return pathname === linkPath || pathname.startsWith(linkPath + '/');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300 ${
      mode === 'portfolio2'
        ? 'bg-[#030712]/80 border-white/[0.08] backdrop-blur-md'
        : isSkilltree
        ? 'bg-theme-surface border-theme-border backdrop-blur-md text-theme-text-body'
        : mode === 'portfolio'
        ? 'bg-red-50/90 border-red-200 backdrop-blur-md'
        : 'bg-white/90 border-gray-200 backdrop-blur-md'
    }`}>
      <div className="flex items-center justify-between px-6 py-4 md:grid md:grid-cols-3 md:px-8 font-sans">
        {/* Left: Logo */}
        <div className="md:justify-self-start">
          <Link
            href={mode === 'portfolio' ? '/portfolio' : mode === 'portfolio2' ? '/portfolio2' : '/'}
            className={`text-2xl font-bold no-underline transition-opacity duration-200 hover:opacity-80 ${
              isSkilltree
                ? 'text-theme-text-title'
                : isDarkTheme
                ? 'text-[#f0f6fc]'
                : 'text-gray-900'
            }`}
            onClick={() => setIsOpen(false)}
          >
            home
          </Link>
        </div>

        {/* Hamburger Icon for Mobile */}
        <div className="flex items-center md:hidden">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className={`focus:outline-none ${
              isSkilltree
                ? 'text-theme-text-muted hover:text-theme-text-title'
                : isDarkTheme
                ? 'text-[#8b949e] hover:text-[#f0f6fc]'
                : 'text-gray-500 hover:text-gray-900'
            }`} 
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Center: Navigation Links */}
        <div className="hidden justify-self-center md:flex md:gap-10">
          {currentMenu.map((item) => {
            const isActive = isLinkActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`no-underline text-base font-medium whitespace-nowrap transition-colors duration-200 ${
                  isActive
                    ? isSkilltree
                      ? 'text-theme-text-title font-bold'
                      : isDarkTheme
                      ? 'text-[#f0f6fc] font-bold'
                      : 'text-gray-900 font-bold'
                    : isSkilltree
                    ? 'text-theme-text-muted hover:text-theme-text-title'
                    : isDarkTheme
                    ? 'text-[#8b949e] hover:text-[#f0f6fc]'
                    : mode === 'portfolio'
                    ? 'text-red-800 hover:text-red-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.text}
              </Link>
            );
          })}
        </div>

        {/* Right: Mode Toggle Buttons */}
        <div className="hidden justify-self-end md:flex md:items-center md:gap-3">
          {(ENABLE_MODE_TOGGLE || isAdmin) && (
            <>
              {showBlogButton && (
                <button
                  onClick={() => handleModeSwitch('blog')}
                  className={isSkilltree
                    ? "bg-theme-bg-hover text-theme-text-body border border-theme-border px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-theme-surface"
                    : isDarkTheme
                    ? "bg-[#21262d] text-[#c9d1d9] border border-[#30363d] px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-[#30363d]"
                    : "bg-red-100 text-red-800 px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-red-200"
                  }
                >
                  Blog
                </button>
              )}
              {showPortfolioButton && (
                <button
                  onClick={() => handleModeSwitch('portfolio')}
                  className={isSkilltree
                    ? "bg-theme-bg-hover text-theme-text-body border border-theme-border px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-theme-surface"
                    : isDarkTheme
                    ? "bg-[#21262d] text-[#c9d1d9] border border-[#30363d] px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-[#30363d]"
                    : "bg-gray-100 text-gray-800 px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-gray-200"
                  }
                >
                  Portfolio
                </button>
              )}
              {showPortfolio2Button && (
                <button
                  onClick={() => handleModeSwitch('portfolio2')}
                  className={isSkilltree
                    ? "bg-theme-bg-hover text-theme-text-body border border-theme-border px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-theme-surface"
                    : isDarkTheme
                    ? "bg-[#21262d] text-[#c9d1d9] border border-[#30363d] px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-[#30363d]"
                    : "bg-indigo-100 text-indigo-800 px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-indigo-200"
                  }
                >
                  Portfolio 2.0
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className={`flex flex-col items-center gap-4 border-t pb-6 pt-4 font-sans md:hidden ${
          mode === 'portfolio2'
            ? 'bg-[#030712]/95 border-white/[0.08] text-slate-100'
            : isSkilltree
            ? 'bg-theme-surface border-theme-border text-theme-text-body'
            : 'bg-white border-gray-100 text-gray-900'
        }`}>
          {currentMenu.map((item) => {
            const isActive = isLinkActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`no-underline text-base font-medium whitespace-nowrap transition-colors duration-200 ${
                  isActive
                    ? isSkilltree
                      ? 'text-theme-text-title font-bold'
                      : isDarkTheme
                      ? 'text-[#f0f6fc] font-bold'
                      : 'text-gray-900 font-bold'
                    : isSkilltree
                    ? 'text-theme-text-muted hover:text-theme-text-title'
                    : isDarkTheme
                    ? 'text-[#8b949e] hover:text-[#f0f6fc]'
                    : mode === 'portfolio'
                    ? 'text-red-800 hover:text-red-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.text}
              </Link>
            );
          })}
          {(ENABLE_MODE_TOGGLE || isAdmin) && (
            <div className="mt-2 flex gap-3">
              {showBlogButton && (
                <button 
                  onClick={() => handleModeSwitch('blog')} 
                  className={isSkilltree
                    ? "bg-theme-bg-hover text-theme-text-body border border-theme-border px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-theme-surface"
                    : isDarkTheme
                    ? "bg-[#21262d] text-[#c9d1d9] border border-[#30363d] px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-[#30363d]"
                    : "bg-red-100 text-red-800 px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-red-200"
                  }
                >
                  Blog
                </button>
              )}
              {showPortfolioButton && (
                <button 
                  onClick={() => handleModeSwitch('portfolio')} 
                  className={isSkilltree
                    ? "bg-theme-bg-hover text-theme-text-body border border-theme-border px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-theme-surface"
                    : isDarkTheme
                    ? "bg-[#21262d] text-[#c9d1d9] border border-[#30363d] px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-[#30363d]"
                    : "bg-gray-100 text-gray-800 px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-gray-200"
                  }
                >
                  Portfolio
                </button>
              )}
              {showPortfolio2Button && (
                <button 
                  onClick={() => handleModeSwitch('portfolio2')} 
                  className={isSkilltree
                    ? "bg-theme-bg-hover text-theme-text-body border border-theme-border px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-theme-surface"
                    : isDarkTheme
                    ? "bg-[#21262d] text-[#c9d1d9] border border-[#30363d] px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-[#30363d]"
                    : "bg-indigo-100 text-indigo-800 px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-indigo-200"
                  }
                >
                  Portfolio 2.0
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

const GNB: React.FC<GNBProps> = ({ isAdmin }) => {
  return <GNBContent isAdmin={isAdmin} />;
};

export default GNB;
