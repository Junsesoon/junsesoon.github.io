import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/infra/turso';

export async function POST(req: Request) {
  try {
    // 1. Vercel 인프라 헤더로부터 실제 클라이언트 IP 추출
    const ip = req.headers.get('x-real-ip') || 
               req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               '127.0.0.1';
               
    // 2. IP 암호화 해싱 처리
    const salt = process.env.TURSO_IP_SALT || 'default-salt-key';
    const ipHash = crypto
      .createHash('sha256')
      .update(ip + salt)
      .digest('hex');

    // 3. 요청 바디 데이터 추출
    const body = await req.json();
    const path = body.path;

    if (!path) {
      return NextResponse.json({ success: false, error: 'Path is required' }, { status: 400 });
    }

    // 4. Turso DB에 접속 로그 적재
    await query(
      'INSERT INTO ip_request_logs (ip_hash, path) VALUES (?, ?)',
      [ipHash, path]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to log request in Turso:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
