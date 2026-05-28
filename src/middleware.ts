import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const authCookie = request.cookies.get('admin_auth');
  const isAuthenticated = authCookie?.value === 'authenticated';

  // 1. 인증되지 않은 사용자가 로그인 페이지가 아닌 다른 admin 경로에 접근하려 할 때 -> 로그인 페이지로 리다이렉트
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // 2. 이미 인증된 사용자가 로그인 페이지에 접근하려 할 때 -> 관리자 대시보드로 리다이렉트
  if (pathname === '/admin/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // 미들웨어가 실행될 경로 설정 (/admin 및 그 하위 모든 경로)
  matcher: ['/admin/:path*'],
};