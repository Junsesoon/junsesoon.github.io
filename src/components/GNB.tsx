'use client';

import Link from 'next/link';
import React, { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PORTFOLIO_MENU, BLOG_MENU, ENABLE_MODE_TOGGLE } from '@/constants';

interface GNBProps {
  isAdmin?: boolean;
}

const GNBContent: React.FC<GNBProps> = ({ isAdmin }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const getMode = () => {
    const queryMode = searchParams.get('mode');
    if (queryMode === 'blog' || queryMode === 'portfolio') {
      return queryMode;
    }

    // Infer from pathname if query parameter is missing
    const isPortfolioPath = PORTFOLIO_MENU.some((item) => {
      const itemPath = item.href.split('?')[0];
      // Ensure we don't match on '/' for portfolio
      return itemPath !== '/' && (pathname === itemPath || pathname.startsWith(itemPath + '/'));
    });

    return isPortfolioPath ? 'portfolio' : 'blog';
  };

  const mode = getMode();
  const currentMenu = mode === 'blog' ? BLOG_MENU : PORTFOLIO_MENU;

  const handleModeSwitch = (newMode: 'blog' | 'portfolio') => {
    router.push(`/?mode=${newMode}`);
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
      mode === 'portfolio' ? 'bg-red-900 border-red-800' : 'bg-gray-900 border-gray-700'
    }`}>
      <div className="grid grid-cols-3 items-center px-8 py-4 font-sans">
        {/* Left: Logo */}
        <div className="justify-self-start">
          <Link
            href={mode === 'portfolio' ? '/?mode=portfolio' : '/'}
            className="text-white text-2xl font-bold no-underline transition-opacity duration-200 hover:opacity-80"
          >
            home
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <div className="justify-self-center flex gap-10">
          {currentMenu.map((item) => {
            const isActive = isLinkActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`no-underline text-base font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-white font-bold'
                : mode === 'portfolio'
                ? 'text-red-200 hover:text-white'
                : 'text-gray-200 hover:text-white'
                }`}
              >
                {item.text}
              </Link>
            );
          })}
        </div>

        {/* Right: Mode Toggle Buttons */}
        <div className="justify-self-end flex items-center gap-3">
          {(ENABLE_MODE_TOGGLE || isAdmin) && (
            <>
              {mode !== 'blog' && (
                <button
                  onClick={() => handleModeSwitch('blog')}
                  className="bg-red-800 text-red-100 px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-red-700"
                >
                  Blog
                </button>
              )}
              {mode !== 'portfolio' && (
                <button
                  onClick={() => handleModeSwitch('portfolio')}
                  className="bg-gray-700 text-gray-200 px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-gray-600"
                >
                  Portfolio
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const GNB: React.FC<GNBProps> = ({ isAdmin }) => {
  return (
    <Suspense fallback={<nav className="bg-gray-900">Loading...</nav>}>
      <GNBContent isAdmin={isAdmin} />
    </Suspense>
  );
};

export default GNB;
