'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { signAdminToken, verifyAdminToken, getAdminTokenExp } from '@/utils/auth';
import { query as tursoQuery } from '../infra/turso';

// IP별 로그인 시도 횟수와 잠금 해제 시간을 기록하는 in-memory 저장소
const loginAttempts = new Map<string, { attempts: number; lockUntil: number }>();

export async function loginAction(password: string, currentSessionId?: string) {
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

  // 소급 업데이트 로직 적용
  if (currentSessionId && !currentSessionId.startsWith('admin_')) {
    const adminSessionId = `admin_${currentSessionId}`;
    try {
      // 1. visitors_manage 업데이트 (유니크 충돌 방지를 위해 UPDATE OR IGNORE 사용)
      await tursoQuery(
        "UPDATE OR IGNORE visitors_manage SET session_id = ? WHERE session_id = ?",
        [adminSessionId, currentSessionId]
      );
      // 만약 UPDATE OR IGNORE 로 인해 여전히 기존 UUID 데이터가 남아있다면 중복된 것이므로 삭제
      await tursoQuery(
        "DELETE FROM visitors_manage WHERE session_id = ?",
        [currentSessionId]
      );

      // 2. views_manage 업데이트
      await tursoQuery(
        "UPDATE views_manage SET session_id = ? WHERE session_id = ?",
        [adminSessionId, currentSessionId]
      );
    } catch (e) {
      console.error('Failed to migrate admin session in Turso DB:', e);
    }
  }

  return { success: true };
}

export async function logoutAction() {
  (await cookies()).delete('admin_auth');
  redirect('/');
}

export async function checkAdminAuthAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_auth')?.value;
    const isAdmin = token ? await verifyAdminToken(token) : false;
    const exp = token ? await getAdminTokenExp(token) : null;

    // Sliding Session: 인증된 사용자의 요청이 있을 시 세션 만료 시간을 60분 연장
    if (isAdmin && token) {
      const newToken = await signAdminToken();
      cookieStore.set('admin_auth', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60, // 60분
      });
      const newExp = await getAdminTokenExp(newToken);
      return { isAdmin: true, exp: newExp };
    }

    return { isAdmin: false, exp: null };
  } catch (error) {
    console.error('Error verifying admin status in Action:', error);
    return { isAdmin: false, exp: null };
  }
}
