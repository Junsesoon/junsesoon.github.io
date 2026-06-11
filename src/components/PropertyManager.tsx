'use client';

import React, { useState, useEffect } from 'react';
import { addGlobalPropertyAction, deleteGlobalPropertyAction, renameGlobalPropertyAction, togglePropertyEssentialAction, updatePropertyTypeAction } from './propertyActions';

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
    
    // 병합 의도인지 확인 및 경고
    const targetProp = localProperties.find((p) => p.name === trimmedNewName);
    if (targetProp) {
      if (!window.confirm(`'${oldName}' 속성을 '${trimmedNewName}' (타입: ${targetProp.type || getPredefinedType(trimmedNewName)}) 속성으로 병합하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 기존 데이터는 새 타입에 맞춰 안전하게 변환됩니다.`)) {
        return;
      }
    }

    // DB 연동 (트랜잭션 업데이트)
    const result = await renameGlobalPropertyAction(oldName, trimmedNewName);
    if (!result.success) {
      alert(result.message);
      return;
    }

    if (targetProp) {
      // 병합(Merge) 성공 시 기존 속성 UI에서 제거
      setLocalProperties((prev) => prev.filter((p) => p.name !== oldName));
    } else {
      // 단순 이름 변경(Rename) 성공 시
      setLocalProperties((prev) => prev.map((p) => (p.name === oldName ? { ...p, name: trimmedNewName } : p)).sort((a, b) => a.name.localeCompare(b.name)));
    }
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

  const handleUpdateType = async (propName: string, newType: string) => {
    const result = await updatePropertyTypeAction(propName, newType);
    if (!result.success) {
      alert(result.message);
      return;
    }
    setLocalProperties((prev) => prev.map((p) => (p.name === propName ? { ...p, type: newType } : p)));
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm min-h-[400px] flex flex-col">
      {/* Add Property Form */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Property</h3>
        <form onSubmit={handleAddProperty} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={newPropName}
            onChange={(e) => setNewPropName(e.target.value)}
            placeholder="e.g., customProp"
            className="block flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
          <select
            value={newPropType}
            onChange={(e) => setNewPropType(e.target.value)}
            className="block w-full sm:w-32 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white appearance-none cursor-pointer"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="date">Date</option>
            <option value="array">Array</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold shadow-sm transition-colors active:scale-95 whitespace-nowrap flex items-center justify-center"
          >
            Add
          </button> 
        </form>
      </div>

      <h2 className="text-xl font-semibold text-gray-800 mb-6">Property List</h2>
      {localProperties.length > 0 ? (
        <ul className="border border-gray-200 rounded-xl overflow-hidden bg-white divide-y divide-gray-200">
          {localProperties.map((prop) => (
            <li key={prop.name} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <select
                  value={prop.type || getPredefinedType(prop.name)}
                  onChange={(e) => handleUpdateType(prop.name, e.target.value)}
                  className="text-gray-500 text-xs bg-gray-100 px-1 py-0.5 rounded border border-gray-200 capitalize w-[68px] text-center shrink-0 cursor-pointer hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white focus:text-gray-700"
                  title="Click to edit type"
                  style={{ textAlignLast: 'center' }}
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                  <option value="array">Array</option>
                </select>
                {editingProp === prop.name ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editPropName}
                      onChange={(e) => setEditPropName(e.target.value)}
                      className="block w-32 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameProperty(prop.name);
                        if (e.key === 'Escape') setEditingProp(null);
                      }}
                    />
                    <button onClick={() => handleRenameProperty(prop.name)} className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">Save</button>
                    <button onClick={() => setEditingProp(null)} className="text-gray-500 hover:text-gray-700 text-sm transition-colors">Cancel</button>
                  </div>
                ) : (
                  <span className="font-mono text-gray-900 font-medium text-base">{prop.name}</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-600 text-sm font-medium bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                  {prop.count} {prop.count === 1 ? 'post' : 'posts'}
                </span>
                {/* Essential Toggle Switch */}
                <div className="flex items-center gap-1.5 border-r border-gray-200 pr-4">
                  <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors ${prop.is_essential ? 'text-blue-600' : 'text-gray-400'}`}>
                    Essential
                  </span>
                  <button
                    onClick={() => handleToggleEssential(prop.name, !!prop.is_essential)}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${prop.is_essential ? 'bg-blue-600' : 'bg-gray-300'}`}
                    title="Toggle Essential Status"
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${prop.is_essential ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <button
                  onClick={() => { setEditingProp(prop.name); setEditPropName(prop.name); }}
                  className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-md transition-colors focus:outline-none"
                  title={`Rename ${prop.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteProperty(prop.name)}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-md transition-colors focus:outline-none"
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
        <div className="py-10 text-center border border-dashed border-gray-300 rounded-xl bg-gray-50">
          <p className="text-gray-500 text-sm">No properties found.</p>
        </div>
      )}
    </div>
  );
}