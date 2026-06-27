import React from 'react';
import { getAllPosts } from '../../utils/posts';
import PostList, { MinimalPost } from '../shared/PostList';

interface HomeContentProps {
  title?: string;
  theme?: 'blog' | 'portfolio';
  posts?: MinimalPost[];
}

export default async function HomeContent({
  title = '최신 글',
  theme = 'blog',
  posts,
}: HomeContentProps) {
  // If posts are not provided, fetch them on the server
  const resolvedPosts = posts ?? (await getAllPosts(theme));

  return (
    <section className="min-w-0">
      <h2 className="mb-6 border-b border-gray-200 pb-2 text-3xl font-bold text-slate-800">
        {title}
      </h2>
      <PostList posts={resolvedPosts} theme={theme} />
    </section>
  );
}
