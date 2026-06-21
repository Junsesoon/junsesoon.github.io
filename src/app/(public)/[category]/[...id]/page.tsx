import TOC from '../../../../components/TOC';
import LikeButton from '../../../../components/LikeButton';
import ViewTracker from '../../../../components/ViewTracker';
import { type TocHeading } from '../../../../utils/parser';
import { getDbPostBySlug, getAllPosts } from '../../../../utils/posts';
import { getParsedMarkdown } from '../../../../utils/markdownCache';
import '@/styles/atom-one-dark.css';

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
  const slug = `${category}/${idString}`;
  const post = await getDbPostBySlug(slug);

  if (!post) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1>Post not found</h1>
        <p>The requested post could not be found.</p>
      </main>
    );
  }

  const { html: contentHtml, headings } = await getParsedMarkdown(
    slug,
    post.content,
    post.metadata.enddate || post.metadata.startdate
  );

  const postData = post.metadata;

  return (
    <div className="mx-auto flex flex-col lg:flex-row max-w-6xl gap-8 p-8 font-sans">
      <main className="min-w-0 flex-1 ml-0">
        <article>
          <header className="mb-6 flex min-h-40 flex-col justify-center gap-4 border-b border-gray-200 py-10">
            <h1 className="text-4xl">
              {postData.title || idString.split(/[-/]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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
