import GNB from '@/components/shared/GNB';
import '@/styles/globals.css';
import Footer from '@/components/shared/footer';
import VisitorTracker from '@/components/admin/VisitorTracker';
import SkillTreeThemeToggle from '@/components/blog/SkillTreeThemeToggle';
import Script from 'next/script';

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
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('skilltree_theme') || 'light';
                  document.documentElement.classList.remove('light-theme', 'sepia-theme');
                  if (saved === 'light') document.documentElement.classList.add('light-theme');
                  else if (saved === 'sepia') document.documentElement.classList.add('sepia-theme');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="m-0 p-0 flex flex-col min-h-screen overflow-y-scroll bg-theme-bg text-theme-text-body relative transition-colors duration-300">
        <VisitorTracker />
        {process.env.GA_MEASUREMENT_ID && (
          <>
            <Script
              strategy="worker"
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GA_MEASUREMENT_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="worker"
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
        <SkillTreeThemeToggle />
        <div className="pt-16 flex-1 relative">
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}