import React from 'react';
import Link from 'next/link';
import ProjectsList, { Project } from '@/components/PF2/ProjectsList';
import { getAllPosts } from '@/utils/posts';

export const metadata = {
  title: 'Projects - Portfolio 2.0',
  description: 'A list of key projects built by Junseo, powered by posts database.',
};

export default async function ProjectsPage() {
  const posts = await getAllPosts('portfolio', { category1: 'portfolio', category2: 'projects' });

  const projects: Project[] = posts.map((post) => {
    const meta = post.metadata || {};
    
    // Ensure techs is always an array of strings (e.g. read from tags or techs)
    const techs = Array.isArray(meta.techs) 
      ? meta.techs 
      : Array.isArray(meta.tags) 
      ? meta.tags 
      : [];

    // Ensure features is always an array of strings
    const features = Array.isArray(meta.features) 
      ? meta.features 
      : [];

    return {
      id: post.slug,
      title: post.title,
      category: (meta.category3 || 'personal').toLowerCase() as Project['category'],
      desc: meta.summary || post.excerpt || '',
      longDesc: meta.longDesc || meta.long_desc || post.excerpt || '',
      icon: meta.icon || '⚡',
      techs: techs,
      color: (meta.color || 'blue').toLowerCase() as Project['color'],
      period: meta.period || post.date || '',
      features: features,
    };
  });

  return (
    <main 
      className="w-full min-h-screen relative overflow-hidden px-6 md:px-12 flex flex-col items-center pt-16 pb-20 select-none"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 10%, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08), transparent 50%), radial-gradient(circle at 10% 80%, rgba(56, 189, 248, 0.05), transparent 40%)',
      }}
    >
      {/* Decorative Orbs */}
      <div className="absolute top-40 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Left: Back to Portfolio 2.0 */}
      <div className="absolute top-8 left-6 md:left-12 z-20 transition-hide">
        <Link 
          href="/portfolio2"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold text-slate-400 bg-white/[0.02] border border-white/[0.05] rounded-full hover:bg-white/[0.06] hover:text-white transition-all duration-200 no-underline group"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span> Back to main
        </Link>
      </div>

      {/* Top Right: Mode Switch */}
      <div className="absolute top-8 right-6 md:right-12 z-20 flex gap-3 transition-hide">
        <Link 
          href="/"
          className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-300 bg-white/[0.03] border border-white/[0.08] rounded-full backdrop-blur-md hover:bg-white/[0.08] hover:text-white transition-all duration-200 no-underline"
        >
          Blog
        </Link>
        <Link 
          href="/portfolio"
          className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-300 bg-white/[0.03] border border-white/[0.08] rounded-full backdrop-blur-md hover:bg-white/[0.08] hover:text-white transition-all duration-200 no-underline"
        >
          Portfolio 1.0
        </Link>
      </div>

      {/* Profile Header */}
      <div className="max-w-4xl w-full text-center mt-12 mb-16 relative z-10">
        <div className="w-20 h-20 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-full mx-auto flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(6,182,212,0.3)] mb-6 animate-pulse">
          ⚡
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-4">
          Awesome <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">Projects</span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          다양한 기술적 도전을 담아 설계하고 검증한 핵심 개발 프로젝트 목록입니다.
        </p>
      </div>

      {/* Projects List Client Wrapper */}
      <ProjectsList initialProjects={projects} />
    </main>
  );
}
