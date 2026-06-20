import { getAllPosts } from '../../utils/posts';
import { query } from '../../infra/neon';
import BlogStats from '../../components/BlogStats';
import PostList from '../../components/PostList';

export const revalidate = 1200; // ISR 적용 시, 게시물 수정 후 최대 20분까지는 수정 내용이 반영되지 않을 수 있음

export default async function Home() {
  const posts = await getAllPosts('blog');

  const totalPostsCount = posts.length;
  const totalLikesCount = posts.reduce((sum: number, post: any) => sum + (Number(post.likes_count) || 0), 0);
  const totalViewsCount = posts.reduce((sum: number, post: any) => sum + (Number(post.views_count) || 0), 0);
  
  const { rows } = await query('SELECT COUNT(*) as count FROM skilltree_posts');
  const totalSkillsCount = parseInt(rows[0].count, 10);

  return (
    <main className="mx-auto max-w-3xl p-8 font-sans">
      <header className="mb-0 flex min-h-80 flex-col items-center justify-center gap-6 py-10 text-center">
        <h1 className="text-5xl">
          Junseo's Blog 🚀
        </h1>
        <p className="text-xl text-gray-600">What are you looking for?</p>
        <BlogStats totalPosts={totalPostsCount} totalLikes={totalLikesCount} totalSkills={totalSkillsCount} totalVisitors={totalViewsCount} />
      </header>
      <section>
        <h2 className="mb-6 border-b border-gray-200 pb-2 text-3xl">최신 글</h2>
        <PostList posts={posts} theme="blog" />
      </section>
    </main>
  );
}
