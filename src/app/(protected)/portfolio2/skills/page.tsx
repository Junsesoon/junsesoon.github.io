import React from 'react';
import SkillsPageClient, { SkillCategory } from '@/components/PF2/SkillsPageClient';
import { getAllPosts } from '@/utils/posts';
import { getMySkillDomainsAction } from '@/actions/postActions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SkillsPage() {
  try {
    const [posts, domainsData] = await Promise.all([
      getAllPosts('portfolio', { category1: 'portfolio', category2: 'myskill' }),
      getMySkillDomainsAction()
    ]);

    const activeDomains = domainsData && domainsData.length > 0 ? domainsData : [
      { id: 1, domainKey: 'frontend', title: 'Frontend Development', icon: '💻', color: 'cyan', displayOrder: 1 },
      { id: 2, domainKey: 'backend', title: 'Backend Development', icon: '⚙️', color: 'purple', displayOrder: 2 },
      { id: 3, domainKey: 'database', title: 'Database & Caching', icon: '🗄️', color: 'emerald', displayOrder: 3 },
      { id: 4, domainKey: 'devops', title: 'DevOps & Cloud', icon: '☁️', color: 'amber', displayOrder: 4 }
    ];

    // Group skills by active domains
    const groupedSkills: Record<string, any[]> = {};
    activeDomains.forEach((dom: any) => {
      groupedSkills[dom.domainKey] = [];
    });

    if (posts && posts.length > 0) {
      posts.forEach((post) => {
        const meta = post.metadata || {};
        const category3 = String(meta.category3 || 'frontend').toLowerCase();
        const techs = Array.isArray(meta.techs) ? meta.techs : [];
        const projects = Array.isArray(meta.projects) ? meta.projects : [];

        const skill = {
          name: post.title,
          level: Number(meta.familiar) || 0,
          levelText: meta.levelText || '',
          desc: meta.summary || post.excerpt || '',
          techs: techs,
          projects: projects
        };

        if (category3 in groupedSkills) {
          groupedSkills[category3].push(skill);
        } else {
          // Fallback for custom categories
          if (!groupedSkills.frontend) {
            groupedSkills.frontend = [];
          }
          groupedSkills.frontend.push(skill);
        }
      });
    }

    const skillsData: SkillCategory[] = activeDomains.map((dom: any) => {
      return {
        id: dom.domainKey,
        title: dom.title,
        icon: dom.icon,
        color: dom.color as any,
        skills: groupedSkills[dom.domainKey] || []
      };
    });

    return <SkillsPageClient skillsData={skillsData} />;
  } catch (error) {
    console.error('Failed to load skills from DB, falling back to static data:', error);
    return <SkillsPageClient skillsData={[]} />;
  }
}
