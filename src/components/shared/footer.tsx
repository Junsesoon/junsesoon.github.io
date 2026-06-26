'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const isSkilltree = pathname === '/skilltree';
  const isPortfolio2 = pathname?.startsWith('/portfolio2');
  const isDarkTheme = isSkilltree || isPortfolio2;

  return (
    <footer className={`absolute bottom-0 left-0 right-0 w-full py-6 text-center text-sm transition-colors duration-300 bg-transparent z-10 ${
      isDarkTheme 
        ? 'text-slate-500' 
        : 'text-gray-500'
    }`}>
      © 2026{' '}
      <Link 
        href="/admin" 
        className={
          isSkilltree 
            ? 'text-[#8b949e] hover:text-[#f0f6fc]' 
            : isPortfolio2
            ? 'text-indigo-400 hover:text-purple-400 transition-colors'
            : 'text-gray-600 hover:text-gray-900'
        }
      >
        Junseo.
      </Link>{' '}
      All rights reserved.
    </footer>
  );
}

