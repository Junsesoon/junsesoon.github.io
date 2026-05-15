import fs from 'fs';
import path from 'path';
import { Dirent } from 'fs';
import matter from 'gray-matter';
import { Post, PostWithFrontmatter, PostFilterOptions } from '../types/blog';

export const getAllPosts = (mode: string = 'blog', filters: PostFilterOptions = {}): Post[] => {
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

  let posts: PostWithFrontmatter[] = allMarkdownFiles.map(({ filePath, slug }) => {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);

    // 슬러그의 마지막 부분을 기반으로 제목을 생성합니다 (예: 'knowledge/docker' -> 'Docker')
    const title = slug.split('/').pop()?.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || slug;

    return { // This object will be filtered later, so it needs category2
      slug,
      title,
      excerpt: data.summary || '', // frontmatter에 summary가 없는 경우를 대비
      date: data['start date'] || '', // frontmatter에 'start date'가 없는 경우를 대비
      category1: data.category1,
      category2: data.category2,
    };
  }).filter(post => post.date); // 날짜가 없는 게시물은 목록에서 제외합니다.

  // 'blog' 모드일 때 category1에 'knowledge' 또는 'skill'이 포함된 게시물만 필터링합니다.
  if (mode === 'blog') {
    posts = posts.filter(post => {
      const targetCategories = ['knowledge', 'skill'];
      if (Array.isArray(post.category1)) {
        return post.category1.some(cat => targetCategories.includes(cat));
      }
      return targetCategories.includes(post.category1);
    });
  }

  // 전달된 필터 옵션에 따라 필터링합니다.
  if (filters.category1) {
    posts = posts.filter(post => {
      if (Array.isArray(post.category1)) {
        return post.category1.includes(filters.category1);
      }
      return post.category1 === filters.category1;
    });
  }

  if (filters.category2) {
    posts = posts.filter(post => {
      if (Array.isArray(post.category2)) {
        return post.category2.includes(filters.category2);
      }
      return post.category2 === filters.category2;
    });
  }

  // 최신 날짜 순으로 정렬합니다.
  const sortedPosts = posts.sort((a, b) => (new Date(b.date) > new Date(a.date) ? 1 : -1));

  // 최종적으로 반환하기 전에 frontmatter 필터링에 사용된 category 속성들을 제거합니다.
  return sortedPosts.map(({ category1, category2, ...rest }) => rest);
};