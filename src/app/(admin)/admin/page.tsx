import React from 'react';
import Link from 'next/link';
import { DEFAULT_CONTACT_EMAIL } from '@/constants';
import { query as neonQuery } from '../../../infra/neon';
import { query as tursoQuery } from '../../../infra/turso';
import { logoutAction } from '../../../actions/actions';
import PostListClient from '../../../components/admin/PostListClient';
import AdminClock from '../../../components/admin/AdminClock';
import BackButton from '../../../components/admin/BackButton';
import AdminSidebar from '../../../components/admin/AdminSidebar';

function getStatIcon(label: string) {
  const iconClass = "h-5 w-5 text-gray-400";
  switch (label) {
    case 'Total Posts':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 4a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V9z" />
        </svg>
      );
    case 'Drafts':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case 'Total Visitors':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'Today Visitors':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'Total Views':
    case 'Today Views':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      );
    case 'Total Likes':
    case 'Today Likes':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    default:
      return null;
  }
}

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
      // 기존 매핑 로직(props.posted_at || props.date || props.startDate || row.created_at)과 호환
      orderByClause = `ORDER BY COALESCE(properties->>'posted_at', properties->>'postedAt', properties->>'date', properties->>'startDate', created_at::text) ${safeOrder}`;
      break;
    case 'location':
    case 'category1':
    case 'category2':
      orderByClause = `ORDER BY properties->>'${safeSort}' ${safeOrder}`;
      break;
  }

  const { rows: fetchedPosts } = await neonQuery(`SELECT slug, title, properties, created_at, likes_count, views_count, post_status, draft_content FROM posts ${orderByClause}`);

  const mappedPosts = fetchedPosts.map((row) => {
    const props = row.properties || {};
    return {
      slug: row.slug,
      title: row.title || props.title || row.slug,
      location: props.location || '',
      category1: props.category1 || '',
      category2: props.category2 || '',
      date: props.posted_at || props.postedAt || props.date || props.startDate || row.created_at,
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
    // 1. Neon DB(게시물 관련 통계) 조회
    const neonStats = await neonQuery(`
      SELECT
        (SELECT COALESCE(SUM(views_count), 0) FROM posts) as total_views,
        (SELECT COALESCE(SUM(likes_count), 0) FROM posts) as total_likes
    `);
    if (neonStats.rows.length > 0) {
      totalViews = Number(neonStats.rows[0].total_views) || 0;
      totalLikes = Number(neonStats.rows[0].total_likes) || 0;
    }

    // 2. Turso DB(접속/로그 관련 통계) 조회
    const totalVisitorsRes = await tursoQuery(`SELECT stat_value FROM site_stats WHERE stat_key = 'total_visitors'`);
    if (totalVisitorsRes.rows && totalVisitorsRes.rows.length > 0) {
      totalVisitors = Number(totalVisitorsRes.rows[0].stat_value) || 0;
    }

    const todayVisitorsRes = await tursoQuery(`SELECT COUNT(*) as count FROM visitors_manage WHERE visited_date = ?`, [todayString]);
    if (todayVisitorsRes.rows && todayVisitorsRes.rows.length > 0) {
      todayVisitors = Number(todayVisitorsRes.rows[0].count) || 0;
    }

    const todayViewsRes = await tursoQuery(`SELECT COUNT(*) as count FROM views_manage WHERE date(viewed_at, '+9 hours') = ?`, [todayString]);
    if (todayViewsRes.rows && todayViewsRes.rows.length > 0) {
      todayViews = Number(todayViewsRes.rows[0].count) || 0;
    }

    const todayLikesRes = await tursoQuery(`SELECT COUNT(*) as count FROM likes_manage WHERE date(created_at, '+9 hours') = ?`, [todayString]);
    if (todayLikesRes.rows && todayLikesRes.rows.length > 0) {
      todayLikes = Number(todayLikesRes.rows[0].count) || 0;
    }
  } catch (err) {
    console.error('Failed to fetch detailed stats from Neon/Turso:', err);
  }

  const statCards = [
    { label: 'Total Posts', value: posts.length },
    { label: 'Drafts', value: posts.filter(p => p.post_status === 'draft' || p.post_status === 'editing').length },
    { label: 'Total Visitors', value: totalVisitors },
    { label: 'Today Visitors', value: todayVisitors },
    { label: 'Total Views', value: totalViews },
    { label: 'Today Views', value: todayViews },
    { label: 'Total Likes', value: totalLikes },
    { label: 'Today Likes', value: todayLikes },
  ];

  return (
    <div className="flex min-h-screen w-full bg-gray-50/50 font-sans">
      <AdminSidebar activePath="overview" />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-none w-full overflow-y-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200 pb-4 gap-4">
          <AdminClock title="Overview" />
          <div className="flex items-center gap-3">
            <BackButton />
            <form action={logoutAction}>
              <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3.5 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-100/80">
                Logout
              </button>
            </form>
          </div>
        </header>

        {/* Renewed Full-Width Stacked Layout */}
        <div className="flex flex-col gap-8">
          
          {/* Top Section: Blog Stats Grid (2x4 on mobile, 4x2 on desktop/tablet) */}
          <div className="w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map((stat, idx) => (
                <div key={idx} className="rounded-2xl border border-gray-200/60 bg-white/80 p-4 shadow-sm backdrop-blur-md flex flex-col justify-between min-h-[96px] transition-all hover:shadow-md hover:border-gray-300/80">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">{stat.label}</span>
                    {getStatIcon(stat.label)}
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 mt-2 tracking-tight tabular-nums">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section: Post List (Full Width) */}
          <div className="w-full">
            <PostListClient posts={posts} sort={sort} order={order} />
          </div>

        </div>
      </main>
    </div>
  );
}