'use client';

import React, { useState, useEffect } from 'react';
import { addGlobalPropertyAction, deleteGlobalPropertyAction, renameGlobalPropertyAction, togglePropertyEssentialAction, togglePropertyRequiredAction, updatePropertyTypeAction, checkUppercasePropertiesAction, autoNormalizeUppercasePropertiesAction, syncAndCleanPropertiesAction, previewSyncAndCleanPropertiesAction, getPostsUsingPropertyAction } from './propertyActions';

export interface PropertyWithCount {
  name: string;
  count: number;
  type?: string;
  is_essential?: boolean;
  is_required?: boolean;
}

interface PropertyManagerProps {
  properties: PropertyWithCount[];
}

interface ModalState {
  isOpen: boolean;
  type: 'alert' | 'confirm';
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const getPredefinedType = (name: string) => {
  if (['tags', 'parentskill', 'childskill'].includes(name)) return 'array';
  if (['techstart', 'startdate', 'enddate', 'date', 'created_at', 'updated_at', 'posted_at', 'modified_at'].includes(name)) return 'date';
  return 'string';
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'string': return 'text-emerald-500';
    case 'number': return 'text-amber-500';
    case 'boolean': return 'text-rose-500';
    case 'array': return 'text-cyan-500';
    case 'date': return 'text-violet-500';
    default: return 'text-gray-500';
  }
};

const SYSTEM_PROPS = ['category1', 'summary', 'category2', 'category3', 'category4', 'tags', 'parentskill', 'childskill', 'techstart', 'projectname', 'location', 'posted_at', 'modified_at'];
const INTERNAL_PROPS = [
  'post_status',
  'has_draft',
  'draft_title',
  'draft_content',
  'draft_properties',
  'views_count',
  'likes_count',
  'created_at',
  'updated_at'
];

export default function PropertyManager({ properties }: PropertyManagerProps) {
  const [localProperties, setLocalProperties] = useState<PropertyWithCount[]>(properties);
  const [newPropName, setNewPropName] = useState('');
  const [newPropType, setNewPropType] = useState('string');
  const [editingProp, setEditingProp] = useState<string | null>(null);
  const [editPropName, setEditPropName] = useState('');
  const [isCheckingProps, setIsCheckingProps] = useState(false);
  const [isRefreshingProps, setIsRefreshingProps] = useState(false);

  const [modalConfig, setModalConfig] = useState<ModalState | null>(null);

  const showAlert = (title: string, message: React.ReactNode, onConfirm?: () => void) => {
    setModalConfig({ isOpen: true, type: 'alert', title, message, onConfirm });
  };

  const showConfirm = (title: string, message: React.ReactNode, onConfirm: () => void) => {
    setModalConfig({ isOpen: true, type: 'confirm', title, message, onConfirm });
  };

  const closeModal = () => setModalConfig(null);

  const [sortConfig, setSortConfig] = useState<{ key: keyof PropertyWithCount; order: 'asc' | 'desc' }>({ key: 'name', order: 'asc' });

  const handleSort = (key: keyof PropertyWithCount) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedProperties = [...localProperties].sort((a, b) => {
    let aVal: any = a[sortConfig.key];
    let bVal: any = b[sortConfig.key];

    if (sortConfig.key === 'type') {
      aVal = a.type || getPredefinedType(a.name);
      bVal = b.type || getPredefinedType(b.name);
    } else if (sortConfig.key === 'is_essential') {
      aVal = a.is_essential ? 1 : 0;
      bVal = b.is_essential ? 1 : 0;
    } else if (sortConfig.key === 'is_required') {
      aVal = a.is_required ? 1 : 0;
      bVal = b.is_required ? 1 : 0;
    } else if (sortConfig.key === 'name') {
      aVal = a.name.toLowerCase();
      bVal = b.name.toLowerCase();
    }

    if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
    return 0;
  });

  const renderSortIcon = (key: keyof PropertyWithCount) => {
    const isActive = sortConfig.key === key;
    return (
      <span className={`text-[10px] shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-300 group-hover:text-gray-400'}`}>
        {isActive ? (sortConfig.order === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    );
  };

  // 서버에서 속성 목록이 업데이트되면 동기화
  useEffect(() => {
    setLocalProperties(properties);
  }, [properties]);

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedProp = newPropName.trim();
    
    if (!trimmedProp) return;
    
    if (localProperties.some((p) => p.name === trimmedProp)) {
      alert('Property already exists.');
      return;
    }

    const result = await addGlobalPropertyAction(trimmedProp, newPropType);
    if (!result.success) {
      alert(result.message);
      return;
    }

    // 화면에 새 속성 즉시 추가 및 정렬 (초기 count는 0)
    setLocalProperties((prev) => 
      [...prev, { name: trimmedProp, count: 0, type: newPropType, is_essential: false }].sort((a, b) => a.name.localeCompare(b.name))
    );
    setNewPropName('');
    setNewPropType('string');
  };

  const handleDeleteProperty = async (propNameToDelete: string) => {
    // 온디맨드 방식: 휴지통 클릭 시점에 서버 액션을 호출해 사용 중인 게시물 목록을 즉시 가져옵니다.
    const usageList = await getPostsUsingPropertyAction(propNameToDelete);

    showConfirm(
      '속성 삭제 (Delete Property)',
      <div className="space-y-2">
        <p>정말로 <span className="font-semibold text-red-600">'{propNameToDelete}'</span> 속성을 삭제하시겠습니까?</p>
        <p className="text-xs text-gray-500">이 작업은 되돌릴 수 없으며, 기존 게시물 데이터에서 해당 속성이 영구적으로 제거됩니다</p>
        {usageList.length > 0 && (
          <div className="mt-4 p-3 bg-rose-50 rounded-lg border border-rose-100 max-h-[150px] overflow-y-auto">
            <p className="font-bold text-xs text-rose-600 mb-2">[사용 중인 게시물 목록 - {usageList.length}개]</p>
            <ul className="list-disc pl-4 text-sm text-rose-800 space-y-1">
              {usageList.map((title, i) => <li key={i}>{title}</li>)}
            </ul>
          </div>
        )}
      </div>,
      async () => {
        closeModal();
        const result = await deleteGlobalPropertyAction(propNameToDelete);
        if (!result.success) {
          showAlert('오류', result.message);
          return;
        }
        setLocalProperties((prev) => prev.filter((p) => p.name !== propNameToDelete));
      }
    );
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

  const handleToggleRequired = async (propName: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    // 낙관적 UI 업데이트
    setLocalProperties(prev => prev.map(p => p.name === propName ? { ...p, is_required: newStatus } : p));
    
    // DB 연동
    const result = await togglePropertyRequiredAction(propName, newStatus);
    if (!result.success) {
      setLocalProperties(prev => prev.map(p => p.name === propName ? { ...p, is_required: currentStatus } : p));
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

  const handlePropCheck = async () => {
    setIsCheckingProps(true);
    try {
      const result = await checkUppercasePropertiesAction();
      setIsCheckingProps(false);

      if (!result.success) {
        showAlert('오류', result.message);
        return;
      }

      const { dbProperties, postProperties } = result;
      if (!dbProperties || !postProperties) return;

      if (dbProperties.length === 0 && postProperties.length === 0) {
        showAlert('점검 완료', '✅ 대문자가 포함된 속성이 없습니다');
        return;
      }

      const messageNode = (
        <div className="space-y-4 text-left">
          <p className="font-medium text-gray-800">⚠️ 대문자가 포함된 속성이 발견되었습니다!</p>
          {dbProperties.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="font-bold text-xs text-gray-500 mb-2">[전역 속성 목록]</p>
              <ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
                {dbProperties.map((p: string) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          )}
          {postProperties.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="font-bold text-xs text-gray-500 mb-2">[게시물 내부 속성]</p>
              <ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
                {Object.entries(
                  postProperties.reduce((acc: any, p: any) => {
                    if (!acc[p.title]) acc[p.title] = [];
                    if (!acc[p.title].includes(p.key)) acc[p.title].push(p.key);
                    return acc;
                  }, {})
                ).map(([title, keys]: any) => (
                  <li key={title}>
                    <span className="font-semibold text-gray-900">{title}</span>: {keys.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="font-semibold pt-2 text-blue-600">위 속성들을 모두 소문자로 변환하시겠습니까?</p>
        </div>
      );

      showConfirm('속성 정규화', messageNode, async () => {
        closeModal();
        setIsCheckingProps(true);
        const normResult = await autoNormalizeUppercasePropertiesAction();
        setIsCheckingProps(false);
        showAlert('변환 결과', normResult.message, () => {
          if (normResult.success) window.location.reload();
        });
      });
    } catch (error) {
      setIsCheckingProps(false);
      showAlert('오류', '서버 통신 중 문제가 발생했습니다.');
    }
  };

  const handlePropRefresh = async () => {
    setIsRefreshingProps(true);
    try {
      // 1. 추가 및 삭제될 속성 미리보기
      const preview = await previewSyncAndCleanPropertiesAction();
      setIsRefreshingProps(false);

      if (!preview.success) {
        showAlert('오류', preview.message);
        return;
      }

      const { toAdd = [], toDelete = [] } = preview;

      if (toAdd.length === 0 && toDelete.length === 0) {
        showAlert('동기화 완료', '✅ 최신 상태로 동기화되어 있습니다. 추가하거나 삭제할 잉여 속성이 없습니다.');
        return;
      }

      const messageNode = (
        <div className="space-y-4 text-left">
          <p className="font-medium text-gray-800">다음 동기화 및 정리 작업이 수행됩니다.</p>
          {toAdd.length > 0 && (
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
              <p className="font-bold text-xs text-emerald-600 mb-2">[추가될 누락 속성 ({toAdd.length}개)]</p>
              <ul className="list-disc pl-4 text-sm text-emerald-800 space-y-1">
                {toAdd.map((p: string) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          )}
          {toDelete.length > 0 && (
            <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
              <p className="font-bold text-xs text-rose-600 mb-2">[삭제될 잉여 속성 ({toDelete.length}개)]</p>
              <ul className="list-disc pl-4 text-sm text-rose-800 space-y-1">
                {toDelete.map((p: string) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          )}
          <p className="font-semibold pt-2 text-blue-600">계속하시겠습니까?</p>
        </div>
      );

      showConfirm('동기화 및 정리 (Refresh)', messageNode, async () => {
        closeModal();
        setIsRefreshingProps(true);
        const result = await syncAndCleanPropertiesAction();
        setIsRefreshingProps(false);
        showAlert('정리 결과', result.message, () => {
          if (result.success) window.location.reload();
        });
      });
    } catch (error) {
      setIsRefreshingProps(false);
      showAlert('오류', '서버 통신 중 문제가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col gap-8 min-h-[400px]">
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Add Property Form (2/3 on lg, 2/4 on xl) */}
        <div className="w-full lg:col-span-2 xl:col-span-2 rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Property</h3>
          <form onSubmit={handleAddProperty} className="flex flex-col xl:flex-row gap-4">
            <input
              type="text"
              value={newPropName}
              onChange={(e) => setNewPropName(e.target.value)}
              placeholder="e.g., customProp"
              className="block w-full xl:flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
            <select
              value={newPropType}
              onChange={(e) => setNewPropType(e.target.value)}
              className={`block w-full xl:w-24 rounded-md border border-gray-300 pl-2.5 pr-6 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white appearance-none cursor-pointer font-semibold ${getTypeColor(newPropType)}`}
            >
              <option value="string" className="text-gray-900 font-medium">String</option>
              <option value="number" className="text-gray-900 font-medium">Number</option>
              <option value="boolean" className="text-gray-900 font-medium">Boolean</option>
              <option value="date" className="text-gray-900 font-medium">Date</option>
              <option value="array" className="text-gray-900 font-medium">Array</option>
            </select>
            <button
              type="submit"
              className="bg-[#0071e3] hover:bg-[#0077ed] text-white px-5 py-1.5 rounded-lg text-xs font-medium shadow-[0_1px_2px_rgba(0,113,227,0.15)] transition-all active:scale-95 whitespace-nowrap flex items-center justify-center w-full xl:w-auto"
            >
              Add
            </button> 
          </form>
        </div>

        {/* Action Boxes (1/3 on lg, 2/4 on xl) */}
        <div className="w-full lg:col-span-1 xl:col-span-2 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4">
          <div className="flex-1 rounded-2xl border border-gray-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 truncate">Prop Check</h3>
            <button
              onClick={handlePropCheck}
              disabled={isCheckingProps}
              className={`w-full flex items-center justify-center h-[38px] rounded-lg border transition-all text-xs font-semibold shadow-sm focus:outline-none ${isCheckingProps ? 'bg-gray-100/50 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-blue-200 bg-blue-50/50 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95'}`}
            >
              {isCheckingProps ? 'Checking...' : 'Start!'}
            </button>
          </div>
          <div className="flex-1 rounded-2xl border border-gray-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 truncate">Prop Refresh</h3>
            <button
              onClick={handlePropRefresh}
              disabled={isRefreshingProps}
              className={`w-full flex items-center justify-center h-[38px] rounded-lg border transition-all text-xs font-semibold shadow-sm focus:outline-none ${isRefreshingProps ? 'bg-gray-100/50 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-emerald-200 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 active:scale-95'}`}
            >
              {isRefreshingProps ? 'Refreshing...' : 'Refresh!'}
            </button>
          </div>
        </div>
      </div>

      <div>
        {localProperties.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80">
            {/* Card Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 pb-2">
              <h2 className="text-lg font-bold text-gray-900">Property List</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              <li className="flex items-center justify-between bg-white px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none border-b border-gray-100">
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                  <div 
                    className="w-[68px] flex items-center justify-center gap-1 cursor-pointer hover:text-gray-800 transition-colors group shrink-0"
                    onClick={() => handleSort('type')}
                  >
                    Type {renderSortIcon('type')}
                  </div>
                  <div 
                    className="pl-1 flex items-center gap-1 cursor-pointer hover:text-gray-800 transition-colors group truncate min-w-0"
                    onClick={() => handleSort('name')}
                  >
                    Name {renderSortIcon('name')}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div 
                    className="w-[80px] flex items-center justify-center gap-1 cursor-pointer hover:text-gray-800 transition-colors group" 
                    onClick={() => handleSort('count')}
                    title="Post Count"
                  >
                    Usage {renderSortIcon('count')}
                  </div>
                  <div 
                    className="w-[80px] flex items-center justify-center gap-1 cursor-pointer hover:text-gray-800 transition-colors group"
                    onClick={() => handleSort('is_essential')}
                    title="Default"
                  >
                    Default {renderSortIcon('is_essential')}
                  </div>
                  <div 
                    className="w-[80px] flex items-center justify-center gap-1 cursor-pointer hover:text-gray-800 transition-colors group border-r border-gray-200 pr-4"
                    onClick={() => handleSort('is_required')}
                    title="Mandatory"
                  >
                    Mandatory {renderSortIcon('is_required')}
                  </div>
                  <div className="w-[80px] text-center">
                    Action
                  </div>
                </div>
              </li>
              {sortedProperties.map((prop) => {
                const currentType = prop.type || getPredefinedType(prop.name);
                const isSystemProp = SYSTEM_PROPS.includes(prop.name);
                const isInternalProp = INTERNAL_PROPS.includes(prop.name);
                return (
                  <li key={prop.name} className="relative flex items-center justify-between h-[48px] px-4 hover:bg-gray-50/50 transition-colors bg-white">
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                      <select
                        value={currentType}
                        onChange={(e) => handleUpdateType(prop.name, e.target.value)}
                        className={`${getTypeColor(currentType)} font-semibold text-xs bg-gray-100 px-1 py-0.5 rounded border border-gray-200 capitalize w-[68px] text-center shrink-0 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white ${(isSystemProp || isInternalProp) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-gray-200 transition-colors'}`}
                        title={(isSystemProp || isInternalProp) ? "System property type cannot be changed" : "Click to edit type"}
                        disabled={isSystemProp || isInternalProp}
                        style={{ textAlignLast: 'center' }}
                      >
                        <option value="string" className="text-gray-900 font-medium">String</option>
                        <option value="number" className="text-gray-900 font-medium">Number</option>
                        <option value="boolean" className="text-gray-900 font-medium">Boolean</option>
                        <option value="date" className="text-gray-900 font-medium">Date</option>
                        <option value="array" className="text-gray-900 font-medium">Array</option>
                      </select>
                      {editingProp === prop.name ? (
                        <div className="absolute left-[92px] z-20 flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-1.5 shadow-lg">
                          <input
                            type="text"
                            value={editPropName}
                            onChange={(e) => setEditPropName(e.target.value)}
                            className="block w-40 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameProperty(prop.name);
                              if (e.key === 'Escape') setEditingProp(null);
                            }}
                          />
                          <button 
                            onClick={() => handleRenameProperty(prop.name)} 
                            className="text-emerald-600 hover:text-emerald-800 p-1 hover:bg-emerald-50 rounded transition-colors shrink-0"
                            title="Save"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => setEditingProp(null)} 
                            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors shrink-0"
                            title="Cancel"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span 
                          className={`font-mono text-gray-900 font-semibold text-sm truncate min-w-0 flex-1 transition-colors ${!(isSystemProp || isInternalProp) ? 'hover:text-blue-600 cursor-pointer' : 'hover:text-red-500 cursor-not-allowed'}`}
                          title={prop.name}
                          onClick={!(isSystemProp || isInternalProp) ? () => { setEditingProp(prop.name); setEditPropName(prop.name); } : undefined}
                        >
                          {prop.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-[80px] flex justify-center">
                        <span className="text-gray-600 text-[10px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 whitespace-nowrap">
                          {prop.count} {prop.count === 1 ? 'post' : 'posts'}
                        </span>
                      </div>
                      {/* Default Toggle Switch */}
                      <div className="flex items-center justify-center gap-1.5 w-[80px]">
                        <button
                          onClick={() => handleToggleEssential(prop.name, !!prop.is_essential)}
                          disabled={isInternalProp}
                          className={`relative shrink-0 inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${prop.is_essential ? 'bg-blue-600' : 'bg-gray-300'} ${isInternalProp ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isInternalProp ? "Internal properties cannot be default" : "Toggle Default Status"}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${prop.is_essential ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      {/* Mandatory Toggle Switch */}
                      <div className="flex items-center justify-center gap-1.5 w-[80px] border-r border-gray-200 pr-4">
                        <button
                          onClick={() => handleToggleRequired(prop.name, !!prop.is_required)}
                          disabled={isInternalProp}
                          className={`relative shrink-0 inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${prop.is_required ? 'bg-blue-600' : 'bg-gray-300'} ${isInternalProp ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isInternalProp ? "Internal properties cannot be mandatory" : "Toggle Mandatory Status"}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${prop.is_required ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-center w-[80px] gap-1">
                        {isInternalProp ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded select-none cursor-not-allowed" title="Internal Property">Internal</span>
                        ) : isSystemProp ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100/50 border border-gray-200 px-2 py-0.5 rounded select-none cursor-not-allowed" title="System Property">Locked</span>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingProp(prop.name); setEditPropName(prop.name); }}
                              className="text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 p-1.5 rounded-lg transition-colors focus:outline-none"
                              title={`Rename ${prop.name}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteProperty(prop.name)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50/50 p-1.5 rounded-lg transition-colors focus:outline-none"
                              title={`Delete ${prop.name}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="py-10 text-center rounded-xl bg-white shadow-sm">
            <p className="text-gray-500 text-sm">No properties found.</p>
          </div>
        )}
      </div>

      {/* Modal Component */}
      {modalConfig && modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col z-10 overflow-hidden transform transition-all">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{modalConfig.title}</h3>
              <div className="text-gray-700 text-sm max-h-[60vh] overflow-y-auto whitespace-pre-wrap">
                {modalConfig.message}
              </div>
              <div className="mt-8 flex justify-end gap-3">
                {modalConfig.type === 'confirm' && (
                  <button
                    onClick={() => {
                      if (modalConfig.onCancel) modalConfig.onCancel();
                      closeModal();
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none"
                  >
                    {modalConfig.cancelText || '취소'}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (modalConfig.onConfirm) modalConfig.onConfirm();
                    if (modalConfig.type === 'alert') closeModal();
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none"
                >
                  {modalConfig.confirmText || '확인'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}