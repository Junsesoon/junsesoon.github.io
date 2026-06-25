'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const isSkilltree = pathname === '/skilltree';

  return (
    <footer className={`absolute bottom-0 left-0 right-0 w-full py-6 text-center text-sm transition-colors duration-300 bg-transparent z-10 ${
      isSkilltree 
        ? 'text-slate-500 border-t border-[#30363d]/20' 
        : 'text-gray-500'
    }`}>
      © 2026 <Link href="/admin" className={isSkilltree ? 'text-[#8b949e] hover:text-[#f0f6fc]' : 'text-gray-600 hover:text-gray-900'}>Junseo.</Link> All rights reserved.
    </footer>
  );
}
