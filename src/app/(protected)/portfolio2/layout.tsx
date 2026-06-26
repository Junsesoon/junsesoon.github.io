'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function Portfolio2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const resolveTransitionRef = useRef<(() => void) | null>(null);

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
          if (href === '/portfolio2/about' && currentPath === '/portfolio2') {
            document.documentElement.classList.add('transition-going-about');
          } else if (href === '/portfolio2' && currentPath === '/portfolio2/about') {
            document.documentElement.classList.add('transition-going-home');
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
            document.documentElement.classList.remove('transition-going-about', 'transition-going-home');
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
    </div>
  );
}
