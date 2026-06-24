import TOC from '../../../../components/TOC';
import LikeButton from '../../../../components/LikeButton';
import ViewTracker from '../../../../components/ViewTracker';
import { type TocHeading } from '../../../../utils/parser';
import { getDbPostBySlug, getAllPosts } from '../../../../utils/posts';
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

export async function generateStaticParams() {
  const posts = await getAllPosts('all');
  return posts.map((post) => {
    const parts = post.slug.split('/');
    return {
      category: parts[0] || 'uncategorized',
      id: parts.length > 1 ? parts.slice(1) : [parts[0]],
    };
  });
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

export default async function PostPage({
  params,
}: {
  params: Promise<{ category: string; id: string | string[] }>;
}) {
  const { category, id } = await params;
  const idString = Array.isArray(id) ? id.join('/') : id;
  const slug = decodeURIComponent(`${category}/${idString}`);
  const post = await getDbPostBySlug(slug);
  const isAdmin = await checkIsAdmin();

  // 일반 사용자는 'draft' 상태 포스트를 볼 수 없도록 차단 (published 또는 editing이거나, 관리자여야 함)
  const isPostVisible = post && (post.metadata.post_status === 'published' || post.metadata.post_status === 'editing' || isAdmin);

  console.log('PostPage debug:', { category, idString, slug, postExists: !!post, postStatus: post?.metadata?.post_status, isPostVisible });

  if (!post || !isPostVisible) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1>Post not found</h1>
        <p>The requested post could not be found.</p>
      </main>
    );
  }

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
                  임시저장
                </span>
              )}
              {displayTitle || idString.split(/[-/]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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
          
          {/* 백그라운드 조회수 집계 트리커 */}
          <ViewTracker postId={post.post_id || ''} />
        </article>
      </main>

      <TOC headings={headings} />
    </div>
  );
}
