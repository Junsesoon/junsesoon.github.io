'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { SkillNode } from './skilltreegrid';

interface Props {
  nodes: Record<string, SkillNode>;
  COLUMNS: number;
}

export default function SkillTreeInteractive({ nodes, COLUMNS }: Props) {
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 마우스 드래그(Pan) 스크롤 처리를 위한 상태 및 Ref
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const isDragged = useRef(false);

  const nodesArray = Object.values(nodes);
  const maxCols = nodesArray.length > 0 ? Math.max(COLUMNS, ...nodesArray.map(n => n.col + 1)) : COLUMNS;
  const maxRows = nodesArray.length > 0 ? Math.max(3, ...nodesArray.map(n => n.row + 1)) : 3;

  const onMouseDown = (e: React.MouseEvent) => {
    isDragged.current = false;
    setIsDragging(true);
    if (!scrollRef.current) return;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // 드래그 속도 조절
    if (Math.abs(walk) > 5) isDragged.current = true; // 일정 거리 이상 이동 시 드래그로 판정
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleNodeClick = (node: SkillNode | null) => {
    if (isDragged.current) return; // 드래그 시 클릭 이벤트 무시
    if (node) {
      setSelectedNode(node);
      setIsDrawerOpen(true);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Generate lines between parents and children
  const lines: Array<{ id: string; x1: number; y1: number; x2: number; y2: number }> = [];
  nodesArray.forEach((childNode) => {
    if (childNode.parents && childNode.parents.length > 0) {
      const childPos = { col: childNode.col, row: childNode.row };
      if (childPos) {
        childNode.parents.forEach((parentName) => {
          const parentNode = nodes[parentName];
          const parentPos = parentNode ? { col: parentNode.col, row: parentNode.row } : null;
          if (parentPos) {
            lines.push({
              id: `${parentName}-${childNode.file.replace(/\.[^/.]+$/, "")}`,
              x1: parentPos.col * 100 + 80, // Right center of parent
              y1: parentPos.row * 70 + 25, // Middle Y of parent
              x2: childPos.col * 100,       // Left center of child
              y2: childPos.row * 70 + 25,  // Middle Y of child
            });
          }
        });
      }
    }
  });

  return (
    <div 
      ref={scrollRef}
      onMouseDown={onMouseDown}
      onMouseLeave={() => setIsDragging(false)}
      onMouseUp={() => setIsDragging(false)}
      onMouseMove={onMouseMove}
      className={`w-full max-w-[1000px] mx-auto py-10 px-4 overflow-x-auto relative bg-gray-50 rounded-2xl shadow-[inset_0px_0px_80px_rgba(0,0,0,0.15)] border border-gray-200 mt-4 mb-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <div className="relative w-max mx-auto">
        {/* SVG layer for connecting lines */}
        <svg 
          className="absolute top-0 left-0 w-full h-full pointer-events-none" 
          style={{ zIndex: 0, overflow: 'visible' }}
        >
          {lines.map((line) => (
            <path
              key={line.id}
              d={`M ${line.x1} ${line.y1} L ${(line.x1 + line.x2) / 2} ${line.y1} L ${(line.x1 + line.x2) / 2} ${line.y2} L ${line.x2} ${line.y2}`}
              // d={`M ${line.x1} ${line.y1} C ${line.x1 + 30} ${line.y1}, ${line.x2 - 30} ${line.y2}, ${line.x2} ${line.y2}`} // 베지어 곡선 style
              stroke="rgb(179, 185, 196)" // skill tree card 연결선 색상 설정 영역
              strokeWidth="1.5"
              fill="none"
            />
          ))}
        </svg>

        <div 
          className="grid w-max relative z-10"
          style={{
            gridTemplateColumns: `repeat(${maxCols}, 80px)`,
            gridTemplateRows: `repeat(${maxRows}, 50px)`,
            gap: '20px',
          }}
        >
          {nodesArray.map((nodeInfo) => {
            const displayName = nodeInfo.title;
            return (
              <div
                key={nodeInfo.file}
                onClick={() => handleNodeClick(nodeInfo)}
                style={{
                  gridColumnStart: nodeInfo.col + 1,
                  gridRowStart: nodeInfo.row + 1,
                }}
                className={`
                  h-[50px] rounded-md transition-all duration-300 flex flex-col items-center justify-center text-[11px] text-center overflow-hidden break-all px-1 select-none
                  bg-white border border-gray-200 text-gray-800 font-semibold shadow-md cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 hover:scale-105'
                `}
              >
                <span>{displayName}</span>
                {nodeInfo?.year && <span className="text-[8px] opacity-70">{nodeInfo.year}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-[400px] max-w-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 relative min-h-full flex flex-col">
          <button 
            onClick={closeDrawer}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            &times;
          </button>
          
          {selectedNode && (
            <div className="mt-8 text-black flex-1">
              <h2 className="text-2xl font-bold mb-6 border-b border-gray-200 pb-3">
                {selectedNode.title}
              </h2>
              
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-inner">
                <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Frontmatter</h3>
                <div className="space-y-2">
                  {Object.entries(selectedNode.frontmatter).map(([key, value]) => (
                    <div key={key} className="text-sm flex flex-col sm:flex-row sm:gap-2">
                      <span className="font-semibold text-gray-700 min-w-[120px] shrink-0">{key}:</span>
                      <span className="text-gray-600 break-words">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Content</h3>
                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed break-words">
                    {selectedNode.content || <span className="text-gray-400 italic">No content</span>}
                  </pre>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Link
                  href={`/${selectedNode.slug}`}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  게시물 자세히 보기 &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Backdrop */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={closeDrawer}
        />
      )}
    </div>
  );
}