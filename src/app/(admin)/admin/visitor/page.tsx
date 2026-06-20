import React from 'react';
import Link from 'next/link';
import { query } from '../../../../infra/neon';
import VisitorManager from '@/components/VisitorManager';

export const dynamic = 'force-dynamic';

export default async function VisitorManagementPage() {
  let visitors: any[] = [];
  try {
    const result = await query(`
      SELECT 
        visitor_id, 
        ip_address, 
        session_id, 
        visited_date::text as visited_date
      FROM site_visitors
      ORDER BY visitor_id DESC
      LIMIT 100
    `);
    visitors = result.rows;
  } catch (error) {
    console.error('Failed to fetch site visitors from DB:', error);
  }

  return (
    <div className="mx-auto w-full max-w-[1000px] p-4 sm:p-8 font-sans">
      <header className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manage Visitors</h1>
          <p className="mt-2 text-sm text-gray-500">Monitor and manage unique site visitors, IP logs, and browser sessions.</p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          ← Back to Dashboard
        </Link>
      </header>

      <VisitorManager initialVisitors={visitors} />
    </div>
  );
}
