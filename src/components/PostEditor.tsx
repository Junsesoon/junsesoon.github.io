'use client';

import React, { useState, useRef, useEffect } from 'react';
import { addGlobalPropertyAction, getAllPropertiesWithTypesAction } from './propertyActions';
import { getSkillTreeCardsAction } from './skillTreeActions';

export interface PostFormData {
  [key: string]: any;
}

export interface PostEditorProps {
  initialData?: PostFormData;
  onSave: (formData: PostFormData) => Promise<void>;
  templates?: Record<string, { propertyName: string; isRequired: boolean }[]>;
  essentialProps?: string[];
}

const FIXED_PROPS = ['title', 'content'];
const PREDEFINED_PROPS = ['category1', 'summary', 'category2', 'category3', 'category4', 'tags', 'parentskill', 'childskill', 'techstart', 'projectname', 'location'];

const getTypeColor = (type: string) => {
  switch (type) {
    case 'string': return 'text-emerald-500';
    case 'number': return 'text-amber-500';
    case 'boolean': return 'text-rose-500';
    case 'array': return 'text-cyan-500';
    case 'date': return 'text-violet-500';
    default: return 'text-gray-500';
  }
};

const ArrayTagInput = ({ id, tags, onChange }: { id?: string; tags: string[]; onChange: (tags: string[]) => void }) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleBlur = () => {
    addTag(inputValue);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 w-full rounded-md border-0 bg-transparent px-2 py-1 text-sm transition-colors hover:bg-gray-50 focus-within:bg-gray-50 min-h-[34px]">
      {tags.map((tag, index) => (
        <span key={index} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 select-none">
          {tag}
          <button type="button" onClick={() => removeTag(index)} className="text-blue-400 hover:text-blue-600 focus:outline-none" title={`Remove ${tag}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </span>
      ))}
      <input id={id} type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} onBlur={handleBlur} className="flex-1 bg-transparent min-w-[80px] border-0 p-0 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:outline-none" placeholder={tags.length === 0 ? "Empty" : ""} />
    </div>
  );
};

export default function PostEditor({ initialData, onSave, templates, essentialProps }: PostEditorProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    if (initialData) {
      Object.entries(initialData).forEach(([key, val]) => {
        if (FIXED_PROPS.includes(key)) return;
        
        // 미보유 prop 표기 제외
        if (val === null || val === undefined || val === '') return;
        if (Array.isArray(val) && val.length === 0) return;

        if (Array.isArray(val)) {
          initial[key] = val;
        } else {
          initial[key] = val;
        }
      });
    }
    initial.title = initialData?.title || '';
    initial.content = initialData?.content || '';
    return initial;
  });

  const [activeProps, setActiveProps] = useState<string[]>(() => {
    const initial: string[] = [];
    if (initialData) {
      Object.keys(initialData).forEach((key) => {
        if (FIXED_PROPS.includes(key)) return;
        const val = initialData[key];
        if (val === null || val === undefined || val === '') return;
        if (Array.isArray(val) && val.length === 0) return;
        initial.push(key);
      });
    }
    // 일관성을 위해 미리 정의된 순서대로 정렬
    return initial.sort((a, b) => {
      const idxA = PREDEFINED_PROPS.indexOf(a);
      const idxB = PREDEFINED_PROPS.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  });

  const [globalProps, setGlobalProps] = useState<{name: string, type: string}[]>(() => {
    return PREDEFINED_PROPS.map(name => {
      let type = 'string';
      if (['tags', 'parentskill', 'childskill'].includes(name)) type = 'array';
      else if (['techstart', 'startdate', 'enddate', 'date', 'created_at', 'updated_at'].includes(name)) type = 'date';
      return { name, type };
    });
  });

  useEffect(() => {
    getAllPropertiesWithTypesAction().then((props) => {
      if (props && props.length > 0) {
        setGlobalProps((prev) => {
          const map = new Map(prev.map(p => [p.name, p.type]));
          props.forEach(p => map.set(p.name, p.type));
          return Array.from(map.entries()).map(([name, type]) => ({ name, type }));
        });
      }
    });
  }, []);

  const [skillCards, setSkillCards] = useState<{ title: string; category2: string }[]>([]);

  useEffect(() => {
    getSkillTreeCardsAction().then((data) => {
      if (data && data.length > 0) setSkillCards(data);
    });
  }, []);

  const [isAddingProp, setIsAddingProp] = useState(false);
  const [newPropName, setNewPropName] = useState('');
  const [newPropType, setNewPropType] = useState('string');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // 전역 필수 속성(essentialProps) 자동 렌더링 주입 로직
  useEffect(() => {
    if (essentialProps && essentialProps.length > 0) {
      setActiveProps((prev) => {
        const newProps = [...prev];
        let changed = false;
        essentialProps.forEach((ep) => {
          if (!newProps.includes(ep) && !FIXED_PROPS.includes(ep)) {
            newProps.push(ep);
            changed = true;
          }
        });
        return changed ? newProps : prev;
      });

      setFormData((prev) => {
        const newData = { ...prev };
        let changed = false;
        essentialProps.forEach((ep) => {
          if (newData[ep] === undefined || newData[ep] === null) {
            newData[ep] = '';
            changed = true;
          }
        });
        return changed ? newData : prev;
      });
    }
  }, [essentialProps]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const name = target.name;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent, isDraft: boolean = false) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const finalData = { ...formData };

      // 1. 동적 속성들의 타입에 맞춰 안전하게 형변환 진행
      globalProps.forEach(p => {
        const val = finalData[p.name];
        if (val !== undefined && val !== null) {
          if (p.type === 'number' && val !== '') {
            finalData[p.name] = Number(val);
          } else if (p.type === 'boolean') {
            finalData[p.name] = (val === true || val === 'true');
          } else if (p.type === 'array') {
            if (typeof val === 'string') {
              finalData[p.name] = val.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
            } else if (Array.isArray(val)) {
              finalData[p.name] = val.filter((s: string) => s.trim().length > 0);
            }
          }
        }
      });

      if (!isDraft && !finalData.title?.trim()) {
        alert('제목(Title)은 필수 항목입니다.');
        setIsSubmitting(false);
        return;
      }

      // 2. 필수 속성(essential) 미입력 시 저장 차단 (프론트엔드 검증 방어선)
      if (!isDraft && essentialProps) {
        for (const ep of essentialProps) {
          if (FIXED_PROPS.includes(ep)) continue;
          const val = finalData[ep];
          
          // Boolean은 false 값이 허용되어야 하므로 빈 문자열이나 null일 때만 차단, Array는 빈 배열이면 차단
          if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
            alert(`전역 필수 속성인 '${ep}' 항목을 반드시 입력해 주세요.`);
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Extract image URLs from markdown content
      const extractImageUrls = (text: string) => {
        const regex = /!\[.*?\]\((.*?)\)/g;
        const urls: string[] = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
          urls.push(match[1]);
        }
        return urls;
      };

      const initialUrls = extractImageUrls(initialData?.content || '');
      const finalUrls = extractImageUrls(formData.content);
      const allPossibleUrls = new Set([...initialUrls, ...uploadedImages]);
      const deletedUrls = Array.from(allPossibleUrls).filter((url) => !finalUrls.includes(url));

      if (deletedUrls.length > 0) {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: deletedUrls }),
        }).catch((err) => console.error('Failed to delete orphaned images:', err));
      }

      // 상위 컴포넌트(EditClient 등)에서 임시저장 여부를 알 수 있도록 플래그 추가
      finalData._isDraft = isDraft;

      await onSave(finalData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setUploadedImages((prev) => [...prev, data.url]);
      insertAtCursor(`![${file.name}](${data.url})`);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await uploadImage(file);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const file = e.clipboardData.files?.[0];
    if (file && file.type.startsWith('image/')) {
      e.preventDefault();
      await uploadImage(file);
    }
  };

  const insertAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content;

    const newContent = currentContent.substring(0, start) + textToInsert + currentContent.substring(end);
    
    setFormData((prev) => ({ ...prev, content: newContent }));

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
      textarea.focus();
    }, 0);
  };

  const handleAddProp = async () => {
    const prop = newPropName.trim();
    if (prop && !activeProps.includes(prop) && !FIXED_PROPS.includes(prop)) {
      setActiveProps((prev) => [...prev, prop]);
      setFormData((prev) => ({ ...prev, [prop]: '' }));

      if (!globalProps.some(p => p.name === prop)) {
        try {
          await addGlobalPropertyAction(prop, newPropType);
          setGlobalProps((prev) => [...prev, { name: prop, type: newPropType }]);
        } catch (error) {
          console.error('Failed to register global property type:', error);
        }
      }
    }
    setNewPropName('');
    setNewPropType('string');
    setIsAddingProp(false);
  };

  const handleRemoveProp = (propToRemove: string) => {
    setActiveProps((prev) => prev.filter((p) => p !== propToRemove));
    setFormData((prev) => {
      const next = { ...prev };
      delete next[propToRemove]; // 제거 시 formData에서도 완전히 제외
      return next;
    });
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateName = e.target.value;
    setSelectedTemplate(templateName);

    // 기존 prop 초기화 및 새 템플릿 prop으로 재구성
    const newActiveProps: string[] = [];
    const newFormData: Record<string, any> = {
      title: formData.title,
      content: formData.content,
    };

    // 1. 전역 필수 속성(Essential Props) 유지
    if (essentialProps) {
      essentialProps.forEach((ep) => {
        if (!FIXED_PROPS.includes(ep)) {
          newActiveProps.push(ep);
          newFormData[ep] = formData[ep] !== undefined ? formData[ep] : '';
        }
      });
    }

    // 2. 선택된 템플릿 속성 추가
    if (templateName && templates && templates[templateName]) {
      const propsToAdd = templates[templateName];

      propsToAdd.forEach((p) => {
        if (!newActiveProps.includes(p.propertyName) && !FIXED_PROPS.includes(p.propertyName)) {
          newActiveProps.push(p.propertyName);
        }
        // 기존에 입력한 값이 있다면 안전하게 유지
        if (newFormData[p.propertyName] === undefined) {
          newFormData[p.propertyName] = formData[p.propertyName] !== undefined ? formData[p.propertyName] : '';
        }
      });

      // 템플릿 이름을 category1에 고정
      if (!newActiveProps.includes('category1')) {
        newActiveProps.push('category1');
      }
      newFormData['category1'] = templateName;
    }

    // 3. 일관된 UI를 위해 미리 정의된 순서로 정렬
    newActiveProps.sort((a, b) => {
      const idxA = PREDEFINED_PROPS.indexOf(a);
      const idxB = PREDEFINED_PROPS.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    setActiveProps(newActiveProps);
    setFormData(newFormData);
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="flex flex-col font-sans w-full">
      <div className="flex flex-col w-full">
        {/* Template Selector (새 글 작성 등 templates prop이 제공된 경우에만 노출) */}
        {templates && Object.keys(templates).length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <label htmlFor="templateSelect" className="text-sm font-medium text-gray-400 select-none">
              Template:
            </label>
            <select
              id="templateSelect"
              value={selectedTemplate}
              onChange={handleTemplateChange}
              className="rounded-md border-0 bg-transparent py-1 pl-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:ring-0 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="">None</option>
              {Object.keys(templates).map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            <span className="text-xs text-gray-400 ml-1 hidden sm:inline-block">(선택 시 필수 속성 자동 추가)</span>
          </div>
        )}

        {/* Title (Obsidian Style Header) */}
        <div className="mb-8">
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="block w-full border-0 bg-transparent p-0 text-4xl font-extrabold text-gray-900 placeholder:text-gray-300 focus:ring-0 focus:outline-none"
            placeholder="Untitled"
          />
        </div>

        {/* Properties Wrapper (Obsidian Style) */}
        <div className="flex flex-col border-y border-gray-200 py-3 mb-8 gap-0.5">
          {activeProps.map((key) => {
            const propInfo = globalProps.find((p) => p.name === key);
            const propType = propInfo?.type || 'string';
            const isEssential = essentialProps?.includes(key);

            return (
              <div key={key} className="group relative flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-1 border-b border-transparent">
                <label htmlFor={key} className="flex items-center gap-1 text-sm font-medium text-gray-400 capitalize sm:w-36 shrink-0 sm:pt-1.5 select-none pl-1">
                  {propType === 'array' ? `${key}` : key}
                  {isEssential && <span className="text-red-400" title="Essential Property">*</span>}
                </label>
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-start gap-2">
                    {key === 'summary' ? (
                      <textarea
                        id={key}
                        name={key}
                        value={formData[key] || ''}
                        onChange={handleChange}
                        required={isEssential}
                        rows={2}
                        className="block w-full resize-none rounded-md border-0 bg-transparent px-2 py-1.5 text-sm text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:ring-0 focus:outline-none transition-colors"
                        placeholder="Empty"
                      />
                    ) : key === 'location' ? (
                      <select
                        id={key}
                        name={key}
                        value={formData[key] || ''}
                        onChange={handleChange}
                        required={isEssential}
                        className="block w-full max-w-[200px] rounded-md border-0 bg-transparent px-2 py-1.5 text-sm text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:ring-0 focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value="" disabled>Select Location</option>
                        <option value="Blog">Blog</option>
                        <option value="Portfolio">Portfolio</option>
                        <option value="Both">Both</option>
                      </select>
                    ) : propType === 'boolean' ? (
                      <div className="flex h-[34px] items-center px-2">
                        <input
                          type="checkbox"
                          id={key}
                          name={key}
                          checked={formData[key] === true || formData[key] === 'true'}
                          onChange={handleChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                    ) : propType === 'number' ? (
                      <input
                        type="number"
                        id={key}
                        name={key}
                        value={formData[key] ?? ''}
                        onChange={handleChange}
                        required={isEssential}
                        className="block w-full rounded-md border-0 bg-transparent px-2 py-1.5 text-sm text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:ring-0 focus:outline-none transition-colors"
                        placeholder="Empty"
                      />
                    ) : propType === 'date' ? (
                      <input
                        type="date"
                        id={key}
                        name={key}
                        value={formData[key] ? String(formData[key]).split('T')[0] : ''}
                        onChange={handleChange}
                        required={isEssential}
                        className="block w-full max-w-[200px] rounded-md border-0 bg-transparent px-2 py-1.5 text-sm text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:ring-0 focus:outline-none transition-colors"
                      />
                    ) : propType === 'array' ? (
                      <ArrayTagInput
                        id={key}
                        tags={
                          Array.isArray(formData[key])
                            ? formData[key]
                            : typeof formData[key] === 'string' && formData[key]
                            ? formData[key].split(',').map((s: string) => s.trim()).filter(Boolean)
                            : []
                        }
                        onChange={(newTags) => setFormData((prev) => ({ ...prev, [key]: newTags }))}
                      />
                    ) : (
                      <input
                        type="text"
                        id={key}
                        name={key}
                        value={formData[key] || ''}
                        onChange={handleChange}
                        required={isEssential}
                        className="block w-full rounded-md border-0 bg-transparent px-2 py-1.5 text-sm text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:ring-0 focus:outline-none transition-colors"
                        placeholder="Empty"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveProp(key)}
                      disabled={isEssential}
                      className={`opacity-0 group-hover:opacity-100 flex h-8 w-8 shrink-0 items-center justify-center rounded transition-all focus:outline-none ${isEssential ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
                      title={isEssential ? `Cannot remove essential property` : `Remove ${key}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* 연결 가능한 카드 목록 나열 (Tag Autocomplete) */}
                  {(key === 'parentskill' || key === 'childskill') && skillCards.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-2 py-1 mt-1">
                      {skillCards
                        .filter((card) => !formData.category2 || card.category2 === formData.category2)
                        .map((card, idx) => (
                          <span 
                            key={idx} 
                            onClick={() => {
                              const currentVal = formData[key] || '';
                              let skills: string[] = [];
                              if (Array.isArray(currentVal)) {
                                skills = [...currentVal];
                              } else if (typeof currentVal === 'string' && currentVal) {
                                skills = currentVal.split(',').map(s => s.trim()).filter(Boolean);
                              }

                              if (!skills.includes(card.title)) {
                                setFormData(prev => ({ ...prev, [key]: [...skills, card.title] }));
                              }
                            }}
                            className="inline-flex items-center rounded bg-gray-100/80 px-2 py-0.5 text-xs font-medium text-gray-600 cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors active:scale-95 select-none"
                          >
                            + {card.title}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Prop 추가 버튼 및 입력 폼 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 pl-1">
            {!isAddingProp ? (
              <button
                type="button"
                onClick={() => setIsAddingProp(true)}
                className="text-sm font-medium text-gray-400 hover:text-gray-600 flex items-center gap-1.5 px-1 transition-colors focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add property
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  list="predefined-props"
                  value={newPropName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewPropName(val);
                    const existingProp = globalProps.find(p => p.name === val.trim());
                    if (existingProp) {
                      setNewPropType(existingProp.type);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddProp();
                    } else if (e.key === 'Escape') {
                      setIsAddingProp(false);
                      setNewPropName('');
                      setNewPropType('string');
                    }
                  }}
                  placeholder="Property name"
                  className="w-36 rounded-md border-0 bg-gray-100 px-3 py-1.5 text-sm text-gray-900 focus:ring-0 focus:outline-none"
                  autoFocus
                />
                <datalist id="predefined-props">
                  {globalProps.filter((p) => !activeProps.includes(p.name)).map((p) => (
                    <option key={p.name} value={p.name} />
                  ))}
                </datalist>
                <select
                  value={newPropType}
                  onChange={(e) => setNewPropType(e.target.value)}
                  disabled={globalProps.some(p => p.name === newPropName.trim())}
                  className={`w-28 rounded-md border-0 bg-gray-100 px-3 py-1.5 text-sm focus:ring-0 focus:outline-none cursor-pointer disabled:opacity-50 font-semibold ${getTypeColor(newPropType)}`}
                >
                  <option value="string" className="text-gray-900 font-medium">String</option>
                  <option value="number" className="text-gray-900 font-medium">Number</option>
                  <option value="boolean" className="text-gray-900 font-medium">Boolean</option>
                  <option value="date" className="text-gray-900 font-medium">Date</option>
                  <option value="array" className="text-gray-900 font-medium">Array</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddProp}
                  className="rounded-md bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 focus:outline-none transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingProp(false);
                    setNewPropName('');
                  }}
                  className="rounded-md bg-transparent px-3 py-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content (Borderless Editor) */}
      <div className="flex-1 w-full relative">
        <textarea
          ref={textareaRef}
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onPaste={handlePaste}
          required
          readOnly={isUploading}
          className={`block w-full resize-y border-0 bg-transparent p-0 text-gray-900 font-mono text-base focus:ring-0 focus:outline-none min-h-[500px] leading-relaxed ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
          placeholder={isUploading ? 'Uploading image...' : 'Write your markdown content here. Drag & drop or paste (Ctrl+V) images to upload.'}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          disabled={isSubmitting || isUploading}
          className={`inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 ${
            (isSubmitting || isUploading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
          }`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          disabled={isSubmitting || isUploading}
          className={`inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 ${
            (isSubmitting || isUploading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
          }`}
        >
          Draft
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className={`inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            (isSubmitting || isUploading) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Saving...' : isUploading ? 'Uploading Image...' : 'Save Post'}
        </button>
      </div>
    </form>
  );
}