'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createPostAction, 
  updatePostAction, 
  deletePostAction, 
  addMySkillDomainAction,
  updateMySkillDomainAction,
  deleteMySkillDomainAction
} from '@/actions/postActions';

export interface AdminSkill {
  id: string; // slug
  slug: string;
  name: string; // title
  category: string; // category3 (matches domainKey)
  level: number; // familiar
  levelText: string;
  desc: string; // content
  techs: string[];
  projects: string[];
}

export interface MySkillDomain {
  id: number;
  domainKey: string;
  title: string;
  icon: string;
  color: string;
  displayOrder: number;
}

interface MySkillManagerProps {
  initialSkills: AdminSkill[];
  initialDomains: MySkillDomain[];
}

const CURATED_EMOJIS = [
  '💻', '📱', '🌐', '🚀', '⚡', '🎨',
  '⚙️', '📊', '🔒', '🎮', '🤖', '🧠',
  '📦', '🧪', '📅', '📝', '🔧', '💬',
  '🛍️', '🔑', '🔥', '💡', '🛠️', '📈'
];

const COLOR_OPTIONS = [
  { value: 'cyan', hex: '#06b6d4' },
  { value: 'purple', hex: '#a855f7' },
  { value: 'emerald', hex: '#10b981' },
  { value: 'amber', hex: '#f59e0b' },
  { value: 'blue', hex: '#3b82f6' },
  { value: 'indigo', hex: '#6366f1' },
  { value: 'rose', hex: '#f43f5e' },
  { value: 'pink', hex: '#ec4899' }
];

const getColorHex = (colorName: string) => {
  const opt = COLOR_OPTIONS.find(o => o.value === colorName.toLowerCase());
  return opt ? opt.hex : '#06b6d4';
};

const getCategoryTheme = (color: string) => {
  const normalized = color.toLowerCase();
  if (normalized === 'cyan') return {
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    title: 'text-cyan-400',
    barBg: 'from-cyan-500/30 to-blue-500/30 shadow-[0_0_8px_rgba(6,182,212,0.3)]',
    badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    accentBg: 'bg-cyan-500',
    cardHover: 'hover:border-cyan-500/40 hover:shadow-[0_8px_30px_rgba(6,182,212,0.15)]',
  };
  if (normalized === 'purple') return {
    border: 'border-purple-500/20 hover:border-purple-500/40',
    title: 'text-purple-400',
    barBg: 'from-purple-500/30 to-pink-500/30 shadow-[0_0_8px_rgba(168,85,247,0.3)]',
    badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    accentBg: 'bg-purple-500',
    cardHover: 'hover:border-purple-500/40 hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)]',
  };
  if (normalized === 'emerald') return {
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    title: 'text-emerald-400',
    barBg: 'from-emerald-500/30 to-teal-500/30 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
    badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    accentBg: 'bg-emerald-500',
    cardHover: 'hover:border-emerald-500/40 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]',
  };
  if (normalized === 'blue') return {
    border: 'border-blue-500/20 hover:border-blue-500/40',
    title: 'text-blue-400',
    barBg: 'from-blue-500/30 to-indigo-500/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]',
    badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    accentBg: 'bg-blue-500',
    cardHover: 'hover:border-blue-500/40 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]',
  };
  if (normalized === 'indigo') return {
    border: 'border-indigo-500/20 hover:border-indigo-500/40',
    title: 'text-indigo-400',
    barBg: 'from-indigo-500/30 to-purple-500/30 shadow-[0_0_8px_rgba(99,102,241,0.3)]',
    badge: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    accentBg: 'bg-indigo-500',
    cardHover: 'hover:border-indigo-500/40 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]',
  };
  if (normalized === 'rose') return {
    border: 'border-rose-500/20 hover:border-rose-500/40',
    title: 'text-rose-400',
    barBg: 'from-rose-500/30 to-red-500/30 shadow-[0_0_8px_rgba(244,63,94,0.3)]',
    badge: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    accentBg: 'bg-rose-500',
    cardHover: 'hover:border-rose-500/40 hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)]',
  };
  if (normalized === 'pink') return {
    border: 'border-pink-500/20 hover:border-pink-500/40',
    title: 'text-pink-400',
    barBg: 'from-pink-500/30 to-rose-500/30 shadow-[0_0_8px_rgba(236,72,153,0.3)]',
    badge: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    accentBg: 'bg-pink-500',
    cardHover: 'hover:border-pink-500/40 hover:shadow-[0_8px_30px_rgba(236,72,153,0.15)]',
  };
  return {
    border: 'border-amber-500/20 hover:border-amber-500/40',
    title: 'text-amber-400',
    barBg: 'from-amber-500/30 to-orange-500/30 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
    badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    accentBg: 'bg-amber-500',
    cardHover: 'hover:border-amber-500/40 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]',
  };
};

const getAutomaticLevelText = (lvl: number) => {
  if (lvl >= 90) return 'Lead';
  if (lvl >= 75) return 'Independent';
  if (lvl >= 45) return 'Co-work';
  return 'Learning';
};

export default function MySkillManager({ initialSkills, initialDomains }: MySkillManagerProps) {
  const router = useRouter();
  
  // Skills lists states
  const [skills, setSkills] = useState<AdminSkill[]>(initialSkills);
  const [domains, setDomains] = useState<MySkillDomain[]>(initialDomains);
  
  // Loader and Deleting indicators
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingSlug, setIsDeletingSlug] = useState<string | null>(null);
  const [selectedPreviewSkill, setSelectedPreviewSkill] = useState<AdminSkill | null>(null);

  // Skill Card Form states
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(
    initialDomains.length > 0 ? initialDomains[0].domainKey : 'frontend'
  );
  const [level, setLevel] = useState(80);
  const [levelText, setLevelText] = useState('Independent');
  const [desc, setDesc] = useState('');
  const [techs, setTechs] = useState('');
  const [projects, setProjects] = useState('');

  // Domain Form states
  const [editingDomainId, setEditingDomainId] = useState<number | null>(null);
  const [domainTitle, setDomainTitle] = useState('');
  const [domainIcon, setDomainIcon] = useState('💻');
  const [domainColor, setDomainColor] = useState('cyan');
  const [isDomainSubmitting, setIsDomainSubmitting] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Skill Handlers
  const handleEdit = (skill: AdminSkill) => {
    setEditingSlug(skill.slug);
    setName(skill.name);
    setCategory(skill.category);
    setLevel(skill.level);
    let initialLvlText = skill.levelText;
    if (initialLvlText === 'Expert') initialLvlText = 'Lead';
    else if (initialLvlText === 'Advanced') initialLvlText = 'Independent';
    else if (initialLvlText === 'Intermediate') initialLvlText = 'Co-work';
    else if (initialLvlText === 'Basic' || initialLvlText === 'Novice') initialLvlText = 'Learning';
    
    if (!['Lead', 'Independent', 'Co-work', 'Learning'].includes(initialLvlText)) {
      initialLvlText = getAutomaticLevelText(skill.level);
    }
    setLevelText(initialLvlText);
    setDesc(skill.desc);
    setTechs(skill.techs.join(', '));
    setProjects(skill.projects.join('\n'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingSlug(null);
    setName('');
    setCategory(domains.length > 0 ? domains[0].domainKey : 'frontend');
    setLevel(80);
    setLevelText('Independent');
    setDesc('');
    setTechs('');
    setProjects('');
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('정말로 이 스킬 카드를 삭제하시겠습니까?')) return;
    setIsDeletingSlug(slug);
    try {
      await deletePostAction(slug);
      setSkills((prev) => prev.filter((s) => s.slug !== slug));
      alert('성공적으로 삭제되었습니다.');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeletingSlug(null);
    }
  };

  const handleLevelChange = (val: number) => {
    setLevel(val);
    setLevelText(getAutomaticLevelText(val));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('스킬 이름을 입력해 주세요.');
      return;
    }
    setIsSubmitting(true);

    const parsedTechs = techs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedProjects = projects
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const formData = {
      title: name.trim(),
      content: desc.trim(),
      summary: desc.trim().slice(0, 100),
      category1: 'portfolio',
      category2: 'myskill',
      category3: category,
      familiar: Number(level),
      levelText: levelText.trim() || getAutomaticLevelText(Number(level)),
      techs: parsedTechs,
      projects: parsedProjects,
    };

    try {
      if (editingSlug) {
        const res = await updatePostAction(editingSlug, formData);
        if (res.success) {
          setSkills((prev) =>
            prev.map((s) =>
              s.slug === editingSlug
                ? {
                    ...s,
                    slug: res.slug || s.slug,
                    name: name.trim(),
                    category,
                    level: Number(level),
                    levelText: formData.levelText,
                    desc: desc.trim(),
                    techs: parsedTechs,
                    projects: parsedProjects,
                  }
                : s
            )
          );
          handleCancel();
          alert('성공적으로 수정되었습니다.');
          router.refresh();
        } else {
          alert('수정 중 오류가 발생했습니다.');
        }
      } else {
        const res = await createPostAction(formData);
        if (res.success) {
          const newSlug = res.slug || `portfolio/myskill/${name.toLowerCase().replace(/\s+/g, '-')}`;
          const newSkill: AdminSkill = {
            id: newSlug,
            slug: newSlug,
            name: name.trim(),
            category,
            level: Number(level),
            levelText: formData.levelText,
            desc: desc.trim(),
            techs: parsedTechs,
            projects: parsedProjects,
          };
          setSkills((prev) => [...prev, newSkill]);
          handleCancel();
          alert('성공적으로 추가되었습니다.');
          router.refresh();
        } else {
          alert('추가 중 오류가 발생했습니다.');
        }
      }
    } catch (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Domain Handlers
  const handleDomainEdit = (dom: MySkillDomain) => {
    setEditingDomainId(dom.id);
    setDomainTitle(dom.title);
    setDomainIcon(dom.icon);
    setDomainColor(dom.color);
  };

  const handleDomainCancel = () => {
    setEditingDomainId(null);
    setDomainTitle('');
    setDomainIcon('💻');
    setDomainColor('cyan');
    setIsEmojiPickerOpen(false);
    setIsColorPickerOpen(false);
  };

  const handleDomainDelete = async (id: number, title: string) => {
    if (!confirm(`정말로 '${title}' 도메인을 삭제하시겠습니까?\n이 도메인에 속한 스킬들은 목록에 보이지 않거나 기본 카테고리로 변경될 수 있습니다.`)) return;
    try {
      const res = await deleteMySkillDomainAction(id);
      if (res.success) {
        setDomains(prev => prev.filter(d => d.id !== id));
        alert('성공적으로 삭제되었습니다.');
        router.refresh();
      } else {
        alert(res.message || '삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    }
  };

  const handleDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainTitle.trim()) {
      alert('도메인 이름을 입력해 주세요.');
      return;
    }
    setIsDomainSubmitting(true);
    try {
      if (editingDomainId) {
        const res = await updateMySkillDomainAction(
          editingDomainId,
          domainTitle.trim(),
          domainIcon,
          domainColor
        );
        if (res.success) {
          setDomains(prev => prev.map(d => d.id === editingDomainId ? {
            ...d,
            title: domainTitle.trim(),
            icon: domainIcon,
            color: domainColor
          } : d));
          handleDomainCancel();
          alert('성공적으로 수정되었습니다.');
          router.refresh();
        } else {
          alert(res.message || '수정에 실패했습니다.');
        }
      } else {
        const res = await addMySkillDomainAction(
          domainTitle.trim(),
          domainIcon,
          domainColor
        );
        if (res.success) {
          alert('성공적으로 추가되었습니다.');
          window.location.reload();
        } else {
          alert(res.message || '추가에 실패했습니다.');
        }
      }
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    } finally {
      setIsDomainSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[4.5fr_5.5fr] gap-6 w-full items-start text-gray-900">
      
      {/* Left Column: Skill Edit Form & Domain Edit Form */}
      <div className="space-y-6">
        
        {/* Skill Card Form Box */}
        <div className="relative z-20 rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              {editingSlug ? '💻 스킬 카드 수정' : '➕ 새 스킬 카드 추가'}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">스킬 이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: React / Next.js"
                  className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
                  required
                />
              </div>
              
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">스킬 구분</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                >
                  {domains.length === 0 ? (
                    <option value="frontend">💻 Frontend Development</option>
                  ) : (
                    domains.map((dom) => (
                      <option key={dom.id} value={dom.domainKey}>
                        {dom.icon} {dom.title}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-600">친숙도 {level}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={level}
                  onChange={(e) => handleLevelChange(Number(e.target.value))}
                  className="block w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">친숙도 등급</label>
                <select
                  value={levelText}
                  onChange={(e) => setLevelText(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 font-medium"
                >
                  <option value="Lead">Lead</option>
                  <option value="Independent">Independent</option>
                  <option value="Co-work">Co-work</option>
                  <option value="Learning">Learning</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">상세 설명</label>
              <textarea
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="스킬의 활용 방법 및 숙련 범위에 대해 자세히 작성해 주세요."
                className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">세부 기술 스택</label>
              <input
                type="text"
                value={techs}
                onChange={(e) => setTechs(e.target.value)}
                placeholder="Next.js 14/15, Zustand, React Query, Framer Motion"
                className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">주요 활용 프로젝트</label>
              <textarea
                rows={3}
                value={projects}
                onChange={(e) => setProjects(e.target.value)}
                placeholder="예: NexusCommerce 헤드리스 커머스&#10;오준서 개인 블로그 & 포트폴리오"
                className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition-all focus:outline-none bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? '저장 중...' : editingSlug ? '카드 수정 완료' : '카드 생성 완료'}
              </button>
              {editingSlug && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-gray-150 px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-250 focus:outline-none cursor-pointer"
                >
                  취소
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Domain Edit Box */}
        <div className="relative z-20 rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingDomainId ? '🗂️ 도메인 구분 수정' : '🗂️ 새 도메인 구분 추가'}
          </h2>
          
          <form onSubmit={handleDomainSubmit} className="space-y-4">
            <div className="flex flex-row items-end gap-3 w-full">
              
              <div className="w-20 shrink-0 relative">
                <label className="mb-1 block text-xs font-semibold text-gray-600">아이콘</label>
                <div className="relative">
                  <input
                    type="text"
                    value={domainIcon}
                    onChange={(e) => setDomainIcon(e.target.value)}
                    placeholder="예: 💻"
                    className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 pl-3 pr-7 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center text-gray-800"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-all cursor-pointer flex items-center justify-center p-0.5 hover:scale-110"
                    title="추천 아이콘 선택"
                  >
                    <svg className="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                      <line x1="9" y1="9" x2="9.01" y2="9" />
                      <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                  </button>
                </div>

                {isEmojiPickerOpen && (
                  <div className="absolute z-50 mt-1 left-0 w-48 bg-white border border-gray-200 rounded-xl shadow-xl p-2.5">
                    <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-gray-100">
                      <span className="text-[10px] font-bold text-gray-500">추천 아이콘</span>
                      <button
                        type="button"
                        onClick={() => setIsEmojiPickerOpen(false)}
                        className="text-gray-400 hover:text-gray-700 text-[10px] font-bold cursor-pointer"
                      >
                        닫기
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {CURATED_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setDomainIcon(emoji);
                            setIsEmojiPickerOpen(false);
                          }}
                          className={`w-6.5 h-6.5 rounded-lg text-base flex items-center justify-center hover:bg-gray-100 transition-all cursor-pointer ${
                            domainIcon === emoji ? 'bg-blue-50 border border-blue-200' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <label className="mb-1 block text-xs font-semibold text-gray-600">도메인 이름</label>
                <input
                  type="text"
                  value={domainTitle}
                  onChange={(e) => setDomainTitle(e.target.value)}
                  placeholder="예: Frontend Development"
                  className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
                  required
                />
              </div>

              <div className="w-32 shrink-0 relative">
                <label className="mb-1 block text-xs font-semibold text-gray-600">테마 색상</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                    className="flex items-center justify-between w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-2.5 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 bg-white cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span 
                        className="w-3 h-3 rounded-full border border-black/10 shrink-0 inline-block" 
                        style={{ backgroundColor: getColorHex(domainColor) }} 
                      />
                      <span className="capitalize truncate">{domainColor}</span>
                    </div>
                    <svg className="w-3 h-3 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {isColorPickerOpen && (
                    <div className="absolute right-0 z-50 mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-xl p-1 max-h-56 overflow-y-auto">
                      {COLOR_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setDomainColor(opt.value);
                            setIsColorPickerOpen(false);
                          }}
                          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer ${
                            domainColor === opt.value ? 'bg-blue-50/70 font-semibold text-blue-700' : ''
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: opt.hex }} />
                          <span className="capitalize">{opt.value}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isDomainSubmitting}
                className="flex-1 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition-all focus:outline-none bg-blue-600 hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {isDomainSubmitting ? '저장 중...' : editingDomainId ? '도메인 수정 완료' : '도메인 추가 완료'}
              </button>
              {editingDomainId && (
                <button
                  type="button"
                  onClick={handleDomainCancel}
                  className="flex-1 rounded-lg bg-gray-150 px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-250 focus:outline-none cursor-pointer"
                >
                  취소
                </button>
              )}
            </div>
          </form>

          {/* List of current domains */}
          <div className="mt-6 border-t border-gray-200/85 pt-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">현재 등록된 도메인 카테고리</h3>
            <div className="space-y-2">
              {domains.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">등록된 도메인이 없습니다.</p>
              ) : (
                domains.map((dom) => (
                  <div 
                    key={dom.id} 
                    className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/20 text-xs text-gray-705 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{dom.icon}</span>
                      <span className="font-semibold text-gray-800">{dom.title}</span>
                      <span className={`w-2.5 h-2.5 rounded-full bg-${dom.color}-500 inline-block`} style={{
                        backgroundColor: dom.color === 'cyan' ? '#06b6d4' : dom.color === 'purple' ? '#a855f7' : dom.color === 'emerald' ? '#10b981' : dom.color === 'amber' ? '#f59e0b' : dom.color === 'blue' ? '#3b82f6' : dom.color === 'indigo' ? '#6366f1' : dom.color === 'rose' ? '#f43f5e' : '#ec4899'
                      }} />
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDomainEdit(dom)}
                        className="text-gray-450 hover:text-blue-600 hover:bg-blue-50/50 p-1.5 rounded-lg transition-colors focus:outline-none cursor-pointer"
                        title="수정"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDomainDelete(dom.id, dom.title)}
                        className="text-gray-455 hover:text-red-600 hover:bg-red-50/50 p-1.5 rounded-lg transition-colors focus:outline-none cursor-pointer"
                        title="삭제"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Right Column: PF2.0 Real-time Dark Theme Live Preview */}
      <div className="bg-[#030712] border border-white/[0.08] p-6 sm:p-8 rounded-3xl min-h-[500px] shadow-2xl relative overflow-hidden flex flex-col items-stretch">
        <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.06] relative z-10">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span>⚙️</span> PF 2.0 스택 라이브 프리뷰
          </h2>
          <span className="text-[9px] bg-white/[0.03] border border-white/[0.08] font-bold px-2 py-0.5 rounded-full text-slate-400">
            Dark Theme Preview
          </span>
        </div>

        <div className="flex flex-col gap-10 relative z-10 w-full text-slate-100">
          {domains.map((dom) => {
            const catSkills = skills.filter(s => s.category === dom.domainKey);
            const theme = getCategoryTheme(dom.color);

            return (
              <div key={dom.id} className="w-full">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <span>{dom.icon}</span>
                  <span className="text-slate-300">{dom.title}</span>
                </h3>

                {catSkills.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl text-xs bg-white/[0.005]">
                    등록된 스킬 카드가 없습니다.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {catSkills.map((skill) => (
                      <div
                        key={skill.id}
                        className={`p-4 rounded-xl border ${theme.border} bg-white/[0.01] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden`}
                      >
                        {/* Control Overlays on Hover */}
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 z-20">
                          <button
                            onClick={() => handleEdit(skill)}
                            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] shadow transition-all cursor-pointer"
                          >
                            ⚙️ 수정
                          </button>
                          <button
                            onClick={() => setSelectedPreviewSkill(skill)}
                            className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[9px] shadow transition-all cursor-pointer"
                          >
                            🔍 상세
                          </button>
                          <button
                            onClick={() => handleDelete(skill.slug)}
                            disabled={isDeletingSlug === skill.slug}
                            className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] shadow transition-all disabled:opacity-50 cursor-pointer"
                          >
                            🗑️ 삭제
                          </button>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-slate-200 text-xs truncate">
                              {skill.name}
                            </h4>
                            <span className="text-[8px] font-semibold text-slate-400 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded-full">
                              {skill.levelText}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                            {skill.desc}
                          </p>
                        </div>

                        <div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-1 relative">
                            <div
                              className={`h-full bg-gradient-to-r ${theme.barBg} transition-all duration-1000`}
                              style={{ width: `${skill.level}%` }}
                            />
                          </div>
                          <div className="text-[8px] font-bold text-slate-500 flex justify-between items-center">
                            <span>Proficiency</span>
                            <span>{skill.level}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail Preview Modal */}
        {selectedPreviewSkill && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 transition-opacity"
            onClick={() => setSelectedPreviewSkill(null)}
          >
            <div
              className="w-full max-w-md bg-[#090d16] border border-white/[0.08] rounded-2xl p-6 relative shadow-2xl overflow-y-auto max-h-[80vh] font-sans text-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPreviewSkill(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-4">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/20 text-indigo-400 bg-indigo-500/10 mb-1.5 inline-block uppercase">
                  {selectedPreviewSkill.levelText} ({selectedPreviewSkill.level}%)
                </span>
                <h3 className="text-lg font-bold text-white">{selectedPreviewSkill.name}</h3>
              </div>

              <div className="space-y-4 text-xs text-slate-350">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">상세 설명</h4>
                  <p className="leading-relaxed bg-white/[0.01] border border-white/[0.03] rounded-xl p-3 whitespace-pre-line text-slate-300">{selectedPreviewSkill.desc}</p>
                </div>

                {selectedPreviewSkill.techs.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">숙련 스택</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPreviewSkill.techs.map((tech) => (
                        <span key={tech} className="text-[9px] font-semibold px-2 py-0.5 rounded-full border border-white/[0.06] text-slate-300 bg-white/[0.02]">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPreviewSkill.projects.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">주요 프로젝트</h4>
                    <ul className="space-y-1.5">
                      {selectedPreviewSkill.projects.map((proj, idx) => (
                        <li key={idx} className="flex gap-2 leading-relaxed text-slate-300">
                          <span className="text-purple-400">✔</span>
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

      </div>
    </div>
  );
}
