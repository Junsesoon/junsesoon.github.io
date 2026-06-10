import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { query } from '../infra/db';
import { Post, PostFilterOptions, FrontMatter, DbPost, DbPostRow } from '../types/blog';
import { titleFromSlug } from './parser';

function dateString(value: Date | string | null): string {
  if (!value) return '';
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
}

function normalizeCategoryValue(value: string) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, '');
}

function rowToMetadata(row: any): FrontMatter {
  const props = row.properties || {};
  
  // 기존 UI와의 호환성을 위해 properties(JSONB) 내부 데이터를 FrontMatter 포맷으로 전개
  return {
    ...props,
    title: row.title || props.title || titleFromSlug(row.slug),
    parentId: props.parentId || null,
    startDate: props.startDate || props.date || dateString(row.created_at) || null,
    endDate: props.endDate || props.modified_at || dateString(row.updated_at) || null,
    project: props.project || props.project_name || null,
    category1: props.category1 || null,
    category2: props.category2 || null,
    category3: props.category3 || null,
    category4: props.category4 || null,
    summary: props.summary || '',
    tags: props.tags || [],
    docVer: props.docVer || props.doc_ver || null,
  };
}

function rowToPost(row: any): Post {
  const props = row.properties || {};
  return {
    post_id: row.post_id,
    likes_count: row.likes_count,
    views_count: row.views_count,
    slug: row.slug,
    title: row.title || props.title || titleFromSlug(row.slug),
    excerpt: props.summary || '',
    date: dateString(props.startDate || props.date || row.created_at),
    category1: props.category1 || null,
    category2: props.category2 || null,
    metadata: props,
  };
}

function hasCategory(value: string | null, category: string) {
  if (!value) return false;
  return value.toLowerCase() === category.toLowerCase();
}

function hasNormalizedCategory(value: string | null, category: string) {
  if (!value) return false;
  return normalizeCategoryValue(value).includes(normalizeCategoryValue(category));
}

export const getTotalPostCount = async (): Promise<number> => {
  const result = await query<{ count: string }>(`SELECT COUNT(*) FROM posts`);
  return parseInt(result.rows[0].count, 10);
};

export const getAllPosts = async (
  mode: string = 'blog',
  filters: PostFilterOptions = {},
): Promise<Post[]> => {
  const result = await query<any>(`
    SELECT post_id, likes_count, views_count, slug, title, content, properties, created_at, updated_at
    FROM posts
  `);

  let rows = result.rows;

  // JSONB의 날짜 기준으로 JS 내림차순 정렬
  rows.sort((a, b) => {
    const dateA = a.properties?.date || a.properties?.startDate || dateString(a.created_at);
    const dateB = b.properties?.date || b.properties?.startDate || dateString(b.created_at);
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return a.slug.localeCompare(b.slug);
  });

  if (mode === 'blog') {
    rows = rows.filter((row) => {
      const cat = row.properties?.category1 || '';
      return ['knowledge', 'skill'].includes(cat.toLowerCase());
    });
  }

  if (filters.category1) {
    rows = rows.filter((row) => hasCategory(row.properties?.category1, filters.category1!));
  }

  if (filters.category2) {
    rows = rows.filter((row) => hasCategory(row.properties?.category2, filters.category2!));
  }

  return rows.map(rowToPost);
};

export const getCategoryPosts = async (category: string, mode: string = 'blog'): Promise<Post[]> => {
  const result = await query<any>(`
    SELECT post_id, likes_count, views_count, slug, title, content, properties, created_at, updated_at
    FROM posts
  `);

  let rows = result.rows;

  rows.sort((a, b) => {
    const dateA = a.properties?.date || a.properties?.startDate || dateString(a.created_at);
    const dateB = b.properties?.date || b.properties?.startDate || dateString(b.created_at);
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return a.slug.localeCompare(b.slug);
  });

  rows = rows.filter((row) => {
    if (mode === 'portfolio') {
      return hasNormalizedCategory(row.properties?.category1, category);
    }

    return hasCategory(row.properties?.category2, category);
  });

  return rows.map(rowToPost);
};

export const getDbPostBySlug = async (slug: string): Promise<DbPost | null> => {
  const result = await query<any>(
    `
      SELECT post_id, likes_count, views_count, slug, title, content, properties, created_at, updated_at
      FROM posts
      WHERE slug = $1
      LIMIT 1
    `,
    [slug],
  );

  const [row] = result.rows;
  if (!row) return null;

  return {
    post_id: row.post_id,
    likes_count: row.likes_count,
    views_count: row.views_count,
    slug: row.slug,
    content: row.content,
    metadata: rowToMetadata(row),
  };
};

export const getSkillTreePosts = async (matchCategory2: string): Promise<DbPost[]> => {
  const result = await query<any>(
    `
      SELECT 
        p.post_id, 
        p.likes_count,
        p.views_count,
        p.slug, 
        p.title,
        p.content, 
        p.properties, 
        p.created_at, 
        p.updated_at,
        s.domain,
        s.sub_domain,
        s.tech_start,
        s.parent_skill,
        s.child_skill
      FROM posts p
      JOIN skilltree_posts s ON p.post_id = s.post_id
      WHERE LOWER(s.domain) = LOWER($1)
        AND p.properties->>'category4' IS NULL
      ORDER BY s.tech_start ASC NULLS LAST, p.title ASC
    `,
    [matchCategory2],
  );

  return result.rows.map((row) => {
    const metadata = rowToMetadata(row);
    return {
      post_id: row.post_id,
      likes_count: row.likes_count,
      views_count: row.views_count,
      slug: row.slug,
      content: row.content,
      metadata: {
        ...metadata,
        title: row.title,
        category1: 'skilltree',
        category2: row.domain,
        category3: row.sub_domain,
        techStart: row.tech_start ? String(row.tech_start) : metadata.techStart,
        parentSkill: row.parent_skill,
        childSkill: row.child_skill,
      },
    };
  });
};

export const getPostData = async (id: string) => {
  const post = await getDbPostBySlug(id);

  if (!post) {
    throw new Error(`Post not found: ${id}`);
  }

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(post.content);

  return {
    id,
    htmlContent: String(processedContent),
    metadata: post.metadata,
  };
};
