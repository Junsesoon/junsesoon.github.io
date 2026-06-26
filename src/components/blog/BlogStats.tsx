'use client';

import React, { useState, useEffect } from 'react';

function AnimatedNumber({ value }: { value: string }) {
  const [count, setCount] = useState(0);
  
  // 앞의 기호, 숫자, 뒤의 기호를 분리합니다 (예: "1,200+" -> "", "1,200", "+")
  const match = value.match(/^(\D*)?([\d,]+)(\D*)$/);
  
  useEffect(() => {
    if (!match) return;
    
    const target = parseInt(match[2].replace(/,/g, ''), 10);
    let startTimestamp: number | null = null;
    let animationFrameId: number;
    const duration = 1500; // 애니메이션 지속 시간 (1.5초)

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Ease-out 효과 (점점 느려지며 도달)
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [value]);

  if (!match) return <>{value}</>;

  const prefix = match[1] || '';
  const numStr = match[2];
  const suffix = match[3] || '';
  const hasComma = numStr.includes(',');

  const formattedCount = hasComma ? count.toLocaleString() : count.toString();
  
  return <>{prefix}{formattedCount}{suffix}</>;
}

export default function BlogStats({ totalPosts = 0, totalLikes = 0, totalSkills = 0, totalVisitors = 0 }: { totalPosts?: number; totalLikes?: number; totalSkills?: number; totalVisitors?: number }) {
  const stats = [
    { value: totalPosts.toString(), label: 'Total Posts', borderColor: 'border-rose-300' },
    { value: totalSkills.toString(), label: 'Total Skills', borderColor: 'border-emerald-300' },
    { value: totalVisitors.toString(), label: 'Total Views', borderColor: 'border-purple-300' },
    { value: totalLikes.toString(), label: 'Total Likes', borderColor: 'border-blue-300' },
  ];

  return (
    <section className="w-full max-w-[1440px] mx-auto py-8 px-4 md:px-8">
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`flex flex-col space-y-1 items-center justify-center p-6 border-2 bg-white rounded-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-gray-200/50 cursor-pointer ${stat.borderColor}`}>
            <span className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
              <AnimatedNumber value={stat.value} />
            </span>
            <span className="text-xs font-semibold text-slate-400 tracking-wider">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}