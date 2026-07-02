import SkillTreeGrid from '@/components/blog/SkillTreeGrid';
import SkillTreeTOC from '@/components/blog/SkillTreeTOC';
import SkillTreeThemeToggle from '@/components/blog/SkillTreeThemeToggle';
import { query } from '../../../infra/neon';

export const revalidate = 3600;

export default async function SkillTreePage() {
  const { rows: domains } = await query('SELECT title, description, match_category2 FROM skilltree_domains ORDER BY display_order ASC, domain_id ASC');

  return (
    <main 
      id="skilltree-main"
      className="w-full min-h-screen bg-theme-bg text-theme-text-body font-sans pb-16 -mt-16 pt-16 relative transition-colors duration-300"
    >
      <SkillTreeThemeToggle />

      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <header className="relative mb-8 flex min-h-[300px] flex-col items-center justify-center gap-6 py-10 text-center select-none">
          {/* Sparkle Star 1: Sky Blue */}
          <div className="absolute top-12 right-[12%] md:right-[20%] animate-pulse sparkle-sky" style={{ animationDuration: '3s' }}>
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
            </svg>
          </div>
          
          {/* Sparkle Star 2: Indigo */}
          <div className="absolute top-24 left-[8%] md:left-[16%] animate-pulse sparkle-indigo" style={{ animationDelay: '1s', animationDuration: '4.5s' }}>
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
            </svg>
          </div>

          {/* Sparkle Star 3: Amber/Gold */}
          <div className="absolute bottom-24 right-[10%] md:right-[18%] animate-pulse sparkle-amber" style={{ animationDelay: '2s', animationDuration: '3.5s' }}>
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
            </svg>
          </div>

          {/* Sparkle Star 4: Soft Slate */}
          <div className="absolute bottom-16 left-[22%] md:left-[28%] animate-pulse sparkle-slate" style={{ animationDelay: '1.5s', animationDuration: '5s' }}>
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
            </svg>
          </div>

          {/* Scattered background star-dots */}
          <div className="absolute top-10 left-[42%] w-1 h-1 bg-white/40 rounded-full blur-[0.2px] animate-pulse [.light-theme_&]:bg-slate-400/30" style={{ animationDuration: '6s' }} />
          <div className="absolute top-28 right-[32%] w-1.5 h-1.5 bg-sky-300/45 rounded-full blur-[0.5px] animate-pulse [.light-theme_&]:bg-sky-400/20" style={{ animationDelay: '0.5s', animationDuration: '4s' }} />
          <div className="absolute bottom-28 left-[18%] w-0.5 h-0.5 bg-indigo-300/50 rounded-full animate-pulse [.light-theme_&]:bg-indigo-400/20" style={{ animationDelay: '1.2s', animationDuration: '3s' }} />
          <div className="absolute top-16 right-[45%] w-0.5 h-0.5 bg-white/30 rounded-full [.light-theme_&]:bg-slate-400/20" />

          <h1 className="text-5xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-theme-grad-from via-theme-grad-via to-theme-grad-to uppercase">Skill Tree</h1>
          <p className="text-xl text-theme-text-muted">From the Roots of Paradigms to Modern Engineering</p>
        </header>
        
        <div className="flex flex-col xl:flex-row gap-8 items-start relative">
          <div className="flex-1 min-w-0 w-full flex flex-col gap-12">
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
