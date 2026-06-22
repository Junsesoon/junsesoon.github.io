import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, getAdminTokenExp } from '@/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_auth')?.value;
    const isAdmin = token ? await verifyAdminToken(token) : false;
    const exp = token ? await getAdminTokenExp(token) : null;

    return NextResponse.json({ isAdmin, exp });
  } catch (error) {
    console.error('Error verifying admin status in API route:', error);
    return NextResponse.json({ isAdmin: false, exp: null }, { status: 500 });
  }
}
