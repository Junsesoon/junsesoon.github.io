'use client';

import { useEffect, useRef } from 'react';
import { trackSiteVisitorAction } from '../../actions/publicActions';

// crypto.randomUUID 미지원 브라우저 환경을 위한 Fallback
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function VisitorTracker() {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    let sid = localStorage.getItem('blog_session_id');
    if (!sid) {
      sid = generateUUID();
      localStorage.setItem('blog_session_id', sid);
    }

    // 백그라운드에서 서버 액션 호출 (UI 블로킹 없음)
    trackSiteVisitorAction(sid).catch(console.error);
  }, []);

  return null; // 시각적으로 렌더링할 요소가 없는 백그라운드 전용 컴포넌트
}