'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deletePostAction, createPostAction, updatePostAction } from '@/actions/postActions';
import { TimelineItem, addTimelineItemAction, deleteTimelineItemAction, updateTimelineItemAction } from '@/actions/timelineActions';

const cleanSlug = (str: string) => {
  let cleaned = str.trim().toLowerCase();
  cleaned = cleaned.replace(/\+/g, 'p');
  cleaned = cleaned.replace(/#/g, 'sharp');
  cleaned = cleaned
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return cleaned || 'untitled';
};

interface AboutTimelineItem {
  id: string;
  slug: string;
  title: string;
  startDate: string;
  endDate: string;
  desc: string;
  category3?: string;
  category4?: string;
  postStatus?: string;
}

interface AboutManagerProps {
  initialItems: AboutTimelineItem[];
  initialTimelineItems: TimelineItem[];
}

const getColorClass = (color: string) => {
  const c = color.toLowerCase();
  if (c === 'amber') return 'border-amber-200 bg-amber-50 text-amber-600';
  if (c === 'blue') return 'border-blue-200 bg-blue-50 text-blue-600';
  if (c === 'green' || c === 'emerald') return 'border-emerald-200 bg-emerald-50 text-emerald-600';
  if (c === 'purple') return 'border-purple-200 bg-purple-50 text-purple-600';
  if (c === 'red') return 'border-red-200 bg-red-50 text-red-600';
  return 'border-gray-200 bg-gray-50 text-gray-600';
};

const getDotColorClass = (color: string) => {
  const c = color.toLowerCase();
  if (c === 'amber') return 'bg-amber-500';
  if (c === 'blue') return 'bg-blue-500';
  if (c === 'green' || c === 'emerald') return 'bg-emerald-500';
  if (c === 'purple') return 'bg-purple-500';
  if (c === 'red') return 'bg-red-500';
  return 'bg-gray-500';
};

export default function AboutManager({ initialItems, initialTimelineItems }: AboutManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<AboutTimelineItem[]>(initialItems);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(initialTimelineItems);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Timeline Item 추가 및 수정용 상태
  const [newItemName, setNewItemName] = useState('');
  const [newItemColor, setNewItemColor] = useState('Blue');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isDeletingItemId, setIsDeletingItemId] = useState<number | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  // Timeline Card 추가 및 수정용 상태
  const [editingCardSlug, setEditingCardSlug] = useState<string | null>(null);
  const [cardTitle, setCardTitle] = useState('');
  const [cardTimelineItem, setCardTimelineItem] = useState('');
  const [cardStartDate, setCardStartDate] = useState('');
  const [cardEndDate, setCardEndDate] = useState('');
  const [cardDesc, setCardDesc] = useState('');
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleAddTimelineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      alert('아이템 이름을 입력해 주세요.');
      return;
    }
    setIsAddingItem(true);
    try {
      if (editingItemId) {
        // 수정 동작
        const res = await updateTimelineItemAction(editingItemId, newItemName, newItemColor);
        if (res.success) {
          setTimelineItems(prev => 
            prev.map(item => 
              item.id === editingItemId 
                ? { ...item, name: newItemName.trim().toLowerCase(), color: newItemColor } 
                : item
            )
          );
          cancelEditTimelineItem();
        } else {
          alert(res.message || '아이템 수정 중 오류가 발생했습니다.');
        }
      } else {
        // 추가 동작
        const res = await addTimelineItemAction(newItemName, newItemColor);
        if (res.success && res.item) {
          setTimelineItems(prev => [...prev, res.item!]);
          setNewItemName('');
        } else {
          alert(res.message || '아이템 추가 중 오류가 발생했습니다.');
        }
      }
    } catch (error) {
      console.error(error);
      alert('아이템 처리 중 오류가 발생했습니다.');
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleEditTimelineItem = (item: TimelineItem) => {
    setEditingItemId(item.id);
    setNewItemName(item.name);
    setNewItemColor(item.color);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 폼으로 스크롤 이동
  };

  const cancelEditTimelineItem = () => {
    setEditingItemId(null);
    setNewItemName('');
    setNewItemColor('Blue');
  };

  const handleDeleteTimelineItem = async (id: number, name: string) => {
    if (!confirm(`정말로 "${name}" 아이템을 삭제하시겠습니까?\n해당 아이템을 사용하는 카드들은 데이터 변경이 필요할 수 있습니다.`)) {
      return;
    }
    setIsDeletingItemId(id);
    try {
      const res = await deleteTimelineItemAction(id);
      if (res.success) {
        setTimelineItems(prev => prev.filter(item => item.id !== id));
        // 수정 중인 아이템을 삭제했다면 수정 모드 취소
        if (editingItemId === id) {
          cancelEditTimelineItem();
        }
      } else {
        alert(res.message || '아이템 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('아이템 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeletingItemId(null);
    }
  };

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const correctedPage = Math.min(currentPage, totalPages || 1);

  const startIndex = (correctedPage - 1) * itemsPerPage;
  const currentItems = items.slice(startIndex, startIndex + itemsPerPage);
  const emptyRowsCount = items.length === 0 ? 0 : itemsPerPage - currentItems.length;

  const handleDelete = async (slug: string) => {
    if (!confirm('정말로 이 이력 항목을 삭제하시겠습니까?')) return;
    
    setIsDeleting(slug);
    try {
      await deletePostAction(slug);
      setItems(prev => {
        const nextItems = prev.filter(item => item.slug !== slug);
        const nextTotalPages = Math.ceil(nextItems.length / itemsPerPage) || 1;
        if (currentPage > nextTotalPages) {
          setCurrentPage(nextTotalPages);
        }
        return nextItems;
      });
      // 수정 중인 카드를 삭제했다면 수정 모드 취소
      if (editingCardSlug === slug) {
        cancelCardEdit();
      }
      alert('성공적으로 삭제되었습니다.');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditCard = (item: AboutTimelineItem) => {
    setEditingCardSlug(item.slug);
    setCardTitle(item.title);
    setCardTimelineItem(item.category3 || '');
    setCardStartDate(item.startDate);
    setCardEndDate(item.endDate);
    setCardDesc(item.desc);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelCardEdit = () => {
    setEditingCardSlug(null);
    setCardTitle('');
    setCardTimelineItem('');
    setCardStartDate('');
    setCardEndDate('');
    setCardDesc('');
  };

  const handleSubmitCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardTitle.trim()) {
      alert('제목을 입력해 주세요.');
      return;
    }
    if (!cardTimelineItem) {
      alert('Timeline Item을 선택해 주세요.');
      return;
    }
    setIsSubmittingCard(true);

    const formData = {
      title: cardTitle.trim(),
      content: cardDesc.trim(),
      summary: cardDesc.trim(),
      category1: 'portfolio',
      category2: 'about',
      category3: cardTimelineItem,
      startdate: cardStartDate,
      enddate: cardEndDate,
      post_status: 'published'
    };

    try {
      if (editingCardSlug) {
        // 수정 동작
        const res = await updatePostAction(editingCardSlug, formData as any);
        if (res.success) {
          setItems(prev => 
            prev.map(item => 
              item.slug === editingCardSlug 
                ? { 
                    ...item, 
                    slug: res.slug || item.slug, 
                    title: cardTitle.trim(), 
                    startDate: cardStartDate, 
                    endDate: cardEndDate, 
                    desc: cardDesc.trim(),
                    category3: cardTimelineItem 
                  } 
                : item
            )
          );
          cancelCardEdit();
          alert('성공적으로 수정되었습니다.');
          router.refresh();
        } else {
          alert('카드 수정 중 오류가 발생했습니다.');
        }
      } else {
        // 추가 동작
        const res = await createPostAction(formData as any);
        if (res.success) {
          const newSlug = res.slug || `portfolio/about/${cleanSlug(cardTitle)}`;
          const newItem: AboutTimelineItem = {
            id: String(Date.now()),
            slug: newSlug,
            title: cardTitle.trim(),
            startDate: cardStartDate,
            endDate: cardEndDate,
            desc: cardDesc.trim(),
            category3: cardTimelineItem,
            postStatus: 'published'
          };
          setItems(prev => [newItem, ...prev]);
          cancelCardEdit();
          alert('성공적으로 추가되었습니다.');
          router.refresh();
        } else {
          alert('카드 추가 중 오류가 발생했습니다.');
        }
      }
    } catch (error) {
      console.error(error);
      alert('카드 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingCard(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-10 gap-6 w-full items-start">
      {/* Left Column: Timeline Category 3 Area */}
      <div className="xl:col-span-3 flex flex-col">
        {/* Sample Add Form: Category 3 Item */}
        <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80 select-none flex flex-col mb-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">{editingItemId ? 'Edit Timeline Item' : 'Add Timeline Item'}</h2>
          <form className="space-y-4" onSubmit={handleAddTimelineItem}>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Item Name</label>
              <input 
                type="text" 
                placeholder="enter item name" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Bar Color</label>
              <select 
                value={newItemColor}
                onChange={(e) => setNewItemColor(e.target.value)}
                className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Blue">Blue</option>
                <option value="Green">Green</option>
                <option value="Amber">Amber</option>
                <option value="Purple">Purple</option>
                <option value="Red">Red</option>
              </select>
            </div>
            <div className="mt-4 flex gap-3">
              <button 
                type="submit" 
                disabled={isAddingItem}
                className="flex-1 rounded-lg px-3.5 py-1.5 text-xs font-medium text-white shadow-[0_1px_2px_rgba(0,113,227,0.15)] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingItem ? (editingItemId ? 'Updating...' : 'Adding...') : (editingItemId ? 'Update' : 'Add Item')}
              </button>
              {editingItemId && (
                <button 
                  type="button" 
                  onClick={cancelEditTimelineItem} 
                  disabled={isAddingItem}
                  className="flex-1 rounded-lg bg-gray-100 px-3.5 py-1.5 text-xs font-medium text-gray-800 transition-all hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Existing: Timeline Category 3 Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80 select-none flex flex-col">
          {/* Card Header (Action Bar) */}
          <div className="flex items-center justify-between pt-6 px-6 pb-4">
            <h2 className="text-lg font-semibold text-gray-800">Timeline Item List</h2>
          </div>

          {/* Card Body (Data Table Grid) */}
          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-transparent border-b border-gray-100">
                <tr>
                  <th scope="col" className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle w-auto min-w-[70px]">Item name</th>
                  <th scope="col" className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle w-24">Bar color</th>
                  <th scope="col" className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right align-middle w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {timelineItems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-xs text-gray-400">
                      등록된 타임라인 아이템이 없습니다.
                    </td>
                  </tr>
                ) : (
                  timelineItems.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="h-[48px] px-4 font-semibold text-gray-900 whitespace-nowrap truncate" title={item.name}>
                        {item.name}
                      </td>
                      <td className="h-[48px] px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getColorClass(item.color)}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${getDotColorClass(item.color)}`}></span>
                          {item.color}
                        </span>
                      </td>
                      <td className="h-[48px] px-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 h-full">
                          <button 
                            type="button" 
                            onClick={() => handleEditTimelineItem(item)}
                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 p-1.5 rounded-lg transition-colors focus:outline-none" 
                            title="Edit Item"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteTimelineItem(item.id, item.name)}
                            disabled={isDeletingItemId === item.id}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50/50 p-1.5 rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed" 
                            title="Delete Item"
                          >
                            {isDeletingItemId === item.id ? (
                              <span className="text-[10px] font-semibold text-red-600 animate-pulse">...</span>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Timeline Card Area */}
      <div className="xl:col-span-7 flex flex-col">
        {/* Sample Add Form: Timeline Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80 select-none flex flex-col mb-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">{editingCardSlug ? 'Edit Timeline Card' : 'Add Timeline Card'}</h2>
          <form className="space-y-4" onSubmit={handleSubmitCard}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Google Software Engineer" 
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Timeline Item</label>
                <select 
                  value={cardTimelineItem}
                  onChange={(e) => setCardTimelineItem(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="" disabled>Select item...</option>
                  {timelineItems.map((ti) => (
                    <option key={ti.id} value={ti.name}>{ti.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Start Date</label>
                <input 
                  type="date" 
                  value={cardStartDate}
                  onChange={(e) => setCardStartDate(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">End Date</label>
                <input 
                  type="date" 
                  value={cardEndDate}
                  onChange={(e) => setCardEndDate(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700">Description</label>
                <textarea 
                  rows={2} 
                  placeholder="Brief description about this timeline card..." 
                  value={cardDesc}
                  onChange={(e) => setCardDesc(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>
            </div>
            <div className="pt-2 flex gap-3">
              <button 
                type="submit" 
                disabled={isSubmittingCard}
                className="flex-1 rounded-lg px-3.5 py-1.5 text-xs font-medium text-white shadow-[0_1px_2px_rgba(0,113,227,0.15)] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingCard ? (editingCardSlug ? 'Updating...' : 'Adding...') : (editingCardSlug ? 'Update' : 'Add Card')}
              </button>
              {editingCardSlug && (
                <button 
                  type="button" 
                  onClick={cancelCardEdit} 
                  disabled={isSubmittingCard}
                  className="flex-1 rounded-lg bg-gray-100 px-3.5 py-1.5 text-xs font-medium text-gray-800 transition-all hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Existing: Timeline Card List (Original Table) */}
        <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80 select-none flex flex-col">
          {/* Card Header (Action Bar) */}
          <div className="flex items-center justify-between pt-6 px-6 pb-4">
            <h2 className="text-lg font-semibold text-gray-800">Timeline Card List</h2>
          </div>

          {/* Card Body (Data Table Grid) */}
          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-transparent border-b border-gray-100">
                <tr>
                  <th scope="col" className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle w-auto min-w-[120px]">Title</th>
                  <th scope="col" className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle w-28 hidden xl:table-cell">Period</th>
                  <th scope="col" className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle w-24 hidden lg:table-cell">Cat3</th>
                  <th scope="col" className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle w-28 hidden sm:table-cell">Status</th>
                  <th scope="col" className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right align-middle w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-gray-400">
                      등록된 타임라인 이력이 없습니다. 상단의 버튼을 눌러 첫 항목을 작성해보세요!
                    </td>
                  </tr>
                ) : (
                  <>
                    {currentItems.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-gray-50/50">
                        <td className="h-[48px] px-4 font-semibold text-gray-900 whitespace-nowrap truncate min-w-[120px]" title={item.title}>
                          {item.title}
                        </td>
                        <td className="h-[48px] px-4 text-gray-500 text-[10px] whitespace-normal py-1 hidden xl:table-cell" title={`${item.startDate} ~ ${item.endDate}`}>
                          <div className="flex flex-col leading-tight">
                            <span>📅 {item.startDate.replace(/-/g, '.')}</span>
                            <span>~ {item.endDate.replace(/-/g, '.')}</span>
                          </div>
                        </td>
                        <td className="h-[48px] px-4 text-gray-500 text-xs whitespace-nowrap truncate hidden lg:table-cell" title={item.category3 || ''}>
                          {item.category3 || '-'}
                        </td>
                        <td className="h-[48px] px-4 whitespace-nowrap hidden sm:table-cell">
                          {item.postStatus === 'draft' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                              Draft
                            </span>
                          ) : item.postStatus === 'editing' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                              Editing
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              Published
                            </span>
                          )}
                        </td>
                        <td className="h-[48px] px-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 h-full">
                            <button
                              type="button"
                              onClick={() => handleEditCard(item)}
                              className="text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 p-1.5 rounded-lg transition-colors focus:outline-none"
                              title={`Edit ${item.title}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item.slug)}
                              disabled={isDeleting === item.slug}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50/50 p-1.5 rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                              title={`Delete ${item.title}`}
                            >
                              {isDeleting === item.slug ? (
                                <span className="text-xs font-semibold text-red-600 animate-pulse">Deleting...</span>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {emptyRowsCount > 0 && Array.from({ length: emptyRowsCount }).map((_, idx) => (
                      <tr key={`empty-${idx}`} className="hover:bg-transparent bg-white">
                        <td className="h-[48px] px-4 font-semibold text-transparent select-none">-</td>
                        <td className="h-[48px] px-4 hidden xl:table-cell text-transparent select-none">-</td>
                        <td className="h-[48px] px-4 hidden lg:table-cell text-transparent select-none">-</td>
                        <td className="h-[48px] px-4 hidden sm:table-cell text-transparent select-none">-</td>
                        <td className="h-[48px] px-4 text-transparent select-none">-</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 ? (
            <div className="border-t border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Page {correctedPage} of {totalPages} ({items.length} cards)
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={correctedPage === 1}
                  onClick={() => setCurrentPage(correctedPage - 1)}
                  className="px-3 py-1.5 border border-gray-200/60 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNumber = i + 1;
                  const isActive = pageNumber === correctedPage;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
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
                  disabled={correctedPage === totalPages}
                  onClick={() => setCurrentPage(correctedPage + 1)}
                  className="px-3 py-1.5 border border-gray-200/60 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-100 bg-white px-6 py-4 text-center text-xs font-bold text-gray-300 uppercase tracking-wider">
              End of list
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
