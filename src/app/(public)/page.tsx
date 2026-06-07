import Link from 'next/link';
import { getAllPosts } from '../../utils/posts';
import { query } from '../../infra/db';
import BlogStats from '../../components/BlogStats';

export const revalidate = 1200; // ISR 적용 시, 게시물 수정 후 최대 20분까지는 수정 내용이 반영되지 않을 수 있음

export default async function Home({ searchParams }: { searchParams?: Promise<{ mode?: string }> }) {
  const params = await searchParams;
  const mode = params?.mode || 'blog';
  const posts = await getAllPosts(mode);

  // 이미 getAllPosts(mode) 내부에서 모드에 맞게 필터링된 게시물을 가져오므로 배열의 길이를 그대로 사용합니다.
  const totalPostsCount = posts.length;
  const totalLikesCount = posts.reduce((sum: number, post: any) => sum + (Number(post.likes_count) || 0), 0);
  
  let totalSkillsCount = 0;
  if (mode === 'portfolio') {
    // 포트폴리오 모드: posts 배열에서 category1 속성이 'my skill'인 게시물을 필터링하여 개수 집계
    totalSkillsCount = posts.filter((post: any) => {
      const cat = post.category1 || post.metadata?.category1 || '';
      return cat.toLowerCase().replace(/\s+/g, '') === 'myskill';
    }).length;
  } else {
    // 블로그 모드: 분리된 skilltree 확장 테이블에서 전체 개수를 집계
    const { rows } = await query('SELECT COUNT(*) as count FROM skilltree');
    totalSkillsCount = parseInt(rows[0].count, 10);
  }

  return (
    <main className="mx-auto max-w-3xl p-8 font-sans">
      <header className="mb-0 flex min-h-80 flex-col items-center justify-center gap-6 py-10 text-center">
        <h1 className="text-5xl">
          {mode === 'portfolio' ? "Junseo's Portfolio 🚀" : "Junseo's Blog 🚀"}
        </h1>
        <p className="text-xl text-gray-600">What are you looking for?</p>
        <BlogStats totalPosts={totalPostsCount} totalLikes={totalLikesCount} totalSkills={totalSkillsCount} />
      </header>
      <section>
        <h2 className="mb-6 border-b border-gray-200 pb-2 text-3xl">최신 글</h2>
        <ul className="list-none p-0">
          {posts.map((post) => (
            <li key={post.slug} className="mb-10">
              <Link href={`/${post.slug}`} className="no-underline">
                <h3 className={`mb-2 text-2xl ${mode === 'portfolio' ? 'text-red-800' : 'text-blue-600'}`}>{post.title}</h3>
                <p className="mb-2 text-1xl text-gray-800">{post.excerpt}</p>
                <p className="text-sm text-gray-500">
                  {new Date(post.date).toLocaleDateString('ko-KR')}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
