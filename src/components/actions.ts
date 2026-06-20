'use server';

import { query } from '../infra/neon';

import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { signAdminToken } from '@/utils/auth';

// IP별 로그인 시도 횟수와 잠금 해제 시간을 기록하는 in-memory 저장소
const loginAttempts = new Map<string, { attempts: number; lockUntil: number }>();

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