import 'dotenv/config';
import path from 'path';
import { pool } from '../infra/db';
import {
  firstString,
  Frontmatter,
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
  const { frontmatter } = post;
  // title은 별도 컬럼으로, 나머지는 properties(JSONB)로 분리
  const { title: rawTitle, ...properties } = frontmatter;
  const title = firstString(rawTitle) || titleFromSlug(post.slug);

  const result = await pool.query<{ post_id: string }>(
    `
      INSERT INTO posts (
        slug,
        content,
        title,
        properties
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (slug) DO UPDATE SET
        content = EXCLUDED.content,
        title = EXCLUDED.title,
        properties = EXCLUDED.properties,
        updated_at = CURRENT_TIMESTAMP
      RETURNING post_id
    `,
    [
      post.slug,
      post.content,
      title,
      JSON.stringify(properties),
    ],
  );

  return result.rows[0].post_id;
}

async function resetPostDetailRows(postId: string) {
  // 구형 테이블 삭제 로직 대체: 현재는 skilltree 단일 확장 테이블만 존재함
  await pool.query('DELETE FROM skilltree WHERE post_id = $1', [postId]);
}

async function insertPostDetails(postId: string, frontmatter: Frontmatter) {
  const cat1 = firstString(frontmatter.category1)?.trim().toLowerCase().replace(/[-\s_]+/g, '');
  
  if (cat1 === 'skilltree') {
    const techStartStr = String(firstString(frontmatter.techStart) || '');
    const techMatch = techStartStr.match(/\d{4}/);
    const tech_start = techMatch ? parseInt(techMatch[0], 10) : null;

    await pool.query(
      `
        INSERT INTO skilltree (
          post_id,
          domain,
          sub_domain,
          tech_start,
          parent_skill,
          child_skill
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        postId,
        firstString(frontmatter.category2),
        firstString(frontmatter.category3),
        tech_start,
        toStringArray(frontmatter.parentSkill),
        toStringArray(frontmatter.childSkill),
      ],
    );
  }
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
      const postId = await upsertPost(post);
      await resetPostDetailRows(postId);
      await insertPostDetails(postId, post.frontmatter);
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