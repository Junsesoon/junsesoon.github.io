'use client';

import React, { useState, useEffect } from 'react';

type ThemeMode = 'dark' | 'light' | 'sepia';

const MoonIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

const SunIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.59 1.59m12.38 12.38l1.59 1.59M3 12h2.25m13.5 0H21M5.81 18.19l1.59-1.59m12.38-12.38l1.59-1.59M12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
  </svg>
);

const SepiaIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.168.477-4.5 1.253" />
  </svg>
);

export default function SkillTreeThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('skilltree_theme') as ThemeMode;
    if (saved && (saved === 'dark' || saved === 'light' || saved === 'sepia')) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      applyTheme('light');
    }
  }, []);

  const applyTheme = (t: ThemeMode) => {
    const rootEl = document.documentElement;
    if (rootEl) {
      rootEl.classList.remove('light-theme', 'sepia-theme');
      if (t === 'light') {
        rootEl.classList.add('light-theme');
      } else if (t === 'sepia') {
        rootEl.classList.add('sepia-theme');
      }
    }
  };

  const selectTheme = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    localStorage.setItem('skilltree_theme', nextTheme);
    applyTheme(nextTheme);
    setIsOpen(false);
    window.dispatchEvent(new Event('skilltree-theme-change'));
  };

  if (!mounted) return null;

  const themesList = [
    { id: 'light', icon: SunIcon, label: 'Light', x: -65, y: 0, delay: '0ms' },
    { id: 'dark', icon: MoonIcon, label: 'Dark', x: -46, y: 46, delay: '40ms' },
    { id: 'sepia', icon: SepiaIcon, label: 'Sepia', x: 0, y: 65, delay: '80ms' },
  ] as const;

  return (
    <div className={`fixed top-20 right-4 sm:right-8 z-30 select-none transition-opacity duration-300 ${
      isOpen ? 'opacity-100' : 'opacity-50 hover:opacity-100'
    }`}>
      {/* Radial/Arch Menu Options */}
      {themesList.map(({ id, icon: Icon, label, x, y, delay }) => (
        <button
          key={id}
          onClick={() => selectTheme(id)}
          style={{
            transform: isOpen 
              ? `translate(${x}px, ${y}px) scale(1)` 
              : 'translate(0px, 0px) scale(0)',
            opacity: isOpen ? 1 : 0,
            transitionDelay: delay,
          }}
          className={`absolute top-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 shadow-md cursor-pointer ${
            theme === id
              ? 'border-theme-accent text-theme-accent bg-theme-surface ring-2 ring-theme-accent/20'
              : 'bg-theme-surface border-theme-border text-theme-text-muted hover:text-theme-text-title hover:bg-theme-bg-hover'
          }`}
          aria-label={`${label} 테마 적용`}
          title={`${label} 테마 적용`}
        >
          <Icon />
        </button>
      ))}

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative z-40 flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 shadow-lg backdrop-blur-md cursor-pointer ${
          isOpen
            ? 'bg-theme-accent border-theme-accent text-white scale-105 rotate-90'
            : theme === 'light'
            ? 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-50'
            : theme === 'sepia'
            ? 'bg-[#faf4e4]/80 border-slate-300 text-[#5c4c38] hover:bg-[#fbf8f0]'
            : 'bg-[#0d1117]/80 border-[#30363d] text-slate-200 hover:bg-[#21262d]'
        }`}
        aria-label="테마 메뉴 열기"
      >
        {isOpen ? (
          // Close Icon
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Current Active Theme Icon
          theme === 'light' ? <SunIcon /> : theme === 'sepia' ? <SepiaIcon /> : <MoonIcon />
        )}
      </button>
    </div>
  );
}
