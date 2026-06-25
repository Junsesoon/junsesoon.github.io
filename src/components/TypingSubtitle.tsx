'use client';

import React, { useState, useEffect } from 'react';

export default function TypingSubtitle() {
  const lines = [
    "AI 시대에 어떤 기술을 왜 선택할 것인가?",
    "단순한 코드 작성을 넘어 문제를 정의하고 '이유 있는 아키텍처'를 설계합니다",
    "견고한 기술로 안정적인 가치를 만들어내는 개발자 오준서 입니다"
  ];

  const [displayedLines, setDisplayedLines] = useState<string[]>(["", "", ""]);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [currentCharIdx, setCurrentCharIdx] = useState(0);

  useEffect(() => {
    if (currentLineIdx >= lines.length) return;

    const currentFullText = lines[currentLineIdx];
    if (currentCharIdx < currentFullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedLines(prev => {
          const next = [...prev];
          next[currentLineIdx] = currentFullText.slice(0, currentCharIdx + 1);
          return next;
        });
        setCurrentCharIdx(prev => prev + 1);
      }, 35); // Typing speed per character (ms)
      return () => clearTimeout(timeout);
    } else {
      // Pause slightly before typing the next line
      const timeout = setTimeout(() => {
        setCurrentLineIdx(prev => prev + 1);
        setCurrentCharIdx(0);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [currentLineIdx, currentCharIdx]);

  return (
    <>
      <style>{`
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-cursor-blink {
          animation: cursor-blink 0.8s infinite;
        }
      `}</style>
      <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed min-h-[110px] sm:min-h-[90px] md:min-h-[84px] text-center select-none">
        {displayedLines[0]}
        {displayedLines[0] && <br />}
        {displayedLines[1]}
        {displayedLines[1] && <br />}
        {displayedLines[2]}
        {currentLineIdx < lines.length && (
          <span className="inline-block w-[2px] h-5 bg-indigo-400 ml-1.5 animate-cursor-blink align-middle shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
        )}
      </p>
    </>
  );
}
