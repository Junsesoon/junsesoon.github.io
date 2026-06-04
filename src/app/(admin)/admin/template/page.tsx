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
    <div className="min-h-screen bg-[#232526] text-white/80 p-8 font-sans">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Manage Templates</h1>
            <p className="mt-2 text-white/60">Manage front-matter property requirements for each post category.</p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-md bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white border border-white/10 shrink-0"
          >
            ← Back to Dashboard
          </Link>
        </header>

        <TemplateManager initialTemplates={initialTemplates} />
      </div>
    </div>
  );
}