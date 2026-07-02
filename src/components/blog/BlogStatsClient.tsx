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

interface BlogStatsClientProps {
  title?: string;
  totalPosts: number;
  totalLikes: number;
  totalSkills?: number;
  totalVisitors: number;
  totalUniqueVisitors?: number;
  todayVisitors?: number;
  layout?: 'grid' | 'sidebar';
}

export default function BlogStatsClient({
  title = 'Blog Stats',
  totalPosts = 0,
  totalLikes = 0,
  totalSkills = 0,
  totalVisitors = 0,
  totalUniqueVisitors = 0,
  todayVisitors = 0,
  layout = 'grid',
}: BlogStatsClientProps) {
  const stats = [
    { value: totalPosts.toString(), label: 'Total Posts', borderColor: 'border-rose-300', dotColor: 'bg-rose-500' },
    { value: totalVisitors.toString(), label: 'Total Views', borderColor: 'border-purple-300', dotColor: 'bg-purple-500' },
    { value: totalLikes.toString(), label: 'Total Likes', borderColor: 'border-blue-300', dotColor: 'bg-blue-500' },
    { value: totalUniqueVisitors.toString(), label: 'Total Visit', borderColor: 'border-emerald-300', dotColor: 'bg-emerald-500' },
    { value: todayVisitors.toString(), label: "Today Visit", borderColor: 'border-amber-300', dotColor: 'bg-amber-500' },
  ];

  if (layout === 'sidebar') {
    return (
      <div className="border border-theme-border bg-theme-surface rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 className="text-sm font-bold text-theme-text-title mb-3 tracking-tight">
          {title}
        </h3>
        <ul className="space-y-2.5">
          {stats.map((stat, index) => (
            <li key={index} className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-1">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${stat.dotColor}`} />
                <span className="text-xs font-semibold text-theme-text-muted tracking-wider whitespace-nowrap">
                  {stat.label}
                </span>
              </div>
              <span className="text-lg font-extrabold text-theme-text-title tracking-tight">
                <AnimatedNumber value={stat.value} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section className="w-full max-w-[1440px] mx-auto py-8 px-4 md:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`flex flex-col space-y-1 items-center justify-center p-6 border bg-theme-surface rounded-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-[var(--color-shadow-surface)] cursor-pointer ${stat.borderColor}`}>
            <span className="text-3xl md:text-4xl font-extrabold text-theme-text-title tracking-tight">
              <AnimatedNumber value={stat.value} />
            </span>
            <span className="text-xs font-semibold text-theme-text-muted tracking-wider">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
