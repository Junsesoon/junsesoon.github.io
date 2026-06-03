import React from 'react';
import Link from 'next/link';
import { query } from '../../../../infra/db';
import PropertyManager, { PropertyWithCount } from '@/components/PropertyManager';

const BASE_PROPS = ['title', 'category1', 'summary', 'content', 'category2', 'category3', 'category4', 'tags', 'parentSkill', 'childSkill', 'techStart', 'project_name'];

export default async function PropertyManagementPage() {
  const propertiesMap = new Map<string, number>();

  // 1. 기본 속성 초기화
  BASE_PROPS.forEach(prop => propertiesMap.set(prop, 0));

  // 대소문자 구분을 무시하고 기존 속성명(표준 케이스)을 찾아 반환하는 헬퍼 함수
  const getOriginalKey = (key: string) => {
    const lowerKey = key.toLowerCase();
    return Array.from(propertiesMap.keys()).find(k => k.toLowerCase() === lowerKey) || key;
  };

  try {
    // 2. 템플릿에 등록된 속성 가져오기
    const result = await query('SELECT DISTINCT property_name FROM property_list');
    result.rows.forEach((row) => {
      const targetKey = getOriginalKey(row.property_name);
      if (!propertiesMap.has(targetKey)) {
        propertiesMap.set(targetKey, 0);
      }
    });
  } catch (error) {
    console.error('Failed to fetch template properties:', error);
  }

  try {
    // 3. posts 테이블의 metadata(JSONB)에서 집계
    const jsonbResult = await query(`
      SELECT key AS property_name, COUNT(*) as count
      FROM posts, jsonb_object_keys(COALESCE(metadata, '{}'::jsonb)) AS key
      GROUP BY key
    `);
    jsonbResult.rows.forEach((row) => {
      const count = parseInt(row.count, 10);
      const targetKey = getOriginalKey(row.property_name);
      propertiesMap.set(targetKey, (propertiesMap.get(targetKey) || 0) + count);
    });
  } catch (error) {
    console.warn('Failed to fetch JSONB metadata counts (column might not exist):', error);
  }

  try {
    // 4. 고정 컬럼들의 사용 횟수 집계
    const colCountResult = await query(`
      SELECT 
        COUNT(p.title) as title, 
        COUNT(p.category1) as category1, 
        COUNT(p.category2) as category2, 
        COUNT(p.category3) as category3, 
        COUNT(p.category4) as category4, 
        COUNT(p.summary) as summary, 
        COUNT(p.tags) as tags, 
        COUNT(p.content) as content,
        COUNT(p.project_name) as project_name,
        COUNT(st.tech_start) as techStart,
        COUNT(st.parent_skill) as parentSkill,
        COUNT(st.child_skill) as childSkill
      FROM posts p
      LEFT JOIN skill_tree st ON p.post_id = st.post_id
    `);
    if (colCountResult.rows.length > 0) {
      const colCounts = colCountResult.rows[0];
      Object.keys(colCounts).forEach(key => {
        const count = parseInt(colCounts[key], 10);
        if (count > 0) {
          const targetKey = getOriginalKey(key);
          propertiesMap.set(targetKey, Math.max(propertiesMap.get(targetKey) || 0, count));
        }
      });
    }
  } catch (error) {
    console.warn('Failed to fetch base column counts:', error);
  }

  // 맵을 배열로 변환 후 알파벳 순 정렬
  const allProperties: PropertyWithCount[] = Array.from(propertiesMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-[#232526] text-white/80 p-8 font-sans">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Manage Properties</h1>
            <p className="mt-2 text-white/60">Manage global front-matter properties and their data types.</p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-md bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white border border-white/10 shrink-0"
          >
            ← Back to Dashboard
          </Link>
        </header>

        <PropertyManager properties={allProperties} />
      </div>
    </div>
  );
}