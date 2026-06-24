'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { addBlockRule, removeBlockRule } from './visitorActions';
import { DBViewLog, deleteViewLogAction } from './viewLogsActions';

interface ViewLogsManagerProps {
  initialLogs: DBViewLog[];
  totalViews: number;
  todayViews: number;
  activeViews30m: number;
}

export default function ViewLogsManager({
  initialLogs,
  totalViews,
  todayViews,
  activeViews30m,
}: ViewLogsManagerProps) {
  const [logs, setLogs] = useState<DBViewLog[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Draft' | 'Editing' | 'Deleted'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting state
  const [sortField, setSortField] = useState<keyof DBViewLog>('view_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof DBViewLog) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const renderSortableHeader = (
    field: keyof DBViewLog,
    label: string,
    align: 'center' | 'left' = 'center',
    widthClass: string = ''
  ) => {
    const isActive = sortField === field;
    const isAsc = sortDirection === 'asc';
    return (
      <th
        scope="col"
        className={`px-1 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle select-none cursor-pointer hover:bg-gray-100/50 transition-colors ${
          align === 'left' ? 'text-left' : 'text-center'
        } ${widthClass}`}
        onClick={() => handleSort(field)}
      >
        <div className={`inline-flex items-center gap-1 ${align === 'left' ? 'justify-start' : 'justify-center'}`}>
          {label}
          <span className={`text-[10px] ${isActive ? 'text-gray-600' : 'text-gray-300'}`}>
            {isActive ? (isAsc ? '▲' : '▼') : '↕'}
          </span>
        </div>
      </th>
    );
  };

  // Toast notifications
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'warning' }[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  // Clipboard copy
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard.`, 'info');
  };

  // Toggle block/allow IP
  const handleToggleBlock = async (ip: string, isCurrentlyBlocked: boolean) => {
    const shouldBlock = !isCurrentlyBlocked;
    let res;
    if (shouldBlock) {
      res = await addBlockRule(ip, 'Administrator manual block from View Logs');
    } else {
      res = await removeBlockRule(ip);
    }

    if (res.success) {
      setLogs(prev =>
        prev.map(log => {
          if (log.ip_address === ip) {
            return { ...log, is_blocked: shouldBlock };
          }
          return log;
        })
      );
      if (shouldBlock) {
        showToast(`IP ${ip} has been blocked.`, 'warning');
      } else {
        showToast(`IP ${ip} has been unblocked.`, 'success');
      }
    } else {
      showToast(`Failed to update block status for ${ip}.`, 'warning');
    }
  };

  // Delete view log row from DB
  const handleDeleteLog = async (viewId: number) => {
    if (!confirm(`Are you sure you want to permanently delete view log #${viewId}?`)) {
      return;
    }
    const res = await deleteViewLogAction(viewId);
    if (res.success) {
      setLogs(prev => prev.filter(log => log.view_id !== viewId));
      showToast(`View log #${viewId} deleted from database.`, 'success');
    } else {
      showToast(`Failed to delete view log #${viewId} from database.`, 'warning');
    }
  };

  // Unique session count in current logs
  const uniqueSessionsCount = useMemo(() => {
    const sessions = new Set(logs.map(l => l.session_id));
    return sessions.size;
  }, [logs]);

  // Group views by date for trend chart (from the loaded logs)
  const chartData = useMemo(() => {
    const last7Days: { dateStr: string; label: string; count: number }[] = [];
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(kstNow.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      last7Days.push({ dateStr, label: dayLabel, count: 0 });
    }

    logs.forEach(log => {
      if (!log.viewed_at) return;
      const logDate = log.viewed_at.split(' ')[0] || log.viewed_at.split('T')[0];
      const dayData = last7Days.find(item => item.dateStr === logDate);
      if (dayData) {
        dayData.count += 1;
      }
    });

    return last7Days;
  }, [logs]);

  const maxChartCount = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.count));
    return max > 0 ? Math.ceil(max / 5) * 5 : 10;
  }, [chartData]);

  const [hoveredTrend, setHoveredTrend] = useState<number | null>(null);

  // Filter and sort logs
  const sortedAndFilteredLogs = useMemo(() => {
    const filtered = logs.filter(log => {
      const matchesSearch =
        log.post_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ip_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.session_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.post_slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'All'
          ? true
          : log.post_status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        return sortDirection === 'asc'
          ? (valA === valB ? 0 : valA ? 1 : -1)
          : (valA === valB ? 0 : valA ? -1 : 1);
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      return 0;
    });
  }, [logs, searchQuery, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedAndFilteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredLogs.slice(start, start + itemsPerPage);
  }, [sortedAndFilteredLogs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Toast notifications container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all duration-300 text-sm border font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : toast.type === 'warning'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
            }`}
          >
            <div className="flex-1">{toast.message}</div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      {/* Summary metrics cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {/* Total Views */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-indigo-200">
          <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-50/50 rounded-bl-full" />
          <p className="text-sm font-semibold text-gray-500">Total Views</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-gray-800">{totalViews}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Accumulated database records</p>
        </div>

        {/* Today's Views */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-indigo-200">
          <p className="text-sm font-semibold text-gray-500">Today's Views</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-gray-800">{todayViews}</span>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">KST Today</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Views tracked since midnight</p>
        </div>

        {/* Active Views (Last 30m) */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-emerald-200">
          <div className="absolute top-2 right-4 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <p className="text-sm font-semibold text-gray-500">Views (Last 30m)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-gray-800">{activeViews30m}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Active views in latest 30 mins</p>
        </div>

        {/* Unique Sessions in Logs */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-100 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-violet-200">
          <p className="text-sm font-semibold text-gray-500">Unique Sessions</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-gray-800">{uniqueSessionsCount}</span>
            <span className="text-xs font-medium text-gray-400">sessions</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">From the latest 100 logs</p>
        </div>
      </div>

      {/* SVG Chart & Detailed view logs distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend line chart */}
        <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-800">Page Views Trend</h3>
              <p className="text-xs text-gray-400">View logs distribution over the last 7 days</p>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded font-semibold">
                7 Days Window
              </span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="relative h-[200px] w-full mt-4">
            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="30" x2="560" y2="30" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
              <line x1="40" y1="75" x2="560" y2="75" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
              <line x1="40" y1="120" x2="560" y2="120" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
              <line x1="40" y1="165" x2="560" y2="165" stroke="#e5e7eb" strokeWidth="1.5" />

              {/* Grid Y Values */}
              <text x="15" y="34" className="text-[10px] fill-gray-400 font-medium">{maxChartCount}</text>
              <text x="15" y="79" className="text-[10px] fill-gray-400 font-medium">{Math.round(maxChartCount * 2 / 3)}</text>
              <text x="15" y="124" className="text-[10px] fill-gray-400 font-medium">{Math.round(maxChartCount / 3)}</text>
              <text x="25" y="169" className="text-[10px] fill-gray-400 font-medium">0</text>

              {/* Path Calculation */}
              {/* x: 40 + i * (520/6) => i*86.66 */}
              {/* y: 165 - (count/maxChartCount) * 135 */}
              <path
                d={`M 40 ${165 - (chartData[0].count / maxChartCount) * 135} 
                    L 126.6 ${165 - (chartData[1].count / maxChartCount) * 135} 
                    L 213.3 ${165 - (chartData[2].count / maxChartCount) * 135} 
                    L 300 ${165 - (chartData[3].count / maxChartCount) * 135} 
                    L 386.6 ${165 - (chartData[4].count / maxChartCount) * 135} 
                    L 473.3 ${165 - (chartData[5].count / maxChartCount) * 135} 
                    L 560 ${165 - (chartData[6].count / maxChartCount) * 135}
                    L 560 165 L 40 165 Z`}
                fill="url(#viewsGrad)"
              />

              <path
                d={`M 40 ${165 - (chartData[0].count / maxChartCount) * 135} 
                    L 126.6 ${165 - (chartData[1].count / maxChartCount) * 135} 
                    L 213.3 ${165 - (chartData[2].count / maxChartCount) * 135} 
                    L 300 ${165 - (chartData[3].count / maxChartCount) * 135} 
                    L 386.6 ${165 - (chartData[4].count / maxChartCount) * 135} 
                    L 473.3 ${165 - (chartData[5].count / maxChartCount) * 135} 
                    L 560 ${165 - (chartData[6].count / maxChartCount) * 135}`}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive nodes */}
              {chartData.map((data, idx) => {
                const cx = 40 + idx * 86.66;
                const cy = 165 - (data.count / maxChartCount) * 135;
                const isHovered = hoveredTrend === idx;

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredTrend(idx)}
                    onMouseLeave={() => setHoveredTrend(null)}
                    className="cursor-pointer"
                  >
                    {isHovered && (
                      <line x1={cx} y1="30" x2={cx} y2="165" stroke="#818cf8" strokeWidth="1" strokeDasharray="3" />
                    )}

                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 8 : 4}
                      className="transition-all duration-200"
                      fill={isHovered ? '#c7d2fe' : '#ffffff'}
                      stroke="#6366f1"
                      strokeWidth={isHovered ? 3 : 2}
                    />

                    <text x={cx} y="185" textAnchor="middle" className="text-[11px] fill-gray-400 font-semibold">
                      {data.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Custom Interactive Tooltip */}
            {hoveredTrend !== null && (
              <div
                className="absolute bg-slate-800 text-white rounded px-2.5 py-1.5 text-xs font-semibold shadow-md pointer-events-none transition-all duration-150"
                style={{
                  left: `${40 + hoveredTrend * 14.4}%`,
                  transform: 'translate(-50%, -100%)',
                  top: `${165 - (chartData[hoveredTrend].count / maxChartCount) * 135 - 10}px`,
                }}
              >
                <div className="text-[9px] text-indigo-200 font-normal">{chartData[hoveredTrend].dateStr}</div>
                <div>{chartData[hoveredTrend].count} Views</div>
              </div>
            )}
          </div>
        </div>

        {/* Most Viewed Posts in the loaded logs */}
        <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80">
          <h3 className="text-base font-bold text-gray-800">Recent Distribution</h3>
          <p className="text-xs text-gray-400 mb-4">Post view distribution</p>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {Array.from(
              logs.reduce((acc, log) => {
                const val = acc.get(log.post_title) || 0;
                acc.set(log.post_title, val + 1);
                return acc;
              }, new Map<string, number>())
            )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([title, count], idx) => {
                const percentage = Math.round((count / logs.length) * 100);
                const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500'];
                const color = colors[idx % colors.length];

                return (
                  <div key={title}>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1.5">
                      <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${color}`} />
                        <span className="truncate" title={title}>{title}</span>
                      </span>
                      <span>{percentage}% ({count})</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4 text-center">
            <span className="inline-block text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded">
              📊 Analyzed from last {logs.length} page hits
            </span>
          </div>
        </div>
      </div>

      {/* Logs Table Section */}
      <div className="space-y-3">
        <div className="border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center pb-2 sm:pb-0 gap-4">
          <nav className="flex space-x-6" aria-label="Tabs">
            <button
              className="border-b-2 border-indigo-500 py-3 px-1 text-sm font-semibold text-indigo-600 transition-colors focus:outline-none"
            >
              View Logs
            </button>
          </nav>

          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto pb-2 sm:pb-0 justify-end">
            {/* Status Filter buttons */}
            <div className="flex gap-1 w-full sm:w-auto justify-end">
              {(['All', 'Published', 'Draft', 'Editing', 'Deleted'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    statusFilter === filter
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search Title, IP, Session ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-4 text-xs text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Card Container */}
        <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80">
          {sortedAndFilteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white">
              <p className="text-base font-medium">No view logs match your filters.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                }}
                className="mt-2 text-sm text-indigo-600 hover:underline"
              >
                Reset search & filters
              </button>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-gray-500">
                <thead className="bg-transparent border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                  <tr>
                    {renderSortableHeader('view_id', 'ID')}
                    {renderSortableHeader('post_title', 'Post Title', 'left')}
                    {renderSortableHeader('ip_address', 'IP Address', 'center', 'min-w-[160px]')}
                    {renderSortableHeader('session_id', 'Session UUID')}
                    {renderSortableHeader('viewed_at', 'Viewed At')}
                    {renderSortableHeader('post_status', 'Status')}
                    <th scope="col" className="px-1 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {paginatedLogs.map(log => (
                    <tr key={log.view_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-1 py-3 font-mono text-xs text-slate-400 text-center">
                        #VIEW-{log.view_id}
                      </td>
                      <td className="px-1 py-3 text-left font-medium text-gray-900 max-w-[240px] truncate">
                        {log.post_slug ? (
                          <Link
                            href={`/${log.post_slug.split('/').map(encodeURIComponent).join('/')}`}
                            target="_blank"
                            className="hover:text-indigo-600 hover:underline"
                            title="View public post"
                          >
                            {log.post_title}
                          </Link>
                        ) : (
                          <span className="text-gray-400">{log.post_title}</span>
                        )}
                      </td>
                      <td className="px-1 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-semibold text-gray-800">{log.ip_address}</span>
                          <button
                            onClick={() => handleCopy(log.ip_address, 'IP Address')}
                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-all focus:outline-none"
                            title="Copy IP"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-1 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-mono text-xs max-w-[120px] truncate" title={log.session_id}>
                            {log.session_id}
                          </span>
                          <button
                            onClick={() => handleCopy(log.session_id, 'Session UUID')}
                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-all focus:outline-none"
                            title="Copy Session ID"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-1 py-3 text-xs font-semibold text-gray-600 text-center whitespace-nowrap">
                        {log.viewed_at ? log.viewed_at.replace('T', ' ').substring(0, 16) : ''}
                      </td>
                      <td className="px-1 py-3 text-center">
                        {log.post_status === 'deleted' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                            Deleted
                          </span>
                        ) : log.post_status === 'draft' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                            Draft
                          </span>
                        ) : log.post_status === 'editing' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                            Editing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Published
                          </span>
                        )}
                      </td>
                      <td className="px-1 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleToggleBlock(log.ip_address, log.is_blocked)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                              log.is_blocked
                                ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            {log.is_blocked ? 'Allow' : 'Block'}
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.view_id)}
                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all focus:outline-none"
                            title="Hide Log"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 ? (
            <div className="border-t border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Page {currentPage} of {totalPages} ({sortedAndFilteredLogs.length} logs)
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-3 py-1.5 border border-gray-200/60 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNumber = i + 1;
                  const isActive = pageNumber === currentPage;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`h-8 w-8 text-[10px] font-bold rounded-lg flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-indigo-50/50 text-indigo-600 border border-indigo-100/60 font-extrabold shadow-sm'
                          : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-800'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-3 py-1.5 border border-gray-200/60 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-100 bg-white px-6 py-4 text-center text-xs font-bold text-gray-300 uppercase tracking-wider">
              End of list
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
