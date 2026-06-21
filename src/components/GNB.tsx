'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PORTFOLIO_MENU, BLOG_MENU, ENABLE_MODE_TOGGLE } from '@/constants';

interface GNBProps {
  isAdmin?: boolean;
}

const GNBContent: React.FC<GNBProps> = ({ isAdmin: initialIsAdmin }) => {
  const router = useRouter();
  const pathname = usePathname();
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
    return pathname.startsWith('/portfolio') ? 'portfolio' : 'blog';
  };

  const mode = getMode();
  const currentMenu = mode === 'blog' ? BLOG_MENU : PORTFOLIO_MENU;

  const handleModeSwitch = (newMode: 'blog' | 'portfolio') => {
    setIsOpen(false);
    router.push(newMode === 'portfolio' ? '/portfolio' : '/');
  };

  const isLinkActive = (href: string, exact?: boolean) => {
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
      mode === 'portfolio' ? 'bg-red-50/90 border-red-200 backdrop-blur-md' : 'bg-white/90 border-gray-200 backdrop-blur-md'
    }`}>
      <div className="flex items-center justify-between px-6 py-4 md:grid md:grid-cols-3 md:px-8 font-sans">
        {/* Left: Logo */}
        <div className="md:justify-self-start">
          <Link
            href={mode === 'portfolio' ? '/portfolio' : '/'}
            className="text-gray-900 text-2xl font-bold no-underline transition-opacity duration-200 hover:opacity-80"
            onClick={() => setIsOpen(false)}
          >
            home
          </Link>
        </div>

        {/* Hamburger Icon for Mobile */}
        <div className="flex items-center md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-gray-900 focus:outline-none" aria-label="Toggle menu">
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
                    ? 'text-gray-900 font-bold'
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
              {mode !== 'blog' && (
                <button
                  onClick={() => handleModeSwitch('blog')}
                  className="bg-red-100 text-red-800 px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-red-200"
                >
                  Blog
                </button>
              )}
              {mode !== 'portfolio' && (
                <button
                  onClick={() => handleModeSwitch('portfolio')}
                  className="bg-gray-100 text-gray-800 px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-gray-200"
                >
                  Portfolio
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="flex flex-col items-center gap-4 border-t border-gray-100 bg-white pb-6 pt-4 font-sans md:hidden">
          {currentMenu.map((item) => {
            const isActive = isLinkActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`no-underline text-base font-medium whitespace-nowrap transition-colors duration-200 ${
                  isActive
                    ? 'text-gray-900 font-bold'
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
              {mode !== 'blog' && (
                <button onClick={() => handleModeSwitch('blog')} className="bg-red-100 text-red-800 px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-red-200">
                  Blog
                </button>
              )}
              {mode !== 'portfolio' && (
                <button onClick={() => handleModeSwitch('portfolio')} className="bg-gray-100 text-gray-800 px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-gray-200">
                  Portfolio
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
