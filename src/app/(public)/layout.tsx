import GNB from '@/components/shared/GNB';
import '@/styles/globals.css';
import Script from 'next/script';
import Footer from '@/components/shared/footer';
import VisitorTracker from '@/components/admin/VisitorTracker';

export const metadata = {
  title: 'Junseo Blog',
  description: 'A blog and portfolio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="ko">
      <body className="m-0 p-0 flex flex-col min-h-screen overflow-y-scroll bg-white text-gray-900 relative">
        <VisitorTracker />
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
        <GNB />
        <div className="pt-16 flex-1 relative">
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}