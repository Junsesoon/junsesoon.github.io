'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { addSkillTreeDomainAction, getSkillTreeDomainsAction, deleteSkillTreeDomainAction, updateSkillTreeDomainAction, updateSkillTreeDomainOrdersAction, getSkillTreeCardsAction } from '../../actions/skillTreeActions';
import { createPostAction, updatePostAction, deletePostAction } from '../../actions/postActions';
import AdminClock from '../admin/AdminClock';
import { logoutAction } from '@/actions/adminActions';
import BackButton from '../admin/BackButton';
import AdminSidebar from '../admin/AdminSidebar';

export default function SkillTreeManager() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [matchCategory2, setMatchCategory2] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [domains, setDomains] = useState<{ id: number; title: string; description: string; matchCategory2: string; displayOrder: number }[]>([]);
  const [isDomainsLoading, setIsDomainsLoading] = useState(true);
  const [isCardsLoading, setIsCardsLoading] = useState(true);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [skillCards, setSkillCards] = useState<{ slug: string; title: string; content: string; properties: any; category2: string; category3?: string; parentSkill?: string }[]>([]);
  const [cardSortConfig, setCardSortConfig] = useState<{ key: string; order: 'asc' | 'desc' }>({ key: '', order: 'asc' });

  // Pagination states
  const [currentDomainPage, setCurrentDomainPage] = useState(1);
  const [currentCardPage, setCurrentCardPage] = useState(1);

  // 새로 추가된 Skill Card Form 상태 관리
  const [editingCardSlug, setEditingCardSlug] = useState<string | null>(null);
  const [cardTitle, setCardTitle] = useState('');
  const [cardSummary, setCardSummary] = useState('');
  const [cardCat1, setCardCat1] = useState('skilltree');
  const [cardCat2, setCardCat2] = useState('');
  const [cardCat3, setCardCat3] = useState('');
  const [cardCat4, setCardCat4] = useState('');
  const [cardTechStart, setCardTechStart] = useState('');
  const [cardParentSkill, setCardParentSkill] = useState('');
  const [cardCreatedAt, setCardCreatedAt] = useState('');
  const [cardModifiedAt, setCardModifiedAt] = useState('');
  const [isCardSubmitting, setIsCardSubmitting] = useState(false);

  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);

  useEffect(() => {
    loadDomains();
    loadCards();
  }, []);

  const loadDomains = async () => {
    setIsDomainsLoading(true);
    const data = await getSkillTreeDomainsAction();
    setDomains(data as { id: number; title: string; description: string; matchCategory2: string; displayOrder: number }[]);
    setIsDomainsLoading(false);
  };

  const loadCards = async () => {
    setIsCardsLoading(true);
    const data = await getSkillTreeCardsAction();
    setSkillCards(data as { slug: string; title: string; content: string; properties: any; category2: string; category3?: string; parentSkill?: string }[]);
    setIsCardsLoading(false);
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

  const handleDeleteCard = async (slug: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the skill card '${title}'?`)) {
      return;
    }
    try {
      await deletePostAction(slug);
      loadCards(); // 삭제 성공 시 리스트 갱신
    } catch (error) {
      alert('Failed to delete skill card.');
    }
  };

  const handleCardClick = (card: { slug: string; title: string; content: string; properties: any; category2: string; category3?: string; parentSkill?: string }) => {
    setEditingCardSlug(card.slug);
    setCardTitle(card.title);
    setCardSummary(card.properties?.summary || '');
    setCardCat1(card.properties?.category1 || 'skill tree');
    setCardCat2(card.category2 || '');
    setCardCat3(card.category3 || '');
    setCardCat4(card.properties?.category4 || '');
    const rawTechStart = card.properties?.techstart || card.properties?.techStart || '';
    setCardTechStart(rawTechStart ? String(rawTechStart).split('T')[0] : '');
    setCardParentSkill(card.parentSkill || '');
    setCardCreatedAt(card.properties?.posted_at ? String(card.properties.posted_at).split('T')[0] : card.properties?.date ? String(card.properties.date).split('T')[0] : '');
    setCardModifiedAt(card.properties?.modified_at ? String(card.properties.modified_at).split('T')[0] : '');
  };

  const cancelCardEdit = () => {
    setEditingCardSlug(null);
    setCardTitle('');
    setCardSummary('');
    setCardCat1('skill tree');
    setCardCat2('');
    setCardCat3('');
    setCardCat4('');
    setCardTechStart('');
    setCardParentSkill('');
    setCardCreatedAt('');
    setCardModifiedAt('');
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardTitle.trim()) {
      alert('Title is required.');
      return;
    }

    setIsCardSubmitting(true);
    try {
      const originalCard = editingCardSlug ? skillCards.find(c => c.slug === editingCardSlug) : null;

      const formData = {
        ...(originalCard ? originalCard.properties : {}),
        title: cardTitle,
        content: originalCard ? originalCard.content : '',
        summary: cardSummary,
        category1: cardCat1,
        category2: cardCat2,
        category3: cardCat3,
        category4: cardCat4,
        techstart: cardTechStart,
        parentskill: cardParentSkill,
        posted_at: cardCreatedAt,
        date: cardCreatedAt,
        modified_at: cardModifiedAt,
      };

      if (editingCardSlug) {
        await updatePostAction(editingCardSlug, formData as any);
      } else {
        await createPostAction(formData as any);
      }
      
      cancelCardEdit();
      loadCards(); // 생성/수정 성공 시 리스트 즉시 갱신
    } catch (error) {
      alert(editingCardSlug ? 'Failed to update skill card.' : 'Failed to add skill card.');
    } finally {
      setIsCardSubmitting(false);
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

  const handleCardSort = (key: string) => {
    setCardSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentCardPage(1);
  };

  const renderCardSortIcon = (key: string) => {
    const isActive = cardSortConfig.key === key;
    return (
      <span className={`text-[10px] shrink-0 ml-1 ${isActive ? 'text-gray-600' : 'text-gray-300 group-hover:text-gray-500'}`}>
        {isActive ? (cardSortConfig.order === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    );
  };

  const sortedSkillCards = [...skillCards].sort((a, b) => {
    if (!cardSortConfig.key) return 0;
    let aVal: any = a[cardSortConfig.key as keyof typeof a];
    let bVal: any = b[cardSortConfig.key as keyof typeof b];

    if (!aVal) aVal = '';
    if (!bVal) bVal = '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return cardSortConfig.order === 'asc' ? -1 : 1;
    if (aVal > bVal) return cardSortConfig.order === 'asc' ? 1 : -1;
    return 0;
  });

  // Domain Pagination derived values
  const DOMAINS_PER_PAGE = 5;
  const totalDomainPages = Math.ceil(domains.length / DOMAINS_PER_PAGE);
  const correctedDomainPage = Math.min(currentDomainPage, totalDomainPages || 1);
  const domainStartIndex = (correctedDomainPage - 1) * DOMAINS_PER_PAGE;
  const currentDomains = domains.slice(domainStartIndex, domainStartIndex + DOMAINS_PER_PAGE);
  const emptyDomainRowsCount = DOMAINS_PER_PAGE - currentDomains.length;

  // Card Pagination derived values
  const CARDS_PER_PAGE = 10;
  const totalCardPages = Math.ceil(skillCards.length / CARDS_PER_PAGE);
  const correctedCardPage = Math.min(currentCardPage, totalCardPages || 1);
  const cardStartIndex = (correctedCardPage - 1) * CARDS_PER_PAGE;
  const currentSkillCards = sortedSkillCards.slice(cardStartIndex, cardStartIndex + CARDS_PER_PAGE);
  const emptyCardRowsCount = CARDS_PER_PAGE - currentSkillCards.length;

  return (
    <div className="flex min-h-screen w-full bg-gray-50/50 font-sans">
      <AdminSidebar activePath="skilltree" />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-none w-full overflow-y-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200 pb-4 gap-4">
          <AdminClock title="Skill Tree" />
          <div className="flex items-center gap-3">
            <BackButton />
            <form action={logoutAction}>
              <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3.5 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-100/80">
                Logout
              </button>
            </form>
          </div>
        </header>

      <div className="flex flex-col gap-8">
        {/* --- 도메인 관리 영역 (1단) --- */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* 왼쪽: 새 스킬 트리 도메인 추가 폼 */}
          <div className="md:col-span-1">
            <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">{editingId ? 'Edit Domain' : 'Add New Domain'}</h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">Grid Name</label>
                  <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. FrontEnd" className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                </div>
                <div>
                  <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                  <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Brief description about this grid..." className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="matchCategory" className="mb-1 block text-sm font-medium text-gray-700">Match Category2</label>
                  <input type="text" id="matchCategory" value={matchCategory2} onChange={(e) => setMatchCategory2(e.target.value)} placeholder="e.g. FrontEnd" className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                  <p className="mt-1 text-xs text-gray-500">게시물의 <span className="font-semibold text-gray-700">category2</span> 속성과 일치해야 해당 그리드에 카드가 표시됩니다</p>
                </div>
                <div className="mt-4 flex gap-3">
                  <button type="submit" disabled={isSubmitting} className={`flex-1 rounded-lg px-3.5 py-1.5 text-xs font-medium text-white shadow-[0_1px_2px_rgba(0,113,227,0.15)] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSubmitting ? 'bg-[#0071e3]/50 cursor-not-allowed' : 'bg-[#0071e3] hover:bg-[#0077ed]'}`}>
                    {isSubmitting ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update' : 'Add Domain')}
                  </button>
                  {editingId && (
                    <button type="button" onClick={cancelEdit} disabled={isSubmitting} className="flex-1 rounded-lg bg-gray-100 px-3.5 py-1.5 text-xs font-medium text-gray-800 transition-all hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* 오른쪽: 새 스킬 트리 카드 추가 폼 */}
          <div className="md:col-span-2">
            <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">{editingCardSlug ? 'Edit Skill Card' : 'Add New Skill Card'}</h2>
              <form className="space-y-4" onSubmit={handleCardSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                    <input type="text" placeholder="e.g. React" value={cardTitle} onChange={(e) => setCardTitle(e.target.value)} required className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Summary</label>
                    <textarea rows={2} placeholder="Brief summary..." value={cardSummary} onChange={(e) => setCardSummary(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Category 1</label>
                      <input type="text" placeholder="skilltree" value={cardCat1} onChange={(e) => setCardCat1(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Category 2</label>
                      <input type="text" placeholder="domain" value={cardCat2} onChange={(e) => setCardCat2(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Category 3</label>
                      <input type="text" placeholder="sub-domain" value={cardCat3} onChange={(e) => setCardCat3(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Category 4</label>
                      <input type="text" placeholder="" value={cardCat4} onChange={(e) => setCardCat4(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Tech Start</label>
                      <input type="date" value={cardTechStart} onChange={(e) => setCardTechStart(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Parent Skill</label>
                      <input type="text" placeholder="skill1, skill2..." value={cardParentSkill} onChange={(e) => setCardParentSkill(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Created At</label>
                      <input type="date" value={cardCreatedAt} onChange={(e) => setCardCreatedAt(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Modified At</label>
                      <input type="date" value={cardModifiedAt} onChange={(e) => setCardModifiedAt(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button type="submit" disabled={isCardSubmitting} className={`flex-1 rounded-lg px-3.5 py-1.5 text-xs font-medium text-white shadow-[0_1px_2px_rgba(0,113,227,0.15)] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isCardSubmitting ? 'bg-[#0071e3]/50 cursor-not-allowed' : 'bg-[#0071e3] hover:bg-[#0077ed]'}`}>
                    {isCardSubmitting ? (editingCardSlug ? 'Updating...' : 'Adding...') : (editingCardSlug ? 'Update' : 'Add Skill Card')}
                  </button>
                  {editingCardSlug && (
                    <button type="button" onClick={cancelCardEdit} disabled={isCardSubmitting} className="flex-1 rounded-lg bg-gray-100 px-3.5 py-1.5 text-xs font-medium text-gray-800 transition-all hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* --- 스킬 카드 관리 영역 (2단) --- */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* 왼쪽: 기존 도메인 관리 목록 */}
          <div className="md:col-span-1">
            <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80">
              <div className="overflow-x-auto w-full">
                <table className="w-full table-fixed divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-transparent border-b border-gray-100">
                    <tr>
                      <th scope="col" className="w-12 py-3 px-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle truncate">No</th>
                      <th scope="col" className="w-20 py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle truncate">Name</th>
                      <th scope="col" className="py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle truncate hidden xl:table-cell">Description</th>
                      <th scope="col" className="w-24 py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle truncate hidden sm:table-cell md:hidden lg:table-cell">Match Cat2</th>
                      <th scope="col" className="w-16 py-3 px-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle truncate">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                  {isDomainsLoading ? (
                    <>
                      <tr className="hover:bg-transparent bg-white">
                        <td colSpan={5} className="h-[48px] text-center text-gray-500 align-middle">Loading domains...</td>
                      </tr>
                      {Array.from({ length: DOMAINS_PER_PAGE - 1 }).map((_, idx) => (
                        <tr key={`empty-domain-loading-${idx}`} className="hover:bg-transparent bg-white">
                          <td className="h-[48px] text-center text-transparent select-none" colSpan={5}>-</td>
                        </tr>
                      ))}
                    </>
                  ) : domains.length === 0 ? (
                    <>
                      <tr className="hover:bg-transparent bg-white">
                        <td colSpan={5} className="h-[48px] text-center text-gray-500 align-middle">No domains found.</td>
                      </tr>
                      {Array.from({ length: DOMAINS_PER_PAGE - 1 }).map((_, idx) => (
                        <tr key={`empty-domain-none-${idx}`} className="hover:bg-transparent bg-white">
                          <td className="h-[48px] text-center text-transparent select-none" colSpan={5}>-</td>
                        </tr>
                      ))}
                    </>
                  ) : (
                    <>
                      {currentDomains.map((domain, index) => {
                        const absoluteIndex = domainStartIndex + index;
                        return (
                          <tr 
                            key={domain.id} 
                            data-index={absoluteIndex}
                            draggable
                            onDragStart={(e) => handleDragStart(e, absoluteIndex)}
                            onDragEnter={(e) => handleDragEnter(e, absoluteIndex)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            onTouchStart={(e) => handleTouchStart(e, absoluteIndex)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            // 터치 드래그 중에 브라우저의 기본 스크롤 동작이 간섭하지 않도록 touch-none 적용
                            className="transition-colors hover:bg-gray-50/50 cursor-move touch-none"
                          >
                            <td className="h-[48px] text-center overflow-hidden">
                              <div className="flex items-center justify-center h-full gap-1.5" title="Drag to reorder">
                                <svg className="h-3.5 w-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                <span className="text-xs font-semibold text-gray-400">{domain.displayOrder || absoluteIndex + 1}</span>
                              </div>
                            </td>
                            <td className="h-[48px] px-2 font-semibold text-gray-900 whitespace-nowrap truncate" title={domain.title}>{domain.title}</td>
                            <td className="h-[48px] px-2 text-gray-500 text-xs whitespace-nowrap truncate hidden xl:table-cell" title={domain.description}>{domain.description || '-'}</td>
                            <td className="h-[48px] px-2 whitespace-nowrap truncate hidden sm:table-cell md:hidden lg:table-cell" title={domain.matchCategory2}>
                              <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                {domain.matchCategory2}
                              </span>
                            </td>
                            <td className="h-[48px] text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  type="button"
                                  onClick={() => handleEdit(domain)}
                                  className="text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 p-1.5 rounded-lg transition-colors focus:outline-none"
                                  title={`Edit ${domain.title}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleDelete(domain.id, domain.title)}
                                  className="text-gray-400 hover:text-red-600 hover:bg-red-50/50 p-1.5 rounded-lg transition-colors focus:outline-none"
                                  title={`Delete ${domain.title}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {emptyDomainRowsCount > 0 && Array.from({ length: emptyDomainRowsCount }).map((_, idx) => (
                        <tr key={`empty-domain-${idx}`} className="hover:bg-transparent bg-white">
                          <td className="h-[48px] text-center overflow-hidden">
                            <div className="flex items-center justify-center h-full">
                              <span className="text-xs font-semibold text-transparent select-none">-</span>
                            </div>
                          </td>
                          <td className="h-[48px] px-2 font-semibold text-transparent select-none">-</td>
                          <td className="h-[48px] px-2 hidden xl:table-cell text-transparent select-none">-</td>
                          <td className="h-[48px] px-2 hidden sm:table-cell md:hidden lg:table-cell text-transparent select-none">-</td>
                          <td className="h-[48px] text-center text-transparent select-none">-</td>
                        </tr>
                      ))}
                    </>
                  )}
                  </tbody>
                </table>
              </div>
              {totalDomainPages > 1 ? (
                <div className="border-t border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Page {correctedDomainPage} of {totalDomainPages} ({domains.length} domains)
                    </p>
                    {isSavingOrder && <span className="text-[10px] font-semibold text-blue-600 animate-pulse mt-0.5">Saving order...</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={correctedDomainPage === 1}
                      onClick={() => setCurrentDomainPage(correctedDomainPage - 1)}
                      className="px-3 py-1.5 border border-gray-200/60 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalDomainPages }).map((_, i) => {
                      const pageNumber = i + 1;
                      const isActive = pageNumber === correctedDomainPage;
                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setCurrentDomainPage(pageNumber)}
                          className={`h-8 w-8 text-[10px] font-bold rounded-lg flex items-center justify-center transition-colors ${
                            isActive 
                              ? 'bg-blue-50/50 text-blue-600 border border-blue-100/60 font-extrabold shadow-sm'
                              : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-800'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      disabled={correctedDomainPage === totalDomainPages}
                      onClick={() => setCurrentDomainPage(correctedDomainPage + 1)}
                      className="px-3 py-1.5 border border-gray-200/60 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-100 bg-white px-6 py-4 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>Total {domains.length} domains</span>
                  {isSavingOrder && <span className="font-semibold text-blue-600 animate-pulse">Saving order...</span>}
                </div>
              )}
            </div>
          </div>

        {/* 오른쪽: 스킬 카드 목록 테이블 */}
        <div className="md:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80">
            <div className="overflow-x-auto w-full">
              <table className="w-full table-fixed divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-transparent border-b border-gray-100">
                <tr>
                  <th scope="col" className="w-12 py-3 px-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle truncate">No</th>
                  <th scope="col" className="w-40 py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle truncate cursor-pointer select-none group hover:text-gray-700 transition-colors" onClick={() => handleCardSort('title')}>
                    <div className="flex items-center gap-1">Name {renderCardSortIcon('title')}</div>
                  </th>
                  <th scope="col" className="w-32 py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle truncate hidden sm:table-cell cursor-pointer select-none group hover:text-gray-700 transition-colors" onClick={() => handleCardSort('category2')}>
                    <div className="flex items-center gap-1">Domain {renderCardSortIcon('category2')}</div>
                  </th>
                  <th scope="col" className="w-36 py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle truncate hidden md:table-cell cursor-pointer select-none group hover:text-gray-700 transition-colors" onClick={() => handleCardSort('category3')}>
                    <div className="flex items-center gap-1">Sub Domain {renderCardSortIcon('category3')}</div>
                  </th>
                  <th scope="col" className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle truncate hidden lg:table-cell cursor-pointer select-none group hover:text-gray-700 transition-colors" onClick={() => handleCardSort('parentSkill')}>
                    <div className="flex items-center gap-1">Parent Skill {renderCardSortIcon('parentSkill')}</div>
                  </th>
                  <th scope="col" className="w-24 py-3 px-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle truncate">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {isCardsLoading ? (
                  <>
                    <tr className="hover:bg-transparent bg-white">
                      <td colSpan={6} className="h-[48px] text-center text-gray-500 align-middle">Loading cards...</td>
                    </tr>
                    {Array.from({ length: CARDS_PER_PAGE - 1 }).map((_, idx) => (
                      <tr key={`empty-card-loading-${idx}`} className="hover:bg-transparent bg-white">
                        <td className="h-[48px] text-center text-transparent select-none" colSpan={6}>-</td>
                      </tr>
                    ))}
                  </>
                ) : skillCards.length === 0 ? (
                  <>
                    <tr className="hover:bg-transparent bg-white">
                      <td colSpan={6} className="h-[48px] text-center text-gray-500 align-middle">No skill cards found.</td>
                    </tr>
                    {Array.from({ length: CARDS_PER_PAGE - 1 }).map((_, idx) => (
                      <tr key={`empty-card-none-${idx}`} className="hover:bg-transparent bg-white">
                        <td className="h-[48px] text-center text-transparent select-none" colSpan={6}>-</td>
                      </tr>
                    ))}
                  </>
                ) : (
                  <>
                    {currentSkillCards.map((card, index) => (
                      <tr key={index} className={`transition-colors hover:bg-gray-50/50 cursor-pointer ${editingCardSlug === card.slug ? 'bg-blue-50/30' : ''}`} onClick={() => handleCardClick(card)}>
                        <td className="h-[48px] text-center overflow-hidden">
                          <div className="flex items-center justify-center h-full">
                            <span className="text-xs font-semibold text-gray-400">{cardStartIndex + index + 1}</span>
                          </div>
                        </td>
                        <td className="h-[48px] px-4 font-semibold text-gray-900 whitespace-nowrap truncate" title={card.title}>{card.title}</td>
                        <td className="h-[48px] px-4 whitespace-nowrap truncate hidden sm:table-cell" title={card.category2 || ''}>
                          {card.category2 ? (
                            <span className="inline-flex items-center rounded-full border border-purple-100 bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-600">
                              {card.category2}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="h-[48px] px-4 whitespace-nowrap truncate hidden md:table-cell" title={card.category3 || ''}>
                          {card.category3 ? (
                            <span className="inline-flex items-center rounded-full border border-cyan-100 bg-cyan-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-600">
                              {card.category3}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="h-[48px] px-4 text-gray-500 text-xs whitespace-nowrap truncate hidden lg:table-cell" title={card.parentSkill}>{card.parentSkill || '-'}</td>
                        <td className="h-[48px] text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Link 
                              href={`/admin/edit/${card.slug.split('/').map(encodeURIComponent).join('/')}?redirect=/admin/skilltree`}
                              className="text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 p-1.5 rounded-lg transition-colors focus:outline-none block"
                              title={`Edit ${card.title}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </Link>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteCard(card.slug, card.title)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50/50 p-1.5 rounded-lg transition-colors focus:outline-none"
                              title={`Delete ${card.title}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {emptyCardRowsCount > 0 && Array.from({ length: emptyCardRowsCount }).map((_, idx) => (
                      <tr key={`empty-card-${idx}`} className="hover:bg-transparent bg-white">
                        <td className="h-[48px] text-center overflow-hidden">
                          <div className="flex items-center justify-center h-full">
                            <span className="text-xs font-semibold text-transparent select-none">-</span>
                          </div>
                        </td>
                        <td className="h-[48px] px-4 font-semibold text-transparent select-none">-</td>
                        <td className="h-[48px] px-4 hidden sm:table-cell text-transparent select-none">-</td>
                        <td className="h-[48px] px-4 hidden md:table-cell text-transparent select-none">-</td>
                        <td className="h-[48px] px-4 hidden lg:table-cell text-transparent select-none">-</td>
                        <td className="h-[48px] text-center text-transparent select-none">-</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
            </div>
            {totalCardPages > 1 ? (
              <div className="border-t border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Page {correctedCardPage} of {totalCardPages} ({skillCards.length} cards)
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={correctedCardPage === 1}
                    onClick={() => setCurrentCardPage(correctedCardPage - 1)}
                    className="px-3 py-1.5 border border-gray-200/60 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalCardPages }).map((_, i) => {
                    const pageNumber = i + 1;
                    const isActive = pageNumber === correctedCardPage;
                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setCurrentCardPage(pageNumber)}
                        className={`h-8 w-8 text-[10px] font-bold rounded-lg flex items-center justify-center transition-colors ${
                          isActive 
                            ? 'bg-blue-50/50 text-blue-600 border border-blue-100/60 font-extrabold shadow-sm'
                            : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-800'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={correctedCardPage === totalCardPages}
                    onClick={() => setCurrentCardPage(correctedCardPage + 1)}
                    className="px-3 py-1.5 border border-gray-200/60 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-100 bg-white px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Total {skillCards.length} cards</span>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </main>
  </div>
);
}