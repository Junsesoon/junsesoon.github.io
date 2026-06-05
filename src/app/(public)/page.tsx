import Link from 'next/link';
import { getAllPosts } from '../../utils/posts';
import BlogStats from '../../components/BlogStats';

export const revalidate = 1200; // ISR 적용 시, 게시물 수정 후 최대 20분까지는 수정 내용이 반영되지 않을 수 있음

export default async function Home({ searchParams }: { searchParams?: Promise<{ mode?: string }> }) {
  const params = await searchParams;
  const mode = params?.mode || 'blog';
  const posts = await getAllPosts(mode);
  return (
    <main className="mx-auto max-w-3xl p-8 font-sans">
      <header className="mb-0 flex min-h-80 flex-col items-center justify-center gap-6 py-10 text-center">
        <h1 className="text-5xl">
          {mode === 'portfolio' ? "Junseo's Portfolio 🚀" : "Junseo's Blog 🚀"}
        </h1>
        <p className="text-xl text-gray-600">What are you looking for?</p>
        <BlogStats />
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
