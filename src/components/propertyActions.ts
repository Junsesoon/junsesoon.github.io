'use server';

import { query } from '../infra/db';

export async function addGlobalPropertyAction(propertyName: string, propertyType: string) {
  if (!propertyName || !propertyName.trim()) {
    return { success: false, message: 'Property name is required.' };
  }

  try {
    await query(
      `INSERT INTO property_list (property_name, property_type)
       VALUES ($1, $2)
       ON CONFLICT (property_name) DO NOTHING`,
      [propertyName.trim(), propertyType]
    );
    return { success: true };
  } catch (error: any) {
    console.error('addGlobalPropertyAction error:', error);
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function deleteGlobalPropertyAction(propertyName: string) {
  if (!propertyName) {
    return { success: false, message: 'Property name is required.' };
  }

  try {
    await query('BEGIN');

    // 1. property_list 테이블에서 속성 삭제
    await query(
      'DELETE FROM property_list WHERE property_name = $1',
      [propertyName.trim()]
    );

    // 2. 해당 속성을 가지고 있는 모든 게시물의 JSONB에서 해당 키와 데이터 일괄 삭제
    await query(
      `UPDATE posts
       SET properties = properties - $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE properties ? $1`,
      [propertyName.trim()]
    );

    await query('COMMIT');
    return { success: true };
  } catch (error: any) {
    await query('ROLLBACK');
    console.error('deleteGlobalPropertyAction error:', error);
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function addPropertyAction(templateName: string, propertyName: string, propertyType: string, isRequired: boolean) {
  if (!templateName || !propertyName || !propertyName.trim()) {
    return { success: false, message: 'Template name and property name are required.' };
  }

  try {
    // 1. property_list에 없으면 새로 만들고, 있으면 타입을 덮어씌워 property_id를 가져옴
    // 2. template_property 에 템플릿과 매핑 데이터 추가
    await query(
      `WITH prop AS (
         INSERT INTO property_list (property_name, property_type) VALUES ($2, $3)
         ON CONFLICT (property_name) DO UPDATE SET property_type = EXCLUDED.property_type
         RETURNING property_id
       )
       INSERT INTO template_property (template_id, property_id, is_required)
       SELECT template_id, prop.property_id, $4 FROM template_list, prop WHERE template_name = $1`,
      [templateName.trim().toLowerCase(), propertyName.trim(), propertyType, isRequired]
    );
    return { success: true };
  } catch (error: any) {
    console.error('addPropertyAction error:', error);
    if (error.code === '23505') {
      return { success: false, message: 'Property already exists in this template.' };
    }
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function deletePropertyAction(templateName: string, propertyName: string) {
  if (!templateName || !propertyName) {
    return { success: false, message: 'Template name and property name are required.' };
  }

  try {
    await query(
      `DELETE FROM template_property
       WHERE template_id = (SELECT template_id FROM template_list WHERE template_name = $1)
         AND property_id = (SELECT property_id FROM property_list WHERE property_name = $2)`,
      [templateName.trim().toLowerCase(), propertyName.trim()]
    );
    return { success: true };
  } catch (error: any) {
    console.error('deletePropertyAction error:', error);
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function renameGlobalPropertyAction(oldName: string, newName: string) {
  if (!oldName || !newName || !newName.trim()) {
    return { success: false, message: 'Valid property names are required.' };
  }

  try {
    await query('BEGIN');

    // 1. 전역 속성 테이블의 이름 변경
    await query(
      'UPDATE property_list SET property_name = $1 WHERE property_name = $2',
      [newName.trim(), oldName]
    );

    // 2. 해당 속성을 가지고 있는( ? 연산자) 모든 게시물의 JSONB 업데이트
    await query(
      `UPDATE posts
       SET properties = (properties - $2) || jsonb_build_object($1::text, properties->$2),
           updated_at = CURRENT_TIMESTAMP
       WHERE properties ? $2`,
      [newName.trim(), oldName]
    );

    await query('COMMIT');
    return { success: true };
  } catch (error: any) {
    await query('ROLLBACK');
    console.error('renameGlobalPropertyAction error:', error);
    if (error.code === '23505') {
      return { success: false, message: 'Property name already exists.' };
    }
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function togglePropertyEssentialAction(propertyName: string, isEssential: boolean) {
  if (!propertyName) {
    return { success: false, message: 'Property name is required.' };
  }

  try {
    await query(
      `INSERT INTO property_list (property_name, is_essential)
       VALUES ($1, $2)
       ON CONFLICT (property_name) DO UPDATE SET is_essential = EXCLUDED.is_essential`,
      [propertyName, isEssential]
    );
    return { success: true };
  } catch (error: any) {
    console.error('togglePropertyEssentialAction error:', error);
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function getEssentialPropertiesAction() {
  try {
    const result = await query('SELECT property_name FROM property_list WHERE is_essential = true');
    // 문자열(속성명) 배열만 깔끔하게 추출해서 반환합니다.
    return result.rows.map((row) => row.property_name);
  } catch (error) {
    console.error('getEssentialPropertiesAction error:', error);
    return [];
  }
}

export async function getAllPropertyNamesAction() {
  try {
    const result = await query('SELECT property_name FROM property_list ORDER BY property_name ASC');
    return result.rows.map((row) => row.property_name);
  } catch (error) {
    console.error('getAllPropertyNamesAction error:', error);
    return [];
  }
}

export async function getAllPropertiesWithTypesAction() {
  try {
    const result = await query('SELECT property_name, property_type FROM property_list ORDER BY property_name ASC');
    return result.rows.map((row) => ({ name: row.property_name, type: row.property_type || 'string' }));
  } catch (error) {
    console.error('getAllPropertiesWithTypesAction error:', error);
    return [];
  }
}