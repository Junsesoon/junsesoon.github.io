import React from 'react';
import Link from 'next/link';
import { query } from '../../../../infra/db';
import PropertyManager, { PropertyWithCount } from '@/components/PropertyManager';

const BASE_PROPS = ['title', 'category1', 'summary', 'content', 'category2', 'category3', 'category4', 'tags', 'parentSkill', 'childSkill', 'techStart', 'project_name'];

export default async function PropertyManagementPage() {
  const propertiesMap = new Map<string, { count: number; is_essential: boolean; type?: string }>();

  // 1. 기본 속성 초기화
  BASE_PROPS.forEach(prop => propertiesMap.set(prop, { count: 0, is_essential: false }));

  // 대소문자 구분을 무시하고 기존 속성명(표준 케이스)을 찾아 반환하는 헬퍼 함수
  const getOriginalKey = (key: string) => {
    const lowerKey = key.toLowerCase();
    return Array.from(propertiesMap.keys()).find(k => k.toLowerCase() === lowerKey) || key;
  };

  try {
    // 2. 템플릿에 등록된 속성 가져오기
    const result = await query('SELECT property_name, is_essential, property_type FROM property_list');
    result.rows.forEach((row) => {
      const targetKey = getOriginalKey(row.property_name);
      if (!propertiesMap.has(targetKey)) {
        propertiesMap.set(targetKey, { count: 0, is_essential: row.is_essential, type: row.property_type });
      } else {
        const existing = propertiesMap.get(targetKey);
        if (existing) {
          existing.is_essential = row.is_essential;
          existing.type = row.property_type;
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch template properties:', error);
  }

  try {
    // 3. posts 테이블의 properties(JSONB)에서 집계
    const jsonbResult = await query(`
      SELECT key AS property_name, COUNT(*) as count
      FROM posts, jsonb_object_keys(COALESCE(properties, '{}'::jsonb)) AS key
      GROUP BY key
    `);
    jsonbResult.rows.forEach((row) => {
      const count = parseInt(row.count, 10);
      const targetKey = getOriginalKey(row.property_name);
      const existing = propertiesMap.get(targetKey) || { count: 0, is_essential: false };
      propertiesMap.set(targetKey, { ...existing, count: existing.count + count });
    });
  } catch (error) {
    console.warn('Failed to fetch JSONB properties counts:', error);
  }

  // 맵을 배열로 변환 후 알파벳 순 정렬
  const allProperties: PropertyWithCount[] = Array.from(propertiesMap.entries())
    .map(([name, data]) => ({ name, count: data.count, is_essential: data.is_essential, type: data.type }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto w-full max-w-[1000px] p-4 sm:p-8 font-sans">
      <header className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manage Properties</h1>
          <p className="mt-2 text-sm text-gray-500">Manage global front-matter properties and their data types.</p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          ← Back to Dashboard
        </Link>
      </header>

      <PropertyManager properties={allProperties} />
    </div>
  );
}