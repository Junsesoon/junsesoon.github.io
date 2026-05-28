import React from 'react';
import Link from 'next/link';
import { query } from '../../../infra/db';
import { deletePostAction, logoutAction } from '../../../components/actions';

export default async function AdminDashboardPage() {
  const { rows: posts } = await query('SELECT slug, title, COALESCE(posted_at, created_at) AS date FROM posts ORDER BY created_at DESC');

  return (
    <div className="mx-auto max-w-7xl p-8 font-sans">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="mt-2 text-gray-500">Welcome to the Junseo Blog admin area.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            ← Back to Home
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="inline-flex items-center justify-center rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100">
              Logout
            </button>
          </form>
        </div>
      </header>

      {/* 1. Stats Layer */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 통계 카드 1: 전체 게시물 수 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-700">Total Posts</h2>
          <p className="text-4xl font-bold text-blue-600">{posts.length}</p>
        </div>

        {/* 통계 카드 2: 임시 저장 (Drafts) */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-700">Drafts</h2>
          <p className="text-4xl font-bold text-yellow-500">0</p>
        </div>
      </div>

      {/* 2. Action Bar Layer */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Manage Posts</h2>
        <Link href="/admin/write" className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          + Create New Post
        </Link>
      </div>

      {/* 3. Data Grid Layer */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold text-gray-900">Title</th>
              <th scope="col" className="px-6 py-4 font-semibold text-gray-900">Status</th>
              <th scope="col" className="px-6 py-4 font-semibold text-gray-900">Date</th>
              <th scope="col" className="px-6 py-4 text-right font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {posts.length > 0 ? (
              posts.map((post) => (
                <tr key={post.slug} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{post.title}</td>
                  <td className="px-6 py-4">
                    {/* 임시저장(Draft) 기능이 구현되기 전이므로 일괄 Published 상태로 표시합니다 */}
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
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">등록된 게시물이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 text-center text-sm text-gray-500">
          End of list
        </div>
      </div>
    </div>
  );
}