import '@/styles/globals.css';
import AdminTracker from '@/components/admin/AdminTracker';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Admin area for Junseo Blog',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" style={{ scrollbarGutter: 'stable' }}>
      <body className="m-0 p-0 flex flex-col min-h-screen bg-gray-50 text-gray-900">
        <AdminTracker />
        {children}
      </body>
    </html>
  );
}