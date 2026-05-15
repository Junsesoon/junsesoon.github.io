'use client';

import Link from 'next/link';
import React, { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from './GNB.module.css';

// 개발자 제어 영역: 모드 전환 버튼의 가시성을 제어합니다.
const ENABLE_MODE_TOGGLE = true; // 이 값을 false로 바꾸면 버튼이 사라집니다.

const GNBContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'blog';
  const pathname = usePathname();
  const blogLinks = [
    { href: '/cs', text: 'CS' },
    { href: '/language', text: 'Language' },
    { href: '/infra', text: 'Infra' },
    { href: '/data', text: 'Data' },
    { href: '/tools', text: 'Tools' },
  ];

  const portfolioLinks = [
    { href: '/about', text: 'About' },
    { href: '/project', text: 'Project' },
    { href: '/skill', text: 'Skill' },
    { href: '/trouble-shotting', text: 'Trouble shotting' },
    { href: '/decision', text: 'Decision' },
  ];

  const currentLinks = mode === 'blog' ? blogLinks : portfolioLinks;
  const linksWithMode = currentLinks.map(link => ({
    ...link,
    href: mode === 'portfolio' ? `${link.href}?mode=portfolio` : link.href,
  }));

  const homeHref = mode === 'portfolio' ? '/?mode=portfolio' : '/';

  return (
    <nav className={styles.nav}>
      <div className={styles.navLeft}>
        <Link href={homeHref} className={styles.logo}>
          home
        </Link>
      </div>
      <div className={styles.navLinks}>
        {linksWithMode.map(link => {
          const linkPath = link.href.split('?')[0];
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${pathname === linkPath ? styles.active : ''}`}
            >
              {link.text}
            </Link>
          );
        })}
      </div>
      <div className={styles.navRight}>
        {/* ENABLE_MODE_TOGGLE 값에 따라 모드 전환 버튼 그룹 렌더링 */}
        {ENABLE_MODE_TOGGLE && (
          <>
            {mode !== 'blog' && (
              <button
                className={styles.toggleButton}
                onClick={() => router.push('/?mode=blog')}>
                Blog
              </button>
            )}
            {mode !== 'portfolio' && (
              <button
                className={styles.toggleButton}
                onClick={() => router.push('/?mode=portfolio')}>
                Portfolio
              </button>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

const GNB: React.FC = () => {
  return (
    <Suspense fallback={<nav>Loading...</nav>}>
      <GNBContent />
    </Suspense>
  );
};

export default GNB;