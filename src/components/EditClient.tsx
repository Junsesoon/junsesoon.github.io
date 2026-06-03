'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PostEditor, { PostFormData } from '@/components/PostEditor';
import { updatePostAction } from './actions';

export default function EditClient({ post, originalSlug }: { post: any; originalSlug: string }) {
  const router = useRouter();

  // DB 고유 컬럼(id, slug, 생성/수정일 등)을 분리하고, 
  // 최상위 속성(title, category 등)과 metadata를 병합하여 에디터에 전달합니다.
  const { id, slug, created_at, updated_at, posted_at, metadata, content, ...rest } = post;

  const initialData: PostFormData = {
    ...(metadata || {}),
    ...rest,
    content: content || '',
  };

  const handleSave = async (formData: PostFormData) => {
    try {
      await updatePostAction(originalSlug, formData);
      alert('게시물이 성공적으로 수정되었습니다!');
      router.push('/admin');
    } catch (error) {
      console.error('Update failed:', error);
      alert('게시물 수정 중 오류가 발생했습니다. (콘솔 확인)');
    }
  };

  return (
    <div className="mx-auto max-w-7xl min-w-[1000px] p-8 font-sans">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Edit Post</h1>
          <p className="mt-2 text-gray-500">기존 게시물을 수정합니다.</p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          ← Back to Dashboard
        </Link>
      </header>

      <PostEditor initialData={initialData} onSave={handleSave} />
    </div>
  );
}