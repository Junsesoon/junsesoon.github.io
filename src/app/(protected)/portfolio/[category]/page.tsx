import { getCategoryPosts } from '../../../../utils/posts';
import PostList from '../../../../components/PostList';

export default async function PortfolioCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const resolvedParams = await params;
  const { category } = resolvedParams;
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