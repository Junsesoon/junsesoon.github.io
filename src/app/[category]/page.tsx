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

interface PostWithFrontmatter extends Post {
  category1?: string | string[];
  category2?: string | string[];
}

const normalizeCategoryValue = (value: string) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, '');

const getCategoryPosts = (category: string, mode: string = 'blog'): Post[] => {
  const postsBaseDirectory = path.join(process.cwd(), 'public', 'posts');

  // Helper function to recursively get all markdown files and their slugs
  function getAllMarkdownFiles(dir: string, baseDir: string): { filePath: string; slug: string }[] {
    let results: { filePath: string; slug: string }[] = [];
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
        const slug = relativePath.replace(/\\/g, '/').replace(/\.md$/, '');
        results.push({ filePath: fullPath, slug });
      }
    }
    return results;
  }

  const allMarkdownFiles = getAllMarkdownFiles(postsBaseDirectory, postsBaseDirectory);

  let posts: PostWithFrontmatter[] = allMarkdownFiles
    .map(({ filePath, slug }) => {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);

      const title =
        slug
          .split('/')
          .pop()
          ?.split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') || slug;

      return {
        slug,
        title,
        excerpt: data.summary || '',
        date: data['start date'] || data.date || '',
        category1: data.category1,
        category2: data.category2,
      };
    })
    .filter((post) => post.date);

  // portfolio 모드에서는 category1 기준으로, 그 외에는 category2 기준으로 필터링
  const normalizedCategory = normalizeCategoryValue(category);

  posts = posts.filter((post) => {
    if (mode === 'portfolio') {
      const category1Values = Array.isArray(post.category1) ? post.category1 : [post.category1].filter(Boolean);
      return category1Values.some(cat => {
        const normalizedCat = normalizeCategoryValue(cat);
        return normalizedCat.includes(normalizedCategory);
      });
    }

    const hasCategory2Match = Array.isArray(post.category2)
      ? post.category2.includes(category)
      : post.category2 === category;

    return hasCategory2Match;
  });

  // 최신 날짜 순으로 정렬
  const sortedPosts = posts.sort((a, b) => (new Date(b.date) > new Date(a.date) ? 1 : -1));

  return sortedPosts.map(({ category1, category2, ...rest }) => rest);
};

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ category: string }> ; searchParams?: Promise<{ mode?: string }> }) {
  const { category } = await params;
  const searchParamsResolved = await searchParams;
  const mode = searchParamsResolved?.mode || 'blog';
  const posts = getCategoryPosts(category, mode);

  // 카테고리명을 포맷팅합니다 (예: 'cs' -> 'CS', 'trouble-shotting' -> 'Trouble Shotting')
  const formattedCategoryName = category
    .split('-')
    .map((word) => word.toUpperCase())
    .join(' ');

  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header
        style={{
          borderBottom: '1px solid #eaeaea',
          paddingBottom: '1rem',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{formattedCategoryName}</h1>
        <p style={{ color: '#666', fontSize: '1rem' }}>{formattedCategoryName} 관련 포스트</p>
      </header>

      {posts.length === 0 ? (
        <section>
          <p style={{ color: '#999', fontSize: '1.1rem', textAlign: 'center' }}>
            게시물이 없습니다.
          </p>
        </section>
      ) : (
        <section>
          <h2
            style={{
              fontSize: '1.5rem',
              borderBottom: '1px solid #eaeaea',
              paddingBottom: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            포스트 목록 ({posts.length})
          </h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {posts.map((post) => (
              <li key={post.slug} style={{ marginBottom: '2.5rem' }}>
                <Link href={`/${post.slug}`} style={{ textDecoration: 'none' }}>
                  <h3 style={{ fontSize: '1.5rem', color: '#0070f3', marginBottom: '0.5rem' }}>
                    {post.title}
                  </h3>
                  <p style={{ color: '#666', margin: '0.5rem 0' }}>
                    {new Date(post.date).toLocaleDateString('ko-KR')}
                  </p>
                  <p style={{ color: '#333' }}>{post.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
