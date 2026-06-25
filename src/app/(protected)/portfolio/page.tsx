import { getAllPosts } from '../../../utils/posts';
import BlogStats from '../../../components/BlogStats';
import PostList from '../../../components/PostList';

export const revalidate = 1200; // ISR 적용

export default async function PortfolioHome() {
  const posts = await getAllPosts('portfolio');

  const totalPostsCount = posts.length;
  const totalLikesCount = posts.reduce((sum: number, post: any) => sum + (Number(post.likes_count) || 0), 0);
  const totalViewsCount = posts.reduce((sum: number, post: any) => sum + (Number(post.views_count) || 0), 0);
  
  // 포트폴리오 모드: posts 배열에서 category1 속성이 'my skill'인 게시물을 필터링하여 개수 집계
  const totalSkillsCount = posts.filter((post: any) => {
    const cat = post.category1 || post.metadata?.category1 || '';
    return cat.toLowerCase().replace(/\s+/g, '') === 'myskill';
  }).length;

  return (
    <main className="mx-auto max-w-3xl p-8 font-sans">
      <header className="mb-0 flex min-h-80 flex-col items-center justify-center gap-6 py-10 text-center">
        <h1 className="text-5xl">Junseo's Portfolio 🚀</h1>
        <p className="text-xl text-gray-600">What are you looking for?</p>
        <BlogStats totalPosts={totalPostsCount} totalLikes={totalLikesCount} totalSkills={totalSkillsCount} totalVisitors={totalViewsCount} />
      </header>
      <section>
        <h2 className="mb-6 border-b border-gray-200 pb-2 text-3xl">최신글</h2>
        <PostList posts={posts} theme="portfolio" />
      </section>
    </main>
  );
}