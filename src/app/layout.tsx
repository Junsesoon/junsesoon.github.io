import GNB from '@/components/GNB';
import '@/styles/globals.css';
import '@/styles/atom-one-dark.css';

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
      <body className="m-0 p-0 flex flex-col min-h-screen bg-white text-gray-900">
        <GNB />
        <div className="pt-16 flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}