import React from 'react';
import { getAllPosts } from '../../utils/posts';
import BlogStatsClient from './BlogStatsClient';

interface BlogStatsProps {
  category?: string;
  title?: string;
  totalPosts?: number;
  totalLikes?: number;
  totalSkills?: number;
  totalVisitors?: number;
  layout?: 'grid' | 'sidebar';
}

export default async function BlogStats({
  category,
  title,
  totalPosts,
  totalLikes,
  totalSkills,
  totalVisitors,
  layout = 'sidebar',
}: BlogStatsProps) {
  // If values are not provided as props, fetch them internally (on the server)
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
      layout={layout}
    />
  );
}