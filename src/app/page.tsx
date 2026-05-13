import Link from 'next/link';

// 임시 블로그 게시물 데이터
const posts = [
  {
    slug: 'first-post',
    title: '첫 번째 블로그 글',
    excerpt: '이것은 첫 번째 블로그 글의 요약입니다. Next.js로 블로그를 만들 준비가 되었습니다!',
    date: '2024-05-16',
  },
  {
    slug: 'second-post',
    title: '두 번째 블로그 글',
    excerpt: 'Vanilla JS에서 Next.js로 마이그레이션하는 과정에 대해 이야기해 봅니다.',
    date: '2024-05-17',
  },
];

export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '1px solid #eaeaea', paddingBottom: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem' }}>Junseo's Blog 🚀</h1>
        <p style={{ color: '#666', fontSize: '1.2rem' }}>What are you looking for?</p>
      </header>
      <section>
        <h2 style={{ fontSize: '1.8rem', borderBottom: '1px solid #eaeaea', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>최신 글</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {posts.map((post) => (
            <li key={post.slug} style={{ marginBottom: '2.5rem' }}>
              <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                <h3 style={{ fontSize: '1.5rem', color: '#0070f3', marginBottom: '0.5rem' }}>{post.title}</h3>
              </Link>
              <p style={{ color: '#333', margin: '0 0 0.5rem 0' }}>{post.excerpt}</p>
              <small style={{ color: '#999' }}>{post.date}</small>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}