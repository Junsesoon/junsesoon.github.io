'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPostAction, updatePostAction, deletePostAction } from '@/actions/postActions';

export interface AdminProject {
  id: string;
  title: string;
  category: 'team' | 'personal';
  desc: string;
  longDesc: string;
  icon: string;
  techs: string[];
  color: 'purple' | 'emerald' | 'blue' | 'amber';
  startdate: string;
  enddate: string;
  features: string[];
  slug: string;
}

interface ProjectCardManagerProps {
  initialProjects: AdminProject[];
}

const getProjectColorClass = (color: AdminProject['color']) => {
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

const formatPeriod = (start: string, end: string) => {
  if (!start) return '';
  const startFormatted = start.replace(/-/g, '.');
  const endFormatted = end ? end.replace(/-/g, '.') : '진행 중';
  return `${startFormatted} - ${endFormatted}`;
};

interface CustomDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  label: string;
}

function CustomDatePicker({ value, onChange, disabled, label }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'year' | 'month' | 'day'>('year');
  
  // Parse state dates or fallback to current
  const parts = value ? value.split('-') : [];
  const initialYear = parts[0] ? parseInt(parts[0], 10) : new Date().getFullYear();
  const initialMonth = parts[1] ? parseInt(parts[1], 10) : new Date().getMonth() + 1;

  const [year, setYear] = useState<number>(initialYear);
  const [month, setMonth] = useState<number>(initialMonth);

  const years = Array.from({ length: 21 }, (_, i) => 2015 + i); // 2015 ~ 2035
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m, 0).getDate();
  };

  const handleYearSelect = (y: number) => {
    setYear(y);
    setStep('month');
  };

  const handleMonthSelect = (m: number) => {
    setMonth(m);
    setStep('day');
  };

  const handleDaySelect = (d: number) => {
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handleBack = () => {
    if (step === 'day') setStep('month');
    else if (step === 'month') setStep('year');
  };

  const displayValue = value ? value.replace(/-/g, '.') : '날짜 선택';

  return (
    <div className="relative">
      {label && <label className="mb-1 block text-xs font-semibold text-gray-600">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          // Pre-populate if value exists
          if (value) {
            const currentParts = value.split('-');
            if (currentParts.length === 3) {
              setYear(parseInt(currentParts[0], 10));
              setMonth(parseInt(currentParts[1], 10));
            }
          }
          setIsOpen(!isOpen);
          setStep('year');
        }}
        className="flex items-center justify-between w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 text-left text-gray-750 font-medium cursor-pointer"
      >
        <span>{displayValue}</span>
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-4 font-sans text-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
            {step !== 'year' ? (
              <button
                type="button"
                onClick={handleBack}
                className="text-blue-600 hover:text-blue-700 text-xs font-bold cursor-pointer"
              >
                ← 뒤로
              </button>
            ) : (
              <div className="w-8"></div>
            )}
            <span className="text-xs font-bold text-gray-600">
              {step === 'year' && '연도 선택'}
              {step === 'month' && `${year}년`}
              {step === 'day' && `${year}년 ${month}월`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer"
            >
              닫기
            </button>
          </div>

          {/* Step 1: Year Grid */}
          {step === 'year' && (
            <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => handleYearSelect(y)}
                  className={`py-1.5 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                    year === y
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-105'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Month Grid */}
          {step === 'month' && (
            <div className="grid grid-cols-4 gap-1.5">
              {months.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMonthSelect(m)}
                  className={`py-2 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                    month === m && parts[0] === String(year)
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-105'
                  }`}
                >
                  {m}월
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Day Grid */}
          {step === 'day' && (
            <div className="grid grid-cols-7 gap-1 max-h-44 overflow-y-auto pr-1">
              {Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1).map((d) => {
                const currentDayFormatted = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDaySelect(d)}
                    className={`py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                      value === currentDayFormatted
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-105'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProjectCardManager({ initialProjects }: ProjectCardManagerProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<AdminProject[]>(initialProjects);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingSlug, setIsDeletingSlug] = useState<string | null>(null);
  const [selectedPreviewProject, setSelectedPreviewProject] = useState<AdminProject | null>(null);

  // Form State
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'team' | 'personal'>('personal');
  const [icon, setIcon] = useState('⚡');
  const [color, setColor] = useState<'purple' | 'emerald' | 'blue' | 'amber'>('blue');
  const [startdate, setStartdate] = useState('');
  const [enddate, setEnddate] = useState('');
  const [isOngoing, setIsOngoing] = useState(false);
  const [techs, setTechs] = useState('');
  const [desc, setDesc] = useState('');
  const [longDesc, setLongDesc] = useState('');
  const [features, setFeatures] = useState('');

  const handleEdit = (project: AdminProject) => {
    setEditingSlug(project.slug);
    setTitle(project.title);
    setCategory(project.category);
    setIcon(project.icon);
    setColor(project.color);
    setStartdate(project.startdate || '');
    setEnddate(project.enddate || '');
    setIsOngoing(!project.enddate);
    setTechs(project.techs.join(', '));
    setDesc(project.desc);
    setLongDesc(project.longDesc);
    setFeatures(project.features.join('\n'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingSlug(null);
    setTitle('');
    setCategory('personal');
    setIcon('⚡');
    setColor('blue');
    setStartdate('');
    setEnddate('');
    setIsOngoing(false);
    setTechs('');
    setDesc('');
    setLongDesc('');
    setFeatures('');
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('정말로 이 프로젝트 카드를 삭제하시겠습니까?')) return;
    setIsDeletingSlug(slug);
    try {
      await deletePostAction(slug);
      setProjects((prev) => prev.filter((p) => p.slug !== slug));
      alert('성공적으로 삭제되었습니다.');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeletingSlug(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('프로젝트 제목을 입력해 주세요.');
      return;
    }
    if (!startdate) {
      alert('프로젝트 시작일을 선택해 주세요.');
      return;
    }
    if (!isOngoing && !enddate) {
      alert('프로젝트 종료일을 선택해 주세요.');
      return;
    }
    setIsSubmitting(true);

    const parsedTechs = techs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedFeatures = features
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const formData = {
      title: title.trim(),
      content: longDesc.trim(),
      summary: desc.trim(),
      category1: 'portfolio',
      category2: 'projects',
      category3: category,
      icon: icon.trim(),
      color: color,
      startdate,
      enddate: isOngoing ? '' : enddate,
      techs: parsedTechs,
      features: parsedFeatures,
      longDesc: longDesc.trim()
    };

    try {
      if (editingSlug) {
        // Update Action
        const res = await updatePostAction(editingSlug, formData);
        if (res.success) {
          setProjects((prev) =>
            prev.map((p) =>
              p.slug === editingSlug
                ? {
                    ...p,
                    slug: res.slug || p.slug,
                    title: title.trim(),
                    category,
                    icon: icon.trim(),
                    color,
                    startdate,
                    enddate: isOngoing ? '' : enddate,
                    techs: parsedTechs,
                    desc: desc.trim(),
                    longDesc: longDesc.trim(),
                    features: parsedFeatures
                  }
                : p
            )
          );
          handleCancel();
          alert('성공적으로 수정되었습니다.');
          router.refresh();
        } else {
          alert('수정 중 오류가 발생했습니다.');
        }
      } else {
        // Create Action
        const res = await createPostAction(formData);
        if (res.success) {
          const newSlug = res.slug || `portfolio/projects/${title.toLowerCase().replace(/\s+/g, '-')}`;
          const newProject: AdminProject = {
            id: newSlug,
            slug: newSlug,
            title: title.trim(),
            category,
            icon: icon.trim(),
            color,
            startdate,
            enddate: isOngoing ? '' : enddate,
            techs: parsedTechs,
            desc: desc.trim(),
            longDesc: longDesc.trim(),
            features: parsedFeatures
          };
          setProjects((prev) => [newProject, ...prev]);
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[4.5fr_5.5fr] gap-6 w-full items-start">
      
      {/* Left Column: Form to Add/Edit Card */}
      <div className="relative z-20 rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80">
        <h2 className="mb-6 text-lg font-semibold text-gray-800">
          {editingSlug ? '💻 프로젝트 카드 수정' : '➕ 새 프로젝트 카드 추가'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">프로젝트 제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: AI Smart Blog"
                className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">구분</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'team' | 'personal')}
                className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="personal">👤 개인 프로젝트</option>
                <option value="team">👥 팀 프로젝트</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-20 shrink-0">
              <label className="mb-1 block text-xs font-semibold text-gray-600">아이콘</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="예: ⚡"
                className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div className="sm:w-32 shrink-0">
              <label className="mb-1 block text-xs font-semibold text-gray-600">대표 색상</label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value as any)}
                className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="blue">🔵 Blue</option>
                <option value="purple">🟣 Purple</option>
                <option value="emerald">🟢 Emerald</option>
                <option value="amber">🟡 Amber</option>
              </select>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4">
              {/* 시작일 */}
              <div>
                <CustomDatePicker
                  label="시작일"
                  value={startdate}
                  onChange={setStartdate}
                />
              </div>

              {/* 종료일 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-600 font-sans">종료일</label>
                  <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOngoing}
                      onChange={(e) => {
                        setIsOngoing(e.target.checked);
                        if (e.target.checked) setEnddate('');
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 h-3 w-3"
                    />
                    진행 중
                  </label>
                </div>
                <CustomDatePicker
                  label=""
                  value={enddate}
                  onChange={setEnddate}
                  disabled={isOngoing}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">기술 스택</label>
            <input
              type="text"
              value={techs}
              onChange={(e) => setTechs(e.target.value)}
              placeholder="React, Next.js, TypeScript, Tailwind CSS"
              className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">간단한 한 줄 설명</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="예: 실시간 동기화를 적용한 협업 에디터 플랫폼"
              className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">상세 설명</label>
            <textarea
              rows={3}
              value={longDesc}
              onChange={(e) => setLongDesc(e.target.value)}
              placeholder="프로젝트 목표 및 자세한 아키텍처에 대해 서술해 주세요."
              className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">핵심 구현 기능</label>
            <textarea
              rows={3}
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="예: Yjs CRDT를 활용한 충돌 없는 편집 시스템 구축&#10;Redis 캐시 레이어를 도입하여 응답 속도 40% 개선"
              className="block w-full rounded-lg border border-gray-200/80 bg-gray-50/30 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition-all focus:outline-none bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '저장 중...' : editingSlug ? '카드 수정 완료' : '카드 생성 완료'}
            </button>
            {editingSlug && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-gray-150 px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-250 focus:outline-none"
              >
                취소
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right Column: Portfolio 2.0 Real-time Mock Live Preview */}
      <div className="bg-[#030712] border border-white/[0.08] p-6 sm:p-8 rounded-3xl min-h-[500px] shadow-2xl relative overflow-hidden flex flex-col items-stretch">
        <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Title Inside Preview Box */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06] relative z-10">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span>🖥️</span> 프로젝트 실시간 프리뷰
          </h2>
          <span className="text-[9px] bg-white/[0.03] border border-white/[0.08] font-bold px-2 py-0.5 rounded-full text-slate-400">
            Dark Theme Preview
          </span>
        </div>

        <div className="flex flex-col items-center flex-1 justify-center">
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {projects.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl">
                등록된 프로젝트 카드가 없습니다. 좌측 폼에서 첫 프로젝트 카드를 등록해 보세요!
              </div>
            ) : (
              projects.map((project) => {
                const theme = getProjectColorClass(project.color);
                return (
                  <div
                    key={project.id}
                    className={`p-6 rounded-3xl bg-white/[0.01] border ${theme.border} backdrop-blur-xl ${theme.shadow} transition-all duration-300 flex flex-col justify-between group relative overflow-hidden`}
                  >
                    {/* Management Overlays on Hover */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2.5 z-20">
                      <button
                        onClick={() => handleEdit(project)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow transition-all"
                      >
                        ⚙️ 수정
                      </button>
                      <button
                        onClick={() => setSelectedPreviewProject(project)}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] shadow transition-all"
                      >
                        🔍 프리뷰
                      </button>
                      <button
                        onClick={() => handleDelete(project.slug)}
                        disabled={isDeletingSlug === project.slug}
                        className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] shadow transition-all disabled:opacity-50"
                      >
                        🗑️ 삭제
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between items-start gap-4 mb-5">
                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${theme.iconBg} flex items-center justify-center text-xl`}>
                          {project.icon}
                        </div>
                        <span className="text-[9px] text-slate-400 font-semibold bg-white/[0.02] border border-white/[0.05] px-2 py-0.5 rounded-full whitespace-nowrap">
                          {project.category === 'team' ? '👥 Team' : '👤 Personal'} | {formatPeriod(project.startdate, project.enddate)}
                        </span>
                      </div>
                      
                      <h3 className="text-base font-bold text-slate-100 mb-2 truncate">
                        {project.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-6 line-clamp-3">
                        {project.desc}
                      </p>
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {project.techs.map((tech) => (
                          <span
                            key={tech}
                            className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${theme.badge}`}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Detail Preview Modal */}
      {selectedPreviewProject && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 transition-opacity"
          onClick={() => setSelectedPreviewProject(null)}
        >
          <div
            className={`w-full max-w-2xl bg-[#090d16] border ${getProjectColorClass(selectedPreviewProject.color).border} rounded-3xl p-6 md:p-8 relative shadow-2xl overflow-y-auto max-h-[85vh]`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPreviewProject(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${getProjectColorClass(selectedPreviewProject.color).iconBg} flex items-center justify-center text-3xl`}>
                {selectedPreviewProject.icon}
              </div>
              <div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase ${getProjectColorClass(selectedPreviewProject.color).badge} mb-1 inline-block`}>
                  {selectedPreviewProject.category}
                </span>
                <h2 className="text-2xl font-bold text-white">{selectedPreviewProject.title}</h2>
              </div>
            </div>

            <div className="space-y-6 text-sm text-slate-300">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">프로젝트 개요</h4>
                <p className="leading-relaxed bg-white/[0.01] border border-white/[0.03] rounded-2xl p-4 whitespace-pre-line">{selectedPreviewProject.longDesc}</p>
              </div>

              {selectedPreviewProject.features && selectedPreviewProject.features.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">주요 핵심 구현 기능</h4>
                  <ul className="space-y-2.5">
                    {selectedPreviewProject.features.map((feature, idx) => (
                      <li key={idx} className="flex gap-2.5 leading-relaxed">
                        <span className="text-cyan-400 mt-0.5">✔</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedPreviewProject.techs && selectedPreviewProject.techs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">사용 기술 스택</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPreviewProject.techs.map((tech) => (
                      <span
                        key={tech}
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${getProjectColorClass(selectedPreviewProject.color).badge}`}
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
