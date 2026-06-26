'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AdminTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const referrer = document.referrer;
    if (!referrer) return;

    try {
      const referrerUrl = new URL(referrer);
      const currentUrl = new URL(window.location.href);

      // referrer가 같은 도메인이고, 어드민 경로(/admin)로 시작하지 않는 경우에만 기록
      const isSameDomain = referrerUrl.origin === currentUrl.origin;
      const isFromAdmin = referrerUrl.pathname.startsWith('/admin');

      if (isSameDomain && !isFromAdmin) {
        sessionStorage.setItem('admin_entry_referrer', referrerUrl.pathname + referrerUrl.search);
      }
    } catch (e) {
      console.error('Failed to parse referrer:', e);
    }
  }, [pathname]);

  return null;
}
