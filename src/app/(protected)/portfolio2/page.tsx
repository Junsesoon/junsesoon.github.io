import React from 'react';
import Link from 'next/link';
import TypingSubtitle from '@/components/TypingSubtitle';

export const metadata = {
  title: 'Portfolio 2.0 - New Generation',
  description: 'Welcome to the completely redesigned portfolio experience.',
};

export default function Portfolio2Page() {
  return (
    <main 
      className="w-full min-h-[calc(100vh-4rem)] bg-[#030712] text-slate-100 font-sans relative overflow-hidden flex flex-col justify-center items-center py-20 px-4 -mt-16 pt-32"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1), transparent 60%), radial-gradient(circle at 10% 80%, rgba(56, 189, 248, 0.08), transparent 45%)',
      }}
    >
      {/* Decorative Blur Orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Page-level Mode Switch Buttons */}
      <div className="absolute top-8 right-8 z-20 flex gap-3">
        <Link 
          href="/"
          className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-300 bg-white/[0.03] border border-white/[0.08] rounded-full backdrop-blur-md hover:bg-white/[0.08] hover:text-white transition-all duration-200 select-none no-underline"
        >
          Blog
        </Link>
        <Link 
          href="/portfolio"
          className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-300 bg-white/[0.03] border border-white/[0.08] rounded-full backdrop-blur-md hover:bg-white/[0.08] hover:text-white transition-all duration-200 select-none no-underline"
        >
          Portfolio 1.0
        </Link>
      </div>

      <div className="max-w-4xl w-full text-center relative z-10 select-none">
        {/* Subtle badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 uppercase mb-8 animate-pulse">
          ✨ Introducing Portfolio 2.0
        </span>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400 mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] drop-shadow-[0_0_35px_rgba(168,85,247,0.3)]">
          소통이 되는 <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">개발자</span>
        </h1>

        {/* Subtitle */}
        <TypingSubtitle />

        {/* Glassmorphic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
          {[
            {
              title: "About",
              desc: "개발자 오준서의 다채로운 인생여정을 공유합니다",
              icon: "🧭",
              href: "/portfolio2/about",
            },
            {
              title: "Projects",
              desc: "Frontend, Backend, DevOps 등 다양한 프로젝트를 통해 최신 기술과 트렌드를 반영한 디자인을 경험해보세요",
              icon: "⚡",
              href: "/portfolio2#project",
            },
            {
              title: "Skills",
              desc: "제가 보유한 다양한 기술 스택과 전문성을 소개합니다",
              icon: "🛠️",
              href: "/portfolio2#skill",
            },
          ].map((item, index) => (
            <Link 
              key={index}
              href={item.href}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] group hover:-translate-y-1 block no-underline"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">{item.icon}</div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
