'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { SkillNode } from './SkillTreeGrid';
import { incrementViewCountAction } from './publicActions';

// crypto.randomUUID 미지원 브라우저 환경을 위한 Fallback (LikeButton/ViewTracker와 동일)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface Props {
  nodes: Record<string, SkillNode>;
  COLUMNS: number;
  isAdmin?: boolean;
  colorIndex?: number;
}

export default function SkillTreeInteractive({ nodes, COLUMNS, isAdmin, colorIndex = 0 }: Props) {
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // 마우스 드래그(Pan) 스크롤 처리를 위한 상태 및 Ref
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeft = useRef(0);
  const scrollTop = useRef(0);
  const isDragged = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      // 페이지가 다시 표시될 때 (탭 전환 등) 드래그 관련 상태가
      // 비정상적으로 남아있는 문제를 해결하기 위해 상태를 강제로 초기화합니다.
      if (document.visibilityState === 'visible') {
        setIsDragging(false);
        isDragged.current = false;
      }
    };

    const handlePageShow = () => {
      // BFCache(Back/Forward Cache)에서 복원될 때 호출되는 이벤트
      // 드래그 관련 상태를 명시적으로 초기화하여 브라우저 뒤로가기 후에도 정상 작동하도록 합니다.
      setIsDragging(false);
      isDragged.current = false;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      window.scrollBy(0, e.deltaY);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);



  const nodesArray = Object.values(nodes);
  const maxCols = nodesArray.length > 0 ? Math.max(COLUMNS, ...nodesArray.map(n => n.col + 1)) : COLUMNS;
  const maxRows = nodesArray.length > 0 ? Math.max(3, ...nodesArray.map(n => n.row + 1)) : 3;

  const onMouseDown = (e: React.MouseEvent) => {
    isDragged.current = false;
    setIsDragging(true);
    if (!scrollRef.current) return;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    startY.current = e.pageY - scrollRef.current.offsetTop;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollTop.current = scrollRef.current.scrollTop;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;

    // '뒤로가기'를 했을 때 isDragging이 강제로 true로 남아있는 캐시 상태 고착화 방지
    // 마우스 왼쪽 버튼(1)이 눌린 상태가 아니라면 드래그를 즉시 해제합니다.
    if (e.buttons !== 1) {
      setIsDragging(false);
      isDragged.current = false;
      return;
    }

    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const y = e.pageY - scrollRef.current.offsetTop;
    const walkX = (x - startX.current) * 1.5; // 가로 드래그 속도 조절
    const walkY = (y - startY.current) * 1.5; // 세로 드래그 속도 조절
    
    if (Math.abs(walkX) > 5 || Math.abs(walkY) > 5) {
      isDragged.current = true; // 일정 거리 이상 이동 시 드래그로 판정
    }
    
    scrollRef.current.scrollLeft = scrollLeft.current - walkX;
    scrollRef.current.scrollTop = scrollTop.current - walkY;
  };

  const handleNodeClick = (node: SkillNode | null) => {
    if (isDragged.current) return; // 드래그 시 클릭 이벤트 무시
    if (node) {
      setSelectedNode(node);
      setIsModalOpen(true);

      // 오버레이 오픈 시 조회수 증가 (백그라운드 호출)
      if (node.postId) {
        let sid = localStorage.getItem('blog_session_id');
        if (!sid) {
          sid = generateUUID();
          localStorage.setItem('blog_session_id', sid);
        }
        incrementViewCountAction(node.postId, sid, 'overlay').catch(console.error);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Generate lines between parents and children
  const lines: Array<{ id: string; parentName: string; childName: string; x1: number; y1: number; x2: number; y2: number }> = [];
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
              parentName: parentName,
              childName: childNode.title.toLowerCase(),
              x1: parentPos.col * 140 + 125, // Right center of parent (col * 140 + width)
              y1: parentPos.row * 70 + 27,   // Middle Y of parent (row * 70 + half_height)
              x2: childPos.col * 140,        // Left center of child (col * 140)
              y2: childPos.row * 70 + 27,    // Middle Y of child (row * 70 + half_height)
            });
          }
        });
      }
    }
  });

  const PALETTE_DOTS = [
    'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.75)]',
    'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]',
    'bg-purple-400 shadow-[0_0_8px_rgba(167,139,250,0.75)]',
    'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.75)]',
    'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.75)]',
  ];

  const PALETTE_HOVERS = [
    'hover:bg-[#0c1b2d] hover:border-sky-400/80 hover:text-sky-300 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]',
    'hover:bg-[#0d211b] hover:border-emerald-400/80 hover:text-emerald-300 hover:shadow-[0_0_15px_rgba(52,211,153,0.3)]',
    'hover:bg-[#1a1426] hover:border-purple-400/80 hover:text-purple-300 hover:shadow-[0_0_15px_rgba(167,139,250,0.3)]',
    'hover:bg-[#1f1d16] hover:border-amber-400/80 hover:text-amber-300 hover:shadow-[0_0_15px_rgba(251,191,36,0.3)]',
    'hover:bg-[#271018] hover:border-rose-400/80 hover:text-rose-300 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]',
  ];

  const PALETTE_LINE_STROKES = [
    '#38bdf8', // Sky
    '#34d399', // Emerald
    '#a78bfa', // Purple
    '#fbbf24', // Amber
    '#fb7185', // Rose
  ];

  const PALETTE_LINE_GLOWS = [
    'rgba(56, 189, 248, 0.65)',
    'rgba(52, 211, 153, 0.65)',
    'rgba(167, 139, 250, 0.65)',
    'rgba(251, 191, 36, 0.65)',
    'rgba(251, 113, 133, 0.65)',
  ];

  const activeStroke = PALETTE_LINE_STROKES[colorIndex % PALETTE_LINE_STROKES.length];
  const activeGlow = PALETTE_LINE_GLOWS[colorIndex % PALETTE_LINE_GLOWS.length];
  const activeDotClass = PALETTE_DOTS[colorIndex % PALETTE_DOTS.length];
  const activeHoverClass = PALETTE_HOVERS[colorIndex % PALETTE_HOVERS.length];

  return (
    <>
      <div className="relative w-full max-w-[1000px] mx-auto mt-4 mb-10 group">
        <div 
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseLeave={() => {
            setIsDragging(false);
            isDragged.current = false;
          }}
          onMouseUp={() => {
            setIsDragging(false);
            isDragged.current = false;
          }}
          onMouseMove={onMouseMove}
          className={`w-full py-10 px-6 overflow-auto relative bg-[#0d1117]/30 backdrop-blur-md rounded-3xl border border-[#30363d]/45 shadow-[0_12px_40px_rgba(0,0,0,0.4)] max-h-[600px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          <div className="relative w-max mx-auto">
            {/* SVG layer for connecting lines */}
            <svg 
              className="absolute top-0 left-0 w-full h-full pointer-events-none" 
              style={{ zIndex: 0, overflow: 'visible' }}
            >
              {lines
                .sort((a, b) => {
                  const aHighlighted = hoveredNode === a.parentName || hoveredNode === a.childName;
                  const bHighlighted = hoveredNode === b.parentName || hoveredNode === b.childName;
                  return aHighlighted === bHighlighted ? 0 : aHighlighted ? 1 : -1;
                })
                .map((line) => {
                  const isHighlighted = hoveredNode === line.parentName || hoveredNode === line.childName;
                  const isDimmed = hoveredNode && !isHighlighted;
                return (
                  <path
                    key={line.id}
                    d={
                      Math.abs(line.y2 - line.y1) < 1
                        ? `M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}`
                        : (() => {
                            const dx = (line.x2 - line.x1) / 2;
                            const dy = Math.abs(line.y2 - line.y1);
                            const r = Math.min(10, dx, dy / 2);
                            const midX = (line.x1 + line.x2) / 2;
                            const yDirection = line.y2 > line.y1 ? 1 : -1;
                            return `M ${line.x1} ${line.y1} L ${midX - r} ${line.y1} Q ${midX} ${line.y1}, ${midX} ${line.y1 + r * yDirection} L ${midX} ${line.y2 - r * yDirection} Q ${midX} ${line.y2}, ${midX + r} ${line.y2} L ${line.x2} ${line.y2}`;
                          })()
                    }
                    stroke={isHighlighted ? activeStroke : isDimmed ? "rgba(139, 148, 158, 0.05)" : "rgba(139, 148, 158, 0.28)"} // Dim non-active paths in focus mode
                    strokeWidth={isHighlighted ? "2" : "1.2"}
                    style={isHighlighted ? { filter: `drop-shadow(0 0 3.5px ${activeGlow})` } : undefined}
                    fill="none"
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>

            <div 
              className="grid w-max relative z-10"
              style={{
                gridTemplateColumns: `repeat(${maxCols}, 125px)`,
                gridTemplateRows: `repeat(${maxRows}, 55px)`,
                gap: '15px',
              }}
            >
              {nodesArray.map((nodeInfo) => {
                const displayName = nodeInfo.title;
                const nodeName = displayName.toLowerCase();
                const hoveredNodeInfo = hoveredNode ? nodes[hoveredNode] : null;
                const isNodeActive = !hoveredNode || 
                  nodeName === hoveredNode || 
                  hoveredNodeInfo?.parents.includes(nodeName) || 
                  nodeInfo.parents.includes(hoveredNode);

                return (
                  <div
                    key={nodeInfo.file}
                    onClick={() => handleNodeClick(nodeInfo)}
                    onMouseEnter={() => setHoveredNode(displayName.toLowerCase())}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{
                      gridColumnStart: nodeInfo.col + 1,
                      gridRowStart: nodeInfo.row + 1,
                    }}
                    className={`
                      h-[55px] rounded-xl transition-all duration-300 flex flex-col items-center justify-center text-xs text-center overflow-hidden break-words px-2.5 select-none
                      bg-[#0d1117]/85 backdrop-blur-md border border-[#30363d]/80 text-[#c9d1d9] font-medium shadow-[0_4px_12px_rgba(0,0,0,0.3)] cursor-pointer
                      ${activeHoverClass}
                      hover:-translate-y-0.5
                      ${isNodeActive ? 'opacity-100' : 'opacity-25'}
                    `}
                  >
                    <div className="flex items-center gap-1.5 justify-center w-full">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeDotClass}`} />
                      <span className="font-semibold tracking-tight truncate max-w-[90px]">{displayName}</span>
                    </div>
                    {nodeInfo?.year && <span className="text-[9px] text-[#8b949e] font-normal mt-0.5">{nodeInfo.year}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Floating Drag Hint Widget */}
        <div className="absolute top-4 right-4 z-20 pointer-events-none flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1117]/90 backdrop-blur-md border border-[#30363d]/85 rounded-full text-[10px] text-[#8b949e] font-semibold tracking-wider uppercase select-none shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <span className="text-xs animate-spin" style={{ animationDuration: '4s' }}>✥</span> Drag to explore Tech Map
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-[600px] max-h-[600px] bg-[#0d1117]/95 backdrop-blur-md rounded-2xl border border-[#30363d] shadow-[0_24px_50px_rgba(0,0,0,0.6)] flex flex-col z-10 overflow-hidden transform transition-all scale-100 opacity-100">
            <div className="p-6 sm:p-8 overflow-y-auto">
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 text-[#8b949e] hover:text-[#f0f6fc] text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#21262d] transition-colors"
              >
                &times;
              </button>
              
              {selectedNode && (
                <div className="mt-2 text-[#c9d1d9] flex-1">
                  <div className="flex items-center justify-between mb-6 border-b border-[#30363d] pb-3 pr-6">
                    <h2 className="text-2xl font-bold text-[#f0f6fc]">
                      {selectedNode.title}
                    </h2>
                    {isAdmin && (
                    <Link 
                      href={`/admin/edit/${selectedNode.slug.split('/').map(encodeURIComponent).join('/')}?redirect=/skilltree`}
                      onClick={closeModal}
                      className="shrink-0 ml-4 px-3 py-1.5 text-sm font-semibold text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-md transition-colors focus:outline-none"
                    >
                        수정
                    </Link>
                    )}
                  </div>
                  
                  {Object.keys(selectedNode.frontmatter).some(key => ['startdate', 'enddate', 'summary'].includes(key)) && (
                    <div className="mb-6 bg-[#161b22] p-4 rounded-lg border border-[#30363d] shadow-inner">
                      <h3 className="text-xs font-bold text-[#8b949e] mb-3 uppercase tracking-wider">INFO</h3>
                      <div className="space-y-2">
                        {Object.entries(selectedNode.frontmatter)
                          .filter(([key]) => ['startdate', 'enddate', 'summary'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="text-sm flex flex-col sm:flex-row sm:gap-2">
                              <span className="font-semibold text-[#8b949e] min-w-[120px] shrink-0">{key}:</span>
                              <span className="text-[#c9d1d9] break-words">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-[#8b949e] mb-3 uppercase tracking-wider">Content</h3>
                    <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 shadow-inner">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-[#c9d1d9] leading-relaxed break-words">
                        {selectedNode.content || <span className="text-gray-400 italic">No content</span>}
                      </pre>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <Link
                      href={`/${selectedNode.slug.split('/').map(encodeURIComponent).join('/')}`}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] text-white px-5 py-2.5 rounded-lg shadow-md transition-all duration-300 text-sm font-semibold border border-indigo-500/30"
                    >
                      게시물 자세히 보기 &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}