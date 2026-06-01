'use client';

import React from 'react';
import Link from 'next/link';
import TemplateManager from '@/components/TemplateManager';

export default function CategoryTemplatePage() {
  return (
    <div className="min-h-screen bg-[#232526] text-white/80 p-8 font-sans">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Category Templates</h1>
            <p className="mt-2 text-white/60">Manage front-matter property requirements for each post category.</p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-md bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white border border-white/10 shrink-0"
          >
            ← Back to Dashboard
          </Link>
        </header>

        <TemplateManager />
      </div>
    </div>
  );
}