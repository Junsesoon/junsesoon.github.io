import React from 'react';
import MySkillManager, { AdminSkill, MySkillDomain } from '@/components/admin/MySkillManager';
import { getAllPosts } from '@/utils/posts';
import { getMySkillDomainsAction } from '@/actions/postActions';
import AdminClock from '@/components/admin/AdminClock';
import { logoutAction } from '@/actions/actions';
import BackButton from '@/components/admin/BackButton';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function MySkillManagementPage() {
  const [posts, domainsData] = await Promise.all([
    getAllPosts('admin', { category1: 'portfolio', category2: 'myskill' }),
    getMySkillDomainsAction()
  ]);

  const domains: MySkillDomain[] = (domainsData || []).map((dom: any) => ({
    id: Number(dom.id),
    domainKey: String(dom.domainKey || ''),
    title: String(dom.title || ''),
    icon: String(dom.icon || '💻'),
    color: String(dom.color || 'cyan'),
    displayOrder: Number(dom.displayOrder || 0)
  }));

  const skills: AdminSkill[] = posts.map((post) => {
    const meta = post.metadata || {};
    const techs = Array.isArray(meta.techs) ? meta.techs : [];
    const projects = Array.isArray(meta.projects) ? meta.projects : [];

    return {
      id: post.slug,
      slug: post.slug,
      name: post.title,
      category: String(meta.category3 || 'frontend').toLowerCase(),
      level: Number(meta.familiar) || 0,
      levelText: meta.levelText || '',
      desc: meta.summary || post.excerpt || '',
      techs: techs,
      projects: projects,
    };
  });

  return (
    <div className="flex min-h-screen w-full bg-gray-50/50 font-sans text-gray-900">
      <AdminSidebar activePath="myskill" />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-none w-full overflow-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200 pb-4 gap-4">
          <AdminClock title="My Skills" />
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
          <MySkillManager initialSkills={skills} initialDomains={domains} />
        </div>
      </main>
    </div>
  );
}
