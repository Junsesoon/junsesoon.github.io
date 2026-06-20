'use server';

import { query } from '../infra/neon';
import { revalidatePath } from 'next/cache';

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
    await query(
      `UPDATE skilltree_domains
       SET title = $1, description = $2, match_category2 = $3, display_order = COALESCE($4, display_order), updated_at = CURRENT_TIMESTAMP
       WHERE domain_id = $5`,
      [title.trim(), description ? description.trim() : '', matchCategory2.trim(), displayOrder ?? null, id]
    );
    revalidatePath('/admin/skilltree');
    revalidatePath('/skilltree');
    return { success: true };
  } catch (error: any) {
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