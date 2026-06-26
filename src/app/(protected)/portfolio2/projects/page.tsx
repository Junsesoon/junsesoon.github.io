'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  category: 'frontend' | 'backend' | 'ai' | 'devops';
  desc: string;
  longDesc: string;
  icon: string;
  techs: string[];
  color: 'purple' | 'emerald' | 'blue' | 'amber';
  period: string;
  features: string[];
}

const PROJECTS_DATA: Project[] = [
  {
    id: 'neurochat',
    title: 'NeuroChat (AI Chat Platform)',
    category: 'ai',
    desc: 'Local LLM 기반의 고성능 대화형 AI 웹 인터페이스 및 프롬프트 엔지니어링 관리 시스템입니다.',
    longDesc: 'NeuroChat은 LangChain과 FastAPI를 활용하여 엔터프라이즈 환경에서 로컬 LLM을 효율적으로 서빙하고 대화 기록을 분석할 수 있도록 구축된 풀스택 AI 플랫폼입니다. 실시간 스트리밍 응답(SSE), 사용자 정의 프롬프트 템플릿 관리, 멀티턴 대화 성능 최적화 등을 제공하며 Redis 캐싱을 통해 응답 시간을 40% 단축했습니다.',
    icon: '🧠',
    techs: ['Next.js', 'FastAPI', 'LangChain', 'Redis', 'PostgreSQL'],
    color: 'purple',
    period: '2025.10 - 2026.01',
    features: [
      'Server-Sent Events(SSE) 기반 실시간 AI 답변 스트리밍',
      '프롬프트 템플릿 버전 관리 및 dynamic 파라미터 바인딩',
      '대화 컨텍스트 토큰 계산 및 자동 슬라이딩 윈도우 압축',
      'Pinecone 벡터 데이터베이스 기반 문서 검색 증강 생성(RAG) 모듈 탑재'
    ]
  },
  {
    id: 'hyperlog',
    title: 'HyperLog DevOps Dashboard',
    category: 'devops',
    desc: '분산 MSA 환경에서 다중 컨테이너의 리얼타임 로그 수집 및 인프라 리소스 모니터링 엔진입니다.',
    longDesc: 'HyperLog는 대규모 도커 및 쿠버네티스 클러스터에서 실시간으로 발생하는 로그 스트림을 백프레셔(Backpressure) 현상 없이 인메모리 파이프라인으로 전송하고 가시화합니다. Prometheus와 Grafana API를 통합 커스텀 대시보드로 시각화하여 데브옵스 엔지니어의 장애 감지 및 조치 속도를 높였습니다.',
    icon: '🛡️',
    techs: ['React', 'Go', 'Docker', 'Prometheus', 'Grafana'],
    color: 'emerald',
    period: '2025.04 - 2025.08',
    features: [
      'gRPC 및 WebSocket 기반 실시간 컨테이너 리소스 모니터링',
      'PromQL 자동 완성 및 시각적 차트 빌더 시스템',
      '장애 조건 정의 및 Slack/Discord 실시간 알림 연동 (Webhooks)',
      '컨테이너 로그 패턴 분석을 통한 비정상 지표 자동 분석(AI 예측)'
    ]
  },
  {
    id: 'nexuscommerce',
    title: 'NexusCommerce (Headless Shop)',
    category: 'frontend',
    desc: 'Edge Handler와 ISR을 활용하여 LCP 0.1초 미만의 속도를 확보한 차세대 무중단 이커머스 쇼핑몰입니다.',
    longDesc: 'NexusCommerce는 Shopify API 및 커스텀 GraphQL 백엔드와 연동되는 헤드리스 커머스 솔루션입니다. Next.js 15 App Router의 세밀한 캐싱 제어와 Vercel Edge Middleware를 활용하여 전 세계 어디서나 빠른 화면을 제공하며, Stripe 결제 API를 완벽하게 보안 통합했습니다.',
    icon: '🛒',
    techs: ['Next.js 15', 'TailwindCSS', 'GraphQL', 'Stripe', 'Framer Motion'],
    color: 'blue',
    period: '2025.01 - 2025.03',
    features: [
      '증분 정적 재생성(ISR) 및 온디맨드 재검증을 활용한 상품 정보 업데이트',
      'Stripe Elements 기반의 3D Secure 2.0 카드 결제 모듈',
      '로컬 스토리지 연동 및 낙관적 업데이트(Optimistic UI)가 적용된 실시간 장바구니',
      'Core Web Vitals 성능 최적화 (LCP: 0.08초, CLS: 0)'
    ]
  },
  {
    id: 'coreapi',
    title: 'CoreAPI Gateway System',
    category: 'backend',
    desc: '초당 50,000건 이상의 동시 요청(TPS)을 제어하는 고성능 API 게이트웨이 및 미들웨어 엔진입니다.',
    longDesc: 'CoreAPI Gateway는 Rust 언어와 Actix-web 프레임워크를 기반으로 개발된 가볍고 극도로 빠른 게이트웨이 시스템입니다. 들어오는 모든 API 요청의 JWT 인증, 동적 속도 제한(Rate Limiting), 분산 시스템 로드 밸런싱을 1ms 미만의 지연 시간 내에 독립적으로 처리합니다.',
    icon: '🔑',
    techs: ['Rust', 'Actix-web', 'Redis', 'gRPC', 'PostgreSQL'],
    color: 'amber',
    period: '2024.08 - 2024.12',
    features: [
      'Token Bucket 알고리즘 기반 Redis 분산 IP 속도 제한(Rate Limiter)',
      'gRPC 커스텀 프로토콜을 사용한 MSA 내부 서비스 간 고속 라우팅',
      '비대칭 키 알고리즘(RSA256) 기반 고성능 JWT 토큰 검증 시스템',
      '성능 모니터링용 OpenTelemetry 지표 연동 및 분산 추적(Distributed Tracing)'
    ]
  }
];

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

export default function ProjectsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'all') return PROJECTS_DATA;
    return PROJECTS_DATA.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

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
          Core <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">Projects</span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          다양한 기술적 도전을 담아 설계하고 검증한 핵심 개발 프로젝트 목록입니다.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-4xl w-full flex justify-center gap-2 mb-12 relative z-10">
        <div className="p-1 rounded-full bg-white/[0.02] border border-white/[0.05] backdrop-blur-md flex flex-wrap gap-1">
          {[
            { label: 'All', value: 'all' },
            { label: 'Frontend', value: 'frontend' },
            { label: 'Backend', value: 'backend' },
            { label: 'AI & Data', value: 'ai' },
            { label: 'Cloud & DevOps', value: 'devops' },
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
                    {project.period}
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
                <p className="leading-relaxed bg-white/[0.01] border border-white/[0.03] rounded-2xl p-4">{selectedProject.longDesc}</p>
              </div>

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
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
