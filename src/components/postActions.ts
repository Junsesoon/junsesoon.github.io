'use server';

import { query } from '../infra/db';
import { revalidatePath } from 'next/cache';

// 슬러그 자동 생성 유틸리티
function generateSlug(title: string) {
  return title.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
}

export async function createPostAction(formData: any) {
  const { _isDraft, title, content, ...properties } = formData;

  const safeTitle = title?.trim() || 'Untitled';
  const safeContent = content || '';
  
  let slug = safeTitle === 'Untitled' ? `untitled-${Date.now()}` : generateSlug(safeTitle);
  
  // 슬러그 중복 검사
  const existing = await query('SELECT slug FROM posts WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) {
    slug = `${slug}-${Date.now()}`;
  }

  await query('BEGIN');
  try {
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
    if (properties.category1 === 'skilltree') {
      await query(
        `INSERT INTO skilltree_posts (post_id, domain, sub_domain, tech_start, parent_skill, child_skill) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          postId, 
          properties.category2 || null, 
          properties.category3 || null, 
          properties.techstart || null,
          properties.parentskill ? (Array.isArray(properties.parentskill) ? properties.parentskill.join(', ') : properties.parentskill) : null,
          properties.childskill ? (Array.isArray(properties.childskill) ? properties.childskill.join(', ') : properties.childskill) : null
        ]
      );
    }

    await query('COMMIT');
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }

  revalidatePath('/');
  revalidatePath('/admin');
  
  return { success: true, slug };
}

export async function updatePostAction(originalSlug: string, formData: any) {
  const { _isDraft, title, content, ...properties } = formData;

  const safeTitle = title?.trim() || 'Untitled';
  const safeContent = content || '';

  await query('BEGIN');
  try {
    const postRes = await query('SELECT post_id, post_status FROM posts WHERE slug = $1', [originalSlug]);
    if (postRes.rows.length === 0) throw new Error('Post not found');
    
    const postId = postRes.rows[0].post_id;
    const currentStatus = postRes.rows[0].post_status;

    if (_isDraft) {
      if (currentStatus === 'draft') {
        // 한 번도 발행되지 않은 새 글의 임시저장 업데이트: 원본 보호 불필요, 전체 덮어쓰기
        await query(
          `UPDATE posts 
           SET title = $1,
               content = $2,
               properties = $3,
               draft_title = $1, 
               draft_content = $2, 
               draft_properties = $3,
               updated_at = CURRENT_TIMESTAMP
           WHERE slug = $4`,
          [safeTitle, safeContent, properties, originalSlug]
        );
      } else {
        // 기존에 발행된 글 임시저장 (1번 방안): 대중에게 노출 중인 원본 데이터는 보호하고 draft_* 컬럼만 조용히 업데이트
        await query(
          `UPDATE posts 
           SET draft_title = $1, 
               draft_content = $2, 
               draft_properties = $3,
               post_status = 'editing',
               updated_at = CURRENT_TIMESTAMP
           WHERE slug = $4`,
          [safeTitle, safeContent, properties, originalSlug]
        );
      }
    } else {
      // 정식 발행: 보관 중이던 draft 데이터를 비우고, 원본 데이터를 덮어쓰며 상태를 'published'로 전환
      await query(
        `UPDATE posts 
         SET title = $1, 
             content = $2, 
             properties = $3, 
             post_status = 'published',
             draft_title = NULL, 
             draft_content = NULL, 
             draft_properties = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE slug = $4`,
        [safeTitle, safeContent, properties, originalSlug]
      );

      // 스킬트리 확장 테이블 강제 동기화 (임시저장본이 스킬트리 라이브 뷰를 망치는 것 방지)
      if (properties.category1 === 'skilltree') {
        await query(
          `INSERT INTO skilltree_posts (post_id, domain, sub_domain, tech_start, parent_skill, child_skill) 
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (post_id) DO UPDATE SET 
             domain = EXCLUDED.domain,
             sub_domain = EXCLUDED.sub_domain,
             tech_start = EXCLUDED.tech_start,
             parent_skill = EXCLUDED.parent_skill,
             child_skill = EXCLUDED.child_skill`,
          [
            postId, 
            properties.category2 || null, 
            properties.category3 || null, 
            properties.techstart || null,
            properties.parentskill ? (Array.isArray(properties.parentskill) ? properties.parentskill.join(', ') : properties.parentskill) : null,
            properties.childskill ? (Array.isArray(properties.childskill) ? properties.childskill.join(', ') : properties.childskill) : null
          ]
        );
      } else {
        // 스킬트리에서 일반 블로그 카테고리로 변경되었을 경우 잉여 데이터 클린업
        await query(`DELETE FROM skilltree_posts WHERE post_id = $1`, [postId]);
      }
    }

    await query('COMMIT');
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/${originalSlug}`);
  
  return { success: true };
}