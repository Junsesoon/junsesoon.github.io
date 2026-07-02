'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import Link from 'next/link';

const navItems = [
  { path: '/portfolio2', label: 'Intro', icon: '🏠' },
  { path: '/portfolio2/about', label: 'About', icon: '👤' },
  { path: '/portfolio2/projects', label: 'Projects', icon: '🚀' },
  { path: '/portfolio2/skills', label: 'Skills', icon: '⚙️' }
];

export default function Portfolio2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const resolveTransitionRef = useRef<(() => void) | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // 경로(pathname)가 실제로 변경되었을 때 대기 중인 View Transition 프로미스를 해결(resolve)합니다.
  useEffect(() => {
    if (resolveTransitionRef.current) {
      resolveTransitionRef.current();
      resolveTransitionRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    const body = document.body;
    // 마운트 시 body 배경색을 PF2 전용 어두운 색(#030712)으로 변경
    body.style.backgroundColor = '#030712';

    return () => {
      // 언마운트 시 복구
      body.style.backgroundColor = '';
    };
  }, []);

  // 링크 클릭 시 브라우저 내장 View Transitions API를 적용하기 위한 이벤트 리스너
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      // 동일 도메인 내의 portfolio2 라우트 간 전환에만 적용 (해시 링크 제외)
      if (href && href.startsWith('/portfolio2') && !href.includes('#')) {
        if (typeof document !== 'undefined' && 'startViewTransition' in document) {
          e.preventDefault();

          // 이동 방향 확인 및 HTML 태그에 적절한 트랜지션 방향 클래스 추가
          const currentPath = window.location.pathname;

          const PAGE_ORDER: Record<string, number> = {
            '/portfolio2': 0,
            '/portfolio2/about': 1,
            '/portfolio2/projects': 2,
            '/portfolio2/skills': 3
          };

          const currentIndex = PAGE_ORDER[currentPath] ?? 0;
          const nextIndex = PAGE_ORDER[href] ?? 0;

          if (nextIndex > currentIndex) {
            document.documentElement.classList.add('transition-going-down');
          } else if (nextIndex < currentIndex) {
            document.documentElement.classList.add('transition-coming-up');
          }

          // Next.js 페이지 라우팅 완료를 감지하기 위한 프로미스 생성
          const promise = new Promise<void>((resolve) => {
            resolveTransitionRef.current = resolve;
          });

          // View Transition 실행
          const transition = document.startViewTransition(() => {
            router.push(href);
            return promise;
          });

          // 애니메이션이 끝나면 추가된 클래스 정리
          transition.finished.then(() => {
            document.documentElement.classList.remove(
              'transition-going-down', 'transition-coming-up'
            );
          });
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, [router]);

  return (
    <div className="w-full min-h-screen bg-[#030712] text-slate-100 font-sans relative overflow-hidden flex flex-col -mt-16">
      {/* GNB 겹침 처리를 위해 상단 마진 -mt-16을 공통 적용합니다. */}
      <div className="flex-1 w-full relative">
        {children}
      </div>

      {/* Floating Right Sidebar GNB Dock (Desktop Only) */}
      <nav className="hidden lg:flex fixed z-50 right-6 md:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 p-2 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl shadow-2xl pf2-gnb-dock"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 no-underline group ${
                isActive 
                  ? 'bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/35 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                  : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
              <span className="absolute right-14 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[10px] font-bold text-slate-200 bg-[#090d16]/95 border border-white/[0.08] rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl whitespace-nowrap hidden md:block">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Backdrop blur when Arc Menu is open */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px] lg:hidden transition-all duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Floating Hamburger / Arc Menu Container (Mobile/Tablet Only) */}
      <div className="lg:hidden fixed z-50 right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center pf2-gnb-dock">
        {/* Arc Navigation Items */}
        {navItems.map((item, index) => {
          const isActive = pathname === item.path;
          
          // Calculate staggered offsets for radial / fan layout spreading leftwards
          const offsets = [
            { dx: '-54px', dy: '-54px' }, // Item 0 (Intro) - Top-Left
            { dx: '-73px', dy: '-20px' }, // Item 1 (About) - Mid-Top-Left
            { dx: '-73px', dy: '20px' },  // Item 2 (Projects) - Mid-Bottom-Left
            { dx: '-54px', dy: '54px' }   // Item 3 (Skills) - Bottom-Left
          ];
          
          const { dx, dy } = offsets[index] || { dx: '0px', dy: '0px' };
          
          return (
            <Link
              key={item.path}
              href={item.path}
              style={{
                transform: isMobileMenuOpen 
                  ? `translate(${dx}, ${dy}) scale(1)` 
                  : 'translate(0px, 0px) scale(0)',
                opacity: isMobileMenuOpen ? 1 : 0,
                transitionDelay: isMobileMenuOpen ? `${index * 45}ms` : `${(3 - index) * 30}ms`,
                pointerEvents: isMobileMenuOpen ? 'auto' : 'none'
              }}
              className={`absolute w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-300 ease-out no-underline ${
                isActive 
                  ? 'bg-gradient-to-tr from-purple-500/30 to-pink-500/30 border border-purple-500/40 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                  : 'bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <span className="text-base">{item.icon}</span>
            </Link>
          );
        })}

        {/* Central Toggle Button with Micro-Interaction Rotation */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="relative z-50 w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all duration-300 shadow-2xl cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <div className={`transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-90 scale-95' : 'rotate-0 scale-100'}`}>
            {isMobileMenuOpen ? (
              <svg className="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg className="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
