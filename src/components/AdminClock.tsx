'use client';

import React, { useState, useEffect } from 'react';

export default function AdminClock() {
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
      <div className="min-h-[4rem] flex items-baseline gap-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">----년 --월 --일(-)</h1>
        <span className="text-sm text-gray-500 font-medium">--:--:--</span>
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
        {dateStr}
      </h1>
      <span className="text-sm text-gray-500 font-medium tabular-nums">
        {timeStr}
      </span>
    </div>
  );
}
