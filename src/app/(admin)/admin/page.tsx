import React from 'react';
import Link from 'next/link';
import { query } from '../../../infra/db';
import { logoutAction } from '../../../components/actions';
import PostListClient from '../../../components/PostListClient';

export default async function AdminDashboardPage({ searchParams }: { searchParams?: Promise<{ sort?: string; order?: 'asc' | 'desc' }> }) {
  const params = await searchParams;
  const sort = params?.sort || 'date';
  const order = params?.order || 'desc';

  // 안전한 정렬 파라미터 매핑 (SQL Injection 방지)
  const validSortKeys = ['title', 'location', 'category1', 'category2', 'date', 'likes_count', 'views_count', 'post_status'];
  const safeSort = validSortKeys.includes(sort) ? sort : 'date';
  const safeOrder = order === 'asc' ? 'ASC' : 'DESC';

  let orderByClause = '';
  switch (safeSort) {
    case 'title':
      orderByClause = `ORDER BY title ${safeOrder}`;
      break;
    case 'post_status':
      // Draft(1), Editing(2), Published(3) 순서로 명확하게 분리하여 정렬합니다.
      orderByClause = `ORDER BY CASE 
        WHEN post_status = 'draft' THEN 1 
        WHEN post_status = 'editing' THEN 2 
        ELSE 3 
      END ${safeOrder}`;
      break;
    case 'likes_count':
      orderByClause = `ORDER BY likes_count ${safeOrder}`;
      break;
    case 'views_count':
      orderByClause = `ORDER BY views_count ${safeOrder}`;
      break;
    case 'date':
      // 기존 매핑 로직(props.date || props.startDate || row.created_at)과 호환
      orderByClause = `ORDER BY COALESCE(properties->>'date', properties->>'startDate', created_at::text) ${safeOrder}`;
      break;
    case 'location':
    case 'category1':
    case 'category2':
      orderByClause = `ORDER BY properties->>'${safeSort}' ${safeOrder}`;
      break;
  }

  const { rows: fetchedPosts } = await query(`SELECT slug, title, properties, created_at, likes_count, views_count, post_status, draft_content FROM posts ${orderByClause}`);

  const mappedPosts = fetchedPosts.map((row) => {
    const props = row.properties || {};
    return {
      slug: row.slug,
      title: row.title || props.title || row.slug,
      location: props.location || '',
      category1: props.category1 || '',
      category2: props.category2 || '',
      date: props.date || props.startDate || row.created_at,
      likes_count: row.likes_count,
      views_count: row.views_count,
      post_status: row.post_status,
      has_draft: !!row.draft_content,
      metadata: {
        ...props,
        post_status: row.post_status,
        has_draft: !!row.draft_content,
      }
    };
  });

  const posts = mappedPosts; // DB 쿼리에서 이미 정렬되었으므로 메모리 정렬 생략

  // 통계 데이터 가져오기
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const todayString = kstNow.toISOString().split('T')[0];

  let totalVisitors = 0, totalViews = 0, totalLikes = 0;
  let todayVisitors = 0, todayViews = 0, todayLikes = 0;

  try {
    const { rows: statsRows } = await query(`
      SELECT
        (SELECT stat_value FROM site_stats WHERE stat_key = 'total_visitors') as total_visitors,
        (SELECT SUM(views_count) FROM posts) as total_views,
        (SELECT SUM(likes_count) FROM posts) as total_likes,
        (SELECT COUNT(*) FROM site_visitors WHERE visited_date = $1) as today_visitors,
        (SELECT COUNT(*) FROM views_manage WHERE DATE(viewed_at + INTERVAL '9 hours') = $1) as today_views,
        (SELECT COUNT(*) FROM likes_manage WHERE DATE(created_at + INTERVAL '9 hours') = $1) as today_likes
    `, [todayString]);
    
    if (statsRows.length > 0) {
      totalVisitors = Number(statsRows[0].total_visitors) || 0;
      totalViews = Number(statsRows[0].total_views) || 0;
      totalLikes = Number(statsRows[0].total_likes) || 0;
      todayVisitors = Number(statsRows[0].today_visitors) || 0;
      todayViews = Number(statsRows[0].today_views) || 0;
      todayLikes = Number(statsRows[0].today_likes) || 0;
    }
  } catch (err) {
    console.error('Failed to fetch detailed stats:', err);
  }

  const statCards = [
    { label: 'Total Visitors', value: totalVisitors },
    { label: 'Total Views', value: totalViews },
    { label: 'Total Likes', value: totalLikes },
    { label: 'Today Visitors', value: todayVisitors },
    { label: 'Today Views', value: todayViews },
    { label: 'Today Likes', value: todayLikes },
  ];

  return (
    <div className="mx-auto w-full max-w-[1000px] p-4 sm:p-8 font-sans">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="mt-2 text-gray-500">Welcome to the Junseo Blog admin area</p>
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

      {/* Stats Layer */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 통계 카드 1: 전체 게시물 수 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-4xl font-bold text-center text-blue-600">{posts.length}</p>
          <h2 className="mb-0 text-lg text-center font-semibold text-gray-700">Total Posts</h2>
        </div>

        {/* 통계 카드 2: 임시 저장 (Drafts) */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-4xl font-bold text-center text-yellow-500">{posts.filter(p => p.post_status === 'draft' || p.post_status === 'editing').length}</p>
          <h2 className="mb-0 text-lg text-center font-semibold text-gray-700">Drafts</h2>
        </div>
      </div>

      {/* Detailed Stats Grid (3x2) */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {statCards.map((stat, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-4xl font-bold text-center text-gray-800">{stat.value}</p>
            <h2 className="mb-0 text-lg font-semibold text-center text-gray-700">{stat.label}</h2>
          </div>
        ))}
      </div>

      {/* Management Actions Grid (3x2) */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-800">Management</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Link href="/admin/skilltree" className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
            <span className="text-lg font-semibold text-gray-700">Skill Tree</span>
          </Link>
          <Link href="/admin/property" className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
            <span className="text-lg font-semibold text-gray-700">Properties</span>
          </Link>
          <Link href="/admin/template" className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
            <span className="text-lg font-semibold text-gray-700">Templates</span>
          </Link>
          <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-gray-400">
            <span className="text-lg font-semibold">Place Holder</span>
          </div>
          <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-gray-400">
            <span className="text-lg font-semibold">Place Holder</span>
          </div>
          <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-gray-400">
            <span className="text-lg font-semibold">Place Holder</span>
          </div>
        </div>
      </div>

      {/* Action Bar and Data Grid Layer */}
      <PostListClient posts={posts} sort={sort} order={order} />
    </div>
  );
}