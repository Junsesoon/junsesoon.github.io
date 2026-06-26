'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Skill {
  name: string;
  level: number; // 0 to 100
  levelText: string;
  desc: string;
  techs: string[];
  projects: string[];
}

interface SkillCategory {
  id: string;
  title: string;
  icon: string;
  color: 'cyan' | 'purple' | 'emerald' | 'amber';
  skills: Skill[];
}

const SKILLS_DATA: SkillCategory[] = [
  {
    id: 'frontend',
    title: 'Frontend Development',
    icon: '💻',
    color: 'cyan',
    skills: [
      {
        name: 'React / Next.js',
        level: 90,
        levelText: 'Expert',
        desc: 'SSR/ISR 렌더링 최적화, Next.js App Router 아키텍처 및 상태 관리를 깊이 이해하고 응용합니다.',
        techs: ['Next.js 14/15', 'React Server Components', 'Zustand', 'React Query', 'Framer Motion'],
        projects: ['NexusCommerce 헤드리스 커머스', '오준서 개인 블로그 & 포트폴리오']
      },
      {
        name: 'TypeScript',
        level: 85,
        levelText: 'Advanced',
        desc: '정적 타입을 활용한 안정적인 코드 작성 및 커스텀 제네릭 유틸리티 타입을 다룰 수 있습니다.',
        techs: ['Advanced Utility Types', 'Strict Type Checking', 'Generic Programming', 'TS Config 최적화'],
        projects: ['NeuroChat AI 플랫폼 프론트엔드', '사내 디자인 시스템 라이브러리 구축']
      },
      {
        name: 'HTML5 / CSS3 / TailwindCSS',
        level: 90,
        levelText: 'Expert',
        desc: '웹 표준 및 접근성을 준수하며, Tailwind와 Vanilla CSS를 활용해 반응형 및 고성능 인터랙티브 UI를 조각합니다.',
        techs: ['Flexbox / Grid Layout', 'TailwindCSS v4', 'CSS Variables', 'Keyframe Animations'],
        projects: ['Portfolio 2.0 테마 디자인', '반응형 대시보드 인터페이스']
      }
    ]
  },
  {
    id: 'backend',
    title: 'Backend Development',
    icon: '⚙️',
    color: 'purple',
    skills: [
      {
        name: 'Node.js / NestJS',
        level: 80,
        levelText: 'Advanced',
        desc: '모듈식 구조 기반의 안정적이고 테스트 가능한 REST API 및 GraphQL API 서버를 구축합니다.',
        techs: ['NestJS CLI', 'TypeORM', 'Prisma', 'Passport JWT', 'Jest Unit Test'],
        projects: ['인공지능 대화 플랫폼 백엔드 API', '사용자 인증 및 권한 관리 시스템']
      },
      {
        name: 'Python / FastAPI',
        level: 85,
        levelText: 'Advanced',
        desc: '비동기 코루틴 기반의 고성능 API 서버 및 데이터 처리 인프라를 설계하고 구축합니다.',
        techs: ['Pydantic v2', 'Asyncio', 'SQLAlchemy Async', 'Uvicorn / Gunicorn'],
        projects: ['NeuroChat LLM 서빙 백엔드', '실시간 로그 수집 에이전트 인터페이스']
      },
      {
        name: 'Rust',
        level: 70,
        levelText: 'Intermediate',
        desc: '소유권 개념을 이해하고 메모리 안전성을 극대화한 가볍고 빠른 미들웨어 모듈을 작성합니다.',
        techs: ['Actix-web', 'Tokio Async', 'Cargo Package Manager', 'Error Handling Pattern'],
        projects: ['CoreAPI Gateway 분산 인증 속도제한 모듈']
      }
    ]
  },
  {
    id: 'database',
    title: 'Database & Caching',
    icon: '🗄️',
    color: 'emerald',
    skills: [
      {
        name: 'PostgreSQL / MySQL',
        level: 80,
        levelText: 'Advanced',
        desc: '데이터베이스 정규화, 인덱스 설계 및 실행 계획(Explain) 분석을 통한 쿼리 튜닝이 가능합니다.',
        techs: ['Index Optimization', 'DB Migration (Flyway/Prisma)', 'ACID Transactions', 'SQL Tuning'],
        projects: ['블로그 댓글 및 회원 관계형 스키마 설계', '통계 데이터 수집 배치 쿼리 최적화']
      },
      {
        name: 'Redis',
        level: 85,
        levelText: 'Advanced',
        desc: '다양한 데이터 구조(Strings, Hashes, Sorted Sets)를 이해하고 분산 락 및 캐싱 캐시 레이어를 설계합니다.',
        techs: ['Redis Caching Strategy', 'Session Store', 'Distributed Rate Limiting', 'Redis Pub/Sub'],
        projects: ['API 게이트웨이 토큰 분산 속도제한', 'AI 채팅 히스토리 인메모리 캐싱']
      }
    ]
  },
  {
    id: 'devops',
    title: 'DevOps & Cloud',
    icon: '☁️',
    color: 'amber',
    skills: [
      {
        name: 'Docker / Containerization',
        level: 85,
        levelText: 'Advanced',
        desc: '멀티 스테이지 빌드를 적용하여 이미지를 경량화하고 효율적인 다중 컨테이너 네트워킹을 설계합니다.',
        techs: ['Docker Compose', 'Multi-stage Build', 'Docker Networking', 'Volume Mounts Optimization'],
        projects: ['HyperLog MSA 인프라 로컬 컨테이너화', 'CI/CD 빌드 이미지 크기 60% 절감']
      },
      {
        name: 'CI/CD (GitHub Actions)',
        level: 80,
        levelText: 'Advanced',
        desc: '자동 린팅, 테스트 실행 및 클라우드 서비스로의 무중단 배포 자동화 파이프라인을 구축합니다.',
        techs: ['YAML Workflow Design', 'GitHub Runners', 'Vercel / AWS Deploy Integration', 'Secure Secrets'],
        projects: ['블로그 자동 정적 배포 파이프라인', '사내 백엔드 테스트 및 AWS ECS 자동 배포']
      }
    ]
  }
];

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

export default function SkillsPage() {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  return (
    <main 
      className="w-full min-h-screen relative overflow-hidden px-6 md:px-12 flex flex-col items-center pt-16 pb-20 select-none"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 10%, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08), transparent 50%), radial-gradient(circle at 90% 80%, rgba(56, 189, 248, 0.05), transparent 40%)',
      }}
    >
      {/* Decorative Orbs */}
      <div className="absolute top-40 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

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

      {/* Skill Categories Section */}
      <div className="max-w-4xl w-full flex flex-col gap-12 relative z-10">
        {SKILLS_DATA.map((category) => {
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
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-slate-200 group-hover:text-white text-base transition-colors">
                            {skill.name}
                          </h3>
                        </div>

                        {/* Skill Desc Preview */}
                        <p className="text-xs text-slate-400 leading-relaxed mb-5 group-hover:text-slate-300 transition-colors">
                          {skill.desc.slice(0, 50)}...
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
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <span className="text-[10px] font-bold px-3 py-1 rounded-full border border-indigo-500/20 text-indigo-400 bg-indigo-500/10 mb-1.5 inline-block uppercase">
                  PROFICIENCY: {selectedSkill.level}%
                </span>
                <h2 className="text-2xl font-bold text-white">{selectedSkill.name}</h2>
              </div>
            </div>

            {/* Modal Content */}
            <div className="space-y-6 text-sm text-slate-300">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">기술 역량 상세</h4>
                <p className="leading-relaxed bg-white/[0.01] border border-white/[0.03] rounded-2xl p-4">{selectedSkill.desc}</p>
              </div>

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
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
