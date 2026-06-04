import 'dotenv/config';
import path from 'path';
import { pool } from '../infra/db';
import {
  firstString,
  loadMarkdownPosts,
  MarkdownPost,
  titleFromSlug,
  toStringArray,
} from '../utils/parser';

interface UploadOptions {
  write: boolean;
  limit?: number;
}

const POSTS_DIR = path.join(process.cwd(), 'public', 'upload-posts');

function readUploadOptions(): UploadOptions {
  const args = process.argv.slice(2);
  const limitArg = args.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined;

  if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0)) {
    throw new Error('--limit must be a positive integer.');
  }

  return {
    write: args.includes('--write'),
    limit,
  };
}

async function upsertPost(post: MarkdownPost): Promise<string> {
  const { slug, content, frontmatter } = post;

  // 메타데이터 정규화 (title, tags 등 필수 속성 보장 및 병합)
  const properties = {
    ...frontmatter,
    title: firstString(frontmatter.title) || titleFromSlug(slug),
    tags: toStringArray(frontmatter.tags),
  };

  const result = await pool.query<{ post_id: string }>(
    `
      INSERT INTO posts (slug, content, properties)
      VALUES ($1, $2, $3)
      ON CONFLICT (slug) DO UPDATE SET
        content = EXCLUDED.content,
        properties = EXCLUDED.properties,
        updated_at = CURRENT_TIMESTAMP
      RETURNING post_id
    `,
    [slug, content, JSON.stringify(properties)]
  );

  return result.rows[0].post_id;
}

function printDryRunSummary(posts: MarkdownPost[], skippedWithoutFrontmatter: number) {
  const counts = posts.reduce<Record<string, number>>((acc, post) => {
    const categories = toStringArray(post.frontmatter.category1);
    const key = categories.length > 0 ? categories.join(', ') : 'uncategorized';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Dry run: parsed ${posts.length} markdown post(s).`);
  if (skippedWithoutFrontmatter > 0) {
    console.log(`Skipped ${skippedWithoutFrontmatter} markdown file(s) without frontmatter.`);
  }
  console.table(counts);
  console.log('Sample slugs:');
  posts.slice(0, 10).forEach((post) => {
    console.log(`- ${post.slug}`);
  });
  console.log('No database writes were performed. Run with --write to upload.');
}

async function uploadPosts(posts: MarkdownPost[]) {
  await pool.query('BEGIN');

  try {
    for (const post of posts) {
      await upsertPost(post);
    }

    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  const options = readUploadOptions();
  const { posts, skippedWithoutFrontmatter } = loadMarkdownPosts(POSTS_DIR, options.limit);

  if (!options.write) {
    printDryRunSummary(posts, skippedWithoutFrontmatter);
    return;
  }

  await uploadPosts(posts);
  console.log(`Uploaded ${posts.length} markdown post(s) into the database.`);
}

main()
  .catch((error) => {
    console.error('Failed to upload posts:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });