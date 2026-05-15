import Link from 'next/link';
import { getAllPosts } from '../utils/posts';
import { Post } from '../types/blog';

export default async function Home({ searchParams }: { searchParams?: Promise<{ mode?: string }> }) {
  const params = await searchParams;
  const mode = params?.mode || 'blog';
  const posts = getAllPosts(mode);
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '1px solid #eaeaea', paddingBottom: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem' }}>
          {mode === 'portfolio' ? "Junseo's Portfolio 🚀" : "Junseo's Blog 🚀"}
        </h1>
        <p style={{ color: '#666', fontSize: '1.2rem' }}>What are you looking for?</p>
      </header>
      <section>
        <h2 style={{ fontSize: '1.8rem', borderBottom: '1px solid #eaeaea', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>최신 글</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {posts.map((post) => (
            <li key={post.slug} style={{ marginBottom: '2.5rem' }}>
              <Link href={`/${post.slug}`} style={{ textDecoration: 'none' }}>
                <h3 style={{ fontSize: '1.5rem', color: '#0070f3', marginBottom: '0.5rem' }}>{post.title}</h3>
                <p style={{ color: '#666', margin: '0.5rem 0' }}>
                  {new Date(post.date).toLocaleDateString('ko-KR')}
                </p>
                <p style={{ color: '#333' }}>{post.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}