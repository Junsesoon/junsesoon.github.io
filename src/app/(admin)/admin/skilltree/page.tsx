'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { addSkillTreeDomainAction, getSkillTreeDomainsAction, deleteSkillTreeDomainAction, updateSkillTreeDomainAction, updateSkillTreeDomainOrdersAction } from '../../../../components/actions';

export default function ManageSkillTreePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [matchCategory2, setMatchCategory2] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [domains, setDomains] = useState<{ id: number; title: string; description: string; matchCategory2: string; displayOrder: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    setIsLoading(true);
    const data = await getSkillTreeDomainsAction();
    setDomains(data as { id: number; title: string; description: string; matchCategory2: string; displayOrder: number }[]);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !matchCategory2.trim()) {
      alert('Title and Match Category2 are required.');
      return;
    }
    
    setIsSubmitting(true);
    
    let result;
    if (editingId) {
      result = await updateSkillTreeDomainAction(editingId, title, description, matchCategory2);
    } else {
      result = await addSkillTreeDomainAction(title, description, matchCategory2);
    }
    setIsSubmitting(false);

    if (result.success) {
      setTitle('');
      setDescription('');
      setMatchCategory2('');
      setEditingId(null);
      loadDomains(); // 새로 추가/수정된 목록을 반영하기 위해 다시 불러옴
    } else {
      alert(result.message || (editingId ? 'Failed to update domain.' : 'Failed to add domain.'));
    }
  };

  const handleEdit = (domain: { id: number; title: string; description: string; matchCategory2: string; displayOrder: number }) => {
    setEditingId(domain.id);
    setTitle(domain.title);
    setDescription(domain.description || '');
    setMatchCategory2(domain.matchCategory2);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 폼으로 스크롤 이동
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setMatchCategory2('');
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the domain '${title}'?`)) {
      return;
    }
    const result = await deleteSkillTreeDomainAction(id);
    if (result.success) {
      loadDomains(); // 성공 시 도메인 목록 새로고침
    } else {
      alert(result.message || 'Failed to delete domain.');
    }
  };

  // 드래그 시작 시 호출
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    dragItemIndex.current = index;
    e.currentTarget.style.opacity = '0.5'; // 시각적 피드백
  };

  // 드래그 중인 행이 다른 행 위를 지나갈 때 호출
  const handleDragEnter = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    dragOverItemIndex.current = index;
  };

  // Drop(마우스 드래그 종료 또는 터치 종료) 시 실행되는 공통 순서 변경 로직
  const handleDropCompletion = async () => {
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

      // 즉각적인 UI 업데이트 (Optimistic Update)
      setDomains(updatedDomains);
      setIsSavingOrder(true);
      
      // 백그라운드 DB 저장
      const orders = updatedDomains.map(d => ({ id: d.id, displayOrder: d.displayOrder }));
      const res = await updateSkillTreeDomainOrdersAction(orders);
      setIsSavingOrder(false);

      if (!res.success) {
        alert('순서 저장에 실패했습니다.');
        loadDomains(); // 실패 시 원래 데이터로 롤백
      }
    }

    // Ref 초기화
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  // 마우스 드래그 종료 시
  const handleDragEnd = async (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.style.opacity = '1'; // 투명도 원상복구
    await handleDropCompletion();
  };

  // --- 터치 이벤트 핸들러 (모바일 지원용) ---
  const handleTouchStart = (e: React.TouchEvent<HTMLTableRowElement>, index: number) => {
    dragItemIndex.current = index;
    e.currentTarget.style.opacity = '0.5';
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLTableRowElement>) => {
    const touch = e.touches[0];
    // 손가락이 지나고 있는 화면의 좌표를 기반으로 하위에 있는 HTML 요소를 찾습니다.
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (targetElement) {
      const trElement = targetElement.closest('tr[data-index]');
      if (trElement) {
        const overIndex = parseInt(trElement.getAttribute('data-index') || '-1', 10);
        if (overIndex !== -1) {
          dragOverItemIndex.current = overIndex;
        }
      }
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent<HTMLTableRowElement>) => {
    e.currentTarget.style.opacity = '1';
    await handleDropCompletion();
  };

  return (
    <div className="mx-auto max-w-6xl p-8 font-sans">
      <header className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manage SkillTree</h1>
          <p className="mt-2 text-sm text-gray-500">
            스킬 트리 페이지에 노출될 카테고리(그리드) 목록과 설명을 관리합니다.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          ← Back to Dashboard
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* 왼쪽: 새 스킬 트리 도메인 추가 폼 */}
        <div className="md:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">{editingId ? 'Edit Domain' : 'Add New Domain'}</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">Grid Title</label>
                <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. FrontEnd" className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" required />
              </div>
              <div>
                <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Brief description about this grid..." className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="matchCategory" className="mb-1 block text-sm font-medium text-gray-700">Match Category2</label>
                <input type="text" id="matchCategory" value={matchCategory2} onChange={(e) => setMatchCategory2(e.target.value)} placeholder="e.g. FrontEnd" className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                <p className="mt-1 text-xs text-gray-500">게시물의 <span className="font-semibold text-gray-700">category2</span> 속성과 일치해야 해당 그리드에 카드가 표시됩니다.</p>
              </div>
              <div className="mt-4 flex gap-3">
                <button type="submit" disabled={isSubmitting} className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {isSubmitting ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Domain' : 'Add Domain')}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} disabled={isSubmitting} className="flex-1 rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* 오른쪽: 기존 도메인 관리 목록 */}
        <div className="md:col-span-2">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-12 px-4 py-3 text-center font-semibold text-gray-400">#</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-900">Title</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-900">Description</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-900">Match Cat2</th>
                  <th scope="col" className="px-4 py-3 text-center font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">Loading domains...</td>
                  </tr>
                ) : domains.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">No domains found.</td>
                  </tr>
                ) : (
                  domains.map((domain, index) => (
                    <tr 
                      key={domain.id} 
                      data-index={index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      onTouchStart={(e) => handleTouchStart(e, index)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      // 터치 드래그 중에 브라우저의 기본 스크롤 동작이 간섭하지 않도록 touch-none 적용
                      className="transition-colors hover:bg-gray-50 cursor-move touch-none"
                    >
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5" title="Drag to reorder">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                          <span className="text-xs font-semibold text-gray-400">{domain.displayOrder || index + 1}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{domain.title}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{domain.description}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold text-blue-700">
                          {domain.matchCategory2}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button 
                          onClick={() => handleEdit(domain)}
                          className="mr-3 font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(domain.id, domain.title)}
                          className="font-medium text-red-600 hover:text-red-800 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-500">
              <span>Total {domains.length} domains</span>
              {isSavingOrder && <span className="font-semibold text-blue-600 animate-pulse">Saving order...</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}