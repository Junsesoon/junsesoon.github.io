import React from 'react';
import { getAllPosts } from '../../utils/posts';
import { query } from '../../infra/neon';
import BlogStatsClient from './BlogStatsClient';

interface BlogStatsProps {
  totalPosts?: number;
  totalLikes?: number;
  totalSkills?: number;
  totalVisitors?: number;
  layout?: 'grid' | 'sidebar';
}

export default async function BlogStats({
  totalPosts,
  totalLikes,
  totalSkills,
  totalVisitors,
  layout = 'sidebar',
}: BlogStatsProps) {
  // If values are not provided as props, fetch them internally (on the server)
  let resolvedPosts = totalPosts;
  let resolvedLikes = totalLikes;
  let resolvedSkills = totalSkills;
  let resolvedVisitors = totalVisitors;

  const needsFetch =
    resolvedPosts === undefined ||
    resolvedLikes === undefined ||
    resolvedVisitors === undefined;

  if (needsFetch) {
    const posts = await getAllPosts('blog');
    if (resolvedPosts === undefined) resolvedPosts = posts.length;
    if (resolvedLikes === undefined) {
      resolvedLikes = posts.reduce((sum: number, post: any) => sum + (Number(post.likes_count) || 0), 0);
    }
    if (resolvedVisitors === undefined) {
      resolvedVisitors = posts.reduce((sum: number, post: any) => sum + (Number(post.views_count) || 0), 0);
    }
  }

  if (resolvedSkills === undefined) {
    const { rows } = await query('SELECT COUNT(*) as count FROM skilltree_posts');
    resolvedSkills = parseInt(rows[0].count, 10);
  }

  return (
    <BlogStatsClient
      totalPosts={resolvedPosts}
      totalLikes={resolvedLikes}
      totalSkills={resolvedSkills}
      totalVisitors={resolvedVisitors}
      layout={layout}
    />
  );
}