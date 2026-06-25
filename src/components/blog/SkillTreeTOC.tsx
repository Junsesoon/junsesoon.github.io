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

  const PALETTE_TEXT_HOVERS = [
    'hover:text-sky-300',
    'hover:text-emerald-300',
    'hover:text-purple-300',
    'hover:text-amber-300',
    'hover:text-rose-300',
  ];

  const PALETTE_ACTIVE_TEXT = [
    'text-sky-400 font-bold',
    'text-emerald-400 font-bold',
    'text-purple-400 font-bold',
    'text-amber-400 font-bold',
    'text-rose-400 font-bold',
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
      <aside className="hidden xl:block sticky top-24 xl:mt-24 h-fit w-48 xl:w-56 shrink-0 rounded-2xl border border-[#30363d]/45 bg-[#0d1117]/40 backdrop-blur-md p-5 shadow-[0_12px_32px_rgba(0,0,0,0.4)] z-20">
        <h3 className="mb-4 text-xs font-bold text-[#8b949e] uppercase tracking-widest border-b border-[#30363d]/45 pb-2">
          Domains Map
        </h3>
        <nav>
          <ul className="m-0 list-none p-0 text-xs space-y-3.5">
            {domains.map((domain, index) => {
              const isActive = activeId === domain.id;
              const idx = domain.colorIndex;
              const dotClass = isActive 
                ? PALETTE_DOTS[idx % PALETTE_DOTS.length] 
                : 'bg-slate-700/60';
              const textClass = isActive 
                ? PALETTE_ACTIVE_TEXT[idx % PALETTE_ACTIVE_TEXT.length] 
                : `text-[#8b949e] ${PALETTE_TEXT_HOVERS[idx % PALETTE_TEXT_HOVERS.length]}`;

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
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#0d1117]/95 text-slate-200 border border-[#30363d] shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md transition-transform hover:scale-105 xl:hidden"
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
          <div className="fixed bottom-24 right-6 z-50 flex max-h-[60vh] w-64 flex-col rounded-2xl border border-[#30363d] bg-[#0d1117]/95 backdrop-blur-md p-5 shadow-[0_24px_50px_rgba(0,0,0,0.6)] xl:hidden">
            <div className="mb-4 flex shrink-0 items-center justify-between border-b border-[#30363d]/60 pb-2">
              <h3 className="text-sm font-bold text-[#f0f6fc] uppercase tracking-wider">Domains Map</h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-[#8b949e] hover:text-[#f0f6fc] text-xl font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#21262d] transition-colors"
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
                    : 'bg-slate-700/60';
                  const textClass = isActive 
                    ? PALETTE_ACTIVE_TEXT[idx % PALETTE_ACTIVE_TEXT.length] 
                    : `text-[#8b949e] ${PALETTE_TEXT_HOVERS[idx % PALETTE_TEXT_HOVERS.length]}`;

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
