import Link from 'next/link';
import React from 'react';

export interface MinimalPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string | number | Date;
  likes_count?: number;
  views_count?: number;
  [key: string]: any; // 다른 추가 속성 허용
}

interface PostListProps {
  posts: MinimalPost[];
  theme?: 'blog' | 'portfolio';
  showLikes?: boolean;
  showViews?: boolean;
}

export default function PostList({ posts, theme = 'blog', showLikes = false, showViews = true }: PostListProps) {
  const titleColor = theme === 'portfolio' ? 'text-red-800' : 'text-theme-accent';
  const heartColor = theme === 'portfolio' ? 'text-red-800' : 'text-theme-accent';
  const eyeColor = theme === 'portfolio' ? 'text-red-800' : 'text-theme-accent';
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
            <p className="mb-2 text-1xl text-theme-text-body">{post.excerpt}</p>
            <div className="flex items-center gap-3 text-sm text-theme-text-muted">
              <span>{new Date(post.date).toLocaleDateString('ko-KR')}</span>
              {showViews && post.views_count !== undefined && (
                <span className={`flex items-center gap-1 ${eyeColor} font-semibold`} title="조회수">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                  {post.views_count}
                </span>
              )}
              {showLikes && post.likes_count !== undefined && (
                <span className={`flex items-center gap-1 ${heartColor} font-semibold`} title="좋아요">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  {post.likes_count}
                </span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
