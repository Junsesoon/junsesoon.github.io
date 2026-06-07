import React from 'react';
import Link from 'next/link';
import { query } from '../../../infra/db';
import { logoutAction } from '../../../components/actions';
import PostListClient from '../../../components/PostListClient';

export default async function AdminDashboardPage({ searchParams }: { searchParams?: Promise<{ sort?: string; order?: 'asc' | 'desc' }> }) {
  const params = await searchParams;
  const sort = params?.sort || 'date';
  const order = params?.order || 'desc';

  // 변경된 단일 테이블 스키마에 맞게 properties(JSONB) 컬럼을 조회합니다.
  const { rows: fetchedPosts } = await query('SELECT slug, properties, created_at, likes_count FROM posts ORDER BY created_at DESC');

  const mappedPosts = fetchedPosts.map((row) => {
    const props = row.properties || {};
    return {
      slug: row.slug,
      title: props.title || row.slug,
      location: props.location || '',
      category1: props.category1 || '',
      category2: props.category2 || '',
      date: props.date || props.startDate || row.created_at,
      likes_count: row.likes_count,
    };
  });

  const posts = mappedPosts.sort((a, b) => {
    let valA = a[sort as keyof typeof a] ?? '';
    let valB = b[sort as keyof typeof b] ?? '';

    if (sort === 'date') {
      valA = valA ? new Date(valA).getTime() : 0;
      valB = valB ? new Date(valB).getTime() : 0;
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });

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
    <div className="mx-auto max-w-7xl p-8 font-sans">
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

      {/* Detailed Stats Grid (3x2) */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {statCards.map((stat, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-gray-700">{stat.label}</h2>
            <p className="text-4xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 2 & 3. Action Bar and Data Grid Layer */}
      <PostListClient posts={posts} sort={sort} order={order} />
    </div>
  );
}