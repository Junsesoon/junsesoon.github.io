'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PostEditor, { PostFormData } from '@/components/PostEditor';

export default function WritePostPage() {
  const router = useRouter();

  const handleSave = async (formData: PostFormData) => {
    // TODO: 추후 실제 DB(PostgreSQL)에 데이터를 저장하는 API 또는 Server Action 호출 로직이 들어갑니다.
    console.log('Saving new post:', formData);
    
    // 저장이 진행되는 것처럼 보이도록 1초 대기 (시뮬레이션)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    alert('게시물이 성공적으로 임시 작성되었습니다! (콘솔을 확인하세요)');
    router.push('/admin'); // 작성 완료 후 관리자 대시보드로 복귀
  };

  return (
    <div className="mx-auto max-w-5xl p-8 font-sans">
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

      <PostEditor onSave={handleSave} />
    </div>
  );
}