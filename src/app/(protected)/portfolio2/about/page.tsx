import React from 'react';
import Link from 'next/link';
import AboutTimeline from '@/components/PF2/AboutTimeline';
import { getAllPosts } from '@/utils/posts';
import { getTimelineItemsAction } from '@/actions/timelineActions';

export const metadata = {
  title: 'About Junseo - Portfolio 2.0',
  description: 'Learn more about the developer Junseo, his values, and timeline.',
};

export default async function AboutPage() {
  const [posts, dbItems] = await Promise.all([
    getAllPosts('portfolio', { category1: 'portfolio', category2: 'about' }),
    getTimelineItemsAction()
  ]);

  const colorMap = new Map<string, string>();
  dbItems.forEach(item => {
    colorMap.set(item.name.trim().toLowerCase(), item.color);
  });
  
  const timelineItems = posts.map(post => {
    const cat3 = (post.metadata?.category3 || '').trim().toLowerCase();
    const color = colorMap.get(cat3) || 'Indigo';
    return {
      title: post.title,
      startDate: post.metadata?.startdate || post.metadata?.startDate || post.date || '',
      endDate: post.metadata?.enddate || post.metadata?.endDate || post.date || '',
      desc: post.metadata?.summary || post.excerpt || '',
      color: color,
      category: cat3,
    };
  });
  return (
    <main 
      className="w-full min-h-screen relative overflow-hidden px-6 md:px-12 flex flex-col items-center pt-16 pb-20"
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
          className="inline-flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold text-slate-400 bg-white/[0.02] border border-white/[0.05] rounded-full hover:bg-white/[0.06] hover:text-white transition-all duration-200 select-none no-underline group"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span> Back to main
        </Link>
      </div>

      {/* Top Right: Mode Switch */}
      <div className="absolute top-8 right-6 md:right-12 z-20 flex gap-3 transition-hide">
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

      {/* Main Profile Header Section */}
      <div className="max-w-4xl w-full text-center mt-12 mb-16 relative z-10">
        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full mx-auto flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(99,102,241,0.3)] mb-6 select-none animate-pulse">
          👨‍💻
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-4">
          About <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">오준서</span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          어제보다 성장한 오늘을 꿈꾸며, 깔끔하고 확장성 있는 코드로 최상의 UXUI를 조각해 나가는 풀스택 개발자입니다.
        </p>
      </div>

      {/* Content Grid */}
      <div className="max-w-4xl w-full flex flex-col gap-8 relative z-10">
        
        {/* Card 1: Timeline / Milestones */}
        <div className="p-8 rounded-3xl bg-white/[0.01] border border-white/[0.04] backdrop-blur-xl hover:border-white/[0.08] transition-all duration-300 min-h-[300px]">
          <AboutTimeline items={timelineItems} />
        </div>

        {/* Card 2: Core Values */}
        <div className="p-8 rounded-3xl bg-white/[0.01] border border-white/[0.04] backdrop-blur-xl hover:border-white/[0.08] transition-all duration-300 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
              <span className="text-indigo-400">⚡</span> Core Values
            </h2>
            <div className="space-y-6">
              {[
                { title: "User-Centric DX", desc: "사용자 중심의 부드럽고 매끄러운 UX와 고성능 UI 인터랙션을 고민합니다." },
                { title: "Clean & Maintainable", desc: "유지보수하기 쉽고 명확한 아키텍처 설계를 지향하며, 불필요한 중복을 줄입니다." },
                { title: "Constant Learner", desc: "매 순간 새로운 라이브러리와 프레임워크 트렌드를 학습하고 프로덕트에 녹여냅니다." },
              ].map((value, idx) => (
                <div key={idx} className="group">
                  <h3 className="text-slate-200 font-semibold mb-1 group-hover:text-indigo-400 transition-colors duration-200">{value.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </main>
  );
}
