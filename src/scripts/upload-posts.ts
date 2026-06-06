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

  const postId = result.rows[0].post_id;

  // 1:1 확장 테이블 연동: 스킬 트리인 경우 고유 속성을 skilltree 테이블에 분리 저장
  const cat1 = firstString(frontmatter.category1)?.toLowerCase().replace(/[-\s_]+/g, '');

  if (cat1 === 'skilltree') {
    const domain = firstString(frontmatter.category2) || null;
    const sub_domain = firstString(frontmatter.category3) || null;

    // techStart 문자열에서 YYYY(4자리 연도)만 추출
    const techStartStr = firstString(frontmatter.techStart);
    const techMatch = techStartStr?.match(/\d{4}/);
    const tech_start = techMatch ? parseInt(techMatch[0], 10) : null;

    const parent_skill = toStringArray(frontmatter.parentSkill);
    const child_skill = toStringArray(frontmatter.childSkill);

    await pool.query(
      `
        INSERT INTO skilltree (post_id, domain, sub_domain, tech_start, parent_skill, child_skill)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (post_id) DO UPDATE SET
          domain = EXCLUDED.domain,
          sub_domain = EXCLUDED.sub_domain,
          tech_start = EXCLUDED.tech_start,
          parent_skill = EXCLUDED.parent_skill,
          child_skill = EXCLUDED.child_skill,
          updated_at = CURRENT_TIMESTAMP
      `,
      [postId, domain, sub_domain, tech_start, parent_skill, child_skill]
    );
  } else {
    // 일반 게시물로 속성이 변경되었을 경우를 대비한 Clean-up 처리
    await pool.query('DELETE FROM skilltree WHERE post_id = $1', [postId]);
  }

  return postId;
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