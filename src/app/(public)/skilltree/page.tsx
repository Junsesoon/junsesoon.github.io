import SkillTreeGrid from '@/components/SkillTreeGrid';
import { query } from '../../../infra/db';

export const revalidate = 3600;

export default async function SkillTreePage() {
  const { rows: domains } = await query('SELECT title, description, match_category2 FROM skilltree_domains ORDER BY display_order ASC, domain_id ASC');

  return (
    <main className="mx-auto max-w-5xl p-8 font-sans">
      <header className="mb-0 flex min-h-80 flex-col items-center justify-center gap-6 py-10 text-center">
        <h1 className="text-5xl">Skill Tree 🌳</h1>
        <p className="text-xl text-gray-600">From the Roots of Paradigms to Modern Engineering</p>
        <hr className="mt-16 w-80 border-gray-200" />
      </header>
      
      <div className="flex flex-col gap-8">
        {domains.map((domain) => (
          <section key={domain.match_category2}>
            <SkillTreeGrid 
              title={domain.title} 
              description={domain.description} 
              matchCategory2={domain.match_category2} 
            />
          </section>
        ))}
      </div>
    </main>
  );
}
