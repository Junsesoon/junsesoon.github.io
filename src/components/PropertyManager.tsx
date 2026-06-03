'use client';

import React, { useState, useEffect } from 'react';
import { addGlobalPropertyAction, deleteGlobalPropertyAction, renameGlobalPropertyAction, togglePropertyEssentialAction } from './actions';

export interface PropertyWithCount {
  name: string;
  count: number;
  type?: string;
  is_essential?: boolean;
}

interface PropertyManagerProps {
  properties: PropertyWithCount[];
}

const getPredefinedType = (name: string) => {
  if (['tags', 'parentSkill', 'childSkill'].includes(name)) return 'array';
  if (['techStart', 'date', 'created_at', 'updated_at'].includes(name)) return 'date';
  return 'string';
};

export default function PropertyManager({ properties }: PropertyManagerProps) {
  const [localProperties, setLocalProperties] = useState<PropertyWithCount[]>(properties);
  const [newPropName, setNewPropName] = useState('');
  const [newPropType, setNewPropType] = useState('string');
  const [editingProp, setEditingProp] = useState<string | null>(null);
  const [editPropName, setEditPropName] = useState('');

  // 서버에서 속성 목록이 업데이트되면 동기화
  useEffect(() => {
    setLocalProperties(properties);
  }, [properties]);

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedProp = newPropName.trim();
    
    if (!trimmedProp) return;
    
    if (localProperties.some((p) => p.name === trimmedProp)) {
      alert('Property already exists.');
      return;
    }

    // 화면에 새 속성 즉시 추가 및 정렬 (초기 count는 0)
    setLocalProperties((prev) => 
      [...prev, { name: trimmedProp, count: 0, type: newPropType, is_essential: false }].sort((a, b) => a.name.localeCompare(b.name))
    );
    setNewPropName('');
    setNewPropType('string');
  };

  const handleDeleteProperty = (propNameToDelete: string) => {
    if (!window.confirm(`Are you sure you want to delete the property '${propNameToDelete}'?`)) {
      return;
    }
    setLocalProperties((prev) => prev.filter((p) => p.name !== propNameToDelete));
  };

  const handleRenameProperty = async (oldName: string) => {
    const trimmedNewName = editPropName.trim();
    if (!trimmedNewName || trimmedNewName === oldName) {
      setEditingProp(null);
      return;
    }
    if (localProperties.some((p) => p.name === trimmedNewName)) {
      alert('Property name already exists.');
      return;
    }

    // DB 연동 (트랜잭션 업데이트)
    const result = await renameGlobalPropertyAction(oldName, trimmedNewName);
    if (!result.success) {
      alert(result.message);
      return;
    }

    setLocalProperties((prev) => prev.map((p) => (p.name === oldName ? { ...p, name: trimmedNewName } : p)).sort((a, b) => a.name.localeCompare(b.name)));
    setEditingProp(null);
  };

  const handleToggleEssential = async (propName: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    // 낙관적 UI 업데이트
    setLocalProperties(prev => prev.map(p => p.name === propName ? { ...p, is_essential: newStatus } : p));
    
    // DB 연동
    const result = await togglePropertyEssentialAction(propName, newStatus);
    if (!result.success) {
      setLocalProperties(prev => prev.map(p => p.name === propName ? { ...p, is_essential: currentStatus } : p));
      alert(result.message);
    }
  };

  return (
    <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl min-h-[400px] flex flex-col">
      {/* Add Property Form */}
      <div className="border-b border-white/20 pb-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Add New Property</h3>
        <form onSubmit={handleAddProperty} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={newPropName}
            onChange={(e) => setNewPropName(e.target.value)}
            placeholder="e.g., customProp"
            className="flex-1 bg-black/20 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007BFF]/50 focus:border-[#007BFF] transition-all"
          />
          <select
            value={newPropType}
            onChange={(e) => setNewPropType(e.target.value)}
            className="w-full sm:w-32 bg-black/20 border border-white/20 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#007BFF]/50 focus:border-[#007BFF] transition-all appearance-none cursor-pointer"
          >
            <option value="string" className="bg-[#232526]">String</option>
            <option value="number" className="bg-[#232526]">Number</option>
            <option value="boolean" className="bg-[#232526]">Boolean</option>
            <option value="date" className="bg-[#232526]">Date</option>
            <option value="array" className="bg-[#232526]">Array</option>
          </select>
          <button
            type="submit"
            className="bg-[#007BFF] hover:bg-[#0069d9] text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg shadow-[#007BFF]/20 transition-all active:scale-95 whitespace-nowrap"
          >
            Add
          </button> 
        </form>
      </div>

      <h2 className="text-xl font-semibold text-white mb-6">Property List</h2>
      {localProperties.length > 0 ? (
        <ul className="border border-white/10 rounded-xl overflow-hidden bg-white/5 divide-y divide-white/10">
          {localProperties.map((prop) => (
            <li key={prop.name} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                {editingProp === prop.name ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editPropName}
                      onChange={(e) => setEditPropName(e.target.value)}
                      className="bg-black/20 border border-white/20 rounded px-2 py-1 text-white text-sm w-32 focus:outline-none focus:border-[#007BFF]"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameProperty(prop.name);
                        if (e.key === 'Escape') setEditingProp(null);
                      }}
                    />
                    <button onClick={() => handleRenameProperty(prop.name)} className="text-[#007BFF] hover:text-[#0056b3] text-sm font-medium transition-colors">Save</button>
                    <button onClick={() => setEditingProp(null)} className="text-white/50 hover:text-white text-sm transition-colors">Cancel</button>
                  </div>
                ) : (
                  <span className="font-mono text-white text-base">{prop.name}</span>
                )}
                <span className="text-white/40 text-xs bg-black/20 px-2 py-0.5 rounded border border-white/10 capitalize">
                  {prop.type || getPredefinedType(prop.name)}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white/60 text-sm font-medium bg-black/20 px-3 py-1 rounded-full border border-white/5">
                  {prop.count} {prop.count === 1 ? 'post' : 'posts'}
                </span>
                {/* Essential Toggle Switch */}
                <div className="flex items-center gap-1.5 border-r border-white/10 pr-4">
                  <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors ${prop.is_essential ? 'text-[#007BFF]' : 'text-white/30'}`}>
                    Essential
                  </span>
                  <button
                    onClick={() => handleToggleEssential(prop.name, !!prop.is_essential)}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${prop.is_essential ? 'bg-[#007BFF]' : 'bg-white/20'}`}
                    title="Toggle Essential Status"
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${prop.is_essential ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <button
                  onClick={() => { setEditingProp(prop.name); setEditPropName(prop.name); }}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-2 rounded-lg transition-colors focus:outline-none"
                  title={`Rename ${prop.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteProperty(prop.name)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors focus:outline-none"
                  title={`Delete ${prop.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-10 text-center border border-dashed border-white/20 rounded-xl bg-white/5">
          <p className="text-white/50 text-sm">No properties found.</p>
        </div>
      )}
    </div>
  );
}