'use server';

import { query } from '../infra/neon';
import { revalidatePath } from 'next/cache';

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

export async function addSkillTreeDomainAction(title: string, description: string, matchCategory2: string, displayOrder: number = 0) {
  if (!title || !title.trim() || !matchCategory2 || !matchCategory2.trim()) {
    return { success: false, message: 'Title and Match Category2 are required.' };
  }

  try {
    await query(
      `INSERT INTO skilltree_domains (title, description, match_category2, display_order)
       VALUES ($1, $2, $3, $4)`,
      [title.trim(), description ? description.trim() : '', matchCategory2.trim(), displayOrder]
    );
    revalidatePath('/admin/skilltree');
    revalidatePath('/skilltree');
    return { success: true };
  } catch (error: any) {
    console.error('addSkillTreeDomainAction error:', error);
    if (error.code === '23505') { // PostgreSQL Unique Violation
      return { success: false, message: 'A domain with this Match Category2 already exists.' };
    }
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function getSkillTreeDomainsAction() {
  try {
    const result = await query(
      'SELECT domain_id as id, title, description, match_category2 as "matchCategory2", display_order as "displayOrder" FROM skilltree_domains ORDER BY display_order ASC, domain_id ASC'
    );
    return result.rows;
  } catch (error) {
    console.error('getSkillTreeDomainsAction error:', error);
    return [];
  }
}

export async function deleteSkillTreeDomainAction(id: number) {
  if (!id) {
    return { success: false, message: 'Domain ID is required.' };
  }

  try {
    await query('DELETE FROM skilltree_domains WHERE domain_id = $1', [id]);
    revalidatePath('/admin/skilltree');
    revalidatePath('/skilltree');
    return { success: true };
  } catch (error: any) {
    console.error('deleteSkillTreeDomainAction error:', error);
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function updateSkillTreeDomainAction(id: number, title: string, description: string, matchCategory2: string, displayOrder?: number) {
  if (!id || !title || !title.trim() || !matchCategory2 || !matchCategory2.trim()) {
    return { success: false, message: 'ID, Title, and Match Category2 are required.' };
  }

  try {
    const oldRes = await query('SELECT match_category2 FROM skilltree_domains WHERE domain_id = $1', [id]);
    const oldMatchCategory2 = oldRes.rows[0]?.match_category2;

    await query('BEGIN');

    // 1. 도메인 자체 정보 업데이트
    await query(
      `UPDATE skilltree_domains
       SET title = $1, description = $2, match_category2 = $3, display_order = COALESCE($4, display_order), updated_at = CURRENT_TIMESTAMP
       WHERE domain_id = $5`,
      [title.trim(), description ? description.trim() : '', matchCategory2.trim(), displayOrder ?? null, id]
    );

    // 2. matchCategory2 변경 시, 소속된 카드들의 category2 정보 일괄 수정
    if (oldMatchCategory2 && oldMatchCategory2 !== matchCategory2.trim()) {
      const targetDomain = matchCategory2.trim();

      // skilltree_posts 테이블의 domain 칼럼 변경
      await query(
        `UPDATE skilltree_posts SET domain = $1 WHERE domain = $2`,
        [targetDomain, oldMatchCategory2]
      );

      // 해당 도메인에 속한 posts 전체 목록 조회
      const postsRes = await query(
        `SELECT p.post_id, p.slug, p.title, p.properties, p.draft_properties 
         FROM posts p
         JOIN skilltree_posts sp ON p.post_id = sp.post_id
         WHERE sp.domain = $1`,
        [targetDomain]
      );

      for (const row of postsRes.rows) {
        const postId = row.post_id;
        const currentTitle = row.title || 'Untitled';

        // properties JSONB 수정
        const properties = row.properties || {};
        properties.category2 = targetDomain;

        // draft_properties JSONB 수정
        const draftProperties = row.draft_properties;
        if (draftProperties) {
          draftProperties.category2 = targetDomain;
        }

        // 새로운 슬러그 재계산
        const slugParts = [];
        if (properties.category1) slugParts.push(cleanSlug(properties.category1));
        if (properties.category2) slugParts.push(cleanSlug(properties.category2));
        if (properties.category3) slugParts.push(cleanSlug(properties.category3));
        if (properties.category4) slugParts.push(cleanSlug(properties.category4));

        const titleSlug = cleanSlug(currentTitle) || `post-${Date.now()}`;
        slugParts.push(titleSlug);

        const baseSlug = slugParts.join('/');
        let newSlug = baseSlug;
        let counter = 1;

        // 중복 슬러그 검사 및 넘버링 처리 (자신은 제외)
        while (true) {
          const check = await query('SELECT post_id FROM posts WHERE slug = $1 AND post_id != $2', [newSlug, postId]);
          if ((check.rowCount ?? 0) === 0) break;
          newSlug = `${baseSlug}-${counter}`;
          counter++;
        }

        // posts 테이블에 새로운 properties 및 슬러그 업데이트
        await query(
          `UPDATE posts 
           SET slug = $1, 
               properties = $2, 
               draft_properties = CASE WHEN draft_properties IS NOT NULL THEN $3::jsonb ELSE NULL END,
               updated_at = CURRENT_TIMESTAMP
           WHERE post_id = $4`,
          [newSlug, properties, draftProperties || null, postId]
        );
      }
    }

    await query('COMMIT');

    revalidatePath('/admin/skilltree');
    revalidatePath('/skilltree');
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    await query('ROLLBACK');
    console.error('updateSkillTreeDomainAction error:', error);
    if (error.code === '23505') { // PostgreSQL Unique Violation
      return { success: false, message: 'A domain with this Match Category2 already exists.' };
    }
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function updateSkillTreeDomainOrdersAction(orders: { id: number; displayOrder: number }[]) {
  if (!orders || orders.length === 0) {
    return { success: false, message: 'No orders provided.' };
  }

  try {
    await query('BEGIN');
    for (const { id, displayOrder } of orders) {
      await query(
        'UPDATE skilltree_domains SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE domain_id = $2',
        [displayOrder, id]
      );
    }
    await query('COMMIT');
    revalidatePath('/admin/skilltree');
    revalidatePath('/skilltree');
    return { success: true };
  } catch (error: any) {
    await query('ROLLBACK');
    console.error('updateSkillTreeDomainOrdersAction error:', error);
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function getSkillTreeCardsAction() {
  try {
    const result = await query(`
      SELECT p.slug, p.title, p.content, p.properties, sp.domain as category2, sp.sub_domain as category3, sp.parent_skill
      FROM posts p
      JOIN skilltree_posts sp ON p.post_id = sp.post_id
      ORDER BY p.created_at DESC
    `);
    return result.rows.map((row) => ({
      slug: row.slug,
      title: row.title || 'Untitled',
      content: row.content || '',
      properties: row.properties || {},
      category2: row.category2 || '',
      category3: row.category3 || '',
      parentSkill: Array.isArray(row.parent_skill) ? row.parent_skill.join(', ') : (row.parent_skill || ''),
    }));
  } catch (error) {
    console.error('getSkillTreeCardsAction error:', error);
    return [];
  }
}