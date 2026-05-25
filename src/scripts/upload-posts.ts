import 'dotenv/config';
import path from 'path';
import { pool } from '../infra/db';
import {
  booleanValue,
  dateValue,
  familiarValue,
  firstString,
  Frontmatter,
  hasCategory,
  loadMarkdownPosts,
  MarkdownPost,
  textValue,
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
  const tags = toStringArray(frontmatter.tags ?? frontmatter.tag);
  const projectName = firstString(frontmatter.project, frontmatter['project title']);
  const title = firstString(frontmatter.title, frontmatter['project title']) || titleFromSlug(post.slug);

  const result = await pool.query<{ post_id: string }>(
    `
      INSERT INTO posts (
        slug,
        content,
        title,
        posted_at,
        modified_at,
        summary,
        tags,
        project_name,
        category1,
        category2,
        category3,
        category4,
        doc_ver
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (slug) DO UPDATE SET
        content = EXCLUDED.content,
        title = EXCLUDED.title,
        posted_at = EXCLUDED.posted_at,
        modified_at = EXCLUDED.modified_at,
        summary = EXCLUDED.summary,
        tags = EXCLUDED.tags,
        project_name = EXCLUDED.project_name,
        category1 = EXCLUDED.category1,
        category2 = EXCLUDED.category2,
        category3 = EXCLUDED.category3,
        category4 = EXCLUDED.category4,
        doc_ver = EXCLUDED.doc_ver,
        updated_at = CURRENT_TIMESTAMP
      RETURNING post_id
    `,
    [
      post.slug,
      post.content,
      title,
      dateValue(frontmatter['start date']),
      dateValue(frontmatter['end date']),
      textValue(frontmatter.summary),
      tags,
      projectName,
      firstString(frontmatter.category1),
      firstString(frontmatter.category2),
      firstString(frontmatter.category3),
      firstString(frontmatter.category4),
      firstString(frontmatter['doc-ver']),
    ],
  );

  return result.rows[0].post_id;
}

async function resetPostDetailRows(postId: string) {
  await pool.query('DELETE FROM trouble_shooting WHERE post_id = $1', [postId]);
  await pool.query('DELETE FROM skill_tree WHERE post_id = $1', [postId]);
  await pool.query('DELETE FROM my_skill WHERE post_id = $1', [postId]);
  await pool.query('DELETE FROM project WHERE post_id = $1', [postId]);
}

async function insertPostDetails(postId: string, frontmatter: Frontmatter) {
  if (hasCategory(frontmatter, 'trouble shooting')) {
    await pool.query(
      'INSERT INTO trouble_shooting (post_id, completion) VALUES ($1, $2)',
      [postId, booleanValue(frontmatter.COMPLETION) ?? false],
    );
  }

  if (hasCategory(frontmatter, 'skilltree') || hasCategory(frontmatter, 'skill tree')) {
    await pool.query(
      `
        INSERT INTO skill_tree (
          post_id,
          tech_start,
          parent_skill,
          child_skill
        )
        VALUES ($1, $2, $3, $4)
      `,
      [
        postId,
        dateValue(frontmatter['tech start']),
        firstString(frontmatter['parent skill']),
        textValue(frontmatter['child skill']),
      ],
    );
  }

  if (hasCategory(frontmatter, 'my skill')) {
    await pool.query(
      'INSERT INTO my_skill (post_id, familiar) VALUES ($1, $2)',
      [postId, familiarValue(frontmatter.familiar)],
    );
  }

  if (hasCategory(frontmatter, 'project')) {
    await pool.query(
      `
        INSERT INTO project (
          post_id,
          contribute,
          my_role,
          tech_platform,
          tech_language,
          tech_server,
          tech_framework,
          tech_db,
          tech_ide,
          tech_api,
          tech_library
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        postId,
        textValue(frontmatter.contribute),
        firstString(frontmatter.role, frontmatter['담당역할']),
        textValue(frontmatter.platform ?? frontmatter['플랫폼']),
        textValue(frontmatter.language ?? frontmatter['언어']),
        textValue(frontmatter.server ?? frontmatter['서버']),
        textValue(frontmatter.framework ?? frontmatter['프레임워크']),
        textValue(frontmatter.db ?? frontmatter.DB),
        textValue(frontmatter.ide ?? frontmatter.IDE),
        textValue(frontmatter.api ?? frontmatter.API),
        textValue(frontmatter.library ?? frontmatter['라이브러리']),
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