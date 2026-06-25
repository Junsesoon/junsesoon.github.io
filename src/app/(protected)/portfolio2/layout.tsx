'use client';

import React, { useEffect } from 'react';

export default function Portfolio2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const body = document.body;
    // 마운트 시 body 배경색을 PF2 전용 어두운 색(#030712)으로 변경
    body.style.backgroundColor = '#030712';

    return () => {
      // 언마운트 시 복구
      body.style.backgroundColor = '';
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#030712] text-slate-100 font-sans relative overflow-hidden flex flex-col -mt-16">
      {/* 
         레이아웃 마운트 시 document.body의 인라인 배경색을 조절함으로써, 
         footer 밑을 포함한 전체 문서의 배경색을 어둡게 고정합니다.
         GNB 겹침 처리를 위해 상단 마진 -mt-16을 공통 적용합니다.
      */}
      <div className="flex-1 w-full relative">
        {children}
      </div>
    </div>
  );
}
