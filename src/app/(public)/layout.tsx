import GNB from '@/components/GNB';
import '@/styles/globals.css';
import '@/styles/atom-one-dark.css';
import Script from 'next/script';
import Footer from '@/components/footer';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/utils/auth';

export const metadata = {
  title: 'Junseo Blog',
  description: 'A blog and portfolio',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_auth')?.value;
  const isAdmin = token ? await verifyAdminToken(token) : false;

  return (
    <html lang="ko">
      <body className="m-0 p-0 flex flex-col min-h-screen bg-white text-gray-900">
        {process.env.GA_MEASUREMENT_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GA_MEASUREMENT_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.GA_MEASUREMENT_ID}');
                `,
              }}
            />
          </>
        )}
        <GNB isAdmin={isAdmin} />
        <div className="pt-16 flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}