'use client';

import React, { useState, useEffect } from 'react';

interface AdminClockProps {
  title?: string;
}

export default function AdminClock({ title = 'Overview' }: AdminClockProps) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className="flex items-baseline gap-3">
      <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
        {title}
      </h1>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
        <span>{dateStr}</span>
        <span className="text-gray-200">|</span>
        <span className="tabular-nums">{timeStr}</span>
      </div>
    </div>
  );
}
