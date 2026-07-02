'use client';

import React, { useState, useEffect } from 'react';

interface DomainHeading {
  id: string;
  title: string;
  colorIndex: number;
}

interface SkillTreeTOCProps {
  domains: DomainHeading[];
}

export default function SkillTreeTOC({ domains }: SkillTreeTOCProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0px -50% 0px' } // Detect section intersection near upper-mid viewport
    );

    domains.forEach((domain) => {
      const element = document.getElementById(domain.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [domains]);

  if (domains.length === 0) return null;

  const PALETTE_DOTS = [
    'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.75)]',
    'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]',
    'bg-purple-400 shadow-[0_0_8px_rgba(167,139,250,0.75)]',
    'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.75)]',
    'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.75)]',
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // scroll-mt-24 accounts for navigation headers
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Desktop Sticky Side TOC */}
      <aside className="hidden xl:block sticky top-24 xl:mt-24 h-fit w-48 xl:w-56 shrink-0 rounded-2xl border p-5 transition-colors duration-300 z-20 border-theme-border bg-theme-surface shadow-[0_12px_32px_var(--color-shadow-surface)]">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest border-b pb-2 text-theme-text-muted border-theme-border">
          Domains Map
        </h3>
        <nav>
          <ul className="m-0 list-none p-0 text-xs space-y-3.5">
            {domains.map((domain, index) => {
              const isActive = activeId === domain.id;
              const idx = domain.colorIndex;
              const dotClass = isActive 
                ? PALETTE_DOTS[idx % PALETTE_DOTS.length] 
                : 'toc-dot-inactive';
              const textClass = isActive 
                ? `toc-active-${idx % 5}` 
                : `text-theme-text-muted toc-link-${idx % 5}`;

              return (
                <li key={index} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 ${dotClass}`} />
                  <a
                    href={`#${domain.id}`}
                    onClick={(e) => handleLinkClick(e, domain.id)}
                    className={`block truncate no-underline transition-all duration-300 ${textClass}`}
                    title={domain.title}
                  >
                    {domain.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border transition-all hover:scale-105 xl:hidden cursor-pointer bg-theme-surface border-theme-border text-theme-text-body shadow-[0_4px_20px_var(--color-shadow-surface)]"
        aria-label="목차 보기"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </button>

      {/* Mobile TOC Drawer Popup */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs xl:hidden" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Floating Drawer Container */}
          <div className="fixed bottom-24 right-6 z-50 flex max-h-[60vh] w-64 flex-col rounded-2xl border p-5 xl:hidden border-[var(--color-border-modal)] bg-[var(--color-bg-modal)] shadow-[0_24px_50px_var(--color-shadow-surface)]">
            <div className="mb-4 flex shrink-0 items-center justify-between border-b pb-2 border-theme-border">
              <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-title">Domains Map</h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-xl font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors text-theme-text-muted hover:text-theme-text-title hover:bg-theme-bg-hover"
              >
                &times;
              </button>
            </div>
            
            <div className="overflow-y-auto pr-1">
              <ul className="m-0 list-none p-0 text-xs space-y-4">
                {domains.map((domain, index) => {
                  const isActive = activeId === domain.id;
                  const idx = domain.colorIndex;
                  const dotClass = isActive 
                    ? PALETTE_DOTS[idx % PALETTE_DOTS.length] 
                    : 'toc-dot-inactive';
                  const textClass = isActive 
                    ? `toc-active-${idx % 5}` 
                    : `text-theme-text-muted toc-link-${idx % 5}`;

                  return (
                    <li key={index} className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 ${dotClass}`} />
                      <a
                        href={`#${domain.id}`}
                        onClick={(e) => handleLinkClick(e, domain.id)}
                        className={`block truncate no-underline transition-all duration-300 ${textClass}`}
                      >
                        {domain.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      )}
    </>
  );
}
