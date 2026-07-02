import React from 'react';
import Link from 'next/link';
import { getAllPosts } from '../../utils/posts';
import PostList, { MinimalPost } from '../shared/PostList';

interface HomeContentProps {
  theme?: 'blog' | 'portfolio';
  posts?: MinimalPost[];
  currentPage?: number;
  currentPopPage?: number;
}

export default async function HomeContent({
  theme = 'blog',
  posts,
  currentPage = 1,
  currentPopPage = 1,
}: HomeContentProps) {
  // If posts are not provided, fetch them on the server
  const resolvedPosts = posts ?? (await getAllPosts(theme));

  // Paging logic for recent posts
  const postsPerPage = 5;
  const totalPostsCount = resolvedPosts.length;
  const totalPages = Math.ceil(totalPostsCount / postsPerPage);

  // Cap page number between 1 and totalPages (or 1 if totalPages is 0)
  const activePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  const paginatedPosts = resolvedPosts.slice(
    (activePage - 1) * postsPerPage,
    activePage * postsPerPage
  );

  // Filter by likes_count >= 1, sort by likes_count descending
  const allPopularPosts = [...resolvedPosts]
    .filter((post) => (Number(post.likes_count) || 0) >= 1)
    .sort((a, b) => (Number(b.likes_count) || 0) - (Number(a.likes_count) || 0));

  // Paging logic for popular posts
  const popPostsPerPage = 5;
  const totalPopPostsCount = allPopularPosts.length;
  const totalPopPages = Math.ceil(totalPopPostsCount / popPostsPerPage);

  // Cap popular page number
  const activePopPage = Math.min(Math.max(1, currentPopPage), Math.max(1, totalPopPages));

  const paginatedPopPosts = allPopularPosts.slice(
    (activePopPage - 1) * popPostsPerPage,
    activePopPage * popPostsPerPage
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full min-w-0">
      {/* Left Column: 최근 게시물 */}
      <section className="min-w-0 flex flex-col justify-between">
        <div>
          <h2 className="mb-6 border-b border-theme-border pb-2 text-3xl font-bold text-theme-text-title">
            최근 게시물
          </h2>
          <div className="min-h-[650px]">
            <PostList posts={paginatedPosts} theme={theme} />
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2 border-t border-theme-border pt-6">
            {activePage > 1 ? (
              <Link
                href={`/?page=${activePage - 1}&popPage=${activePopPage}`}
                className="px-4 py-2 border border-theme-border rounded-lg text-sm font-semibold text-theme-text-body hover:bg-theme-bg-hover transition no-underline"
                scroll={false}
              >
                이전
              </Link>
            ) : (
              <span className="px-4 py-2 border border-theme-border opacity-40 rounded-lg text-sm font-semibold text-theme-text-muted cursor-not-allowed">
                이전
              </span>
            )}
            <span className="text-sm text-theme-text-muted font-medium px-2">
              {activePage} / {totalPages}
            </span>
            {activePage < totalPages ? (
              <Link
                href={`/?page=${activePage + 1}&popPage=${activePopPage}`}
                className="px-4 py-2 border border-theme-border rounded-lg text-sm font-semibold text-theme-text-body hover:bg-theme-bg-hover transition no-underline"
                scroll={false}
              >
                다음
              </Link>
            ) : (
              <span className="px-4 py-2 border border-theme-border opacity-40 rounded-lg text-sm font-semibold text-theme-text-muted cursor-not-allowed">
                다음
              </span>
            )}
          </div>
        )}
      </section>

      {/* Right Column: 인기 게시물 */}
      <section className="min-w-0 flex flex-col justify-between">
        <div>
          <h2 className="mb-6 border-b border-theme-border pb-2 text-3xl font-bold text-theme-text-title flex items-center gap-2">
            인기 게시물 <span className="text-2xl">🔥</span>
          </h2>
          <div className="min-h-[650px]">
            {paginatedPopPosts.length === 0 ? (
              <p className="text-center text-lg text-theme-text-muted py-10 border-2 border-dashed border-theme-border rounded-xl bg-theme-bg-hover">
                인기글이 없습니다.
              </p>
            ) : (
              <PostList posts={paginatedPopPosts} theme={theme} showLikes={true} />
            )}
          </div>
        </div>

        {totalPopPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2 border-t border-theme-border pt-6">
            {activePopPage > 1 ? (
              <Link
                href={`/?page=${activePage}&popPage=${activePopPage - 1}`}
                className="px-4 py-2 border border-theme-border rounded-lg text-sm font-semibold text-theme-text-body hover:bg-theme-bg-hover transition no-underline"
                scroll={false}
              >
                이전
              </Link>
            ) : (
              <span className="px-4 py-2 border border-theme-border opacity-40 rounded-lg text-sm font-semibold text-theme-text-muted cursor-not-allowed">
                이전
              </span>
            )}
            <span className="text-sm text-theme-text-muted font-medium px-2">
              {activePopPage} / {totalPopPages}
            </span>
            {activePopPage < totalPopPages ? (
              <Link
                href={`/?page=${activePage}&popPage=${activePopPage + 1}`}
                className="px-4 py-2 border border-theme-border rounded-lg text-sm font-semibold text-theme-text-body hover:bg-theme-bg-hover transition no-underline"
                scroll={false}
              >
                다음
              </Link>
            ) : (
              <span className="px-4 py-2 border border-theme-border opacity-40 rounded-lg text-sm font-semibold text-theme-text-muted cursor-not-allowed">
                다음
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
