import React from 'react';
import Link from 'next/link';
import TemplateManager, { TemplatesState } from '@/components/TemplateManager';
import { query } from '../../../../infra/db';

export const dynamic = 'force-dynamic'; // 항상 최신 DB 데이터를 패칭하도록 보장

export default async function CategoryTemplatePage() {
  const result = await query(`
    SELECT tl.template_id, tl.template_name, pl.property_name, pl.property_type, tp.is_required
    FROM template_list tl
    LEFT JOIN template_property tp ON tl.template_id = tp.template_id
    LEFT JOIN property_list pl ON tp.property_id = pl.property_id
    ORDER BY tl.template_name ASC, tp.created_at ASC
  `);

  const initialTemplates: TemplatesState = {};

  result.rows.forEach((row) => {
    if (!initialTemplates[row.template_name]) {
      initialTemplates[row.template_name] = [];
    }
    if (row.property_name) {
      initialTemplates[row.template_name].push({
        propertyName: row.property_name,
        type: row.property_type || 'string', 
        isRequired: row.is_required,
      });
    }
  });

  return (
    <div className="mx-auto w-full max-w-[1000px] p-4 sm:p-8 font-sans">
      <header className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manage Templates</h1>
          <p className="mt-2 text-sm text-gray-500">Manage front-matter property requirements for each post category</p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          ← Back to Dashboard
        </Link>
      </header>

      <TemplateManager initialTemplates={initialTemplates} />
    </div>
  );
}