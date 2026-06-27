import Link from 'next/link';
import React from 'react';

export interface MinimalPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string | number | Date;
  [key: string]: any; // 다른 추가 속성 허용
}

interface PostListProps {
  posts: MinimalPost[];
  theme?: 'blog' | 'portfolio';
}

export default function PostList({ posts, theme = 'blog' }: PostListProps) {
  const titleColor = theme === 'portfolio' ? 'text-red-800' : 'text-blue-600';
  const basePath = theme === 'portfolio' ? '/portfolio' : '';

  if (!posts || posts.length === 0) {
    return (
      <p className="text-center text-lg text-gray-400 py-10">
        게시물이 없습니다.
      </p>
    );
  }

  return (
    <ul className="list-none p-0">
      {posts.map((post) => (
        <li key={post.slug} className="mb-10">
          <Link
            href={`${basePath}/${post.slug.split('/').map(encodeURIComponent).join('/')}`}
            className="no-underline group"
          >
            <h3 className={`mb-2 text-2xl transition-colors group-hover:opacity-80 ${titleColor}`}>
              {post.title}
            </h3>
            <p className="mb-2 text-1xl text-gray-800">{post.excerpt}</p>
            <p className="text-sm text-gray-500">
              {new Date(post.date).toLocaleDateString('ko-KR')}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
