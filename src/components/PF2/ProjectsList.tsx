'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

export interface Project {
  id: string;
  title: string;
  category: 'team' | 'personal';
  desc: string;
  longDesc: string;
  icon: string;
  techs: string[];
  color: 'purple' | 'emerald' | 'blue' | 'amber';
  period: string;
  features: string[];
}

interface ProjectsListProps {
  initialProjects: Project[];
}

const getProjectColorClass = (color: Project['color']) => {
  if (color === 'purple') return {
    border: 'border-purple-500/20 hover:border-purple-500/40',
    shadow: 'hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)]',
    badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    iconBg: 'from-purple-500/20 to-pink-500/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
  };
  if (color === 'emerald') return {
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    shadow: 'hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]',
    badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    iconBg: 'from-emerald-500/20 to-teal-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
  };
  if (color === 'blue') return {
    border: 'border-blue-500/20 hover:border-blue-500/40',
    shadow: 'hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]',
    badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    iconBg: 'from-blue-500/20 to-cyan-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
  };
  return {
    border: 'border-amber-500/20 hover:border-amber-500/40',
    shadow: 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]',
    badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    iconBg: 'from-amber-500/20 to-orange-500/20 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
  };
};

export default function ProjectsList({ initialProjects = [] }: ProjectsListProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'all') return initialProjects;
    return initialProjects.filter((p) => p.category === activeCategory);
  }, [activeCategory, initialProjects]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Filter Tabs */}
      <div className="max-w-4xl w-full flex justify-center gap-2 mb-12 relative z-10">
        <div className="p-1 rounded-full bg-white/[0.02] border border-white/[0.05] backdrop-blur-md flex flex-wrap gap-1">
          {[
            { label: '전체', value: 'all' },
            { label: '👥 팀', value: 'team' },
            { label: '👤 개인', value: 'personal' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveCategory(tab.value)}
              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-full transition-all duration-300 ${
                activeCategory === tab.value
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="max-w-4xl w-full text-center py-16 text-slate-500 border border-dashed border-white/10 rounded-3xl relative z-10">
          등록된 프로젝트가 없습니다.
        </div>
      ) : (
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {filteredProjects.map((project) => {
            const theme = getProjectColorClass(project.color);
            return (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`p-6 rounded-3xl bg-white/[0.01] border ${theme.border} backdrop-blur-xl ${theme.shadow} transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1.5`}
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-5">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${theme.iconBg} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                      {project.icon}
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold bg-white/[0.02] border border-white/[0.05] px-3 py-1 rounded-full">
                      {project.category === 'team' ? '👥 Team' : '👤 Personal'} | {project.period}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-white transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    {project.desc}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {project.techs.map((tech) => (
                      <span
                        key={tech}
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${theme.badge}`}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 group-hover:text-cyan-300 transition-colors">
                    상세 보기 <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 transition-opacity"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className={`w-full max-w-2xl bg-[#090d16] border ${getProjectColorClass(selectedProject.color).border} rounded-3xl p-6 md:p-8 relative shadow-2xl overflow-y-auto max-h-[85vh]`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${getProjectColorClass(selectedProject.color).iconBg} flex items-center justify-center text-3xl`}>
                {selectedProject.icon}
              </div>
              <div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase ${getProjectColorClass(selectedProject.color).badge} mb-1 inline-block`}>
                  {selectedProject.category}
                </span>
                <h2 className="text-2xl font-bold text-white">{selectedProject.title}</h2>
              </div>
            </div>

            <div className="space-y-6 text-sm text-slate-300">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">프로젝트 개요</h4>
                <p className="leading-relaxed bg-white/[0.01] border border-white/[0.03] rounded-2xl p-4 whitespace-pre-line">{selectedProject.longDesc}</p>
              </div>

              {selectedProject.features && selectedProject.features.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">주요 핵심 구현 기능</h4>
                  <ul className="space-y-2.5">
                    {selectedProject.features.map((feature, idx) => (
                      <li key={idx} className="flex gap-2.5 leading-relaxed">
                        <span className="text-cyan-400 mt-0.5">✔</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedProject.techs && selectedProject.techs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">사용 기술 스택</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.techs.map((tech) => (
                      <span
                        key={tech}
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${getProjectColorClass(selectedProject.color).badge}`}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
