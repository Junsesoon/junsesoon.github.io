'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PostEditor, { PostFormData } from '@/components/PostEditor';
import { createPostAction, getTemplatesAction } from '../../../../components/actions';
import { getEssentialPropertiesAction } from '../../../../components/propertyActions';

export default function WritePostPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Record<string, { propertyName: string; isRequired: boolean }[]>>({});
  const [essentialProps, setEssentialProps] = useState<string[]>([]);

  useEffect(() => {
    getTemplatesAction().then((data) => setTemplates(data));
    getEssentialPropertiesAction().then((data) => setEssentialProps(data));
  }, []);

  const handleSave = async (formData: PostFormData) => {
    try {
      // 1. 방금 구현한 서버 액션을 호출하여 실제 DB에 저장
      await createPostAction(formData);
      
      alert('게시물이 성공적으로 작성 및 저장되었습니다!');
      router.push('/admin'); // 2. 저장 완료 후 관리자 대시보드로 복귀 (revalidatePath에 의해 자동으로 최신 목록이 반영됩니다)
    } catch (error) {
      console.error('Save failed:', error);
      alert('게시물 저장 중 오류가 발생했습니다. (콘솔 확인)');
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1000px] p-4 sm:p-8 font-sans">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Write New Post</h1>
          <p className="mt-2 text-gray-500">새로운 게시물을 작성합니다.</p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          ← Back to Dashboard
        </Link>
      </header>

      <PostEditor onSave={handleSave} templates={templates} essentialProps={essentialProps} />
    </div>
  );
}