import React from 'react';
import { getAllPosts } from '../../utils/posts';
import { query as tursoQuery } from '../../infra/turso';
import BlogStatsClient from './BlogStatsClient';

interface BlogStatsProps {
  category?: string;
  title?: string;
  totalPosts?: number;
  totalLikes?: number;
  totalSkills?: number;
  totalVisitors?: number;
  totalUniqueVisitors?: number;
  todayVisitors?: number;
  layout?: 'grid' | 'sidebar';
}

export default async function BlogStats({
  category,
  title,
  totalPosts,
  totalLikes,
  totalSkills,
  totalVisitors,
  totalUniqueVisitors,
  todayVisitors,
  layout = 'sidebar',
}: BlogStatsProps) {
  // 1. Resolve post-related metrics (Posts, views/views_count, likes)
  let resolvedPosts = totalPosts;
  let resolvedLikes = totalLikes;
  let resolvedVisitors = totalVisitors;

  const needsFetch =
    resolvedPosts === undefined ||
    resolvedLikes === undefined ||
    resolvedVisitors === undefined;

  if (needsFetch) {
    const posts = await getAllPosts('blog');
    const filteredPosts = category
      ? posts.filter((post) => {
          const target = category.toLowerCase();
          const matchCategory = (cat: string | string[] | undefined | null) => {
            if (!cat) return false;
            if (Array.isArray(cat)) {
              return cat.some(c => c.toLowerCase() === target);
            }
            return cat.toLowerCase() === target;
          };
          return (
            matchCategory(post.category1) ||
            matchCategory(post.category2) ||
            matchCategory(post.metadata?.category3) ||
            matchCategory(post.metadata?.category4)
          );
        })
      : posts;

    if (resolvedPosts === undefined) resolvedPosts = filteredPosts.length;
    if (resolvedLikes === undefined) {
      resolvedLikes = filteredPosts.reduce((sum: number, post: any) => sum + (Number(post.likes_count) || 0), 0);
    }
    if (resolvedVisitors === undefined) {
      resolvedVisitors = filteredPosts.reduce((sum: number, post: any) => sum + (Number(post.views_count) || 0), 0);
    }
  }

  // 2. Query Turso Database for Site-wide Visitors (Total Unique Visitors & Today's Visitors)
  let resolvedTotalUniqueVisitors = totalUniqueVisitors;
  let resolvedTodayVisitors = todayVisitors;

  if (resolvedTotalUniqueVisitors === undefined || resolvedTodayVisitors === undefined) {
    try {
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstNow = new Date(now.getTime() + kstOffset);
      const todayString = kstNow.toISOString().split('T')[0];

      if (resolvedTotalUniqueVisitors === undefined) {
        const statsResult = await tursoQuery("SELECT stat_value FROM site_stats WHERE stat_key = 'total_visitors'");
        if (statsResult.rows && statsResult.rows.length > 0) {
          resolvedTotalUniqueVisitors = Number(statsResult.rows[0].stat_value);
        } else {
          resolvedTotalUniqueVisitors = 0;
        }
      }

      if (resolvedTodayVisitors === undefined) {
        const todayResult = await tursoQuery(
          "SELECT COUNT(DISTINCT session_id) as today_count FROM visitors_manage WHERE visited_date = ?",
          [todayString]
        );
        if (todayResult.rows && todayResult.rows.length > 0) {
          resolvedTodayVisitors = Number(todayResult.rows[0].today_count);
        } else {
          resolvedTodayVisitors = 0;
        }
      }
    } catch (e) {
      console.error('Failed to fetch site visitor metrics in BlogStats:', e);
      if (resolvedTotalUniqueVisitors === undefined) resolvedTotalUniqueVisitors = 0;
      if (resolvedTodayVisitors === undefined) resolvedTodayVisitors = 0;
    }
  }

  const resolvedTitle = title || (category
    ? `${category.split('-').map(word => word.toUpperCase()).join(' ')} Stats`
    : 'Blog Stats');

  return (
    <BlogStatsClient
      title={resolvedTitle}
      totalPosts={resolvedPosts}
      totalLikes={resolvedLikes}
      totalSkills={totalSkills}
      totalVisitors={resolvedVisitors}
      totalUniqueVisitors={resolvedTotalUniqueVisitors}
      todayVisitors={resolvedTodayVisitors}
      layout={layout}
    />
  );
}