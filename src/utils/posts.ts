import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { query } from '../infra/db';
import { Post, PostFilterOptions } from '../types/blog';
import { Frontmatter, titleFromSlug } from './parser';

export interface DbPost {
  slug: string;
  content: string;
  metadata: Frontmatter;
}

interface DbPostRow {
  slug: string;
  content: string;
  title: string | null;
  posted_at: Date | string | null;
  modified_at: Date | string | null;
  summary: string | null;
  tags: string[] | null;
  project_name: string | null;
  category1: string | null;
  category2: string | null;
  category3: string | null;
  category4: string | null;
  doc_ver: string | null;
  completion: boolean | null;
  tech_start: Date | string | null;
  parent_skill: string | null;
  child_skill: string | null;
  familiar: number | null;
  contribute: string | null;
  my_role: string | null;
  tech_platform: string | null;
  tech_language: string | null;
  tech_server: string | null;
  tech_framework: string | null;
  tech_db: string | null;
  tech_ide: string | null;
  tech_api: string | null;
  tech_library: string | null;
}

const POST_SELECT = `
  SELECT
    p.slug,
    p.content,
    p.title,
    p.posted_at,
    p.modified_at,
    p.summary,
    p.tags,
    p.project_name,
    p.category1,
    p.category2,
    p.category3,
    p.category4,
    p.doc_ver,
    ts.completion,
    st.tech_start,
    st.parent_skill,
    st.child_skill,
    ms.familiar,
    pr.contribute,
    pr.my_role,
    pr.tech_platform,
    pr.tech_language,
    pr.tech_server,
    pr.tech_framework,
    pr.tech_db,
    pr.tech_ide,
    pr.tech_api,
    pr.tech_library
  FROM posts p
  LEFT JOIN trouble_shooting ts ON ts.post_id = p.post_id
  LEFT JOIN skill_tree st ON st.post_id = p.post_id
  LEFT JOIN my_skill ms ON ms.post_id = p.post_id
  LEFT JOIN project pr ON pr.post_id = p.post_id
`;

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

function rowToMetadata(row: DbPostRow): Frontmatter {
  const metadata: Frontmatter = {
    title: row.title || titleFromSlug(row.slug),
    parentId: null,
    'start date': dateString(row.posted_at) || null,
    'end date': dateString(row.modified_at) || null,
    project: row.project_name || null,
    category1: row.category1 || null,
    category2: row.category2 || null,
    category3: row.category3 || null,
    category4: row.category4 || null,
    summary: row.summary || '',
    tags: row.tags || [],
    'doc-ver': row.doc_ver || null,
  };

  if (row.completion !== null) metadata.COMPLETION = row.completion;
  if (row.tech_start) metadata['tech start'] = dateString(row.tech_start);
  if (row.parent_skill) metadata['parent skill'] = row.parent_skill;
  if (row.child_skill) metadata['child skill'] = row.child_skill;
  if (row.familiar !== null) metadata.familiar = row.familiar;
  if (row.contribute) metadata.contribute = row.contribute;
  if (row.my_role) metadata.role = row.my_role;
  if (row.tech_platform) metadata.platform = row.tech_platform;
  if (row.tech_language) metadata.language = row.tech_language;
  if (row.tech_server) metadata.server = row.tech_server;
  if (row.tech_framework) metadata.framework = row.tech_framework;
  if (row.tech_db) metadata.db = row.tech_db;
  if (row.tech_ide) metadata.ide = row.tech_ide;
  if (row.tech_api) metadata.api = row.tech_api;
  if (row.tech_library) metadata.library = row.tech_library;

  return metadata;
}

function rowToPost(row: DbPostRow): Post {
  return {
    slug: row.slug,
    title: row.title || titleFromSlug(row.slug),
    excerpt: row.summary || '',
    date: dateString(row.posted_at),
  };
}

function hasCategory(value: string | null, category: string) {
  if (!value) return false;
  return value === category;
}

function hasNormalizedCategory(value: string | null, category: string) {
  if (!value) return false;
  return normalizeCategoryValue(value).includes(normalizeCategoryValue(category));
}

export const getAllPosts = async (
  mode: string = 'blog',
  filters: PostFilterOptions = {},
): Promise<Post[]> => {
  const result = await query<DbPostRow>(`
    ${POST_SELECT}
    WHERE p.posted_at IS NOT NULL
    ORDER BY p.posted_at DESC NULLS LAST, p.slug ASC
  `);

  let rows = result.rows;

  if (mode === 'blog') {
    rows = rows.filter((row) => ['knowledge', 'skill'].includes(row.category1 || ''));
  }

  if (filters.category1) {
    rows = rows.filter((row) => hasCategory(row.category1, filters.category1!));
  }

  if (filters.category2) {
    rows = rows.filter((row) => hasCategory(row.category2, filters.category2!));
  }

  return rows.map(rowToPost);
};

export const getCategoryPosts = async (category: string, mode: string = 'blog'): Promise<Post[]> => {
  const result = await query<DbPostRow>(`
    ${POST_SELECT}
    WHERE p.posted_at IS NOT NULL
    ORDER BY p.posted_at DESC NULLS LAST, p.slug ASC
  `);

  const rows = result.rows.filter((row) => {
    if (mode === 'portfolio') {
      return hasNormalizedCategory(row.category1, category);
    }

    return hasCategory(row.category2, category);
  });

  return rows.map(rowToPost);
};

export const getDbPostBySlug = async (slug: string): Promise<DbPost | null> => {
  const result = await query<DbPostRow>(
    `
      ${POST_SELECT}
      WHERE p.slug = $1
      LIMIT 1
    `,
    [slug],
  );

  const [row] = result.rows;
  if (!row) return null;

  return {
    slug: row.slug,
    content: row.content,
    metadata: rowToMetadata(row),
  };
};

export const getSkillTreePosts = async (matchCategory2: string): Promise<DbPost[]> => {
  const result = await query<DbPostRow>(
    `
      ${POST_SELECT}
      WHERE p.category1 = 'skill tree'
        AND LOWER(p.category2) = LOWER($1)
        AND p.category4 IS NULL
      ORDER BY p.posted_at ASC NULLS LAST, p.title ASC
    `,
    [matchCategory2],
  );

  return result.rows.map((row) => ({
    slug: row.slug,
    content: row.content,
    metadata: rowToMetadata(row),
  }));
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
