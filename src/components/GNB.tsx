'use client';

import Link from 'next/link';
import React, { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PORTFOLIO_MENU, BLOG_MENU, ENABLE_MODE_TOGGLE } from '@/constants';

const GNBContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'blog';
  const pathname = usePathname();

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700">
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
          {ENABLE_MODE_TOGGLE && (
            <>
              {mode !== 'blog' && (
                <button
                  onClick={() => handleModeSwitch('blog')}
                  className="bg-gray-700 text-gray-200 px-4 py-2 cursor-pointer font-sans text-sm rounded-md font-semibold transition-colors duration-200 hover:bg-gray-600"
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

const GNB: React.FC = () => {
  return (
    <Suspense fallback={<nav className="bg-gray-900">Loading...</nav>}>
      <GNBContent />
    </Suspense>
  );
};

export default GNB;
