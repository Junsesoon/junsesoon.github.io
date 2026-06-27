import BlogStats from '@/components/blog/BlogStats';
import Header from '@/components/blog/Header';
import HomeContent from '@/components/blog/HomeContent';

export const revalidate = 1200; // ISR 적용 시, 게시물 수정 후 최대 20분까지는 수정 내용이 반영되지 않을 수 있음

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; popPage?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentPage = parseInt(resolvedSearchParams?.page || '1', 10);
  const currentPopPage = parseInt(resolvedSearchParams?.popPage || '1', 10);

  return (
    <main className="w-full px-4 md:px-12 py-8 pb-24 font-sans">
      <Header />
      <div className="grid grid-cols-1 md:grid-cols-[15%_1fr_15%] gap-8 w-full">
        {/* Left Sidebar */}
        <aside className="w-full">
          <BlogStats />
        </aside>

        {/* Content Section */}
        <HomeContent currentPage={currentPage} currentPopPage={currentPopPage} />

        {/* Right Sidebar */}
        <aside className="hidden md:block w-full">
          {/* Reserved space for right sidebar */}
        </aside>
      </div>
    </main>
  );
}
