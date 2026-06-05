import React from 'react';

export default function BlogStats() {
  const stats = [
    { value: '140+', label: 'Total Posts', borderColor: 'border-blue-300' },
    { value: '32', label: 'Tech Skills Map', borderColor: 'border-emerald-300' },
    { value: '450+', label: 'GitHub Commits', borderColor: 'border-purple-300' },
    { value: '1,200+', label: 'Monthly Views', borderColor: 'border-rose-300' },
  ];

  return (
    <section className="w-full max-w-[1440px] mx-auto py-8 px-4 md:px-8">
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`flex flex-col space-y-1 items-center justify-center p-6 border-2 bg-white rounded-xl ${stat.borderColor}`}>
            <span className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
              {stat.value}
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}