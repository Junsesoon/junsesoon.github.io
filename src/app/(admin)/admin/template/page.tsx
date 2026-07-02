import React from 'react';
import Link from 'next/link';
import TemplateManager, { TemplatesState } from '@/components/admin/TemplateManager';
import { query } from '../../../../infra/neon';
import AdminClock from '../../../../components/admin/AdminClock';
import { logoutAction } from '../../../../actions/actions';
import BackButton from '@/components/admin/BackButton';
import AdminSidebar from '@/components/admin/AdminSidebar';

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
    <div className="flex min-h-screen w-full bg-gray-50/50 font-sans">
      <AdminSidebar activePath="template" />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-none w-full overflow-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200 pb-4 gap-4">
          <AdminClock title="Templates" />
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
          <TemplateManager initialTemplates={initialTemplates} />
        </div>
      </main>
    </div>
  );
}