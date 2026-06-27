import React from 'react';
import Link from 'next/link';
import { DEFAULT_CONTACT_EMAIL } from '@/constants';
import { query as neonQuery } from '../../../infra/neon';
import { query as tursoQuery } from '../../../infra/turso';
import { logoutAction } from '../../../actions/actions';
import PostListClient from '../../../components/admin/PostListClient';
import AdminClock from '../../../components/admin/AdminClock';
import BackButton from '../../../components/admin/BackButton';

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
      {/* Apple-style Sidebar (Sample UI) */}
      <aside className="w-64 border-r border-gray-200 bg-white/80 p-6 backdrop-blur-md flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Title */}
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              J
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 leading-none">Junseo Admin</h2>
              <span className="text-xs text-gray-400">System Dashboard</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Workspace</p>
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50/50 rounded-lg transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
              Overview
            </Link>
            <Link
              href="/admin/about"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 rounded-lg transition-colors no-underline"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              About
            </Link>
            <Link
              href="/admin/skilltree"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 rounded-lg transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Skill Tree
            </Link>
            <Link
              href="/admin/property"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 rounded-lg transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Properties
            </Link>
            <Link
              href="/admin/template"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 rounded-lg transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Templates
            </Link>
            <Link
              href="/admin/visitor"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 rounded-lg transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Visitor Logs
            </Link>
            <Link
              href="/admin/view-logs"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 rounded-lg transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              View Logs
            </Link>
            
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 pt-6 mb-2">Metrics (To be added)</p>
            <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed rounded-lg">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed rounded-lg">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </div>
          </nav>
        </div>

        {/* User profile */}
        <div className="border-t border-gray-200 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
              JS
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 leading-none">Junseo (Admin)</p>
              <span className="text-[10px] text-gray-400">{DEFAULT_CONTACT_EMAIL}</span>
            </div>
          </div>
        </div>
      </aside>

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