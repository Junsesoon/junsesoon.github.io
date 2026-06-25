'use client';

import React, { useState, useEffect } from 'react';

// ==========================================
// 1. 타입 정의
// ==========================================
interface TimelineItem {
  title: string;
  startDate: string;
  endDate: string;
  desc: string;
}

// ==========================================
// 2. 서브 컴포넌트: TimelineBars (그래프 UI)
// ==========================================
interface TimelineBarsProps {
  items: TimelineItem[];
  hoveredIndex: number | null;
  onHoverChange: (idx: number | null) => void;
  clickedIndex: number | null;
  onItemClick: (idx: number) => void;
  yearsList: string[];
  calculateTimelinePosition: (startDate: string, endDate: string) => { left: string; width: string };
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

function TimelineBars({
  items,
  hoveredIndex,
  onHoverChange,
  clickedIndex,
  onItemClick,
  yearsList,
  calculateTimelinePosition,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: TimelineBarsProps) {
  const layers = ["top-[12px]", "top-[36px]", "top-[60px]"];

  return (
    <div className="relative w-full rounded-2xl p-6 mb-8 overflow-hidden select-none">
      {/* 좌측 이동 버튼 (그래프 좌측 끝에 배치) */}
      {canPrev && (
        <button
          onClick={onPrev}
          className="absolute left-1 top-[76px] -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-slate-950/80 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-md active:scale-95"
          title="이전 연도로 이동"
        >
          <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* 우측 이동 버튼 (그래프 우측 끝에 배치) */}
      {canNext && (
        <button
          onClick={onNext}
          className="absolute right-1 top-[76px] -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-slate-950/80 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-md active:scale-95"
          title="다음 연도로 이동"
        >
          <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* 그리드 가로 실선 (Track Line) */}
      <div className="absolute top-[84px] left-6 right-6 h-[1px] bg-white/10" />

      {/* 연도별 수직 가이드라인선 (Milestones: 현재 윈도우 기준 연도들) */}
      <div className="absolute inset-x-6 top-6 bottom-14 flex justify-between pointer-events-none">
        {yearsList.map((year, i) => (
          <div key={i} className="h-full border-l border-white/[0.05] relative">
            <span className="absolute bottom-[-28px] left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-500 tracking-wider">
              {year}
            </span>
          </div>
        ))}
      </div>

      {/* 가로 막대 그래프 (Duration Bars) */}
      <div className="relative h-20 mx-6 z-10 overflow-hidden">
        {items.map((item, idx) => {
          const { left, width } = calculateTimelinePosition(item.startDate, item.endDate);
          const isHovered = hoveredIndex === idx;
          const isClicked = clickedIndex === idx;
          const isActive = isHovered || isClicked;
          const topClass = layers[idx % 3];

          return (
            <div
              key={idx}
              onMouseEnter={() => onHoverChange(idx)}
              onMouseLeave={() => onHoverChange(null)}
              onClick={() => onItemClick(idx)}
              style={{ left, width }}
              className={`absolute h-4 rounded-full transition-all duration-300 cursor-pointer ${topClass} ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] scale-y-110"
                  : "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-white/[0.05]"
              } ${isClicked ? "ring-2 ring-white/50 shadow-[0_0_15px_rgba(168,85,247,0.7)]" : ""}`}
              title={`${item.title} (${item.startDate} ~ ${item.endDate})`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 3. 서브 컴포넌트: TimelineCard (상세 카드 UI - 오버 또는 클릭 고정 시 표시)
// ==========================================
interface TimelineCardProps {
  item: TimelineItem | null;
  isVisible: boolean;
}

function TimelineCard({ item, isVisible }: TimelineCardProps) {
  // 시작일("YYYY.MM.DD")에서 연도("YYYY")만 파싱해서 뱃지로 사용
  const displayYear = item && item.startDate ? item.startDate.split('.')[0] : '';

  return (
    <div 
      className={`w-full flex justify-center select-none overflow-hidden transition-all duration-500 ease-out ${
        isVisible && item
          ? "max-h-[300px] opacity-100 mt-6"
          : "max-h-0 opacity-0 mt-0"
      }`}
    >
      <div
        className={`w-full max-w-2xl p-6 rounded-2xl border bg-white/[0.02] border-white/[0.08] shadow-[0_8px_30px_rgba(99,102,241,0.05)] transition-all duration-500 ease-out transform ${
          isVisible && item
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
      >
        {item && (
          <>
            <div className="flex justify-between items-start gap-4 mb-4">
              <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                {displayYear}
              </span>
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap bg-white/[0.03] border border-white/[0.05] px-3 py-1 rounded-full">
                📅 {item.startDate} ~ {item.endDate}
              </span>
            </div>
            <h3 className="text-slate-100 font-bold text-lg mb-2.5 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
              {item.title}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {item.desc}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. 메인 컴포넌트: AboutTimeline
// ==========================================
interface AboutTimelineProps {
  items: TimelineItem[];
}

export default function AboutTimeline({ items = [] }: AboutTimelineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // KST 오늘자 기준연도 계산 (RSC/SSR Hydration mismatch 방지용 fallback 상수 지정)
  const currentYear = mounted
    ? new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })).getFullYear()
    : 2026;

  // 전체 데이터에서 최소/최대 연도 동적 추출
  const getTimelineYearRange = () => {
    if (items.length === 0) {
      return { minItemYear: currentYear - 5, maxItemYear: currentYear };
    }
    const years = items.flatMap(item => {
      const start = item.startDate ? parseInt(item.startDate.split('.')[0]) : null;
      const end = item.endDate ? parseInt(item.endDate.split('.')[0]) : null;
      const list = [];
      if (start && !isNaN(start)) list.push(start);
      if (end && !isNaN(end)) list.push(end);
      return list;
    });
    if (years.length === 0) {
      return { minItemYear: currentYear - 5, maxItemYear: currentYear };
    }
    return {
      minItemYear: Math.min(...years),
      maxItemYear: Math.max(...years),
    };
  };

  const { minItemYear, maxItemYear } = getTimelineYearRange();

  // 전체 데이터와 오늘 날짜를 아우르는 "전체 범위" 경계 계산
  const defaultMinYear = currentYear - 5;
  const defaultMaxYear = currentYear;

  const totalMinYear = Math.min(defaultMinYear, minItemYear);
  const totalMaxYear = Math.max(defaultMaxYear, maxItemYear);

  // 축적 크기 고정: 6개년 단위 (2021 ~ 2026 처럼 기준연도 포함 최근 5년 범위 = 6개 연도)
  const WINDOW_SIZE = 6;

  const maxStartYear = totalMaxYear - (WINDOW_SIZE - 1);
  const minStartYear = totalMinYear;

  // 윈도우 시작 연도 상태값 정의 (디폴트: KST 오늘자 기준 연도 - 5년)
  const [startYear, setStartYear] = useState<number>(defaultMinYear);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 마운트 후 실제 클라이언트 KST 기준연도로 안전하게 상태 동기화
  useEffect(() => {
    if (mounted) {
      setStartYear(currentYear - 5);
    }
  }, [mounted, currentYear]);

  // 좌우 슬라이딩 제어 핸들러
  const handlePrev = () => {
    setStartYear(prev => Math.max(minStartYear, prev - 1));
  };

  const handleNext = () => {
    setStartYear(prev => Math.min(maxStartYear, prev + 1));
  };

  // 현재 뷰포트(윈도우) 범위 연산
  const windowEndYear = startYear + (WINDOW_SIZE - 1);
  const yearsList = Array.from(
    { length: WINDOW_SIZE }, 
    (_, i) => String(startYear + i)
  );

  const minTime = new Date(`${startYear}-01-01`).getTime();
  const maxTime = new Date(`${windowEndYear}-12-31`).getTime();
  const totalTime = maxTime - minTime;

  // 좌표 및 가로 너비 백분율 연산 함수 (최소 두께 보장 및 우측 경계 보정 포함)
  const calculateTimelinePosition = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return { left: '0%', width: '0%' };
    
    const start = new Date(startDate.replace(/\./g, '-')).getTime();
    const end = new Date(endDate.replace(/\./g, '-')).getTime();
    
    const left = ((start - minTime) / totalTime) * 100;
    const calculatedWidth = ((end - start) / totalTime) * 100;
    
    // 최소 너비를 4%로 보장하여 마우스 오버 편의성 확보
    const minWidth = 4;
    const finalWidth = Math.max(minWidth, calculatedWidth);
    
    // 뷰포트 내 우측 경계선(100%)을 탈출하지 않도록 위치 보정
    let finalLeft = left;
    if (left >= 0 && left <= 100 && left + finalWidth > 100) {
      finalLeft = 100 - finalWidth;
    }
    
    return {
      left: `${finalLeft}%`,
      width: `${finalWidth}%`,
    };
  };

  // 클릭 고정 시 클릭 상태를 우선하고, 호버 시에는 호버 아이템을 일시 노출
  const handleItemClick = (idx: number) => {
    setClickedIndex(prev => (prev === idx ? null : idx));
  };

  const activeIndex = hoveredIndex !== null ? hoveredIndex : clickedIndex;
  const activeItem = activeIndex !== null ? items[activeIndex] : null;

  return (
    <div className="w-full relative font-sans text-slate-100">
      {/* Title & Range Display */}
      <div className="flex justify-between items-center mb-8 select-none">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span className="text-purple-400">🌱</span> Time line
        </h2>

        {/* 현재 표시 범위 연도 뱃지 */}
        {totalMaxYear - totalMinYear + 1 > WINDOW_SIZE && (
          <span className="text-[10px] text-slate-400 font-medium tracking-wider bg-white/[0.03] border border-white/[0.05] px-3 py-1 rounded-full">
            📅 {startYear} - {windowEndYear}
          </span>
        )}
      </div>

      {/* 데이터가 없는 경우에 대한 빈 화면 가이드 */}
      {items.length === 0 ? (
        <div className="w-full text-center py-12 text-slate-500 border border-dashed border-white/10 rounded-2xl">
          등록된 히스토리가 없습니다.
        </div>
      ) : (
        <>
          {/* 1. 상단 그래프 UI */}
          <TimelineBars 
            items={items}
            hoveredIndex={hoveredIndex}
            onHoverChange={setHoveredIndex}
            clickedIndex={clickedIndex}
            onItemClick={handleItemClick}
            yearsList={yearsList}
            calculateTimelinePosition={calculateTimelinePosition}
            canPrev={startYear > minStartYear}
            canNext={startYear < maxStartYear}
            onPrev={handlePrev}
            onNext={handleNext}
          />

          {/* 2. 하단 상세 정보 UI (호버 및 클릭 고정 시 노출) */}
          <TimelineCard 
            item={activeItem}
            isVisible={activeIndex !== null}
          />
        </>
      )}
    </div>
  );
}
