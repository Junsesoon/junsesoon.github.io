'use client';

import React, { useState, useEffect } from 'react';

// 1. 타입 정의
// ==========================================
interface TimelineItem {
  title: string;
  startDate: string;
  endDate: string;
  desc: string;
  color?: string;
  category?: string;
}

const getTimelineBarClass = (color: string | undefined, isActive: boolean) => {
  const c = (color || 'Indigo').toLowerCase();
  
  if (isActive) {
    if (c === 'indigo') return 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] scale-y-110';
    if (c === 'blue') return 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] scale-y-110';
    if (c === 'green' || c === 'emerald') return 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-y-110';
    if (c === 'amber') return 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.8)] scale-y-110';
    if (c === 'purple') return 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_12px_rgba(168,85,247,0.8)] scale-y-110';
    if (c === 'red') return 'bg-gradient-to-r from-red-500 to-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] scale-y-110';
    return 'bg-gradient-to-r from-gray-500 to-slate-500 shadow-[0_0_12px_rgba(107,114,128,0.8)] scale-y-110';
  } else {
    if (c === 'indigo') return 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-white/[0.05]';
    if (c === 'blue') return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-white/[0.05]';
    if (c === 'green' || c === 'emerald') return 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-white/[0.05]';
    if (c === 'amber') return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-white/[0.05]';
    if (c === 'purple') return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-white/[0.05]';
    if (c === 'red') return 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-white/[0.05]';
    return 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-white/[0.05]';
  }
};

const getCardBadgeClass = (color: string | undefined) => {
  const c = (color || 'Indigo').toLowerCase();
  if (c === 'indigo') return 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20';
  if (c === 'blue') return 'text-blue-400 bg-blue-500/10 border border-blue-500/20';
  if (c === 'green' || c === 'emerald') return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
  if (c === 'amber') return 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
  if (c === 'purple') return 'text-purple-400 bg-purple-500/10 border border-purple-500/20';
  if (c === 'red') return 'text-red-400 bg-red-500/10 border border-red-500/20';
  return 'text-gray-400 bg-gray-500/10 border border-gray-500/20';
};

const getCardShadowClass = (color: string | undefined) => {
  const c = (color || 'Indigo').toLowerCase();
  if (c === 'indigo') return 'shadow-[0_8px_30px_rgba(99,102,241,0.05)]';
  if (c === 'blue') return 'shadow-[0_8px_30px_rgba(59,130,246,0.05)]';
  if (c === 'green' || c === 'emerald') return 'shadow-[0_8px_30px_rgba(16,185,129,0.05)]';
  if (c === 'amber') return 'shadow-[0_8px_30px_rgba(245,158,11,0.05)]';
  if (c === 'purple') return 'shadow-[0_8px_30px_rgba(168,85,247,0.05)]';
  if (c === 'red') return 'shadow-[0_8px_30px_rgba(239,68,68,0.05)]';
  return 'shadow-[0_8px_30px_rgba(107,114,128,0.05)]';
};

const getClickEffectClass = (color: string | undefined) => {
  const c = (color || 'Indigo').toLowerCase();
  if (c === 'indigo') return 'ring-2 ring-white/50 shadow-[0_0_15px_rgba(168,85,247,0.7)]';
  if (c === 'blue') return 'ring-2 ring-white/50 shadow-[0_0_15px_rgba(59,130,246,0.7)]';
  if (c === 'green' || c === 'emerald') return 'ring-2 ring-white/50 shadow-[0_0_15px_rgba(16,185,129,0.7)]';
  if (c === 'amber') return 'ring-2 ring-white/50 shadow-[0_0_15px_rgba(245,158,11,0.7)]';
  if (c === 'purple') return 'ring-2 ring-white/50 shadow-[0_0_15px_rgba(168,85,247,0.7)]';
  if (c === 'red') return 'ring-2 ring-white/50 shadow-[0_0_15px_rgba(239,68,68,0.7)]';
  return 'ring-2 ring-white/50 shadow-[0_0_15px_rgba(107,114,128,0.7)]';
};

// ==========================================
// 2. 서브 컴포넌트: TimelineBars (그래프 UI)
// ==========================================
interface TimelineBarsProps {
  items: TimelineItem[];
  hoveredIndex: number | null;
  onHoverChange: (idx: number | null) => void;
  clickedIndex: number | null;
  onItemClick: (idx: number, isHover?: boolean) => void;
  yearsList: string[];
  calculateTimelinePosition: (startDate: string, endDate: string) => { left: string; width: string };
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  selectedCategory: string;
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
  selectedCategory,
}: TimelineBarsProps) {
  const layers = ["top-[0px]", "top-[30px]", "top-[60px]"];

  return (
    <div className="relative w-full rounded-2xl p-6 mb-8 overflow-hidden select-none">
      {/* 좌측 이동 버튼 (그래프 좌측 끝에 배치) */}
      {canPrev && (
        <button
          onClick={onPrev}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-slate-950/80 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-md active:scale-95"
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
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-slate-950/80 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-md active:scale-95"
          title="다음 연도로 이동"
        >
          <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* 그리드 가로 실선 (Track Line) */}
      <div className="absolute top-[120px] left-6 right-6 h-[1px] bg-white/10" />

      {/* 연도별 수직 가이드라인선 (Milestones: 현재 윈도우 기준 연도들) */}
      <div className="absolute inset-x-6 top-6 bottom-[52px] pointer-events-none">
        {yearsList.map((year, i) => {
          const leftPercentage = (i / yearsList.length) * 100;
          return (
            <div 
              key={i} 
              style={{ left: `${leftPercentage}%` }} 
              className="absolute top-0 bottom-0 border-l border-white/[0.05]"
            >
              <span className="absolute bottom-[-28px] left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-500 tracking-wider">
                {year}
              </span>
            </div>
          );
        })}
      </div>

      {/* 가로 막대 그래프 (Duration Bars) */}
      <div className="relative h-[116px] mx-0 z-10 overflow-hidden">
        {items.map((item, idx) => {
          const { left, width } = calculateTimelinePosition(item.startDate, item.endDate);
          const isHovered = hoveredIndex === idx;
          const isClicked = clickedIndex === idx;
          
          // Determine activity state based on category filter
          const isFilterApplied = selectedCategory !== 'all';
          const isMatchedCategory = item.category?.trim().toLowerCase() === selectedCategory.toLowerCase();
          
          // 1) No filter: All bars remain in bright, full color.
          // 2) Filter applied: Only matching category is active/bright.
          const isActive = isFilterApplied ? isMatchedCategory : true;
          
          // Disable hover/click interactions for dimmed, non-matching bars
          const isInteractive = !isFilterApplied || isMatchedCategory;
          
          const topClass = layers[idx % 3];

          return (
            <div
              key={idx}
              onMouseEnter={() => {
                if (isInteractive) {
                  onHoverChange(idx);
                  onItemClick(idx, true);
                }
              }}
              onMouseLeave={() => isInteractive && onHoverChange(null)}
              onClick={() => isInteractive && onItemClick(idx, false)}
              style={{ left, width }}
              className={`absolute flex flex-col justify-end transition-all duration-300 ${topClass} ${
                isInteractive ? "cursor-pointer" : "pointer-events-none opacity-20"
              }`}
              title={`${item.title} (${item.startDate} ~ ${item.endDate})`}
            >
              {/* Card Title Label on top of the bar */}
              <span className={`text-xs font-semibold tracking-wide whitespace-nowrap overflow-visible block pb-1 transition-colors ${
                isActive ? "text-slate-300" : "text-slate-500"
              }`}>
                {item.title}
              </span>
              
              {/* Actual timeline bar */}
              <div 
                className={`h-2 min-w-[16px] rounded-full transition-all duration-300 ${getTimelineBarClass(item.color, isActive)} ${
                  isInteractive && isClicked ? getClickEffectClass(item.color) : ""
                }`}
              />
            </div>
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
        className={`w-full max-w-2xl p-6 rounded-2xl border bg-white/[0.02] border-white/[0.08] transition-all duration-500 ease-out transform ${
          isVisible && item
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        } ${getCardShadowClass(item?.color)}`}
      >
        {item && (
          <>
            <div className="flex justify-between items-start gap-4 mb-4">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${getCardBadgeClass(item.color)}`}>
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
  const [justOpenedIndex, setJustOpenedIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Reset indices when active category changes to avoid out-of-bounds selection
  useEffect(() => {
    setClickedIndex(null);
    setHoveredIndex(null);
    setJustOpenedIndex(null);
  }, [selectedCategory]);

  // Extract unique categories dynamically from items list
  const categories = Array.from(
    new Set(
      items
        .map(item => item.category?.trim().toLowerCase())
        .filter(Boolean)
    )
  ) as string[];

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
  const maxTime = new Date(`${windowEndYear + 1}-01-01`).getTime();
  const totalTime = maxTime - minTime;

  // 좌표 및 가로 너비 백분율 연산 함수 (최소 두께 보장 및 우측 경계 보정 포함)
  const calculateTimelinePosition = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return { left: '0%', width: '0%' };
    
    // 끝 온점(.) 및 공백을 정제하고 점(.)을 하이픈(-)으로 교체
    const cleanStartStr = startDate.trim().replace(/\.$/, '').replace(/\./g, '-');
    const cleanEndStr = endDate.trim().replace(/\.$/, '').replace(/\./g, '-');

    const start = new Date(cleanStartStr).getTime();
    const end = new Date(cleanEndStr).getTime();
    
    // NaN 방어막 적용
    const safeStart = isNaN(start) ? minTime : start;
    const safeEnd = isNaN(end) ? safeStart : end;

    const left = ((safeStart - minTime) / totalTime) * 100;
    const calculatedWidth = ((safeEnd - safeStart) / totalTime) * 100;
    
    // calculatedWidth가 NaN일 경우를 대비해 0으로 대체
    const safeWidth = isNaN(calculatedWidth) ? 0 : calculatedWidth;

    // 최소 너비를 4%로 보장하여 마우스 오버 편의성 확보
    const minWidth = 4;
    const finalWidth = Math.max(minWidth, safeWidth);
    
    const finalLeft = isNaN(left) ? 0 : left;
    
    return {
      left: `${finalLeft}%`,
      width: `${finalWidth}%`,
    };
  };

  // 마우스 호버가 해제되면 방금 호버로 열린 세션 플래그도 클리어
  useEffect(() => {
    if (hoveredIndex === null) {
      setJustOpenedIndex(null);
    }
  }, [hoveredIndex]);

  // 마우스 오버 시 무조건 고정, 클릭 시에는 최초 오버 진입 후 첫 클릭 방지 토글
  const handleItemClick = (idx: number, isHover = false) => {
    if (isHover) {
      if (clickedIndex !== idx) {
        setJustOpenedIndex(idx);
      }
      setClickedIndex(idx);
    } else {
      if (justOpenedIndex === idx) {
        setJustOpenedIndex(null); // 첫 클릭을 흘려보낸 뒤 다음 연속 클릭에선 닫힐 수 있게 보정
        return;
      }
      setClickedIndex(prev => (prev === idx ? null : idx));
    }
  };

  const activeIndex = hoveredIndex !== null ? hoveredIndex : clickedIndex;
  const activeItem = activeIndex !== null ? items[activeIndex] : null;

  return (
    <div className="w-full relative font-sans text-slate-100">
      {/* Title & Range Display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 select-none">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span className="text-purple-400">🌱</span> Life story
        </h2>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* 카테고리 필터 */}
          {categories.length > 0 && (
            <div className="relative flex items-center">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none text-xs font-semibold text-slate-300 bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] rounded-full pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer select-none transition-colors"
              >
                <option value="all" className="bg-slate-950 text-slate-300">All</option>
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-slate-950 text-slate-300">
                    {cat.toUpperCase()}
                  </option>
                ))}
              </select>
              {/* 커스텀 화살표 아이콘 */}
              <div className="pointer-events-none absolute right-3 flex items-center text-slate-400">
                <svg className="h-3 w-3 fill-none stroke-current" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}

          {/* 현재 표시 범위 연도 뱃지 */}
          {totalMaxYear - totalMinYear + 1 > WINDOW_SIZE && (
            <span className="text-[10px] text-slate-400 font-medium tracking-wider bg-white/[0.03] border border-white/[0.05] px-3 py-1.5 rounded-full whitespace-nowrap">
              📅 {startYear} - {windowEndYear}
            </span>
          )}
        </div>
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
            selectedCategory={selectedCategory}
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
