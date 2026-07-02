'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import React, { useState, useEffect } from 'react';

export default function Footer() {
  const pathname = usePathname();
  const isSkilltree = pathname === '/skilltree';
  const isPortfolio2 = pathname?.startsWith('/portfolio2');
  const [skilltreeTheme, setSkilltreeTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (isSkilltree) {
      const saved = localStorage.getItem('skilltree_theme') as 'dark' | 'light';
      if (saved) setSkilltreeTheme(saved);

      const handleThemeChange = () => {
        const current = localStorage.getItem('skilltree_theme') as 'dark' | 'light';
        setSkilltreeTheme(current || 'dark');
      };
      window.addEventListener('skilltree-theme-change', handleThemeChange);
      return () => window.removeEventListener('skilltree-theme-change', handleThemeChange);
    }
  }, [isSkilltree]);

  const isDarkTheme = (isSkilltree && skilltreeTheme === 'dark') || isPortfolio2;

  return (
    <footer className={`absolute bottom-0 left-0 right-0 w-full py-6 text-center text-sm transition-colors duration-300 bg-transparent z-10 ${
      isDarkTheme 
        ? 'text-slate-500' 
        : 'text-gray-500'
    }`}>
      © 2026{' '}
      <Link 
        href="/admin" 
        className={
          isSkilltree 
            ? (isDarkTheme ? 'text-[#8b949e] hover:text-[#f0f6fc]' : 'text-gray-600 hover:text-gray-900')
            : isPortfolio2
            ? 'text-indigo-400 hover:text-purple-400 transition-colors'
            : 'text-gray-600 hover:text-gray-900'
        }
      >
        Junseo.
      </Link>{' '}
      All rights reserved.
    </footer>
  );
}

