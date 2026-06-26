'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      const entryReferrer = sessionStorage.getItem('admin_entry_referrer');
      if (entryReferrer) {
        router.push(entryReferrer);
        return;
      }
    }
    router.push('/');
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-3.5 py-1.5 text-xs font-medium text-gray-800 transition-all hover:bg-gray-200/80"
    >
      ← Back
    </button>
  );
}
