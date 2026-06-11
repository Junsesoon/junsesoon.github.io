'use server';

import { query } from '../infra/db';
import { PostFormData } from '@/components/PostEditor';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { signAdminToken } from '@/utils/auth';

// IP별 로그인 시도 횟수와 잠금 해제 시간을 기록하는 in-memory 저장소
const loginAttempts = new Map<string, { attempts: number; lockUntil: number }>();

export async function createPostAction(data: PostFormData) {
  // 1. 작성된 카테고리와 제목을 기반으로 URL 슬러그 생성
  const cleanSlugPart = (str: string) => {
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

  const slugParts = [];
  if (data.category1) slugParts.push(cleanSlugPart(data.category1));
  if (data.category2) slugParts.push(cleanSlugPart(data.category2));
  if (data.category3) slugParts.push(cleanSlugPart(data.category3));
  if (data.category4) slugParts.push(cleanSlugPart(data.category4));

  const titleSlug = cleanSlugPart(data.title) || `post-${Date.now()}`;
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

    const { content, title, ...properties } = data;
    const propertyNames = Object.keys(properties);

    // 1. 게시물 작성 시 사용된 모든 속성 키를 전역 property_list에 자동 등록 (없는 경우에만 삽입)
    if (propertyNames.length > 0) {
      await query(
        `INSERT INTO property_list (property_name)
         SELECT UNNEST($1::text[])
         ON CONFLICT (property_name) DO NOTHING`,
        [propertyNames]
      );
    }

    // 2. .env(DB_ENV)에 의해 연결된 DB로 쿼리 실행
    // 만약 중복된 슬러그가 있을 경우 덮어쓰기(Upsert)를 수행해 에러를 방지합니다.
    const result = await query(
      `INSERT INTO posts (slug, content, title, properties)
       VALUES ($1, $2, $3, $4)
      ON CONFLICT (slug) DO UPDATE SET
         content = EXCLUDED.content,
         title = EXCLUDED.title,
         properties = EXCLUDED.properties,
         updated_at = CURRENT_TIMESTAMP
       RETURNING post_id`,
      [slug, content || '', title || '', JSON.stringify(properties)]
    );

    const postId = result.rows[0]?.post_id;

    if (postId) {
      const cat1 = String(properties.category1 || '').trim().toLowerCase().replace(/[-\s_]+/g, '');
      
      if (cat1 === 'skilltree') {
        const domain = properties.category2 ? String(properties.category2) : null;
        const sub_domain = properties.category3 ? String(properties.category3) : null;
        
        const techStartStr = String(properties.techStart || '');
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
          [postId, domain, sub_domain, tech_start, toArray(properties.parentSkill), toArray(properties.childSkill)]
        );
      }
    }

    // 3. 캐시를 무효화하여 Admin 대시보드와 블로그 홈에서 새로운 데이터를 즉시 가져오도록 조치합니다.
    revalidatePath('/admin');
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to create post:', error);
    throw new Error('Database query failed.');
  }
}

export async function loginAction(password: string) {
  const headerList = await headers();
  // Next.js에서 클라이언트 IP를 가져오는 표준적인 방법입니다.
  const ip = headerList.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  const record = loginAttempts.get(ip) ?? { attempts: 0, lockUntil: 0 };

  // 차단 시간이 아직 지나지 않았을 경우
  if (record.lockUntil > now) {
    const remainingSeconds = Math.ceil((record.lockUntil - now) / 1000);
    return { success: false, message: `5회 연속 실패했습니다.\n${remainingSeconds}초 후 다시 시도해주세요.` };
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    record.attempts += 1;
    
    if (record.attempts >= 5) {
      record.lockUntil = now + 30 * 1000; // 현재 시간 + 30초로 잠금
      loginAttempts.set(ip, record);
      return { success: false, message: '5회 연속 실패했습니다.\n30초 후 다시 시도해주세요.' };
    }
    
    loginAttempts.set(ip, record);
    return { success: false, message: `비밀번호가 올바르지 않습니다. (실패 횟수: ${record.attempts}/5)` };
  }

  // 성공 시 시도 횟수 초기화 (잠금 해제)
  loginAttempts.delete(ip);

  const token = await signAdminToken();

  (await cookies()).set('admin_auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 쿠키 유효기간 1일
  });

  return { success: true };
}

export async function logoutAction() {
  (await cookies()).delete('admin_auth');
  redirect('/');
}

export async function updatePostAction(originalSlug: string, data: PostFormData) {
  const cleanSlugPart = (str: string) => {
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

  const slugParts = [];
  if (data.category1) slugParts.push(cleanSlugPart(data.category1));
  if (data.category2) slugParts.push(cleanSlugPart(data.category2));
  if (data.category3) slugParts.push(cleanSlugPart(data.category3));
  if (data.category4) slugParts.push(cleanSlugPart(data.category4));

  const titleSlug = cleanSlugPart(data.title) || `post-${Date.now()}`;
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

    const { content, title, ...properties } = data;
    const propertyNames = Object.keys(properties);

    // 1. 게시물 수정 시 사용된 모든 속성 키를 전역 property_list에 자동 등록 (없는 경우에만 삽입)
    if (propertyNames.length > 0) {
      await query(
        `INSERT INTO property_list (property_name)
         SELECT UNNEST($1::text[])
         ON CONFLICT (property_name) DO NOTHING`,
        [propertyNames]
      );
    }

    const result = await query(
      `UPDATE posts
       SET slug = $1, content = $2, title = $3, properties = $4, updated_at = CURRENT_TIMESTAMP
       WHERE slug = $5
       RETURNING post_id`,
      [newSlug, content || '', title || '', JSON.stringify(properties), originalSlug]
    );

    const postId = result.rows[0]?.post_id;

    if (postId) {
      const cat1 = String(properties.category1 || '').trim().toLowerCase().replace(/[-\s_]+/g, '');
      
      if (cat1 === 'skilltree') {
        const domain = properties.category2 ? String(properties.category2) : null;
        const sub_domain = properties.category3 ? String(properties.category3) : null;
        
        const techStartStr = String(properties.techStart || '');
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
          [postId, domain, sub_domain, tech_start, toArray(properties.parentSkill), toArray(properties.childSkill)]
        );
      } else {
        // 스킬 트리에서 다른 템플릿(일반 카테고리)으로 속성이 변경된 경우 연관 데이터 Clean-up
        await query('DELETE FROM skilltree_posts WHERE post_id = $1', [postId]);
      }
    }

    revalidatePath('/admin');
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to update post:', error);
    throw new Error('Database query failed.');
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

export async function batchUpdateLocationAction(slugs: string[], newLocation: string) {
  if (!slugs || slugs.length === 0 || !newLocation) {
    return { success: false, message: 'Invalid parameters.' };
  }

  try {
    await query(
      `UPDATE posts
       SET properties = properties || jsonb_build_object('location', $1::text),
           updated_at = CURRENT_TIMESTAMP
       WHERE slug = ANY($2::text[])`,
      [newLocation, slugs]
    );
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('batchUpdateLocationAction error:', error);
    return { success: false, message: 'Internal Server Error' };
  }
}