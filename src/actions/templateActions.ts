'use server';

import { query } from '../infra/neon';
import { revalidatePath } from 'next/cache';

export async function addTemplateAction(templateName: string) {
  if (!templateName || !templateName.trim()) {
    return { success: false, message: 'Template name is required.' };
  }

  const sanitizedName = templateName.trim().toLowerCase();

  try {
    await query(
      'INSERT INTO template_list (template_name) VALUES ($1)',
      [sanitizedName]
    );
    revalidatePath('/admin/template');
    revalidatePath('/admin/write'); // 글쓰기 페이지의 템플릿 목록도 갱신
    return { success: true };
  } catch (error: any) {
    console.error('addTemplateAction error:', error);
    if (error.code === '23505') { // PostgreSQL Unique Violation
      return { success: false, message: 'Template already exists in database.' };
    }
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function deleteTemplateAction(templateName: string) {
  if (!templateName) {
    return { success: false, message: 'Template name is required.' };
  }

  try {
    // ON DELETE CASCADE 제약 조건에 의해 매핑된 template_property 데이터도 자동 삭제됩니다.
    await query('DELETE FROM template_list WHERE template_name = $1', [templateName.trim().toLowerCase()]);
    revalidatePath('/admin/template');
    revalidatePath('/admin/write');
    return { success: true };
  } catch (error: any) {
    console.error('deleteTemplateAction error:', error);
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function getTemplatesAction() {
  try {
    const result = await query(`
      SELECT tl.template_name, pl.property_name, tp.is_required
      FROM template_list tl
      LEFT JOIN template_property tp ON tl.template_id = tp.template_id
      LEFT JOIN property_list pl ON tp.property_id = pl.property_id
      ORDER BY tl.template_name ASC
    `);

    const templates: Record<string, { propertyName: string; isRequired: boolean }[]> = {};
    result.rows.forEach((row) => {
      if (!templates[row.template_name]) templates[row.template_name] = [];
      if (row.property_name) {
        templates[row.template_name].push({
          propertyName: row.property_name,
          isRequired: row.is_required,
        });
      }
    });
    return templates;
  } catch (error) {
    console.error('getTemplatesAction error:', error);
    return {};
  }
}
