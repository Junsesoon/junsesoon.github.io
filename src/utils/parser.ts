import fs, { Dirent } from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface TocHeading {
  level: number;
  text: string;
  id: string;
}

export type Frontmatter = Record<string, unknown>;

export interface MarkdownPost {
  slug: string;
  filePath: string;
  content: string;
  frontmatter: Frontmatter;
}

export interface ParsedMarkdownPosts {
  posts: MarkdownPost[];
  skippedWithoutFrontmatter: number;
}

function getNodeText(node: any): string {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  if (!Array.isArray(node.children)) return '';

  return node.children.map(getNodeText).join('');
}

export function collectTocHeadings(headings: TocHeading[]) {
  return () => (tree: any) => {
    function visit(node: any) {
      if (!node) return;

      if (node.type === 'heading' && node.depth === 1) { // 목차에 표기되는 헤더 레벨 조정 영역
        const id = node.data?.hProperties?.id ?? node.data?.id;
        const text = getNodeText(node).trim();

        if (id && text) {
          headings.push({
            level: 1,
            text,
            id: String(id),
          });
        }
      }

      if (Array.isArray(node.children)) {
        node.children.forEach(visit);
      }
    }

    visit(tree);
  };
}

export function getAllMarkdownFiles(dir: string, baseDir: string): { filePath: string; slug: string }[] {
  if (!fs.existsSync(dir)) {
    throw new Error(`Posts directory not found: ${dir}`);
  }

  let results: { filePath: string; slug: string }[] = [];
  const files: Dirent[] = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      results = results.concat(getAllMarkdownFiles(fullPath, baseDir));
      continue;
    }

    if (file.isFile() && file.name.endsWith('.md')) {
      const relativePath = path.relative(baseDir, fullPath);
      const slug = relativePath.replace(/\\/g, '/').replace(/\.md$/, '');
      results.push({ filePath: fullPath, slug });
    }
  }

  return results.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function loadMarkdownPosts(postsDir: string, limit?: number): ParsedMarkdownPosts {
  const markdownFiles = getAllMarkdownFiles(postsDir, postsDir);
  const targetFiles = limit ? markdownFiles.slice(0, limit) : markdownFiles;
  let skippedWithoutFrontmatter = 0;

  const posts = targetFiles.map(({ filePath }) => {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    const cat1 = firstString(data.category1);
    const cat2 = firstString(data.category2);
    const fileName = path.basename(filePath, '.md');

    const slugParts = [];
    if (cat1) slugParts.push(cat1.trim().toLowerCase().replace(/[\s_]+/g, '-'));
    if (cat2) slugParts.push(cat2.trim().toLowerCase().replace(/[\s_]+/g, '-'));
    slugParts.push(fileName.trim().toLowerCase().replace(/[\s_]+/g, '-'));

    const slug = slugParts.join('/');

    return {
      slug,
      filePath,
      content,
      frontmatter: data,
    };
  }).filter((post) => {
    const hasFrontmatter = Object.keys(post.frontmatter).length > 0;

    if (!hasFrontmatter) {
      skippedWithoutFrontmatter += 1;
    }

    return hasFrontmatter;
  });

  return {
    posts,
    skippedWithoutFrontmatter,
  };
}

export function toStringArray(value: unknown): string[] {
  if (value === null || value === undefined || value === '') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(toStringArray);
  }

  return [String(value).trim()].filter(Boolean);
}

export function parseMultilineArray(value: string | null | undefined): string[] {
  if (!value) return [];
  if (value.includes('\n')) {
    return value.split('\n').map((v) => v.trim()).filter(Boolean);
  }
  return [value.trim()].filter(Boolean);
}

export function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    const [first] = toStringArray(value);
    if (first) {
      return first;
    }
  }

  return null;
}

export function textValue(value: unknown): string | null {
  const values = toStringArray(value);
  return values.length > 0 ? values.join('\n') : null;
}

export function titleFromSlug(slug: string): string {
  const fileName = slug.split('/').pop() || slug;
  return fileName
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeCategory(value: string): string {
  return value.toLowerCase().replace(/[-_\s]+/g, '');
}

function categoryValues(frontmatter: Frontmatter): string[] {
  return toStringArray(frontmatter.category1).map(normalizeCategory);
}

export function hasCategory(frontmatter: Frontmatter, category: string): boolean {
  const normalized = normalizeCategory(category);
  return categoryValues(frontmatter).includes(normalized);
}

export function dateValue(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'number' && Number.isInteger(value)) {
    return `${String(value).padStart(4, '0')}-01-01`;
  }

  const dateText = firstString(value);
  if (!dateText) {
    return null;
  }

  if (/^\d{4}$/.test(dateText)) {
    return `${dateText}-01-01`;
  }

  return dateText;
}

export function booleanValue(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }

  const text = firstString(value)?.toLowerCase();
  if (!text) {
    return null;
  }

  if (['true', 'yes', 'y', '1', '완료'].includes(text)) {
    return true;
  }

  if (['false', 'no', 'n', '0', '미완료'].includes(text)) {
    return false;
  }

  return null;
}

export function familiarValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const text = toStringArray(value).join('');
  const starCount = [...text].filter((char) => char === '★').length;
  if (starCount > 0) {
    return starCount;
  }

  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : null;
}
