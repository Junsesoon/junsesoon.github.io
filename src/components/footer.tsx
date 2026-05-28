import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full py-6 mt-auto text-center text-sm text-gray-500">
      © 2026 <Link href="/admin">Junseo.</Link> All rights reserved.
    </footer>
  );
}
