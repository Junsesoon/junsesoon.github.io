import React from 'react';
import Link from 'next/link';
import { query } from '../../../../infra/neon';
import PropertyManager, { PropertyWithCount } from '@/components/admin/PropertyManager';
import AdminClock from '../../../../components/admin/AdminClock';
import { logoutAction } from '../../../../actions/actions';
import BackButton from '@/components/admin/BackButton';
import AdminSidebar from '@/components/admin/AdminSidebar';

const BASE_PROPS = ['category1', 'summary', 'category2', 'category3', 'category4', 'tags', 'parentskill', 'childskill', 'techstart', 'projectname'];
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

export default async function PropertyManagementPage() {
  const propertiesMap = new Map<string, { count: number; is_essential: boolean; is_required: boolean; type?: string }>();

  // 1. 기본 속성 및 시스템 속성 초기화
  BASE_PROPS.forEach(prop => propertiesMap.set(prop, { count: 0, is_essential: false, is_required: false }));
  INTERNAL_PROPS.forEach(prop => propertiesMap.set(prop, { count: 0, is_essential: false, is_required: false }));

  // 대소문자 구분을 무시하고 기존 속성명(표준 케이스)을 찾아 반환하는 헬퍼 함수
  const getOriginalKey = (key: string) => {
    const lowerKey = key.toLowerCase();
    return Array.from(propertiesMap.keys()).find(k => k.toLowerCase() === lowerKey) || key;
  };

  try {
    // 2. 템플릿에 등록된 속성 가져오기
    const result = await query('SELECT property_name, is_essential, is_required, property_type FROM property_list');
    result.rows.forEach((row) => {
      const targetKey = getOriginalKey(row.property_name);
      if (!propertiesMap.has(targetKey)) {
        propertiesMap.set(targetKey, { count: 0, is_essential: row.is_essential, is_required: row.is_required, type: row.property_type });
      } else {
        const existing = propertiesMap.get(targetKey);
        if (existing) {
          existing.is_essential = row.is_essential;
          existing.is_required = row.is_required;
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
      const existing = propertiesMap.get(targetKey) || { count: 0, is_essential: false, is_required: false };
      propertiesMap.set(targetKey, { ...existing, count: existing.count + count });
    });
  } catch (error) {
    console.warn('Failed to fetch JSONB properties counts:', error);
  }

  try {
    // 4. posts 테이블의 컬럼 형태인 시스템 속성들의 사용 횟수 집계
    const systemCounts = await query(`
      SELECT 
        COUNT(post_status) as post_status,
        COUNT(CASE WHEN draft_content IS NOT NULL THEN 1 END) as has_draft,
        COUNT(draft_title) as draft_title,
        COUNT(draft_content) as draft_content,
        COUNT(draft_properties) as draft_properties,
        COUNT(views_count) as views_count,
        COUNT(likes_count) as likes_count,
        COUNT(created_at) as created_at,
        COUNT(updated_at) as updated_at
      FROM posts
    `);
    
    if (systemCounts.rows.length > 0) {
      const row = systemCounts.rows[0];
      Object.entries(row).forEach(([key, val]) => {
        const count = parseInt(val as string, 10) || 0;
        const targetKey = getOriginalKey(key);
        const existing = propertiesMap.get(targetKey) || { count: 0, is_essential: false, is_required: false };
        propertiesMap.set(targetKey, { ...existing, count: existing.count + count });
      });
    }
  } catch (error) {
    console.warn('Failed to fetch system properties counts:', error);
  }

  // 맵을 배열로 변환 후 알파벳 순 정렬
  const allProperties: PropertyWithCount[] = Array.from(propertiesMap.entries())
    .map(([name, data]) => ({ name, count: data.count, is_essential: data.is_essential, is_required: data.is_required, type: data.type }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex min-h-screen w-full bg-gray-50/50 font-sans">
      <AdminSidebar activePath="property" />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-none w-full overflow-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200 pb-4 gap-4">
          <AdminClock title="Properties" />
          <div className="flex items-center gap-3">
            <BackButton />
            <form action={logoutAction}>
              <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3.5 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-100/80">
                Logout
              </button>
            </form>
          </div>
        </header>

        <div className="w-full md:w-11/12 lg:w-3/5" style={{ minWidth: '600px' }}>
          <PropertyManager properties={allProperties} />
        </div>
      </main>
    </div>
  );
}