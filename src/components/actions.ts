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
    const { content, ...properties } = data;

    // 3. .env(DB_ENV)에 의해 연결된 DB로 쿼리 실행
    // 만약 중복된 슬러그가 있을 경우 덮어쓰기(Upsert)를 수행해 에러를 방지합니다.
    await query(
      `INSERT INTO posts (slug, content, properties)
       VALUES ($1, $2, $3)
      ON CONFLICT (slug) DO UPDATE SET
         content = EXCLUDED.content,
         properties = EXCLUDED.properties,
         updated_at = CURRENT_TIMESTAMP`,
      [slug, content || '', JSON.stringify(properties)]
    );

    // 4. 캐시를 무효화하여 Admin 대시보드와 블로그 홈에서 새로운 데이터를 즉시 가져오도록 조치합니다.
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
  const cleanSlugPart = (str: string) =>
    str.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/(^-|-$)+/g, '');

  const slugParts = [];
  if (data.category1) slugParts.push(cleanSlugPart(data.category1));
  if (data.category2) slugParts.push(cleanSlugPart(data.category2));
  if (data.category3) slugParts.push(cleanSlugPart(data.category3));
  if (data.category4) slugParts.push(cleanSlugPart(data.category4));

  const titleSlug = cleanSlugPart(data.title) || `post-${Date.now()}`;
  slugParts.push(titleSlug);

  const newSlug = slugParts.join('/');

  try {
    const { content, ...properties } = data;

    await query(
      `UPDATE posts
       SET slug = $1, content = $2, properties = $3, updated_at = CURRENT_TIMESTAMP
       WHERE slug = $4`,
      [newSlug, content || '', JSON.stringify(properties), originalSlug]
    );

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
    return { success: true };
  } catch (error: any) {
    console.error('addTemplateAction error:', error);
    if (error.code === '23505') { // PostgreSQL Unique Violation
      return { success: false, message: 'Template already exists in database.' };
    }
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