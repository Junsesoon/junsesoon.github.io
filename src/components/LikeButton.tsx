'use client';

import React, { useState, useEffect } from 'react';
import { getLikeStatusAction, toggleLikeAction } from './publicActions';

interface LikeButtonProps {
  postId: string;
  initialLikesCount?: number;
}

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

export default function LikeButton({ postId, initialLikesCount = 0 }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (!postId) return;
    
    // 로컬 스토리지에서 세션 ID 가져오기 또는 새로 발급
    let sid = localStorage.getItem('blog_session_id');
    if (!sid) {
      sid = generateUUID();
      localStorage.setItem('blog_session_id', sid);
    }
    setSessionId(sid);

    // 초기 좋아요 상태 확인
    getLikeStatusAction(postId, sid).then((res) => {
      if (res.success && res.isLiked) {
        setIsLiked(true);
      }
    });
  }, [postId]);

  // 페이지 내 여러 개의 좋아요 버튼 상태를 동기화하기 위한 커스텀 이벤트 리스너
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.postId === postId) {
        if (customEvent.detail.isLiked !== undefined) setIsLiked(customEvent.detail.isLiked);
        if (customEvent.detail.likesCount !== undefined) setLikesCount(customEvent.detail.likesCount);
        if (customEvent.detail.isLoading !== undefined) setIsLoading(customEvent.detail.isLoading);
        if (customEvent.detail.isCooldown !== undefined) setIsCooldown(customEvent.detail.isCooldown);
      }
    };
    window.addEventListener('like-sync', handleSync);
    return () => window.removeEventListener('like-sync', handleSync);
  }, [postId]);

  const handleToggle = async () => {
    if (!sessionId || !postId || isLoading || isCooldown) return;

    const previousIsLiked = isLiked;
    const previousCount = likesCount;

    const newIsLiked = !isLiked;
    const newCount = isLiked ? Math.max(previousCount - 1, 0) : previousCount + 1;

    // Optimistic UI Update (빠른 피드백 제공)
    setIsLiked(newIsLiked);
    setLikesCount(newCount);

    if (newIsLiked) { // 좋아요를 누르는 타이밍에만 파티클 이펙트 발생
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 600); // 애니메이션 지속시간(0.6초) 후 DOM에서 제거
    }

    setIsLoading(true);

    // 다른 버튼들에게 낙관적 업데이트 상태 전달 (빠른 반응 동기화)
    window.dispatchEvent(new CustomEvent('like-sync', {
      detail: { postId, isLiked: newIsLiked, likesCount: newCount, isLoading: true }
    }));

    const result = await toggleLikeAction(postId, sessionId);
    if (result.success) {
      setIsLiked(result.isLiked!);
      if (result.likesCount !== undefined) {
        setLikesCount(result.likesCount); // 서버 카운트로 완벽한 동기화
      }

      let cooldown = false;
      // 좋아요를 추가한 경우에만 30초 쿨다운 적용
      if (result.isLiked) {
        setIsCooldown(true);
        cooldown = true;
        setTimeout(() => {
          setIsCooldown(false);
          window.dispatchEvent(new CustomEvent('like-sync', {
            detail: { postId, isCooldown: false }
          }));
        }, 100); //(테스트를 위한 시간 변경, 실제로는 30000ms = 30초)
      }

      // 성공 결과 동기화
      window.dispatchEvent(new CustomEvent('like-sync', {
        detail: { 
          postId, 
          isLiked: result.isLiked, 
          likesCount: result.likesCount !== undefined ? result.likesCount : newCount, 
          isLoading: false, 
          isCooldown: cooldown 
        }
      }));
    } else {
      // 실패 시 상태 롤백
      setIsLiked(previousIsLiked);
      setLikesCount(previousCount);
      window.dispatchEvent(new CustomEvent('like-sync', {
        detail: { postId, isLiked: previousIsLiked, likesCount: previousCount, isLoading: false }
      }));
      alert(result.message || '좋아요 처리 중 오류가 발생했습니다.');
    }
    setIsLoading(false);
  };

  if (!postId) return null;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading || isCooldown}
      className={`relative group inline-flex flex-col items-center justify-center gap-1 shrink-0 rounded-lg border w-[60px] h-[60px] shadow-sm transition-all duration-300 ease-out active:scale-95 ${
        isLiked ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
      } ${(isLoading || isCooldown) ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {showParticles && (
        <>
          <style>{`
            @keyframes particle-explode {
              0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
              100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
            }
            .animate-particle {
              animation: particle-explode 0.6s ease-out forwards;
            }
          `}</style>
          <div className="absolute top-1/2 left-1/2 pointer-events-none z-10">
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30) * (Math.PI / 180);
              const distance = 35 + Math.random() * 15;
              const size = 4 + Math.random() * 4;
              return (
                <span
                  key={i}
                  className="absolute bg-blue-400 rounded-full animate-particle"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    '--tx': `${Math.cos(angle) * distance}px`,
                    '--ty': `${Math.sin(angle) * distance}px`,
                  } as React.CSSProperties}
                />
              );
            })}
          </div>
        </>
      )}
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-all duration-300 ${isLiked ? 'text-blue-600 fill-blue-200 scale-110' : 'text-gray-400 fill-transparent group-hover:text-gray-500'}`} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514" />
      </svg>
      {isLiked ? (
        <span className="text-sm font-semibold transition-colors text-blue-600">
          {likesCount}
        </span>
      ) : (
        <span className="text-sm font-semibold transition-colors text-gray-500 group-hover:text-gray-700">
          유익함
        </span>
      )}
    </button>
  );
}