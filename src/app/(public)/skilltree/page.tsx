import SkillTreeGrid from '@/components/SkillTreeGrid';
import SkillTreeTOC from '@/components/SkillTreeTOC';
import { query } from '../../../infra/neon';

export const revalidate = 3600;

export default async function SkillTreePage() {
  const { rows: domains } = await query('SELECT title, description, match_category2 FROM skilltree_domains ORDER BY display_order ASC, domain_id ASC');

  return (
    <main 
      className="w-full min-h-screen bg-[#02040a] text-slate-100 font-sans pb-16 -mt-16 pt-16 relative"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08), transparent 60%), radial-gradient(circle at 10% 80%, rgba(56, 189, 248, 0.06), transparent 40%)',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <header className="relative mb-8 flex min-h-[300px] flex-col items-center justify-center gap-6 py-10 text-center select-none">
          {/* Sparkle Star 1: Sky Blue */}
          <div className="absolute top-12 right-[12%] md:right-[20%] animate-pulse text-sky-400/60 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" style={{ animationDuration: '3s' }}>
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
            </svg>
          </div>
          
          {/* Sparkle Star 2: Indigo */}
          <div className="absolute top-24 left-[8%] md:left-[16%] animate-pulse text-indigo-400/50 drop-shadow-[0_0_6px_rgba(167,139,250,0.4)]" style={{ animationDelay: '1s', animationDuration: '4.5s' }}>
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
            </svg>
          </div>

          {/* Sparkle Star 3: Amber/Gold */}
          <div className="absolute bottom-24 right-[10%] md:right-[18%] animate-pulse text-amber-400/40 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]" style={{ animationDelay: '2s', animationDuration: '3.5s' }}>
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
            </svg>
          </div>

          {/* Sparkle Star 4: Soft Slate */}
          <div className="absolute bottom-16 left-[22%] md:left-[28%] animate-pulse text-slate-300/40" style={{ animationDelay: '1.5s', animationDuration: '5s' }}>
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
            </svg>
          </div>

          {/* Scattered background star-dots */}
          <div className="absolute top-10 left-[42%] w-1 h-1 bg-white/40 rounded-full blur-[0.2px] animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute top-28 right-[32%] w-1.5 h-1.5 bg-sky-300/45 rounded-full blur-[0.5px] animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '4s' }} />
          <div className="absolute bottom-28 left-[18%] w-0.5 h-0.5 bg-indigo-300/50 rounded-full animate-pulse" style={{ animationDelay: '1.2s', animationDuration: '3s' }} />
          <div className="absolute top-16 right-[45%] w-0.5 h-0.5 bg-white/30 rounded-full" />

          <h1 className="text-5xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.35)] uppercase">Skill Tree</h1>
          <p className="text-xl text-slate-400">From the Roots of Paradigms to Modern Engineering</p>
        </header>
        
        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          <div className="flex-1 w-full flex flex-col gap-12">
            {domains.map((domain, index) => (
              <section 
                key={domain.match_category2}
                id={`domain-${domain.match_category2.replace(/\s+/g, '-').toLowerCase()}`}
                className="scroll-mt-24"
              >
                <SkillTreeGrid 
                  title={domain.title} 
                  description={domain.description} 
                  matchCategory2={domain.match_category2} 
                  colorIndex={index}
                />
              </section>
            ))}
          </div>

          <SkillTreeTOC 
            domains={domains.map((d, index) => ({
              id: `domain-${d.match_category2.replace(/\s+/g, '-').toLowerCase()}`,
              title: d.title,
              colorIndex: index,
            }))}
          />
        </div>
      </div>
    </main>
  );
}
