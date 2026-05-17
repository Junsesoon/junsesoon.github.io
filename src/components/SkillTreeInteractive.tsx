'use client';

import React, { useState } from 'react';

interface SkillNode {
  file: string;
  hasCat3: boolean;
  parents: string[];
  colIndex?: number;
  year?: string;
  content: string;
  frontmatter: Record<string, any>;
}

interface Props {
  columnsData: string[][];
  nodes: Record<string, SkillNode>;
  COLUMNS: number;
}

export default function SkillTreeInteractive({ columnsData, nodes, COLUMNS }: Props) {
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const maxRows = Math.max(10, ...columnsData.map(col => col.length));
  const INITIAL_ROWS = maxRows;
  const TOTAL_CELLS = COLUMNS * INITIAL_ROWS;
  const gridCells = Array.from({ length: TOTAL_CELLS }, (_, i) => i);

  const handleNodeClick = (node: SkillNode | null) => {
    if (node) {
      setSelectedNode(node);
      setIsDrawerOpen(true);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <div className="w-full flex justify-center py-10 overflow-x-auto relative">
      <div 
        className="grid gap-x-[20px] gap-y-[20px] w-max"
        style={{ gridTemplateColumns: `repeat(${COLUMNS}, 60px)` }}
      >
        {gridCells.map((index) => {
          const colIndex = index % COLUMNS;
          const rowIndex = Math.floor(index / COLUMNS);
          const file = rowIndex < columnsData[colIndex].length ? columnsData[colIndex][rowIndex] : null;
          
          const displayName = file ? file.replace(/\.[^/.]+$/, "") : null;
          const nodeInfo = displayName ? nodes[displayName] : null;

          return (
            <div
              key={index}
              onClick={() => handleNodeClick(nodeInfo || null)}
              className={`
                h-[50px] rounded-md transition-all duration-300 flex flex-col items-center justify-center text-[10px] text-center overflow-hidden break-all px-1
                ${file 
                  ? 'bg-white/10 backdrop-blur-md border border-white/20 text-black shadow-[0_0_10px_rgba(0,123,255,0.2)] cursor-pointer hover:bg-white/20 hover:scale-105'
                  : 'bg-white/5 border border-dashed border-white/10 opacity-20 hover:opacity-40'
                }
              `}
            >
              {displayName && <span>{displayName}</span>}
              {nodeInfo?.year && <span className="text-[8px] opacity-70">{nodeInfo.year}</span>}
            </div>
          );
        })}
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
                {selectedNode.file.replace(/\.[^/.]+$/, "")}
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