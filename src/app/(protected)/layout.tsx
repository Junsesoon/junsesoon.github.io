import React from 'react';
import GNB from '@/components/GNB';
import '@/styles/globals.css';
import '@/styles/atom-one-dark.css';
import Footer from '@/components/footer';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/utils/auth';

export const metadata = {
  title: 'Junseo Portfolio',
  description: 'A portfolio of Junseo',
};

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_auth')?.value;
  const isAdmin = token ? await verifyAdminToken(token) : false;

  // TODO: 방문자 열람용 인증(비밀번호 등) 미들웨어나 로직을 적용할 레이아웃
  return (
    <html lang="ko">
      <body className="m-0 p-0 flex flex-col min-h-screen overflow-y-scroll bg-white text-gray-900">
        <GNB isAdmin={isAdmin} />
        <div className="pt-16 flex-1 protected-container">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}