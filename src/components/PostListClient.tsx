'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { deletePostAction, batchUpdateLocationAction } from './actions';

interface Post {
  slug: string;
  title: string;
  location: string;
  category1: string;
  category2: string;
  date: string | number | Date;
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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSlugs(posts.map((post) => post.slug));
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

  const isAllSelected = posts.length > 0 && selectedSlugs.length === posts.length;
  const isSomeSelected = selectedSlugs.length > 0;

  const renderHeader = (key: string, label: string) => {
    const isActive = sort === key;
    const nextOrder = isActive && order === 'asc' ? 'desc' : 'asc';
    return (
      <th scope="col" className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
        <Link href={`/admin?sort=${key}&order=${nextOrder}`} className="group inline-flex items-center gap-1 transition-colors hover:text-blue-600">
          {label}
          <span className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-300 group-hover:text-blue-400'}`}>
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
      {/* 2. Action Bar Layer */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Manage Posts</h2>
        <div className="flex gap-3">
          <button 
            type="button" 
            disabled={!isSomeSelected} 
            onClick={() => setIsModalOpen(true)}
            className={`inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isSomeSelected 
                ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-200' 
                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Change Location {isSomeSelected && `(${selectedSlugs.length})`}
          </button>
          <Link href="/admin/property" className="inline-flex items-center justify-center rounded-md bg-white border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2">
            Manage Properties
          </Link>
          <Link href="/admin/template" className="inline-flex items-center justify-center rounded-md bg-white border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2">
            Manage Templates
          </Link>
          <Link href="/admin/write" className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            + Create New Post
          </Link>
        </div>
      </div>

      {/* 3. Data Grid Layer */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 w-10 text-center">
                <input 
                  type="checkbox" 
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                />
              </th>
              {renderHeader('title', 'Title')}
              {renderHeader('location', 'Location')}
              {renderHeader('category1', 'Cat1')}
              {renderHeader('category2', 'Cat2')}
              <th scope="col" className="px-6 py-4 font-semibold text-gray-900">Status</th>
              {renderHeader('date', 'Date')}
              <th scope="col" className="px-6 py-4 text-right font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {posts.length > 0 ? (
              posts.map((post) => (
                <tr key={post.slug} className={`transition-colors hover:bg-gray-50 ${selectedSlugs.includes(post.slug) ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedSlugs.includes(post.slug)}
                      onChange={(e) => handleSelectOne(e, post.slug)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
                    <Link 
                      href={`/${post.slug}`}
                      className="block truncate text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                      title={post.title}
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {post.location ? (
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        post.location === 'Portfolio' ? 'bg-red-100 text-red-800' :
                        post.location === 'Both' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {post.location}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-[150px] break-words" title={post.category1 || ''}>
                    {post.category1 || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-[150px] break-words" title={post.category2 || ''}>
                    {post.category2 || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Published</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(post.date).toLocaleDateString('ko-KR')}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/edit/${post.slug}`} className="mr-4 font-medium text-blue-600 transition-colors hover:text-blue-800">Edit</Link>
                    <form action={deletePostAction.bind(null, post.slug)} className="inline">
                      <button type="submit" className="font-medium text-red-600 transition-colors hover:text-red-800">Delete</button>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">등록된 게시물이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 text-center text-sm text-gray-500">
          End of list
        </div>
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