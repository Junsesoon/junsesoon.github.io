import Link from 'next/link';
import { getCategoryPosts } from '../../../utils/posts';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ category: string }> ; searchParams?: Promise<{ mode?: string }> }) {
  const { category } = await params;
  const searchParamsResolved = await searchParams;
  const mode = searchParamsResolved?.mode || 'blog';
  const posts = await getCategoryPosts(category, mode);

  // 카테고리명을 포맷팅합니다 (예: 'cs' -> 'CS', 'trouble-shotting' -> 'Trouble Shotting')
  const formattedCategoryName = category
    .split('-')
    .map((word) => word.toUpperCase())
    .join(' ');

  return (
    <main className="mx-auto max-w-3xl p-8 font-sans">
      <header className="mb-12 flex min-h-40 flex-col justify-center gap-4 border-b border-gray-200 py-10">
        <h1 className="mb-2 text-4xl">{formattedCategoryName}</h1>
        <p className="text-base text-gray-600">{formattedCategoryName} 관련 포스트</p>
      </header>

      {posts.length === 0 ? (
        <section>
          <p className="text-center text-lg text-gray-400">
            게시물이 없습니다.
          </p>
        </section>
      ) : (
        <section>
          <h2 className="mb-6 border-b border-gray-200 pb-2 text-2xl">
            포스트 목록 ({posts.length})
          </h2>
          <ul className="list-none p-0">
            {posts.map((post) => (
              <li key={post.slug} className="mb-10">
                <Link href={`/${post.slug}`} className="no-underline">
                  <h3 className="mb-2 text-2xl text-blue-600">
                    {post.title}
                  </h3>
                  <p className="my-2 text-gray-600">
                    {new Date(post.date).toLocaleDateString('ko-KR')}
                  </p>
                  <p className="text-gray-800">{post.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
