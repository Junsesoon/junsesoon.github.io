'use client';

import React, { useState, useRef } from 'react';
import { updateSkillTreeDomainOrdersAction } from './actions';

export interface DomainItem {
  id: number;
  title: string;
  description: string;
  matchCategory2: string;
  displayOrder: number;
}

interface Props {
  initialDomains: DomainItem[];
}

export default function DomainOrderList({ initialDomains }: Props) {
  const [domains, setDomains] = useState<DomainItem[]>(initialDomains);
  const [isSaving, setIsSaving] = useState(false);

  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);

  // 드래그 시작 시 호출
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItemIndex.current = index;
    e.currentTarget.style.opacity = '0.5'; // 시각적 피드백
  };

  // 드래그 중인 아이템이 다른 아이템 위를 지나갈 때 호출
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragOverItemIndex.current = index;
  };

  // 드래그가 종료(Drop)되었을 때 호출
  const handleDragEnd = async (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1'; // 투명도 원상복구

    if (
      dragItemIndex.current !== null &&
      dragOverItemIndex.current !== null &&
      dragItemIndex.current !== dragOverItemIndex.current
    ) {
      const newDomains = [...domains];
      const draggedItem = newDomains[dragItemIndex.current];
      
      // 배열에서 아이템 위치 변경
      newDomains.splice(dragItemIndex.current, 1);
      newDomains.splice(dragOverItemIndex.current, 0, draggedItem);

      // 새로운 순서(displayOrder) 재할당
      const updatedDomains = newDomains.map((domain, idx) => ({
        ...domain,
        displayOrder: idx + 1, // 1부터 순서대로 부여
      }));

      setDomains(updatedDomains);
      
      // 변경된 순서를 DB에 반영하기 위해 서버 액션 호출
      setIsSaving(true);
      const orders = updatedDomains.map(d => ({ id: d.id, displayOrder: d.displayOrder }));
      const res = await updateSkillTreeDomainOrdersAction(orders);
      setIsSaving(false);

      if (!res.success) {
        alert('순서 저장에 실패했습니다.');
        setDomains(initialDomains); // 실패 시 원래 순서로 복구 (롤백)
      }
    }

    // Ref 초기화
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-2xl relative">
      {domains.map((domain, index) => (
        <div
          key={domain.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()} // onDragOver에서 기본 이벤트를 막아야 Drop이 가능합니다.
          className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm cursor-move flex items-center justify-between hover:bg-gray-50 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center gap-4">
            {/* 그립(Grip) 아이콘 */}
            <div className="text-gray-400 cursor-move">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-800">{domain.title}</span>
              <span className="text-xs text-gray-500">카테고리: {domain.matchCategory2}</span>
            </div>
          </div>
          <div className="text-sm font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">
            #{domain.displayOrder}
          </div>
        </div>
      ))}
      {isSaving && (
        <div className="absolute -bottom-8 left-0 text-sm font-semibold text-blue-600 animate-pulse">
          순서 저장 중...
        </div>
      )}
    </div>
  );
}