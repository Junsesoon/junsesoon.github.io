'use client';

import React, { useState, useEffect } from 'react';
import { getLikeStatusAction, toggleLikeAction } from './publicActions';

interface SkillTreeLikeButtonProps {
  postId: string;
  initialLikesCount?: number;
}

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function SkillTreeLikeButton({ postId, initialLikesCount = 0 }: SkillTreeLikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (!postId) return;
    
    let sid = localStorage.getItem('blog_session_id');
    if (!sid) {
      sid = generateUUID();
      localStorage.setItem('blog_session_id', sid);
    }
    setSessionId(sid);

    getLikeStatusAction(postId, sid).then((res) => {
      if (res.success && res.isLiked) {
        setIsLiked(true);
      }
    });
  }, [postId]);

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

    setIsLiked(newIsLiked);
    setLikesCount(newCount);

    if (newIsLiked) {
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 600);
    }

    setIsLoading(true);

    window.dispatchEvent(new CustomEvent('like-sync', {
      detail: { postId, isLiked: newIsLiked, likesCount: newCount, isLoading: true }
    }));

    const result = await toggleLikeAction(postId, sessionId);
    if (result.success) {
      setIsLiked(result.isLiked!);
      if (result.likesCount !== undefined) {
        setLikesCount(result.likesCount);
      }

      let cooldown = false;
      if (result.isLiked) {
        setIsCooldown(true);
        cooldown = true;
        setTimeout(() => {
          setIsCooldown(false);
          window.dispatchEvent(new CustomEvent('like-sync', {
            detail: { postId, isCooldown: false }
          }));
        }, 100);
      }

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
      className={`relative group inline-flex items-center gap-1.5 shrink-0 rounded-md border h-[36px] px-3 shadow-sm transition-all duration-300 ease-out active:scale-95 text-xs font-semibold ${
        isLiked 
          ? 'border-blue-500/80 bg-blue-500/15 text-blue-400' 
          : 'border-[#30363d] bg-[#0d1117] text-[#c9d1d9] hover:bg-[#161b22]'
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
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-all duration-300 ${isLiked ? 'text-blue-400 fill-blue-500/30 scale-110' : 'text-[#8b949e] fill-transparent group-hover:text-[#c9d1d9]'}`} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514" />
      </svg>
      <span>
        {isLiked ? `${likesCount} 추천` : '유익함'}
      </span>
    </button>
  );
}
