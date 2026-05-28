import React from 'react';
import { query } from '../../../../../infra/db';
import EditClient from '../../../../../components/EditClient';

export default async function EditPostPage({ params }: { params: Promise<{ slug: string | string[] }> }) {
  const resolvedParams = await params;
  
  // 폴더명이 [slug]일 때(단일 문자열)와 [...slug]일 때(배열)를 모두 대응하여 안전하게 슬러그 복원
  const slugParam = resolvedParams.slug;
  const originalSlug = Array.isArray(slugParam) ? slugParam.join('/') : slugParam;
  
  const { rows } = await query('SELECT * FROM posts WHERE slug = $1', [originalSlug]);
  
  if (rows.length === 0) {
    return <div className="p-8 text-center text-gray-500">Post not found.</div>;
  }

  return <EditClient post={rows[0]} originalSlug={originalSlug} />;
}
