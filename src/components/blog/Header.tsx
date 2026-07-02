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
    <header className={`mb-12 border-b border-theme-border pb-8 text-center ${className}`}>
      <h1 className="text-5xl font-bold tracking-tight text-theme-text-title">
        {title}
      </h1>
      <p className="mt-3 text-xl text-theme-text-muted">
        {description}
      </p>
    </header>
  );
}
