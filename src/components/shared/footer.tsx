'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const isSkilltree = pathname === '/skilltree';

  return (
    <footer className={`w-full py-6 mt-auto text-center text-sm transition-colors duration-300 ${
      isSkilltree 
        ? 'bg-[#02040a] text-slate-500 border-t border-[#30363d]/45' 
        : 'text-gray-500 bg-white'
    }`}>
      © 2026 <Link href="/admin" className={isSkilltree ? 'text-[#8b949e] hover:text-[#f0f6fc]' : 'text-gray-600 hover:text-gray-900'}>Junseo.</Link> All rights reserved.
    </footer>
  );
}
