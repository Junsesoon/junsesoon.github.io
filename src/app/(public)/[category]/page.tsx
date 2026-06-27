import { getCategoryPosts, getDbPostBySlug } from '@/utils/posts';
import PostList from '@/components/shared/PostList';
import TOC from '@/components/blog/TOC';
import LikeButton from '@/components/shared/LikeButton';
import ViewTracker from '@/components/admin/ViewTracker';
import { getParsedMarkdown } from '@/utils/markdownCache';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/utils/auth';
import BlogStats from '@/components/blog/BlogStats';
import Link from 'next/link';
import '@/styles/atom-one-dark.css';

export const dynamic = 'force-dynamic';

async function checkIsAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('admin_auth');
    if (!authCookie?.value) return false;
    return await verifyAdminToken(authCookie.value);
  } catch {
    return false;
  }
}

function formatKoreanDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}. ${mm}. ${dd}.`;
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams?: Promise<{ mode?: string; page?: string; popPage?: string }>;
}) {
  const { category } = await params;
  const searchParamsResolved = await searchParams;
  const mode = searchParamsResolved?.mode || 'blog';
  const currentPage = parseInt(searchParamsResolved?.page || '1', 10);
  const currentPopPage = parseInt(searchParamsResolved?.popPage || '1', 10);

  // 1. 단일 세그먼트 슬러그 매칭 기법 (1-Segment Slug Fallback)
  // 카테고리명과 일치하는 슬러그의 포스트가 DB에 존재하는지 먼저 검사
  const post = await getDbPostBySlug(category);
  const isAdmin = await checkIsAdmin();

  // 일반 사용자는 'draft' 상태 포스트를 볼 수 없도록 차단 (published 또는 editing이거나, 관리자여야 함)
  const isPostVisible = post && (post.metadata.post_status === 'published' || post.metadata.post_status === 'editing' || isAdmin);

  if (post && isPostVisible) {
    // 관리자이거나 draft 상태면 최신 임시저장 내용(draft_content)을 보여줌
    const showDraft = isAdmin && (post.metadata.post_status === 'draft' || !!post.metadata.draft_content);
    const displayContent = (showDraft ? (post.metadata.draft_content || post.content) : post.content) as string;
    const displayTitle = (showDraft ? (post.metadata.draft_title || post.metadata.title) : post.metadata.title) as string;
    
    // draft_properties가 있는 경우 병합 처리
    const displayProps = showDraft && post.metadata.draft_properties
      ? { ...post.metadata, ...(post.metadata.draft_properties as any) }
      : post.metadata;

    // 포스트 상세 페이지로 렌더링
    const { html: contentHtml, headings } = await getParsedMarkdown(
      category,
      displayContent,
      displayProps.modified_at || displayProps.posted_at
    );

    const postData = displayProps;

    return (
      <main className="w-full px-4 md:px-12 py-8 pb-24 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-[15%_1fr_15%] gap-8 w-full">
          {/* Left Sidebar Spacer */}
          <aside className="hidden md:block w-full" />

          {/* Content Section */}
          <section className="min-w-0">
            <article>
              <header className="mb-6 flex min-h-40 flex-col justify-center gap-4 border-b border-gray-200 py-10">
                <h1 className="text-4xl">
                  {showDraft && (
                    <span className="mr-2 inline-block rounded bg-amber-100 text-amber-800 text-sm px-2.5 py-0.5 font-medium align-middle">
                      임시저장
                    </span>
                  )}
                  {displayTitle || category.split(/[-/]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </h1>
                
                <div className="flex items-start justify-between gap-4">
                  <div className="my-0 text-gray-600">
                    <p>
                      작성일: {formatKoreanDate(postData.posted_at) ?? '정보 없음'}
                    </p>
                    <p>
                      수정일: {formatKoreanDate(postData.modified_at) ?? '정보 없음'}
                    </p>
                  </div>
                  <LikeButton postId={post.post_id || ''} initialLikesCount={post.likes_count || 0} />
                </div>
                {postData.summary && (
                  <p className="my-0 text-lg text-gray-800">
                    {postData.summary}
                  </p>
                )}
                {postData.tags && postData.tags.length > 0 && (
                  <div className="mt-0">
                    <strong>Tags:</strong>{' '}
                    {postData.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="m-1 inline-block rounded bg-gray-100 px-2 py-1 text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </header>

              <div
                className="post-body text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />

              {/* 하단 중앙 좋아요 버튼 */}
              <div className="mt-16 mb-8 flex justify-center">
                <LikeButton postId={post.post_id || ''} initialLikesCount={post.likes_count || 0} />
              </div>
              
              {/* 백그라운드 조회수 집계 트리거 */}
              <ViewTracker postId={post.post_id || ''} />
            </article>
          </section>

          {/* Right Sidebar */}
          <div className="w-full">
            <TOC headings={headings} />
          </div>
        </div>
      </main>
    );
  }

  // 2. 일치하는 포스트가 없을 경우 기존의 카테고리 목록 페이지로 렌더링
  const posts = await getCategoryPosts(category, mode);

  // 카테고리명을 포맷팅합니다 (예: 'cs' -> 'CS', 'trouble-shotting' -> 'Trouble Shotting')
  const formattedCategoryName = category
    .split('-')
    .map((word) => word.toUpperCase())
    .join(' ');

  // Paging logic for recent posts of this category
  const postsPerPage = 5;
  const totalPostsCount = posts.length;
  const totalPages = Math.ceil(totalPostsCount / postsPerPage);
  const activePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const paginatedPosts = posts.slice(
    (activePage - 1) * postsPerPage,
    activePage * postsPerPage
  );

  // Popular posts for this category (likes_count >= 1)
  const popularCategoryPosts = [...posts]
    .filter((post) => (Number(post.likes_count) || 0) >= 1)
    .sort((a, b) => (Number(b.likes_count) || 0) - (Number(a.likes_count) || 0));

  // Paging logic for popular posts of this category
  const totalPopPostsCount = popularCategoryPosts.length;
  const totalPopPages = Math.ceil(totalPopPostsCount / postsPerPage);
  const activePopPage = Math.min(Math.max(1, currentPopPage), Math.max(1, totalPopPages));
  const paginatedPopPosts = popularCategoryPosts.slice(
    (activePopPage - 1) * postsPerPage,
    activePopPage * postsPerPage
  );

  const basePathQuery = mode !== 'blog' ? `&mode=${mode}` : '';

  return (
    <main className="w-full px-4 md:px-12 py-8 pb-24 font-sans">
      <header className="mb-12 border-b border-gray-100 pb-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">{formattedCategoryName}</h1>
        <p className="mt-3 text-xl text-slate-500">{formattedCategoryName} 관련 포스트</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[15%_1fr_15%] gap-8 w-full">
        {/* Left Sidebar */}
        <aside className="w-full">
          <BlogStats category={category} />
        </aside>

        {/* Content Section */}
        <section className="min-w-0">
          {posts.length === 0 ? (
            <p className="text-center text-lg text-gray-400 py-10 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
              게시물이 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full min-w-0">
              {/* Left Column: 최근 게시물 */}
              <div className="min-w-0 flex flex-col justify-between">
                <div>
                  <h2 className="mb-6 border-b border-gray-200 pb-2 text-2xl font-bold text-slate-800">
                    최근 게시물
                  </h2>
                  <div className="min-h-[650px]">
                    <PostList posts={paginatedPosts} theme={mode === 'portfolio' ? 'portfolio' : 'blog'} />
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2 border-t border-gray-100 pt-6">
                    {activePage > 1 ? (
                      <Link
                        href={`/${category}?page=${activePage - 1}&popPage=${activePopPage}${basePathQuery}`}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-gray-50 transition no-underline"
                        scroll={false}
                      >
                        이전
                      </Link>
                    ) : (
                      <span className="px-4 py-2 border border-gray-100 rounded-lg text-sm font-semibold text-gray-300 cursor-not-allowed">
                        이전
                      </span>
                    )}
                    <span className="text-sm text-slate-500 font-medium px-2">
                      {activePage} / {totalPages}
                    </span>
                    {activePage < totalPages ? (
                      <Link
                        href={`/${category}?page=${activePage + 1}&popPage=${activePopPage}${basePathQuery}`}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-gray-50 transition no-underline"
                        scroll={false}
                      >
                        다음
                      </Link>
                    ) : (
                      <span className="px-4 py-2 border border-gray-100 rounded-lg text-sm font-semibold text-gray-300 cursor-not-allowed">
                        다음
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: 인기 게시물 */}
              <div className="min-w-0 flex flex-col justify-between">
                <div>
                  <h2 className="mb-6 border-b border-gray-200 pb-2 text-2xl font-bold text-slate-800 flex items-center gap-2">
                    인기 게시물 <span className="text-2xl">🔥</span>
                  </h2>
                  <div className="min-h-[650px]">
                    {paginatedPopPosts.length === 0 ? (
                      <p className="text-center text-lg text-gray-400 py-10 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                        인기글이 없습니다.
                      </p>
                    ) : (
                      <PostList posts={paginatedPopPosts} theme={mode === 'portfolio' ? 'portfolio' : 'blog'} showLikes={true} />
                    )}
                  </div>
                </div>

                {totalPopPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2 border-t border-gray-100 pt-6">
                    {activePopPage > 1 ? (
                      <Link
                        href={`/${category}?page=${activePage}&popPage=${activePopPage - 1}${basePathQuery}`}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-gray-50 transition no-underline"
                        scroll={false}
                      >
                        이전
                      </Link>
                    ) : (
                      <span className="px-4 py-2 border border-gray-100 rounded-lg text-sm font-semibold text-gray-300 cursor-not-allowed">
                        이전
                      </span>
                    )}
                    <span className="text-sm text-slate-500 font-medium px-2">
                      {activePopPage} / {totalPopPages}
                    </span>
                    {activePopPage < totalPopPages ? (
                      <Link
                        href={`/${category}?page=${activePage}&popPage=${activePopPage + 1}${basePathQuery}`}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-gray-50 transition no-underline"
                        scroll={false}
                      >
                        다음
                      </Link>
                    ) : (
                      <span className="px-4 py-2 border border-gray-100 rounded-lg text-sm font-semibold text-gray-300 cursor-not-allowed">
                        다음
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right Sidebar */}
        <aside className="hidden md:block w-full">
          {/* Reserved space for right sidebar */}
        </aside>
      </div>
    </main>
  );
}
