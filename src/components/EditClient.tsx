'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PostEditor, { PostFormData } from '@/components/PostEditor';
import { updatePostAction } from './postActions';
import { getEssentialPropertiesAction, getRequiredPropertiesAction } from './propertyActions';

export default function EditClient({ post, originalSlug }: { post: any; originalSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin';

  const [essentialProps, setEssentialProps] = useState<string[]>([]);
  const [requiredProps, setRequiredProps] = useState<string[]>([]);

  useEffect(() => {
    getEssentialPropertiesAction().then((data) => setEssentialProps(data));
    getRequiredPropertiesAction().then((data) => setRequiredProps(data));
  }, []);

  // DB 고유 컬럼(id, slug, 생성/수정일 등)을 분리하고, 
  // 최상위 속성(title, category 등)과 metadata를 병합하여 에디터에 전달합니다.
  const { id, slug, created_at, updated_at, likes_count, views_count, metadata, content, ...rest } = post;

  // 임시저장된 데이터가 존재할 경우 우선적으로 불러옵니다.
  const hasDraft = !!metadata?.draft_content;

  const INTERNAL_PROPS = [
    'post_status',
    'has_draft',
    'draft_title',
    'draft_content',
    'draft_properties',
    'views_count',
    'likes_count',
    'created_at',
    'updated_at'
  ];

  // Clean metadata and draft properties from system/internal keys
  const cleanMetadata = { ...(metadata || {}) };
  INTERNAL_PROPS.forEach(key => delete cleanMetadata[key]);

  const cleanDraftProps = hasDraft ? { ...(metadata?.draft_properties || {}) } : {};
  INTERNAL_PROPS.forEach(key => delete cleanDraftProps[key]);

  const initialData: PostFormData = {
    ...cleanMetadata,
    ...cleanDraftProps,
    ...rest,
    title: hasDraft ? metadata.draft_title : (metadata?.title || ''),
    content: hasDraft ? metadata.draft_content : (content || ''),
  };

  const handleSave = async (formData: PostFormData) => {
    try {
      await updatePostAction(originalSlug, formData);
      if (formData._isDraft) {
        alert('임시저장 되었습니다.');
        // UX: 임시저장 시 페이지 이동 없이 현재 에디터 화면에 계속 머물게 합니다.
      } else {
        alert('게시물이 성공적으로 수정 및 발행되었습니다!');
        router.push(redirectPath);
      }
    } catch (error) {
      console.error('Update failed:', error);
      alert('게시물 수정 중 오류가 발생했습니다. (콘솔 확인)');
    }
  };

  const handleCancel = () => {
    router.push(redirectPath);
  };

  return (
    <div className="mx-auto w-full max-w-[1000px] p-4 sm:p-8 font-sans">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Edit Post</h1>
          <p className="mt-2 text-gray-500">기존 게시물을 수정합니다.</p>
        </div>
        <Link
          href={redirectPath}
          className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          ← Back
        </Link>
      </header>

      <PostEditor
        initialData={initialData}
        onSave={handleSave}
        onCancel={handleCancel}
        essentialProps={essentialProps}
        requiredProps={requiredProps}
      />
    </div>
  );
}