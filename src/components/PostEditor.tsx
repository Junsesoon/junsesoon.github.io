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
const PREDEFINED_PROPS = ['category1', 'summary', 'category2', 'category3', 'category4', 'tags', 'parentSkill', 'childSkill', 'techStart', 'project_name', 'location'];

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
          initial[key] = val.join(', ');
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
      if (['tags', 'parentSkill', 'childSkill'].includes(name)) type = 'array';
      else if (['techStart', 'date', 'created_at', 'updated_at'].includes(name)) type = 'date';
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

  const handleSubmit = async (e: React.FormEvent) => {
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
          } else if (p.type === 'array' && typeof val === 'string') {
            finalData[p.name] = val.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
          }
        }
      });

      if (!finalData.title?.trim()) {
        alert('제목(Title)은 필수 항목입니다.');
        setIsSubmitting(false);
        return;
      }

      // 2. 필수 속성(essential) 미입력 시 저장 차단 (프론트엔드 검증 방어선)
      if (essentialProps) {
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

    if (templateName && templates && templates[templateName]) {
      const propsToAdd = templates[templateName];
      const newActiveProps = [...activeProps];
      const newFormData = { ...formData };
      let updated = false;

      propsToAdd.forEach((p) => {
        if (!newActiveProps.includes(p.propertyName) && !FIXED_PROPS.includes(p.propertyName)) {
          newActiveProps.push(p.propertyName);
          updated = true;
        }
        if (newFormData[p.propertyName] === undefined) {
          newFormData[p.propertyName] = '';
          updated = true;
        }
      });

      // 선택한 템플릿 이름을 자동으로 category1 에 기입해 줍니다.
      if (!newFormData['category1']) {
        newFormData['category1'] = templateName;
        if (!newActiveProps.includes('category1')) {
          newActiveProps.push('category1');
        }
        updated = true;
      }

      if (updated) {
        setActiveProps(newActiveProps);
        setFormData(newFormData);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm font-sans">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Template Selector (새 글 작성 등 templates prop이 제공된 경우에만 노출) */}
        {templates && Object.keys(templates).length > 0 && (
          <div className="sm:col-span-2 mb-2 p-5 bg-[#f8f9fa] border border-gray-200 rounded-lg shadow-sm">
            <label htmlFor="templateSelect" className="mb-2 block text-sm font-semibold text-gray-700">
              Apply Template (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-3">Selecting a template will auto-fill category1 and automatically add the required properties.</p>
            <select
              id="templateSelect"
              value={selectedTemplate}
              onChange={handleTemplateChange}
              className="block w-full max-w-sm rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Select a template --</option>
              {Object.keys(templates).map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
        )}

        {/* Title (고정 필수 영역) */}
        <div className="sm:col-span-2">
          <label htmlFor="title" className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-700">
            Title
            <span className="text-red-500" title="Essential Property">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter title"
          />
        </div>

        {/* 동적 추가된 프론트매터 속성들 */}
        {activeProps.map((key) => {
          const propInfo = globalProps.find((p) => p.name === key);
          const propType = propInfo?.type || 'string';

          const isFullWidth = propType === 'array' || ['category1', 'summary'].includes(key);
          const isEssential = essentialProps?.includes(key);

          return (
            <div key={key} className={isFullWidth ? 'sm:col-span-2' : ''}>
              <label htmlFor={key} className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-700 capitalize">
                {propType === 'array' ? `${key}` : key}
                {isEssential && <span className="text-red-500" title="Essential Property">*</span>}
              </label>
              <div className="flex items-center gap-2">
                {key === 'summary' ? (
                  <textarea
                    id={key}
                    name={key}
                    value={formData[key] || ''}
                    onChange={handleChange}
                    required={isEssential}
                    rows={2}
                    className="block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={`Enter ${key}`}
                  />
                ) : key === 'location' ? (
                  <select
                    id={key}
                    name={key}
                    value={formData[key] || ''}
                    onChange={handleChange}
                    required={isEssential}
                    className="block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="" disabled>Select Location</option>
                    <option value="Blog">Blog</option>
                    <option value="Portfolio">Portfolio</option>
                    <option value="Both">Both</option>
                  </select>
                ) : propType === 'boolean' ? (
                  <div className="flex h-[42px] items-center px-1">
                    <input
                      type="checkbox"
                      id={key}
                      name={key}
                      checked={formData[key] === true || formData[key] === 'true'}
                      onChange={handleChange}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                    className="block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : propType === 'date' ? (
                  <input
                    type="date"
                    id={key}
                    name={key}
                    value={formData[key] ? String(formData[key]).split('T')[0] : ''}
                    onChange={handleChange}
                    required={isEssential}
                    className="block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type="text"
                    id={key}
                    name={key}
                    value={formData[key] || ''}
                    onChange={handleChange}
                    required={isEssential}
                    className="block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={`Enter ${key}`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveProp(key)}
                  disabled={isEssential}
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${isEssential ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
                  title={isEssential ? `Cannot remove essential property` : `Remove ${key}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {/* 연결 가능한 카드 목록 나열 */}
              {(key.toLowerCase() === 'parentskill' || key.toLowerCase() === 'childskill') && skillCards.length > 0 && (
                <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-2.5">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-500">
                    {formData.category2 ? `${formData.category2}` : '전체'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {skillCards
                      .filter((card) => !formData.category2 || card.category2 === formData.category2)
                      .map((card, idx) => (
                        <span 
                          key={idx} 
                          onClick={() => {
                            const currentVal = formData[key] || '';
                            const skills = String(currentVal).split(',').map(s => s.trim()).filter(Boolean);
                            if (!skills.includes(card.title)) {
                              setFormData(prev => ({ ...prev, [key]: [...skills, card.title].join(', ') }));
                            }
                          }}
                          className="inline-flex rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-all active:scale-95 select-none"
                        >
                          {card.title}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Prop 추가 버튼 및 입력 폼 */}
        <div className="sm:col-span-2 pt-2 pb-4 border-b border-gray-100">
          {!isAddingProp ? (
            <button
              type="button"
              onClick={() => setIsAddingProp(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Property
            </button>
          ) : (
            <div className="flex max-w-lg items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-2 shadow-sm">
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
                className="block w-full flex-1 rounded-md border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="block w-28 rounded-md border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:opacity-50"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="date">Date</option>
                <option value="array">Array</option>
              </select>
              <button
                type="button"
                onClick={handleAddProp}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingProp(false);
                  setNewPropName('');
                }}
                className="inline-flex items-center justify-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div>
        <label htmlFor="content" className="mb-2 block text-sm font-medium text-gray-700">
          Content (Markdown)
        </label>
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
          rows={15}
          className={`block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${isUploading ? 'bg-gray-50' : ''}`}
          placeholder={isUploading ? 'Uploading image...' : 'Write your markdown content here. Drag & drop or paste (Ctrl+V) images to upload.'}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
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