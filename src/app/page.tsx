import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { Dirent } from 'fs';
import matter from 'gray-matter';

interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

const getPosts = (): Post[] => {
  const postsBaseDirectory = path.join(process.cwd(), 'public', 'posts');

  // Helper function to recursively get all markdown files and their slugs
  function getAllMarkdownFiles(dir: string, baseDir: string): { filePath: string; slug: string }[] {
    let results: { filePath: string; slug: string }[] = [];
    // 디렉터리가 존재하지 않으면 빈 배열을 반환하여 오류를 방지합니다.
    if (!fs.existsSync(dir)) {
      console.error(`Directory not found: ${dir}`);
      return [];
    }
    const files: Dirent[] = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        results = results.concat(getAllMarkdownFiles(fullPath, baseDir));
      } else if (file.isFile() && file.name.endsWith('.md')) {
        const relativePath = path.relative(baseDir, fullPath);
        // Windows 경로 구분자(\)를 /로 통일합니다.
        const slug = relativePath.replace(/\\/g, '/').replace(/\.md$/, '');
        results.push({ filePath: fullPath, slug });
      }
    }
    return results;
  }

const allMarkdownFiles = getAllMarkdownFiles(postsBaseDirectory, postsBaseDirectory);

const posts = allMarkdownFiles.map(({ filePath, slug }) => {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);

    // 슬러그의 마지막 부분을 기반으로 제목을 생성합니다 (예: 'knowledge/docker' -> 'Docker')
    const title = slug.split('/').pop()?.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || slug;

    return {
      slug,
      title,
      excerpt: data.summary || '', // frontmatter에 summary가 없는 경우를 대비
      date: data['start date'] || '', // frontmatter에 'start date'가 없는 경우를 대비
    };
  }).filter(post => post.date); // 날짜가 없는 게시물은 목록에서 제외합니다.

  // 최신 날짜 순으로 정렬합니다.
  return posts.sort((a, b) => (new Date(b.date) > new Date(a.date) ? 1 : -1));
};

export default function Home() {
  const posts = getPosts();
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