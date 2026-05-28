'use server';

import { query } from '../infra/db';
import { PostFormData } from '@/components/PostEditor';
import { revalidatePath } from 'next/cache';

export async function createPostAction(data: PostFormData) {
  // 1. 작성된 카테고리와 제목을 기반으로 URL 슬러그 생성
  const cleanSlugPart = (str: string) =>
    str.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/(^-|-$)+/g, '');

  const slugParts = [];
  if (data.category1) slugParts.push(cleanSlugPart(data.category1));
  if (data.category2) slugParts.push(cleanSlugPart(data.category2));
  if (data.category3) slugParts.push(cleanSlugPart(data.category3));
  if (data.category4) slugParts.push(cleanSlugPart(data.category4));

  const titleSlug = cleanSlugPart(data.title) || `post-${Date.now()}`;
  slugParts.push(titleSlug);

  const slug = slugParts.join('/');

  try {
    // 3. .env(DB_ENV)에 의해 연결된 DB로 쿼리 실행
    // 만약 중복된 슬러그가 있을 경우 덮어쓰기(Upsert)를 수행해 에러를 방지합니다.
    await query(
      `INSERT INTO posts (
        slug, title, content, category1, category2, category3, category4, summary, tags, created_at, posted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        category1 = EXCLUDED.category1,
        category2 = EXCLUDED.category2,
        category3 = EXCLUDED.category3,
        category4 = EXCLUDED.category4,
        summary = EXCLUDED.summary,
        tags = EXCLUDED.tags,
        updated_at = NOW()`,
      [
        slug,
        data.title,
        data.content,
        data.category1 || null,
        data.category2 || null,
        data.category3 || null,
        data.category4 || null,
        data.summary || null,
        data.tags // pg 모듈이 JS 배열을 PostgreSQL 배열형(text[])으로 자동 변환해 줍니다.
      ]
    );

    // 4. 캐시를 무효화하여 Admin 대시보드와 블로그 홈에서 새로운 데이터를 즉시 가져오도록 조치합니다.
    revalidatePath('/admin');
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to create post:', error);
    throw new Error('Database query failed.');
  }
}