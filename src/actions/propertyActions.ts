'use server';

import { revalidatePath } from 'next/cache';
import { query } from '../infra/neon';

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

export async function checkUppercasePropertiesAction() {
  try {
    // 1. 전역 속성(property_list) 테이블에서 대문자가 포함된 속성 검색
    const listResult = await query(
      `SELECT property_name FROM property_list WHERE property_name ~ '[A-Z]'`
    );
    const dbProperties = listResult.rows.map(row => row.property_name);

    // 2. 게시물(posts) 테이블 내부의 JSONB properties에서 대문자 키를 포함한 게시물 검색
    const postsResult = await query(
      `SELECT title, slug, key AS uppercase_key
       FROM posts, jsonb_object_keys(COALESCE(properties, '{}'::jsonb)) AS key
       WHERE key ~ '[A-Z]'`
    );
    const postProperties = postsResult.rows.map(row => ({
      title: row.title || '제목 없음',
      key: row.uppercase_key
    }));

    return { success: true, dbProperties, postProperties };
  } catch (error) {
    console.error('checkUppercasePropertiesAction error:', error);
    return { success: false, message: '서버 오류가 발생했습니다' };
  }
}

export async function autoNormalizeUppercasePropertiesAction() {
  try {
    // 1. 대문자가 포함된 모든 키 수집 (DB 전역 속성 + JSONB 내부 속성)
    const listResult = await query(
      `SELECT property_name FROM property_list WHERE property_name ~ '[A-Z]'`
    );
    const dbKeys = listResult.rows.map(row => row.property_name);

    const postsResult = await query(
      `SELECT DISTINCT key AS uppercase_key
       FROM posts, jsonb_object_keys(COALESCE(properties, '{}'::jsonb)) AS key
       WHERE key ~ '[A-Z]'`
    );
    const postKeys = postsResult.rows.map(row => row.uppercase_key);

    const allKeys = Array.from(new Set([...dbKeys, ...postKeys]));

    if (allKeys.length === 0) {
      return { success: true, message: '변환할 속성이 없습니다' };
    }

    let successCount = 0;
    let failureMessages = [];

    // 2. 수집된 대문자 키들을 하나씩 소문자로 병합 (기존 renameGlobalPropertyAction의 안전한 형변환 로직 재활용)
    for (const key of allKeys) {
      const lowerKey = key.toLowerCase();
      const res = await renameGlobalPropertyAction(key, lowerKey);
      if (res.success) successCount++;
      else failureMessages.push(`'${key}': ${res.message}`);
    }

    if (failureMessages.length > 0) return { success: false, message: `일부 변환 실패:\n${failureMessages.join('\n')}` };
    return { success: true, message: `총 ${successCount}개의 속성을 성공적으로 변환했습니다!` };
  } catch (error) {
    console.error('autoNormalizeUppercasePropertiesAction error:', error);
    return { success: false, message: '서버 오류가 발생했습니다' };
  }
}

export async function syncAndCleanPropertiesAction() {
  try {
    await query('BEGIN');

    // 1. Sync: 누락된 속성 추가 (posts 테이블의 JSONB 속에는 존재하지만, property_list 테이블에는 없는 키를 찾아 삽입)
    const syncResult = await query(`
      INSERT INTO property_list (property_name, property_type)
      SELECT DISTINCT key, 'string'
      FROM posts, jsonb_object_keys(COALESCE(properties, '{}'::jsonb)) AS key
      ON CONFLICT (property_name) DO NOTHING
      RETURNING property_name
    `);
    const addedCount = syncResult.rowCount || 0;

    // 2. Garbage Collection: 잉여 속성 삭제
    // 조건: 필수 속성(is_essential)이 아니고, 템플릿(template_property)에 연결되어 있지 않으며, 
    // 어떠한 게시물(posts JSONB)에서도 사용되지 않는(Usage = 0) 속성만 안전하게 삭제
    const cleanResult = await query(`
      DELETE FROM property_list
      WHERE (is_essential = false OR is_essential IS NULL)
        AND property_id NOT IN (SELECT property_id FROM template_property)
        AND property_name NOT IN (
          SELECT DISTINCT key FROM posts, jsonb_object_keys(COALESCE(properties, '{}'::jsonb)) AS key
        )
      RETURNING property_name
    `);
    const removedCount = cleanResult.rowCount || 0;

    await query('COMMIT');
    
    revalidatePath('/admin/property');
    revalidatePath('/admin/template');

    return { success: true, message: `동기화 및 정리 완료!\n\n- 누락된 속성 ${addedCount}개 추가됨\n- 잉여 속성 ${removedCount}개 삭제됨` };
  } catch (error) {
    await query('ROLLBACK');
    console.error('syncAndCleanPropertiesAction error:', error);
    return { success: false, message: '서버 오류가 발생했습니다' };
  }
}

export async function previewSyncAndCleanPropertiesAction() {
  try {
    // 1. Preview Sync: 누락되어 추가될 속성 목록 조회
    const syncPreviewResult = await query(`
      SELECT DISTINCT key AS property_name
      FROM posts, jsonb_object_keys(COALESCE(properties, '{}'::jsonb)) AS key
      WHERE key NOT IN (SELECT property_name FROM property_list)
    `);
    const toAdd = syncPreviewResult.rows.map(row => row.property_name);

    // 2. Preview Garbage Collection: 아무 곳에서도 쓰이지 않아 삭제될 속성 목록 조회
    const cleanPreviewResult = await query(`
      SELECT property_name FROM property_list
      WHERE (is_essential = false OR is_essential IS NULL)
        AND property_id NOT IN (SELECT property_id FROM template_property)
        AND property_name NOT IN (SELECT DISTINCT key FROM posts, jsonb_object_keys(COALESCE(properties, '{}'::jsonb)) AS key)
    `);
    const toDelete = cleanPreviewResult.rows.map(row => row.property_name);

    return { success: true, toAdd, toDelete };
  } catch (error) {
    console.error('previewSyncAndCleanPropertiesAction error:', error);
    return { success: false, message: '서버 오류가 발생했습니다' };
  }
}

export async function getPostsUsingPropertyAction(propertyName: string) {
  try {
    const result = await query(
      'SELECT title FROM posts WHERE properties ? $1 ORDER BY title ASC',
      [propertyName]
    );
    return result.rows.map(row => row.title || '제목 없음');
  } catch (error) {
    console.error('getPostsUsingPropertyAction error:', error);
    return [];
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
      let castSql = `
        COALESCE(
          to_jsonb(
            NULLIF(TRIM(BOTH ', ' FROM concat_ws(', ', 
              NULLIF(
                CASE WHEN jsonb_typeof(properties->$1) = 'array' THEN array_to_string(ARRAY(SELECT jsonb_array_elements_text(properties->$1)), ', ')
                     ELSE properties->>$1 END,
              ''),
              NULLIF(
                CASE WHEN jsonb_typeof(properties->$2) = 'array' THEN array_to_string(ARRAY(SELECT jsonb_array_elements_text(properties->$2)), ', ')
                     ELSE properties->>$2 END,
              '')
            )), '')
          ),
          '""'::jsonb
        )
      `; 
      if (targetType === 'number') {
        castSql = `
          COALESCE(
            to_jsonb(COALESCE(CASE WHEN properties ? $1 AND properties->>$1 <> '' THEN (properties->>$1)::numeric ELSE NULL END, CASE WHEN properties ? $2 AND properties->>$2 <> '' THEN (properties->>$2)::numeric ELSE NULL END)),
            '""'::jsonb
          )
        `;
      } else if (targetType === 'boolean') {
        castSql = `
          COALESCE(
            to_jsonb(COALESCE(CASE WHEN properties ? $1 AND properties->>$1 <> '' THEN (properties->>$1)::boolean ELSE NULL END, CASE WHEN properties ? $2 AND properties->>$2 <> '' THEN (properties->>$2)::boolean ELSE NULL END)),
            '""'::jsonb
          )
        `;
      } else if (targetType === 'date') {
        castSql = `
          COALESCE(
            to_jsonb(COALESCE(CASE WHEN properties ? $1 AND properties->>$1 <> '' THEN (properties->>$1)::timestamp ELSE NULL END, CASE WHEN properties ? $2 AND properties->>$2 <> '' THEN (properties->>$2)::timestamp ELSE NULL END)),
            '""'::jsonb
          )
        `;
      } else if (targetType === 'array') {
        castSql = `
          COALESCE(
            (SELECT to_jsonb(array_agg(DISTINCT trim(x))) FROM (
              SELECT jsonb_array_elements_text(
                CASE WHEN jsonb_typeof(properties->$1) = 'array' THEN properties->$1
                     WHEN properties->>$1 = '' OR NOT (properties ? $1) THEN '[]'::jsonb
                     ELSE to_jsonb(ARRAY(SELECT trim(y) FROM unnest(string_to_array(properties->>$1, ',')) AS y)) END
              ) as x
              UNION
              SELECT jsonb_array_elements_text(
                CASE WHEN jsonb_typeof(properties->$2) = 'array' THEN properties->$2
                     WHEN properties->>$2 = '' OR NOT (properties ? $2) THEN '[]'::jsonb
                     ELSE to_jsonb(ARRAY(SELECT trim(y) FROM unnest(string_to_array(properties->>$2, ',')) AS y)) END
              ) as x
            ) t WHERE trim(x) <> ''),
            '[]'::jsonb
          )
        `;
      }

      // 2. 게시물 JSONB 데이터 동기화 (기존 값과 병합될 값을 타겟 타입에 맞게 안전하게 포맷팅 및 결합)
      await query(
        `UPDATE posts
         SET properties = jsonb_set(properties - $2, ARRAY[$1::text], ${castSql}),
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
        const checkResult = await query('SELECT title, properties->>$1 as val1, properties->>$2 as val2 FROM posts WHERE properties ? $1 OR properties ? $2', [oldName, newTrimmed]);
        const targetPropResult = await query('SELECT property_type FROM property_list WHERE property_name = $1', [newTrimmed]);
        const newType = targetPropResult.rows[0]?.property_type || 'string';

        for (const row of checkResult.rows) {
          let isInvalid = false;
          for (const val of [row.val1, row.val2]) {
            if (val === null || val === undefined || val.trim() === '') continue;
            
            if (newType === 'number') {
              if (isNaN(Number(val))) isInvalid = true;
            } else if (newType === 'boolean') {
              const lowerVal = val.trim().toLowerCase();
              if (!['true', 'false', 't', 'f', 'yes', 'no', 'y', 'n', '1', '0'].includes(lowerVal)) isInvalid = true;
            } else if (newType === 'date') {
              if (isNaN(Date.parse(val))) isInvalid = true;
            }
          }
          
          if (isInvalid) problemTitles.push(row.title || '제목 없음');
        }
      } catch (checkErr) {
        console.error('Failed to find problematic posts:', checkErr);
      }

      let message = `병합하려는 새 속성('${newTrimmed}')의 타입과 기존 데이터가 호환되지 않아 병합이 취소되었습니다`;
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

export async function togglePropertyRequiredAction(propertyName: string, isRequired: boolean) {
  if (!propertyName) {
    return { success: false, message: 'Property name is required.' };
  }

  try {
    await query(
      `INSERT INTO property_list (property_name, is_required)
       VALUES ($1, $2)
       ON CONFLICT (property_name) DO UPDATE SET is_required = EXCLUDED.is_required`,
      [propertyName, isRequired]
    );
    revalidatePath('/admin/property');
    return { success: true };
  } catch (error: any) {
    console.error('togglePropertyRequiredAction error:', error);
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function getEssentialPropertiesAction() {
  try {
    const result = await query('SELECT property_name FROM property_list WHERE is_essential = true');
    // 문자열(속성명) 배열만 깔끔하게 추출해서 반환합니다
    return result.rows.map((row) => row.property_name);
  } catch (error) {
    console.error('getEssentialPropertiesAction error:', error);
    return [];
  }
}

export async function getRequiredPropertiesAction() {
  try {
    const result = await query('SELECT property_name FROM property_list WHERE is_required = true');
    return result.rows.map((row) => row.property_name);
  } catch (error) {
    console.error('getRequiredPropertiesAction error:', error);
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
    let castSql = `
      CASE 
        WHEN jsonb_typeof(properties->$1) = 'array' THEN 
          to_jsonb(array_to_string(ARRAY(SELECT jsonb_array_elements_text(properties->$1)), ', '))
        ELSE to_jsonb(properties->>$1)
      END
    `; // string (기본)
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
          WHEN properties->>$1 = '' THEN '[]'::jsonb
          ELSE to_jsonb(ARRAY(SELECT trim(x) FROM unnest(string_to_array(properties->>$1, ',')) AS x))
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

      let message = `기존 데이터 중 '${newType}' 타입으로 변환할 수 없는 값이 포함되어 있어 변경이 취소되었습니다`;
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