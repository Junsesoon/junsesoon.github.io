import SkillTreeGrid from '@/components/skilltreegrid';

export const dynamic = 'force-dynamic';

export default function SkillTreePage() {
  return (
    <main className="mx-auto max-w-5xl p-8 font-sans">
      <header className="mb-0 flex min-h-80 flex-col items-center justify-center gap-6 py-10 text-center">
        <h1 className="text-5xl">Skill Tree 🌳</h1>
        <p className="text-xl text-gray-600">From the Roots of Paradigms to Modern Engineering</p>
        <hr className="mt-16 w-80 border-gray-200" />
      </header>
      
      <div className="flex flex-col gap-8">
        <section>
          <SkillTreeGrid 
            title="Programming Language" 
            description="Core programming languages and their related ecosystems" 
            matchCategory2="Programming Language" // 어떤 category의 skill card post를 가져올지 지정하는 설정 영역
          />
        </section>

        <section>
          <SkillTreeGrid 
            title="Operating System"
            description="OS and Infrastructure"
            matchCategory2="Operating System" // 어떤 category의 skill card post를 가져올지 지정하는 설정 영역
          />
        </section>
      </div>
    </main>
  );
}
