'use server';

import { query } from '../infra/neon';
import { revalidatePath } from 'next/cache';
import { PostFormData } from './PostEditor';

// 슬러그 생성 시 특수문자 치환 및 정제 헬퍼 함수
const cleanSlug = (str: string) => {
  let cleaned = str.trim().toLowerCase();

  // C++, C# 등 특수문자가 포함된 기술 스택 이름을 안전한 영문으로 치환
  cleaned = cleaned.replace(/\+/g, 'p');
  cleaned = cleaned.replace(/#/g, 'sharp');

  cleaned = cleaned
    .replace(/[^a-z0-9가-힣\s-]/g, '') // 영문, 숫자, 한글, 공백, 하이픈만 허용하여 URL 호환성 보장
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return cleaned || 'untitled';
};

const INTERNAL_PROPS = [
  'post_status',
  'has_draft',
  'draft_title',
  'draft_content',
  'draft_properties',
  'views_count',
  'likes_count',
  'created_at',
  'updated_at'
];

export async function createPostAction(formData: PostFormData & { _isDraft?: boolean }) {
  const { _isDraft, title, content, ...rawProperties } = formData;

  const properties: Record<string, any> = {};
  Object.keys(rawProperties).forEach((key) => {
    if (!INTERNAL_PROPS.includes(key)) {
      properties[key] = rawProperties[key];
    }
  });

  const safeTitle = title?.trim() || 'Untitled';
  const safeContent = content || '';

  const slugParts = [];
  if (properties.category1) slugParts.push(cleanSlug(properties.category1));
  if (properties.category2) slugParts.push(cleanSlug(properties.category2));
  if (properties.category3) slugParts.push(cleanSlug(properties.category3));
  if (properties.category4) slugParts.push(cleanSlug(properties.category4));

  const titleSlug = cleanSlug(safeTitle) || `post-${Date.now()}`;
  slugParts.push(titleSlug);

  const baseSlug = slugParts.join('/');
  let slug = baseSlug;
  let counter = 1;

  try {
    // 중복 슬러그 검사 및 넘버링 처리
    while (true) {
      const check = await query('SELECT post_id FROM posts WHERE slug = $1', [slug]);
      if ((check.rowCount ?? 0) === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const propertyNames = Object.keys(properties);

    await query('BEGIN');

    // 1. 게시물 작성 시 사용된 모든 속성 키를 전역 property_list에 자동 등록 (없는 경우에만 삽입)
    if (propertyNames.length > 0) {
      await query(
        `INSERT INTO property_list (property_name)
         SELECT UNNEST($1::text[])
         ON CONFLICT (property_name) DO NOTHING`,
        [propertyNames]
      );
    }

    let postId;

    if (_isDraft) {
      // 새 글 임시저장: post_status를 'draft'로 설정하여 퍼블릭에 노출되지 않게 함
      const res = await query(
        `INSERT INTO posts 
          (slug, title, content, properties, post_status, draft_title, draft_content, draft_properties) 
         VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7) RETURNING post_id`,
        [slug, safeTitle, safeContent, properties, safeTitle, safeContent, properties]
      );
      postId = res.rows[0].post_id;
    } else {
      // 정식 발행
      const res = await query(
        `INSERT INTO posts 
          (slug, title, content, properties, post_status, draft_title, draft_content, draft_properties) 
         VALUES ($1, $2, $3, $4, 'published', NULL, NULL, NULL) RETURNING post_id`,
        [slug, safeTitle, safeContent, properties]
      );
      postId = res.rows[0].post_id;
    }

    // 카테고리가 스킬트리인 경우 보조 테이블 데이터 동기화
    if (postId) {
      const cat1 = String(properties.category1 || '').trim().toLowerCase().replace(/[-\s_]+/g, '');
      
      if (cat1 === 'skilltree') {
        const domain = properties.category2 ? String(properties.category2) : null;
        const sub_domain = properties.category3 ? String(properties.category3) : null;
        
        const techStartStr = String(properties.techstart || properties.techStart || '');
        const techMatch = techStartStr.match(/\d{4}/);
        const tech_start = techMatch ? parseInt(techMatch[0], 10) : null;

        const toArray = (val: any): string[] => {
          if (val === null || val === undefined || val === '') return [];
          if (Array.isArray(val)) return val.flatMap(toArray);
          return String(val).split(',').map((s) => s.trim()).filter(Boolean);
        };

        await query(
          `INSERT INTO skilltree_posts (post_id, domain, sub_domain, tech_start, parent_skill, child_skill)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (post_id) DO UPDATE SET
             domain = EXCLUDED.domain,
             sub_domain = EXCLUDED.sub_domain,
             tech_start = EXCLUDED.tech_start,
             parent_skill = EXCLUDED.parent_skill,
             child_skill = EXCLUDED.child_skill,
             updated_at = CURRENT_TIMESTAMP`,
          [
            postId,
            domain,
            sub_domain,
            tech_start,
            toArray(properties.parentskill || properties.parentSkill),
            toArray(properties.childskill || properties.childSkill)
          ]
        );
      }
    }

    await query('COMMIT');
  } catch (err) {
    await query('ROLLBACK');
    console.error('Failed to create post:', err);
    throw err;
  }

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/${slug}`);
  
  return { success: true, slug };
}

export async function updatePostAction(originalSlug: string, formData: PostFormData & { _isDraft?: boolean }) {
  const { _isDraft, title, content, ...rawProperties } = formData;

  const properties: Record<string, any> = {};
  Object.keys(rawProperties).forEach((key) => {
    if (!INTERNAL_PROPS.includes(key)) {
      properties[key] = rawProperties[key];
    }
  });

  const safeTitle = title?.trim() || 'Untitled';
  const safeContent = content || '';

  const slugParts = [];
  if (properties.category1) slugParts.push(cleanSlug(properties.category1));
  if (properties.category2) slugParts.push(cleanSlug(properties.category2));
  if (properties.category3) slugParts.push(cleanSlug(properties.category3));
  if (properties.category4) slugParts.push(cleanSlug(properties.category4));

  const titleSlug = cleanSlug(safeTitle) || `post-${Date.now()}`;
  slugParts.push(titleSlug);

  const baseSlug = slugParts.join('/');
  let newSlug = baseSlug;
  let counter = 1;

  try {
    // 중복 슬러그 검사 및 넘버링 처리 (기존 자신의 슬러그는 제외)
    while (true) {
      const check = await query('SELECT post_id FROM posts WHERE slug = $1 AND slug != $2', [newSlug, originalSlug]);
      if ((check.rowCount ?? 0) === 0) break;
      newSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const propertyNames = Object.keys(properties);

    await query('BEGIN');

    // 1. 게시물 수정 시 사용된 모든 속성 키를 전역 property_list에 자동 등록 (없는 경우에만 삽입)
    if (propertyNames.length > 0) {
      await query(
        `INSERT INTO property_list (property_name)
         SELECT UNNEST($1::text[])
         ON CONFLICT (property_name) DO NOTHING`,
        [propertyNames]
      );
    }

    const postRes = await query('SELECT post_id, post_status FROM posts WHERE slug = $1', [originalSlug]);
    if (postRes.rows.length === 0) throw new Error('Post not found');
    
    const postId = postRes.rows[0].post_id;
    const currentStatus = postRes.rows[0].post_status;

    if (_isDraft) {
      if (currentStatus === 'draft') {
        // 한 번도 발행되지 않은 새 글의 임시저장 업데이트: 원본 보호 불필요, 전체 덮어쓰기
        await query(
          `UPDATE posts 
           SET slug = $1,
               title = $2,
               content = $3,
               properties = $4,
               draft_title = $2, 
               draft_content = $3, 
               draft_properties = $4,
               updated_at = CURRENT_TIMESTAMP
           WHERE slug = $5`,
          [newSlug, safeTitle, safeContent, properties, originalSlug]
        );
      } else {
        // 기존에 발행된 글 임시저장 (1번 방안): 대중에게 노출 중인 원본 데이터는 보호하고 draft_* 컬럼만 조용히 업데이트
        await query(
          `UPDATE posts 
           SET slug = $1,
               draft_title = $2, 
               draft_content = $3, 
               draft_properties = $4,
               post_status = 'editing',
               updated_at = CURRENT_TIMESTAMP
           WHERE slug = $5`,
          [newSlug, safeTitle, safeContent, properties, originalSlug]
        );
      }
    } else {
      // 정식 발행: 보관 중이던 draft 데이터를 비우고, 원본 데이터를 덮어쓰며 상태를 'published'로 전환
      await query(
        `UPDATE posts 
         SET slug = $1,
             title = $2, 
             content = $3, 
             properties = $4, 
             post_status = 'published',
             draft_title = NULL, 
             draft_content = NULL, 
             draft_properties = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE slug = $5`,
         [newSlug, safeTitle, safeContent, properties, originalSlug]
      );
    }

    // 스킬트리 확장 테이블 강제 동기화 (임시저장본이 스킬트리 라이브 뷰를 망치는 것 방지)
    if (postId) {
      const cat1 = String(properties.category1 || '').trim().toLowerCase().replace(/[-\s_]+/g, '');
      
      if (cat1 === 'skilltree') {
        const domain = properties.category2 ? String(properties.category2) : null;
        const sub_domain = properties.category3 ? String(properties.category3) : null;
        
        const techStartStr = String(properties.techstart || properties.techStart || '');
        const techMatch = techStartStr.match(/\d{4}/);
        const tech_start = techMatch ? parseInt(techMatch[0], 10) : null;

        const toArray = (val: any): string[] => {
          if (val === null || val === undefined || val === '') return [];
          if (Array.isArray(val)) return val.flatMap(toArray);
          return String(val).split(',').map((s) => s.trim()).filter(Boolean);
        };

        await query(
          `INSERT INTO skilltree_posts (post_id, domain, sub_domain, tech_start, parent_skill, child_skill) 
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (post_id) DO UPDATE SET 
             domain = EXCLUDED.domain,
             sub_domain = EXCLUDED.sub_domain,
             tech_start = EXCLUDED.tech_start,
             parent_skill = EXCLUDED.parent_skill,
             child_skill = EXCLUDED.child_skill,
             updated_at = CURRENT_TIMESTAMP`,
          [
            postId, 
            domain, 
            sub_domain, 
            tech_start,
            toArray(properties.parentskill || properties.parentSkill),
            toArray(properties.childskill || properties.childSkill)
          ]
        );
      } else {
        // 스킬트리에서 일반 블로그 카테고리로 변경되었을 경우 잉여 데이터 클린업
        await query(`DELETE FROM skilltree_posts WHERE post_id = $1`, [postId]);
      }
    }

    await query('COMMIT');

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath(`/${originalSlug}`);
    if (newSlug !== originalSlug) {
      revalidatePath(`/${newSlug}`);
    }

    return { success: true, slug: newSlug };
  } catch (err) {
    await query('ROLLBACK');
    console.error('Failed to update post:', err);
    throw err;
  }
}

export async function deletePostAction(slug: string) {
  try {
    await query('DELETE FROM posts WHERE slug = $1', [slug]);
    
    revalidatePath('/admin');
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to delete post:', error);
    throw new Error('Database query failed.');
  }
}