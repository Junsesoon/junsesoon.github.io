import React from 'react';
import Link from 'next/link';
import ProjectCardManager, { AdminProject } from '@/components/admin/ProjectCardManager';
import { getAllPosts } from '@/utils/posts';
import AdminClock from '@/components/admin/AdminClock';
import { logoutAction } from '@/actions/actions';
import BackButton from '@/components/admin/BackButton';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function ProjectManagementPage() {
  const posts = await getAllPosts('admin', { category1: 'portfolio', category2: 'projects' });

  const projects: AdminProject[] = posts.map((post) => {
    const meta = post.metadata || {};
    const techs = Array.isArray(meta.techs) 
      ? meta.techs 
      : Array.isArray(meta.tags) 
      ? meta.tags 
      : [];
    const features = Array.isArray(meta.features) 
      ? meta.features 
      : [];

    return {
      id: post.slug,
      slug: post.slug,
      title: post.title,
      category: (meta.category3 || 'personal').toLowerCase() as 'team' | 'personal',
      desc: meta.summary || post.excerpt || '',
      longDesc: meta.longDesc || meta.long_desc || post.excerpt || '',
      icon: meta.icon || '⚡',
      techs: techs,
      color: (meta.color || 'blue').toLowerCase() as any,
      startdate: meta.startdate || '',
      enddate: meta.enddate || '',
      features: features,
    };
  });

  return (
    <div className="flex min-h-screen w-full bg-gray-50/50 font-sans text-gray-900">
      <AdminSidebar activePath="project" />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-none w-full overflow-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200 pb-4 gap-4">
          <AdminClock title="Projects (PF2.0)" />
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
          <ProjectCardManager initialProjects={projects} />
        </div>
      </main>
    </div>
  );
}
