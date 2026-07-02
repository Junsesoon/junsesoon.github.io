'use client';

import React, { useState, useEffect } from 'react';

export default function SkillTreeThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('skilltree_theme') as 'dark' | 'light';
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      applyTheme('dark');
    }
  }, []);

  const applyTheme = (t: 'dark' | 'light') => {
    const rootEl = document.documentElement;
    if (rootEl) {
      if (t === 'light') {
        rootEl.classList.add('light-theme');
      } else {
        rootEl.classList.remove('light-theme');
      }
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('skilltree_theme', nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new Event('skilltree-theme-change'));
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className={`fixed top-20 right-4 sm:right-8 z-30 flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 shadow-lg backdrop-blur-md cursor-pointer ${
        theme === 'light'
          ? 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-50'
          : 'bg-[#0d1117]/80 border-[#30363d] text-slate-200 hover:bg-[#21262d]'
      }`}
      aria-label="테마 변경"
      title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
    >
      {theme === 'light' ? (
        // Moon Icon
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      ) : (
        // Sun Icon
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.59 1.59m12.38 12.38l1.59 1.59M3 12h2.25m13.5 0H21M5.81 18.19l1.59-1.59m12.38-12.38l1.59-1.59M12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
        </svg>
      )}
    </button>
  );
}
