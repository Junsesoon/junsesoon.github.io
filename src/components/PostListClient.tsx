'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { batchUpdateLocationAction } from './actions';
import { deletePostAction } from './postActions';

interface Post {
  slug: string;
  title: string;
  location: string;
  category1: string;
  category2: string;
  date: string | number | Date;
  likes_count?: number;
  views_count?: number;
  post_status?: string;
  has_draft?: boolean;
  metadata?: {
    post_status?: string;
    has_draft?: boolean;
  };
}

interface PostListClientProps {
  posts: Post[];
  sort: string;
  order: 'asc' | 'desc';
}

export default function PostListClient({ posts, sort, order }: PostListClientProps) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLocation, setNewLocation] = useState('Blog');
  const [isUpdating, setIsUpdating] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const correctedPage = Math.min(currentPage, totalPages || 1);
  
  const startIndex = (correctedPage - 1) * ITEMS_PER_PAGE;
  const currentPosts = posts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const emptyRowsCount = ITEMS_PER_PAGE - currentPosts.length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSlugs(currentPosts.map((post) => post.slug));
    } else {
      setSelectedSlugs([]);
    }
  };

  const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, slug: string) => {
    if (e.target.checked) {
      setSelectedSlugs((prev) => [...prev, slug]);
    } else {
      setSelectedSlugs((prev) => prev.filter((s) => s !== slug));
    }
  };

  const isAllSelected = currentPosts.length > 0 && selectedSlugs.length === currentPosts.length && currentPosts.every(post => selectedSlugs.includes(post.slug));
  const isSomeSelected = selectedSlugs.length > 0;

  const renderHeader = (key: string, label: string, extraClasses: string = '') => {
    const isActive = sort === key;
    const nextOrder = isActive && order === 'asc' ? 'desc' : 'asc';
    return (
      <th 
        scope="col" 
        className={`py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle truncate ${extraClasses}`}
      >
        <Link href={`/admin?sort=${key}&order=${nextOrder}`} className="group inline-flex items-center gap-1 transition-colors hover:text-gray-700">
          {label}
          <span className={`text-[10px] ${isActive ? 'text-gray-600' : 'text-gray-300 group-hover:text-gray-500'}`}>
            {isActive ? (order === 'asc' ? '▲' : '▼') : '↕'}
          </span>
        </Link>
      </th>
    );
  };

  const handleApplyLocation = async () => {
    setIsUpdating(true);
    const result = await batchUpdateLocationAction(selectedSlugs, newLocation);
    setIsUpdating(false);

    if (result.success) {
      setIsModalOpen(false);
      setSelectedSlugs([]); // 작업 완료 후 선택 해제
    } else {
      alert(result.message || 'Failed to update locations.');
    }
  };

  return (
    <>
      {/* Unified Card Container */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80">
        
        {/* Card Header (Action Bar) */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-2">
          <h2 className="text-lg font-bold text-gray-900">Posts</h2>
          <div className="flex gap-2.5">
            <button 
              type="button" 
              disabled={!isSomeSelected} 
              onClick={() => setIsModalOpen(true)}
              className={`inline-flex items-center justify-center rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isSomeSelected 
                  ? 'bg-gray-100 text-gray-800 hover:bg-gray-200/80 focus:ring-gray-200' 
                  : 'bg-gray-100/50 text-gray-400/80 cursor-not-allowed opacity-50'
              }`}
            >
              Change Location {isSomeSelected && `(${selectedSlugs.length})`}
            </button>
            <Link 
              href="/admin/write" 
              className="inline-flex items-center justify-center rounded-lg bg-[#0071e3] px-3.5 py-1.5 text-xs font-medium text-white shadow-[0_1px_2px_rgba(0,113,227,0.15)] transition-all hover:bg-[#0077ed] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + Create New Post
            </Link>
          </div>
        </div>

        {/* Card Body (Data Table Grid) */}
        <div className="w-full overflow-hidden min-h-[528px]">
          <table className="w-full table-fixed divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-transparent border-b border-gray-100">
              <tr>
                <th scope="col" className="w-10 py-3 text-center align-middle">
                  <div className="flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="h-3.5 w-3.5 rounded-[3px] border-gray-300/85 text-[#0071e3] focus:ring-[#0071e3]/30 focus:ring-offset-0 hover:border-gray-400 cursor-pointer transition-colors" 
                    />
                  </div>
                </th>
                {renderHeader('title', 'Title', 'w-48')}
                {renderHeader('location', 'Location', 'w-24 hidden sm:table-cell')}
                {renderHeader('category1', 'Cat1', 'w-28 hidden md:table-cell')}
                {renderHeader('category2', 'Cat2', 'w-28 hidden lg:table-cell')}
                {renderHeader('post_status', 'Status', 'w-24 hidden lg:table-cell')}
                {renderHeader('date', 'Date', 'w-24 hidden md:table-cell')}
                {renderHeader('views_count', 'View', 'w-16 hidden lg:table-cell')}
                {renderHeader('likes_count', 'Like', 'w-16 hidden lg:table-cell')}
                <th scope="col" className="w-16 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center align-middle truncate">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {currentPosts.length > 0 ? (
                <>
                  {currentPosts.map((post) => (
                    <tr key={post.slug} className={`transition-colors hover:bg-gray-50/50 ${selectedSlugs.includes(post.slug) ? 'bg-blue-50/30' : ''}`}>
                      <td className="h-[48px] text-center overflow-hidden">
                        <div className="flex items-center justify-center h-full">
                          <input 
                            type="checkbox" 
                            checked={selectedSlugs.includes(post.slug)}
                            onChange={(e) => handleSelectOne(e, post.slug)}
                            className="h-3.5 w-3.5 rounded-[3px] border-gray-300/85 text-[#0071e3] focus:ring-[#0071e3]/30 focus:ring-offset-0 hover:border-gray-400 cursor-pointer transition-colors" 
                          />
                        </div>
                      </td>
                      <td className="h-[48px] px-4 font-semibold text-gray-900 whitespace-nowrap truncate">
                        <Link 
                          href={`/${post.slug.split('/').map(encodeURIComponent).join('/')}`}
                          className="block whitespace-nowrap truncate text-gray-900 hover:text-blue-600 transition-colors"
                          title={post.title}
                        >
                          {post.title}
                        </Link>
                      </td>
                      <td className="h-[48px] px-4 whitespace-nowrap truncate hidden sm:table-cell">
                        {post.location ? (
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            post.location === 'Portfolio' ? 'bg-red-50 text-red-600 border-red-100' :
                            post.location === 'Both' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                            'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                            {post.location}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="h-[48px] px-4 text-gray-500 text-xs whitespace-nowrap truncate hidden md:table-cell" title={post.category1 || ''}>
                        {post.category1 || '-'}
                      </td>
                      <td className="h-[48px] px-4 text-gray-500 text-xs whitespace-nowrap truncate hidden lg:table-cell" title={post.category2 || ''}>
                        {post.category2 || '-'}
                      </td>
                      <td className="h-[48px] px-4 whitespace-nowrap hidden lg:table-cell">
                        {(post.metadata?.post_status === 'draft' || post.post_status === 'draft') ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                            Draft
                          </span>
                        ) : (post.metadata?.post_status === 'editing' || post.post_status === 'editing') ? (
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
                      <td className="h-[48px] px-4 text-gray-500 text-xs whitespace-nowrap truncate hidden md:table-cell">{new Date(post.date).toLocaleDateString('ko-KR')}</td>
                      <td className="h-[48px] px-4 text-gray-500 text-xs whitespace-nowrap truncate hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold text-gray-600 truncate">{Number(post.views_count ?? 0).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="h-[48px] px-4 text-gray-500 text-xs whitespace-nowrap truncate hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold text-gray-600 truncate">{Number(post.likes_count ?? 0).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="h-[48px] text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Link 
                            href={`/admin/edit/${post.slug.split('/').map(encodeURIComponent).join('/')}`}
                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 p-1.5 rounded-lg transition-colors focus:outline-none block"
                            title={`Edit ${post.title}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </Link>
                          <form action={deletePostAction.bind(null, post.slug)} className="inline" onSubmit={(e) => { if (!window.confirm(`Are you sure you want to delete '${post.title}'?`)) e.preventDefault(); }}>
                            <button type="submit" className="text-gray-400 hover:text-red-600 hover:bg-red-50/50 p-1.5 rounded-lg transition-colors focus:outline-none" title={`Delete ${post.title}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {emptyRowsCount > 0 && Array.from({ length: emptyRowsCount }).map((_, idx) => (
                    <tr key={`empty-${idx}`} className="hover:bg-transparent bg-white">
                      <td className="h-[48px] text-center overflow-hidden">
                        <div className="flex items-center justify-center h-full">
                          <input type="checkbox" disabled className="h-3.5 w-3.5 rounded-[3px] border-gray-200 text-gray-200 cursor-not-allowed opacity-0" />
                        </div>
                      </td>
                      <td className="h-[48px] px-4 font-semibold text-transparent select-none">-</td>
                      <td className="h-[48px] px-4 hidden sm:table-cell text-transparent select-none">-</td>
                      <td className="h-[48px] px-4 hidden md:table-cell text-transparent select-none">-</td>
                      <td className="h-[48px] px-4 hidden lg:table-cell text-transparent select-none">-</td>
                      <td className="h-[48px] px-4 hidden lg:table-cell text-transparent select-none">-</td>
                      <td className="h-[48px] px-4 hidden md:table-cell text-transparent select-none">-</td>
                      <td className="h-[48px] px-4 hidden lg:table-cell text-transparent select-none">-</td>
                      <td className="h-[48px] px-4 hidden lg:table-cell text-transparent select-none">-</td>
                      <td className="h-[48px] text-center text-transparent select-none">-</td>
                    </tr>
                  ))}
                </>
              ) : (
                <>
                  <tr className="hover:bg-transparent bg-white">
                    <td colSpan={10} className="h-[48px] text-center text-gray-500 align-middle">등록된 게시물이 없습니다.</td>
                  </tr>
                  {Array.from({ length: ITEMS_PER_PAGE - 1 }).map((_, idx) => (
                    <tr key={`empty-${idx}`} className="hover:bg-transparent bg-white">
                      <td className="h-[48px] text-center overflow-hidden">
                        <div className="flex items-center justify-center h-full">
                          <input type="checkbox" disabled className="h-3.5 w-3.5 rounded-[3px] border-gray-200 text-gray-200 cursor-not-allowed opacity-0" />
                        </div>
                      </td>
                      <td className="h-[48px] px-4 font-semibold text-transparent select-none">-</td>
                      <td className="h-[48px] px-4 hidden sm:table-cell text-transparent select-none">-</td>
                      <td className="h-[48px] px-4 hidden md:table-cell text-transparent select-none">-</td>
                      <td className="h-[48px] px-4 hidden lg:table-cell text-transparent select-none">-</td>
                      <td className="h-[48px] px-4 hidden lg:table-cell text-transparent select-none">-</td>
                      <td className="h-[48px] px-4 hidden md:table-cell text-transparent select-none">-</td>
                      <td className="h-[48px] px-4 hidden lg:table-cell text-transparent select-none">-</td>
                      <td className="h-[48px] px-4 hidden lg:table-cell text-transparent select-none">-</td>
                      <td className="h-[48px] text-center text-transparent select-none">-</td>
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
              Page {correctedPage} of {totalPages} ({posts.length} posts)
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={correctedPage === 1}
                onClick={() => { setCurrentPage(correctedPage - 1); setSelectedSlugs([]); }}
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
                    onClick={() => { setCurrentPage(pageNumber); setSelectedSlugs([]); }}
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
                onClick={() => { setCurrentPage(correctedPage + 1); setSelectedSlugs([]); }}
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

      {/* 4. Change Location Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-bold text-gray-900">Change Location</h3>
            <p className="mb-6 text-sm text-gray-500">
              선택한 <span className="font-semibold text-blue-600">{selectedSlugs.length}</span>개의 게시물 위치를 일괄 변경합니다.
            </p>
            
            <div className="mb-8">
              <label htmlFor="batch-location" className="mb-2 block text-sm font-medium text-gray-700">
                New Location
              </label>
              <select
                id="batch-location"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="Blog">Blog</option>
                <option value="Portfolio">Portfolio</option>
                <option value="Both">Both</option>
              </select>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isUpdating}
                className={`rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyLocation}
                disabled={isUpdating}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isUpdating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isUpdating ? 'Applying...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}