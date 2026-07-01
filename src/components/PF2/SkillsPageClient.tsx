'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface Skill {
  name: string;
  level: number;
  levelText: string;
  desc: string;
  techs: string[];
  projects: string[];
}

export interface SkillCategory {
  id: string;
  title: string;
  icon: string;
  color: 'cyan' | 'purple' | 'emerald' | 'amber';
  skills: Skill[];
}

interface SkillsPageClientProps {
  skillsData: SkillCategory[];
}

const getCategoryTheme = (color: SkillCategory['color']) => {
  if (color === 'cyan') return {
    border: 'border-cyan-500/20',
    title: 'text-cyan-400',
    accentBg: 'bg-cyan-500',
    barBg: 'from-cyan-500/30 to-blue-500/30 shadow-[0_0_12px_rgba(6,182,212,0.3)]',
    cardHover: 'hover:border-cyan-500/40 hover:shadow-[0_8px_30px_rgba(6,182,212,0.15)]',
    badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };
  if (color === 'purple') return {
    border: 'border-purple-500/20',
    title: 'text-purple-400',
    accentBg: 'bg-purple-500',
    barBg: 'from-purple-500/30 to-pink-500/30 shadow-[0_0_12px_rgba(168,85,247,0.3)]',
    cardHover: 'hover:border-purple-500/40 hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)]',
    badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };
  if (color === 'emerald') return {
    border: 'border-emerald-500/20',
    title: 'text-emerald-400',
    accentBg: 'bg-emerald-500',
    barBg: 'from-emerald-500/30 to-teal-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
    cardHover: 'hover:border-emerald-500/40 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]',
    badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };
  return {
    border: 'border-amber-500/20',
    title: 'text-amber-400',
    accentBg: 'bg-amber-500',
    barBg: 'from-amber-500/30 to-orange-500/30 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    cardHover: 'hover:border-amber-500/40 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]',
    badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };
};

export default function SkillsPageClient({ skillsData }: SkillsPageClientProps) {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  return (
    <main 
      className="w-full min-h-screen relative overflow-hidden px-6 md:px-12 flex flex-col items-center pt-16 pb-20 select-none bg-[#030712] text-slate-100 font-sans"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 10%, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08), transparent 50%), radial-gradient(circle at 90% 80%, rgba(56, 189, 248, 0.05), transparent 40%)',
      }}
    >
      {/* Decorative Orbs */}
      <div className="absolute top-40 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Left: Back to Portfolio 2.0 */}
      <div className="absolute top-8 left-6 md:left-12 z-20">
        <Link 
          href="/portfolio2"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold text-slate-450 bg-white/[0.02] border border-white/[0.05] rounded-full hover:bg-white/[0.06] hover:text-white transition-all duration-200 no-underline group"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span> Back to main
        </Link>
      </div>

      {/* Top Right: Mode Switch */}
      <div className="absolute top-8 right-6 md:right-12 z-20 flex gap-3">
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

      {/* Header Section */}
      <div className="max-w-4xl w-full text-center mt-12 mb-16 relative z-10">
        <div className="w-20 h-20 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(168,85,247,0.3)] mb-6 animate-pulse">
          🛠️
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-4">
          Tech <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Familiarity</span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          실제 개발 실무 및 개인 프로젝트를 진행하며 깊이 있게 다진 저의 기술 스택 명세서입니다.
        </p>
      </div>

      {/* Legend Section (친숙도 범례) */}
      <div className="max-w-4xl w-full mb-12 p-5 rounded-3xl bg-white/[0.01] border border-white/[0.04] backdrop-blur-xl relative z-10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs text-slate-400">
        <div className="font-bold text-slate-300 shrink-0 flex items-center gap-1.5">
          <span>💡</span> 친숙도 등급 안내
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          <div className="flex flex-col gap-1 p-2.5 rounded-2xl bg-white/[0.01] border border-white/[0.03]">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Lead</span>
            <span className="text-[10px] text-slate-400">주도적 설계 및 기획 가능</span>
          </div>
          <div className="flex flex-col gap-1 p-2.5 rounded-2xl bg-white/[0.01] border border-white/[0.03]">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Independent</span>
            <span className="text-[10px] text-slate-400">도움 없이 단독 개발 가능</span>
          </div>
          <div className="flex flex-col gap-1 p-2.5 rounded-2xl bg-white/[0.01] border border-white/[0.03]">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Co-work</span>
            <span className="text-[10px] text-slate-400">협업 및 유지보수 가능</span>
          </div>
          <div className="flex flex-col gap-1 p-2.5 rounded-2xl bg-white/[0.01] border border-white/[0.03]">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Learning</span>
            <span className="text-[10px] text-slate-400">기초 개념 공부 및 학습 중</span>
          </div>
        </div>
      </div>

      {/* Skill Categories Section */}
      <div className="max-w-4xl w-full flex flex-col gap-12 relative z-10">
        {skillsData.map((category) => {
          const theme = getCategoryTheme(category.color);
          return (
            <div 
              key={category.id}
              className="p-8 rounded-3xl bg-white/[0.01] border border-white/[0.04] backdrop-blur-xl transition-all duration-300"
            >
              {/* Category Title */}
              <h2 className="text-2xl font-bold text-slate-100 mb-8 flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <span className={`bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300`}>
                  {category.title}
                </span>
              </h2>

              {/* Skills Grid within Category */}
              {category.skills.length === 0 ? (
                <div className="py-8 text-center text-slate-500 border border-dashed border-white/5 rounded-2xl text-xs bg-white/[0.005]">
                  등록된 스킬 카드가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {category.skills.map((skill) => {
                    const isHovered = hoveredSkill === skill.name;
                    const isAnyHovered = hoveredSkill !== null;
                    return (
                      <div
                        key={skill.name}
                        onMouseEnter={() => setHoveredSkill(skill.name)}
                        onMouseLeave={() => setHoveredSkill(null)}
                        onClick={() => setSelectedSkill(skill)}
                        className={`p-5 rounded-2xl border ${theme.border} bg-white/[0.01] transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:-translate-y-1 ${theme.cardHover} ${
                          isAnyHovered && !isHovered ? 'opacity-35 scale-[0.98] blur-[0.5px]' : 'opacity-100 scale-100'
                        }`}
                      >
                        <div>
                          {/* Skill Header */}
                          <div className="flex justify-between items-center mb-3 gap-2">
                            <h3 className="font-bold text-slate-200 group-hover:text-white text-base transition-colors truncate">
                              {skill.name}
                            </h3>
                            {skill.levelText && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 uppercase ${
                                skill.levelText === 'Lead' ? 'text-cyan-400 bg-cyan-500/5 border-cyan-500/10' :
                                skill.levelText === 'Independent' ? 'text-purple-400 bg-purple-500/5 border-purple-500/10' :
                                skill.levelText === 'Co-work' ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' :
                                'text-amber-400 bg-amber-500/5 border-amber-500/10'
                              }`}>
                                {skill.levelText}
                              </span>
                            )}
                          </div>

                          {/* Skill Desc Preview */}
                          <p className="text-xs text-slate-400 leading-relaxed mb-5 group-hover:text-slate-300 transition-colors line-clamp-2">
                            {skill.desc}
                          </p>
                        </div>

                        <div>
                          {/* Visual Progress Bar */}
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-3 relative">
                            <div
                              className={`h-full bg-gradient-to-r ${theme.barBg} transition-all duration-1000 ease-out`}
                              style={{ width: `${skill.level}%` }}
                            />
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 flex justify-between items-center group-hover:text-slate-400 transition-colors">
                            <span>Proficiency</span>
                            <span>{skill.level}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 transition-opacity"
          onClick={() => setSelectedSkill(null)}
        >
          <div
            className="w-full max-w-lg bg-[#090d16] border border-white/[0.08] rounded-3xl p-6 md:p-8 relative shadow-2xl overflow-y-auto max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedSkill(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full border border-indigo-500/20 text-indigo-400 bg-indigo-500/10 uppercase">
                    Familiarity: {selectedSkill.level}%
                  </span>
                  {selectedSkill.levelText && (
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase ${
                      selectedSkill.levelText === 'Lead' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' :
                      selectedSkill.levelText === 'Independent' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                      selectedSkill.levelText === 'Co-work' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                      'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    }`}>
                      {selectedSkill.levelText}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white">{selectedSkill.name}</h2>
              </div>
            </div>

            {/* Modal Content */}
            <div className="space-y-6 text-sm text-slate-350">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">기술 역량 상세</h4>
                <p className="leading-relaxed bg-white/[0.01] border border-white/[0.03] rounded-2xl p-4 whitespace-pre-line">{selectedSkill.desc}</p>
              </div>

              {selectedSkill.techs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">주요 세부 숙련 스택</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkill.techs.map((tech) => (
                      <span
                        key={tech}
                        className="text-xs font-semibold px-3 py-1 rounded-full border border-white/[0.06] text-slate-300 bg-white/[0.02]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedSkill.projects.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">활용 프로젝트</h4>
                  <ul className="space-y-2.5">
                    {selectedSkill.projects.map((proj, idx) => (
                      <li key={idx} className="flex gap-2.5 leading-relaxed">
                        <span className="text-purple-400 mt-0.5">✔</span>
                        <span>{proj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
