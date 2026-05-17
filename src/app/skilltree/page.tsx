'use client';

import React from 'react';

// 임시 데이터: 특정 인덱스(위치)에만 스킬이 존재한다고 가정
// 나중에 마크다운 프론트매터에서 X, Y 좌표를 추출해 매핑할 수 있습니다.
const activeSkillIndices = [0, 2, 5, 7, 10, 14, 18, 22, 27, 30]; // 예시로 활성화된 스킬 위치

export default function SkillTreeGrid() {
  const COLUMNS = 12;
  const INITIAL_ROWS = 10; // 확장 가능 (No limit)
  const TOTAL_CELLS = COLUMNS * INITIAL_ROWS;

  // 전체 셀 배열 생성
  const gridCells = Array.from({ length: TOTAL_CELLS }, (_, i) => i);

  return (
    <div className="w-full flex justify-center py-10 overflow-x-auto">
      {/* Grid Container
        - grid-cols-[repeat(12,60px)]: 60px 너비의 12개 컬럼 강제 생성
        - gap-x-[20px] gap-y-[20px]: 간격 적용
      */}
      <div 
        className="grid gap-x-[20px] gap-y-[20px] w-max" // cell 간격 조정 영역
        style={{ gridTemplateColumns: `repeat(${COLUMNS}, 60px)` }}
      >
        {gridCells.map((index) => {
          const isActive = activeSkillIndices.includes(index);

          return (
            <div
              key={index}
              className={`
                h-[50px] rounded-md transition-all duration-300 flex items-center justify-center text-xs
                ${isActive 
                  ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-[0_0_10px_rgba(0,123,255,0.2)]' // 활성 상태 (글래스모피즘 + 테크 블루 글로우)
                  : 'bg-white/5 border border-dashed border-white/10 opacity-20 hover:opacity-40' // 비활성 상태 (투명도 조절)
                }
              `}
            >
              {/* 활성 상태일 때만 데이터 노출 */}
              {isActive ? `Skill ${index}` : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}