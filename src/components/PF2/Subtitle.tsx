'use client';

import React from 'react';

export default function Subtitle() {
  const lines = [
    "AI 시대에 어떤 기술을 왜 선택할 것인가?",
    "문제를 정의하고 '이유 있는 아키텍처'를 설계합니다",
    "견고한 기술로 안정적인 가치를 만들어내는 개발자 오준서 입니다"
  ];

  return (
    <>
      <style>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(16px);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        .animate-fade-up {
          opacity: 0;
          animation: fade-up 3.0s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div className="flex flex-col gap-2 md:gap-3 text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed text-center select-none">
        {lines.map((line, idx) => (
          <span
            key={idx}
            className="animate-fade-up block"
            style={{
              animationDelay: `${idx * 800 + 150}ms`,
            }}
          >
            {line}
          </span>
        ))}
      </div>
    </>
  );
}

