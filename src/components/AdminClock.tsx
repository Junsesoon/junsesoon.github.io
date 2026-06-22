'use client';

import React, { useState, useEffect } from 'react';

interface AdminClockProps {
  title?: string;
}

export default function AdminClock({ title = 'Overview' }: AdminClockProps) {
  const [time, setTime] = useState<Date | null>(null);
  const [exp, setExp] = useState<number | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.exp) {
          setExp(data.exp);
        }
      })
      .catch((err) => console.error('Failed to fetch auth exp:', err));
  }, []);

  useEffect(() => {
    if (exp) {
      const remaining = exp - Date.now();
      if (remaining <= 0) {
        window.location.reload();
      } else {
        const reloadTimer = setTimeout(() => {
          window.location.reload();
        }, remaining);
        return () => clearTimeout(reloadTimer);
      }
    }
  }, [exp]);

  if (!time) {
    return (
      <div className="flex items-baseline gap-3 min-h-[40px]">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
          <span>----년 --월 --일(-)</span>
          <span className="text-gray-200">|</span>
          <span>--:--:--</span>
        </div>
      </div>
    );
  }

  const year = time.getFullYear();
  const month = time.getMonth() + 1;
  const day = time.getDate();
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = weekDays[time.getDay()];
  const dateStr = `${year}년 ${month}월 ${day}일(${dayOfWeek})`;

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}:${seconds}`;

  const getRemainingTimeStr = () => {
    if (!exp) return '';
    const diff = exp - time.getTime();
    if (diff <= 0) return '00:00:00';
    
    const totalSecs = Math.floor(diff / 1000);
    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    
    return `${hrs}:${mins}:${secs}`;
  };

  const remainingTimeStr = getRemainingTimeStr();

  return (
    <div className="flex items-baseline gap-3">
      <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
        {title}
      </h1>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
        <span>{dateStr}</span>
        <span className="text-gray-200">|</span>
        <span className="tabular-nums">{timeStr}</span>
        {exp && (
          <>
            <span className="text-gray-200">|</span>
            <span className="text-red-500 font-bold flex items-center gap-1" title="Login Session Timeout">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="tabular-nums">{remainingTimeStr}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
