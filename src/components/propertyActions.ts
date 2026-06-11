'use server';

import { revalidatePath } from 'next/cache';
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
    revalidatePath('/admin/property');
    revalidatePath('/admin/template');
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

    // 1. 템플릿 매핑 데이터 우선 삭제 (Foreign Key 제약 조건 위반 방지)
    await query(
      'DELETE FROM template_property WHERE property_id IN (SELECT property_id FROM property_list WHERE property_name = $1)',
      [propertyName.trim()]
    );

    // 2. property_list 테이블에서 속성 삭제
    await query(
      'DELETE FROM property_list WHERE property_name = $1',
      [propertyName.trim()]
    );

    // 3. 해당 속성을 가지고 있는 모든 게시물의 JSONB에서 해당 키와 데이터 일괄 삭제 (명시적 형변환 추가)
    await query(
      `UPDATE posts
       SET properties = properties - $1::text,
           updated_at = CURRENT_TIMESTAMP
       WHERE properties ? $1::text`,
      [propertyName.trim()]
    );

    await query('COMMIT');
    revalidatePath('/admin/property');
    revalidatePath('/admin/template');
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
    revalidatePath('/admin/template');
    revalidatePath('/admin/property');
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
    revalidatePath('/admin/template');
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

  const newTrimmed = newName.trim();
  if (oldName === newTrimmed) {
    return { success: true };
  }

  try {
    await query('BEGIN');

    // 1. 새 이름이 이미 존재하는지 확인 (Merge 시나리오 판별)
    const targetPropResult = await query('SELECT property_id, property_type FROM property_list WHERE property_name = $1', [newTrimmed]);
    const isMerge = targetPropResult.rowCount !== null && targetPropResult.rowCount > 0;

    if (isMerge) {
      const targetType = targetPropResult.rows[0].property_type || 'string';
      const targetId = targetPropResult.rows[0].property_id;

      // 병합 시 타겟 타입에 맞춘 안전한 형변환 캐스팅 준비
      let castSql = `to_jsonb(properties->>$2)`; 
      if (targetType === 'number') {
        castSql = `to_jsonb((properties->>$2)::numeric)`;
      } else if (targetType === 'boolean') {
        castSql = `to_jsonb((properties->>$2)::boolean)`;
      } else if (targetType === 'date') {
        castSql = `to_jsonb((properties->>$2)::timestamp)`;
      } else if (targetType === 'array') {
        castSql = `
          CASE 
            WHEN jsonb_typeof(properties->$2) = 'array' THEN properties->$2
            ELSE to_jsonb(string_to_array(properties->>$2, ','))
          END
        `;
      }

      // 2. 게시물 JSONB 데이터 동기화 (새 속성이 이미 있으면 유지, 없으면 기존 값을 변환해서 병합)
      await query(
        `UPDATE posts
         SET properties = jsonb_set(properties - $2, ARRAY[$1::text], COALESCE(properties->$1, ${castSql})),
             updated_at = CURRENT_TIMESTAMP
         WHERE properties ? $2`,
        [newTrimmed, oldName]
      );

      // 3. 템플릿 매핑 이전 (새 속성이 없는 템플릿에만 기존 속성의 정보를 추가 후 충돌 무시)
      await query(
        `INSERT INTO template_property (template_id, property_id, is_required)
         SELECT template_id, $1, is_required FROM template_property
         WHERE property_id = (SELECT property_id FROM property_list WHERE property_name = $2)
         ON CONFLICT DO NOTHING`,
        [targetId, oldName]
      );

      // 4. 기존 속성 및 잔여 매핑 깔끔하게 삭제
      await query(`DELETE FROM template_property WHERE property_id = (SELECT property_id FROM property_list WHERE property_name = $1)`, [oldName]);
      await query('DELETE FROM property_list WHERE property_name = $1', [oldName]);

    } else {
      // 단순 이름 변경 (Simple Rename)
      await query('UPDATE property_list SET property_name = $1 WHERE property_name = $2', [newTrimmed, oldName]);
      await query(
        `UPDATE posts
         SET properties = (properties - $2) || jsonb_build_object($1::text, properties->$2),
             updated_at = CURRENT_TIMESTAMP
         WHERE properties ? $2`,
        [newTrimmed, oldName]
      );
    }

    await query('COMMIT');
    return { success: true };
  } catch (error: any) {
    await query('ROLLBACK');
    console.error('renameGlobalPropertyAction error:', error);

    // PostgreSQL 타입 캐스팅 에러 (안전한 병합 실패)
    if (error.code === '22P02' || error.code === '22007') {
      let problemTitles: string[] = [];
      try {
        const checkResult = await query('SELECT title, properties->>$1 as val FROM posts WHERE properties ? $1', [oldName]);
        const targetPropResult = await query('SELECT property_type FROM property_list WHERE property_name = $1', [newTrimmed]);
        const newType = targetPropResult.rows[0]?.property_type || 'string';

        for (const row of checkResult.rows) {
          const val = row.val;
          if (val === null || val === undefined) continue;
          
          let isInvalid = false;
          if (newType === 'number') {
            if (val.trim() === '' || isNaN(Number(val))) isInvalid = true;
          } else if (newType === 'boolean') {
            const lowerVal = val.trim().toLowerCase();
            if (!['true', 'false', 't', 'f', 'yes', 'no', 'y', 'n', '1', '0'].includes(lowerVal)) isInvalid = true;
          } else if (newType === 'date') {
            if (isNaN(Date.parse(val))) isInvalid = true;
          }
          
          if (isInvalid) problemTitles.push(row.title || '제목 없음');
        }
      } catch (checkErr) {
        console.error('Failed to find problematic posts:', checkErr);
      }

      let message = `병합하려는 새 속성('${newTrimmed}')의 타입과 기존 데이터가 호환되지 않아 병합이 취소되었습니다.`;
      if (problemTitles.length > 0) {
        message += `\n\n[충돌 발생 게시물]\n- ${problemTitles.slice(0, 3).join('\n- ')}`;
        if (problemTitles.length > 3) message += `\n...외 ${problemTitles.length - 3}건`;
      }
      return { success: false, message };
    }

    if (error.code === '23505') return { success: false, message: 'Property name already exists.' };
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
    revalidatePath('/admin/property');
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

export async function updatePropertyTypeAction(propertyName: string, newType: string) {
  if (!propertyName || !newType) {
    return { success: false, message: 'Valid property name and type are required.' };
  }

  try {
    await query('BEGIN');

    // 1. property_list 테이블 타입 업데이트
    await query(
      'UPDATE property_list SET property_type = $1 WHERE property_name = $2',
      [newType, propertyName]
    );

    // 2. posts 테이블의 기존 JSONB 데이터 형변환 (안전한 캐스팅)
    let castSql = `to_jsonb(properties->>$1)`; // string (기본)
    if (newType === 'number') {
      castSql = `to_jsonb((properties->>$1)::numeric)`;
    } else if (newType === 'boolean') {
      castSql = `to_jsonb((properties->>$1)::boolean)`;
    } else if (newType === 'date') {
      castSql = `to_jsonb((properties->>$1)::timestamp)`;
    } else if (newType === 'array') {
      castSql = `
        CASE 
          WHEN jsonb_typeof(properties->$1) = 'array' THEN properties->$1
          ELSE to_jsonb(string_to_array(properties->>$1, ','))
        END
      `;
    }

    await query(
      `UPDATE posts
       SET properties = jsonb_set(properties, ARRAY[$1::text], ${castSql}),
           updated_at = CURRENT_TIMESTAMP
       WHERE properties ? $1`,
      [propertyName]
    );

    await query('COMMIT');
    revalidatePath('/admin/property');
    revalidatePath('/admin/template');
    return { success: true };
  } catch (error: any) {
    await query('ROLLBACK');
    console.error('updatePropertyTypeAction error:', error);

    // PostgreSQL 타입 캐스팅 에러 (22P02: invalid text representation, 22007: invalid datetime format)
    if (error.code === '22P02' || error.code === '22007') {
      let problemTitles: string[] = [];
      try {
        // 어떤 게시물에서 충돌이 났는지 찾기 위해 데이터 재조회
        const checkResult = await query('SELECT title, properties->>$1 as val FROM posts WHERE properties ? $1', [propertyName]);
        for (const row of checkResult.rows) {
          const val = row.val;
          if (val === null || val === undefined) continue;
          
          let isInvalid = false;
          if (newType === 'number') {
            if (val.trim() === '' || isNaN(Number(val))) isInvalid = true;
          } else if (newType === 'boolean') {
            const lowerVal = val.trim().toLowerCase();
            if (!['true', 'false', 't', 'f', 'yes', 'no', 'y', 'n', '1', '0'].includes(lowerVal)) isInvalid = true;
          } else if (newType === 'date') {
            if (isNaN(Date.parse(val))) isInvalid = true;
          }
          
          if (isInvalid) problemTitles.push(row.title || '제목 없음');
        }
      } catch (checkErr) {
        console.error('Failed to find problematic posts:', checkErr);
      }

      let message = `기존 데이터 중 '${newType}' 타입으로 변환할 수 없는 값이 포함되어 있어 변경이 취소되었습니다.`;
      if (problemTitles.length > 0) {
        message += `\n\n[충돌 발생 게시물]\n- ${problemTitles.slice(0, 3).join('\n- ')}`;
        if (problemTitles.length > 3) message += `\n...외 ${problemTitles.length - 3}건`;
      }

      return { 
        success: false, 
        message
      };
    }

    return { success: false, message: 'Internal Server Error' };
  }
}