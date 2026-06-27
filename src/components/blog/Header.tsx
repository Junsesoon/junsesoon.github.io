import React from 'react';

interface HeaderProps {
  title?: string;
  description?: string;
  className?: string;
}

export default function Header({
  title = "Junseo's Blog",
  description = "What are you looking for?",
  className = '',
}: HeaderProps) {
  return (
    <header className={`mb-12 border-b border-gray-100 pb-8 text-center ${className}`}>
      <h1 className="text-5xl font-bold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="mt-3 text-xl text-slate-500">
        {description}
      </p>
    </header>
  );
}
