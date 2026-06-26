'use client';

import React, { useState, useEffect } from 'react';
import { type TocHeading } from '../../utils/parser';

interface TOCProps {
  headings: TocHeading[];
}

export default function TOC({ headings }: TOCProps) {
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
      { rootMargin: '-10% 0px -40% 0px' } // 상단 10%, 하단 40% 범위에 들어올 때 감지
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <>
      {/* Desktop TOC */}
      <aside className="hidden lg:block sticky top-40 h-fit w-48 shrink lg:w-56 xl:w-64 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-4 text-lg font-bold text-gray-800">
          목차
        </h3>
        <nav>
          <ul className="m-0 list-none p-0 text-sm">
            {headings.map((heading, index) => (
              <li
                key={index}
                className="mb-2"
                style={{ paddingLeft: `${(heading.level - 1) * 1}rem` }}
              >
                <a
                  href={`#${heading.id}`}
                  className={`block truncate rounded px-1 py-1 no-underline transition-colors ${
                    activeId === heading.id
                      ? 'bg-gray-200 text-gray-900 font-bold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={heading.text}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-transform hover:scale-105 lg:hidden"
        aria-label="목차 보기"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </button>

      {/* Mobile TOC Drawer */}
      {isOpen && (
        <>
          {/* 바탕 영역 클릭 시 닫힘 처리용 투명 배경 */}
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
          
          {/* 우측 하단 고정 플로팅 팝업 */}
          <div className="fixed bottom-24 right-6 z-50 flex max-h-[60vh] w-64 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl lg:hidden">
            <div className="mb-4 flex shrink-0 items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="text-lg font-bold text-gray-800">목차</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800">
                <span className="sr-only">닫기</span>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto pr-2">
              <ul className="m-0 list-none p-0 text-sm">
                {headings.map((heading, index) => (
                  <li key={index} className="mb-4" style={{ paddingLeft: `${(heading.level - 1) * 1}rem` }}>
                    <a
                      href={`#${heading.id}`}
                      onClick={() => setIsOpen(false)}
                      className={`block truncate no-underline transition-colors ${
                        activeId === heading.id
                          ? 'text-gray-900 font-bold'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </>
  );
}
