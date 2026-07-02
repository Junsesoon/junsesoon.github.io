'use client';

import React, { useState, useEffect } from 'react';

function AnimatedNumber({ value }: { value: string }) {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  // 분리 (예: "1,200+" -> "", "1,200", "+")
  const match = value.match(/^(\D*)?([\d,]+)(\D*)$/);
  
  useEffect(() => {
    setMounted(true);
    const localMatch = value.match(/^(\D*)?([\d,]+)(\D*)$/);
    if (!localMatch) return;
    
    const target = parseInt(localMatch[2].replace(/,/g, ''), 10);
    let startTimestamp: number | null = null;
    let animationFrameId: number;
    const duration = 1500; // 1.5초

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
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

  if (!mounted || !match) return <>{value}</>;

  const prefix = match[1] || '';
  const numStr = match[2];
  const suffix = match[3] || '';
  const hasComma = numStr.includes(',');

  const formattedCount = hasComma ? count.toLocaleString() : count.toString();
  
  return <>{prefix}{formattedCount}{suffix}</>;
}

interface BlogStatsClientProps {
  title?: string;
  category?: string;
  layout?: 'grid' | 'sidebar';
  totalPosts?: number;
  totalLikes?: number;
  totalSkills?: number;
  totalVisitors?: number;
  totalUniqueVisitors?: number;
  todayVisitors?: number;
}

interface StatsData {
  totalPosts: number;
  totalLikes: number;
  totalVisitors: number;
  totalUniqueVisitors: number;
  todayVisitors: number;
}

export default function BlogStatsClient({
  title = 'Blog Stats',
  category,
  layout = 'sidebar',
  totalPosts,
  totalLikes,
  totalSkills,
  totalVisitors,
  totalUniqueVisitors,
  todayVisitors,
}: BlogStatsClientProps) {
  // If stats props are provided directly (e.g., from portfolio), bypass loading and fetch
  const [data, setData] = useState<StatsData | null>(() => {
    if (
      totalPosts !== undefined &&
      totalLikes !== undefined &&
      totalVisitors !== undefined
    ) {
      return {
        totalPosts,
        totalLikes,
        totalVisitors,
        totalUniqueVisitors: totalUniqueVisitors || 0,
        todayVisitors: todayVisitors || 0,
      };
    }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    return !(
      totalPosts !== undefined &&
      totalLikes !== undefined &&
      totalVisitors !== undefined
    );
  });

  useEffect(() => {
    // If stats are already initialized through props, no need to fetch asynchronously
    if (
      totalPosts !== undefined &&
      totalLikes !== undefined &&
      totalVisitors !== undefined
    ) {
      return;
    }

    const url = `/api/blog-stats${category ? `?category=${encodeURIComponent(category)}` : ''}`;
    fetch(url)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load blog stats:', err);
        setLoading(false);
      });
  }, [category, totalPosts, totalLikes, totalVisitors]);

  // Loading Skeleton State
  if (loading || !data) {
    if (layout === 'sidebar') {
      return (
        <div className="border border-theme-border bg-theme-surface rounded-2xl p-5 shadow-sm animate-pulse">
          <div className="h-4 bg-theme-border rounded w-2/3 mb-4" />
          <ul className="space-y-3.5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <li key={idx} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-theme-border/60" />
                  <div className="h-3 bg-theme-border/60 rounded w-16" />
                </div>
                <div className="h-4 bg-theme-border/60 rounded w-8" />
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <section className="w-full max-w-[1440px] mx-auto py-8 px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex flex-col space-y-2 items-center justify-center p-6 border border-theme-border bg-theme-surface rounded-xl animate-pulse">
              <div className="h-8 bg-theme-border/60 rounded w-12" />
              <div className="h-3 bg-theme-border/60 rounded w-16" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const stats = [
    { value: data.totalPosts.toString(), label: 'Total Posts', borderColor: 'border-rose-300', dotColor: 'bg-rose-500' },
    { value: data.totalVisitors.toString(), label: 'Total Views', borderColor: 'border-purple-300', dotColor: 'bg-purple-500' },
    { value: data.totalLikes.toString(), label: 'Total Likes', borderColor: 'border-blue-300', dotColor: 'bg-blue-500' },
    { value: data.totalUniqueVisitors.toString(), label: 'Total Visitors', borderColor: 'border-emerald-300', dotColor: 'bg-emerald-500' },
    { value: data.todayVisitors.toString(), label: "Today's Visitors", borderColor: 'border-amber-300', dotColor: 'bg-amber-500' },
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
