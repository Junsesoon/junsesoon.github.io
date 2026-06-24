import { getCategoryPosts, getDbPostBySlug } from '../../../../utils/posts';
import PostList from '../../../../components/PostList';
import TOC from '../../../../components/TOC';
import LikeButton from '../../../../components/LikeButton';
import ViewTracker from '../../../../components/ViewTracker';
import { getParsedMarkdown } from '../../../../utils/markdownCache';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/utils/auth';
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

export default async function PortfolioCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const resolvedParams = await params;
  const { category } = resolvedParams;
  const isAdmin = await checkIsAdmin();

  // 포트폴리오의 1-segment (즉 /portfolio/slug 형식) 매칭
  const slug = `portfolio/${category}`;
  const post = await getDbPostBySlug(slug);

  // 일반 사용자는 'draft' 상태 포스트를 볼 수 없도록 차단 (보호된 라우트지만 이중 안전 장치)
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

    const { html: contentHtml, headings } = await getParsedMarkdown(
      slug,
      displayContent,
      displayProps.enddate || displayProps.startdate
    );

    const postData = displayProps;

    return (
      <div className="mx-auto flex flex-col lg:flex-row max-w-6xl gap-8 p-8 font-sans">
        <main className="min-w-0 flex-1 ml-0">
          <article>
            <header className="mb-6 flex min-h-40 flex-col justify-center gap-4 border-b border-gray-200 py-10">
              <h1 className="text-4xl">
                {showDraft && (
                  <span className="mr-2 inline-block rounded bg-amber-100 text-amber-800 text-sm px-2.5 py-0.5 font-medium align-middle">
                    임시저장 보기
                  </span>
                )}
                {displayTitle || category.split(/[-/]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </h1>
              
              <div className="flex items-start justify-between gap-4">
                <div className="my-0 text-gray-600">
                  <p>
                    작성일: {formatKoreanDate(postData.startDate) ?? '정보 없음'}
                  </p>
                  <p>
                    수정일: {formatKoreanDate(postData.endDate) ?? '정보 없음'}
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
        </main>

        <TOC headings={headings} />
      </div>
    );
  }

  // 2. 포스트가 없다면 기존의 카테고리 목록 렌더링
  const posts = await getCategoryPosts(category, 'portfolio');

  // 카테고리명을 포맷팅합니다 (예: 'myskill' -> 'MYSKILL', 'trouble-shooting' -> 'TROUBLE SHOOTING')
  const formattedCategoryName = category
    .split('-')
    .map((word) => word.toUpperCase())
    .join(' ');

  return (
    <main className="mx-auto max-w-3xl p-8 font-sans">
      <header className="mb-12 flex min-h-40 flex-col justify-center gap-4 border-b border-gray-200 py-10">
        <h1 className="mb-2 text-4xl">{formattedCategoryName}</h1>
        <p className="text-base text-gray-600">{formattedCategoryName} 관련 포트폴리오</p>
      </header>
      <section>
        {posts.length > 0 && (
          <h2 className="mb-6 border-b border-gray-200 pb-2 text-2xl">
            Posts ({posts.length})
          </h2>
        )}
        <PostList posts={posts} theme="portfolio" />
      </section>
    </main>
  );
}