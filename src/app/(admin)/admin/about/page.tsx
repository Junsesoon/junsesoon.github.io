import React from 'react';
import Link from 'next/link';
import AboutManager from '@/components/admin/AboutManager';
import { getAllPosts } from '@/utils/posts';
import { getTimelineItemsAction } from '@/actions/timelineActions';
import AdminClock from '@/components/admin/AdminClock';
import { logoutAction } from '@/actions/actions';
import BackButton from '@/components/admin/BackButton';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function AboutManagementPage() {
  const posts = await getAllPosts('portfolio', { category1: 'portfolio', category2: 'about' });
  const dbTimelineItems = await getTimelineItemsAction();

  const timelineItems = posts.map((post) => ({
    id: post.post_id,
    slug: post.slug,
    title: post.title,
    startDate: post.metadata?.startdate || post.metadata?.startDate || post.date || '',
    endDate: post.metadata?.enddate || post.metadata?.endDate || post.date || '',
    desc: post.metadata?.summary || post.excerpt || '',
    category3: post.metadata?.category3 || '',
    category4: post.metadata?.category4 || '',
    postStatus: post.metadata?.post_status || 'published',
  }));

  return (
    <div className="flex min-h-screen w-full bg-gray-50/50 font-sans text-gray-900">
      <AdminSidebar activePath="about" />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-none w-full overflow-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200 pb-4 gap-4">
          <AdminClock title="About" />
          <div className="flex items-center gap-3">
            <BackButton />
            <form action={logoutAction}>
              <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3.5 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-100/80">
                Logout
              </button>
            </form>
          </div>
        </header>

        <div className="w-full xl:w-[95%] 2xl:w-[90%] max-w-7xl">
          <AboutManager initialItems={timelineItems} initialTimelineItems={dbTimelineItems} />
        </div>
      </main>
    </div>
  );
}
