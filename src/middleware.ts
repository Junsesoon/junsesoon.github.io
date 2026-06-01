import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken, signAdminToken } from '@/utils/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const authCookie = request.cookies.get('admin_auth');
  const isAuthenticated = authCookie?.value ? await verifyAdminToken(authCookie.value) : false;

  // 1. 인증되지 않은 사용자가 로그인 페이지가 아닌 다른 admin 경로에 접근하려 할 때 -> 로그인 페이지로 리다이렉트
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!isAuthenticated) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('admin_auth'); // 만료되거나 유효하지 않은 쿠키 삭제
      return response;
    }
  }

  // 2. 이미 인증된 사용자가 로그인 페이지에 접근하려 할 때 -> 관리자 대시보드로 리다이렉트
  if (pathname === '/admin/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  const response = NextResponse.next();

  // 3. 인증된 사용자라면 활동(접근)이 있을 때마다 토큰과 쿠키를 60분으로 갱신 (Sliding Session)
  if (isAuthenticated) {
    const newToken = await signAdminToken();
    response.cookies.set({
      name: 'admin_auth',
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 60분
    });
  }

  return response;
}

export const config = {
  // 미들웨어가 실행될 경로 설정 (/admin 및 그 하위 모든 경로)
  matcher: ['/admin/:path*'],
};