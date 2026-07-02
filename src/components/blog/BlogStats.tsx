import React from 'react';
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

export default function BlogStats({
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
  const resolvedTitle = title || (category
    ? `${category.split('-').map(word => word.toUpperCase()).join(' ')} Stats`
    : 'Blog Stats');

  return (
    <BlogStatsClient
      title={resolvedTitle}
      category={category}
      layout={layout}
      totalPosts={totalPosts}
      totalLikes={totalLikes}
      totalSkills={totalSkills}
      totalVisitors={totalVisitors}
      totalUniqueVisitors={totalUniqueVisitors}
      todayVisitors={todayVisitors}
    />
  );
}