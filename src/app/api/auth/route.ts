import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_auth')?.value;
    const isAdmin = token ? await verifyAdminToken(token) : false;

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error verifying admin status in API route:', error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
