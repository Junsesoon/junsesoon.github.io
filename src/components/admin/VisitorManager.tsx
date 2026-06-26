'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { addBlockRule, removeBlockRule } from '../../actions/visitorActions';

export interface DBVisitor {
  visitor_id: number;
  ip_address: string;
  session_id: string;
  visited_date: string;
  browser?: string;
}

interface VisitorDetails extends DBVisitor {
  location: string;
  browser: string;
  status: 'Allowed' | 'Blocked';
  reason?: string;
}

interface BlockRule {
  id: string;
  ip_address: string;
  reason: string;
  created_at: string;
}

interface VisitorManagerProps {
  initialVisitors: DBVisitor[];
  totalVisitors: number;
  todayVisitors: number;
  activeVisitors: number;
  initialBlockRules: BlockRule[];
  weeklyIncreaseRate: number;
  weeklyTrend: { day: string; count: number }[];
  browserStats: { name: string; percentage: number }[];
}

// IP 기반 디바이스/위치 정보를 매핑하는 헬퍼 함수
const getDetailsFromIp = (ip: string, id: number) => {
  const locations = [
    '🇰🇷 Seoul, KR',
    '🇺🇸 California, US',
    '🇯🇵 Tokyo, JP',
    '🇩🇪 Frankfurt, DE',
    '🇸🇬 Singapore, SG',
    '🇬🇧 London, GB',
    '🇫🇷 Paris, FR',
    '🇦🇺 Sydney, AU'
  ];
  
  const browsers = [
    'Chrome / macOS',
    'Safari / iOS',
    'Chrome / Windows',
    'Firefox / Linux',
    'Edge / Windows',
    'Safari / macOS',
    'Chrome / Android'
  ];

  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip === 'unknown') {
    return {
      location: '💻 Localhost (Development)',
      browser: 'Chrome / macOS',
      status: 'Allowed' as const
    };
  }

  // 간단한 해시 함수로 속성 일관성 유지
  const hash = ip.split('.').reduce((acc, part) => acc + parseInt(part, 10), 0) + id;
  const locIndex = hash % locations.length;
  const browserIndex = (hash + 3) % browsers.length;
  
  // 15% 확률로 초기 차단 상태
  const status = (hash % 7 === 0) ? 'Blocked' as const : 'Allowed' as const;
  const reason = status === 'Blocked' ? 'Multiple rapid requests' : undefined;

  return {
    location: locations[locIndex],
    browser: browsers[browserIndex],
    status,
    reason
  };
};

export default function VisitorManager({ initialVisitors, totalVisitors, todayVisitors, activeVisitors, initialBlockRules, weeklyIncreaseRate, weeklyTrend, browserStats }: VisitorManagerProps) {
  // 1. 초기 방문자 데이터 구성 (DB 데이터만 사용하도록 목업 데이터 제거)
  const defaultMockVisitors: VisitorDetails[] = useMemo(() => {
    return initialVisitors.map(v => {
      const details = getDetailsFromIp(v.ip_address, v.visitor_id);
      const isBlocked = initialBlockRules.some(r => r.ip_address === v.ip_address);
      const matchedRule = initialBlockRules.find(r => r.ip_address === v.ip_address);
      return {
        ...v,
        location: details.location,
        browser: v.browser || details.browser,
        status: isBlocked ? 'Blocked' as const : 'Allowed' as const,
        reason: isBlocked ? (matchedRule?.reason || 'Administrator manual block') : undefined
      };
    });
  }, [initialVisitors, initialBlockRules]);

  // 로컬 상태 정의
  const [visitors, setVisitors] = useState<VisitorDetails[]>(defaultMockVisitors);
  const [activeTab, setActiveTab] = useState<'logs' | 'rules'>('logs');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Allowed' | 'Blocked'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // IP 차단 규칙 리스트
  const [blockRules, setBlockRules] = useState<BlockRule[]>(initialBlockRules);

  // 새로운 규칙 입력용
  const [newRuleIp, setNewRuleIp] = useState('');
  const [newRuleReason, setNewRuleReason] = useState('Abnormal requests');

  // 토스트 메시지
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'warning' }[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  // 클립보드 복사
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Session ID copied to clipboard.', 'info');
  };

  // IP 차단 토글
  const handleToggleBlock = async (ip: string, currentStatus: 'Allowed' | 'Blocked') => {
    const newStatus: 'Allowed' | 'Blocked' = currentStatus === 'Allowed' ? 'Blocked' : 'Allowed';
    
    let res;
    if (newStatus === 'Blocked') {
      res = await addBlockRule(ip, 'Administrator manual block');
    } else {
      res = await removeBlockRule(ip);
    }

    if (res.success) {
      setVisitors(prev => prev.map(v => {
        if (v.ip_address === ip) {
          return {
            ...v,
            status: newStatus,
            reason: newStatus === 'Blocked' ? 'Administrator manual block' : undefined
          };
        }
        return v;
      }));

      if (newStatus === 'Blocked') {
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        setBlockRules(prev => [...prev, {
          id: `rule-${Date.now()}-${ip}`,
          ip_address: ip,
          reason: 'Administrator manual block',
          created_at: nowStr
        }]);
        showToast(`IP ${ip} has been blocked.`, 'warning');
      } else {
        setBlockRules(prev => prev.filter(r => r.ip_address !== ip));
        showToast(`IP ${ip} has been unblocked.`, 'success');
      }
    } else {
      showToast(`Failed to update block status for ${ip} on DB.`, 'warning');
    }
  };

  // 로그 삭제
  const handleDeleteLog = (id: number) => {
    setVisitors(prev => prev.filter(v => v.visitor_id !== id));
    showToast(`Visitor log #${id} deleted successfully.`, 'success');
  };

  // 차단 규칙 추가
  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleIp.trim()) return;

    // 간단한 IPv4 정규식 검증
    const ipv4Regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipv4Regex.test(newRuleIp) && newRuleIp !== 'localhost') {
      showToast('Please enter a valid IP address.', 'warning');
      return;
    }

    if (blockRules.some(r => r.ip_address === newRuleIp)) {
      showToast('This IP address is already registered in blocklist.', 'warning');
      return;
    }

    const res = await addBlockRule(newRuleIp, newRuleReason);
    if (res.success) {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newRule: BlockRule = {
        id: `rule-${Date.now()}-${newRuleIp}`,
        ip_address: newRuleIp,
        reason: newRuleReason,
        created_at: nowStr
      };

      setBlockRules(prev => [newRule, ...prev]);

      // 방문자 로그에도 반영
      setVisitors(prev => prev.map(v => {
        if (v.ip_address === newRuleIp) {
          return { ...v, status: 'Blocked', reason: newRuleReason };
        }
        return v;
      }));

      showToast(`Manually blocked IP ${newRuleIp}.`, 'warning');
      setNewRuleIp('');
    } else {
      showToast('Failed to add block rule to DB.', 'warning');
    }
  };

  // 차단 규칙 삭제
  const handleRemoveRule = async (id: string, ip: string) => {
    const res = await removeBlockRule(ip);
    if (res.success) {
      setBlockRules(prev => prev.filter(r => r.ip_address !== ip));
      
      // 방문자 로그 해제
      setVisitors(prev => prev.map(v => {
        if (v.ip_address === ip) {
          return { ...v, status: 'Allowed', reason: undefined };
        }
        return v;
      }));

      showToast(`IP ${ip} has been removed from blocklist.`, 'success');
    } else {
      showToast('Failed to remove block rule from DB.', 'warning');
    }
  };

  // 7일간의 방문 트렌드 통계 생성
  const trendData = weeklyTrend && weeklyTrend.length === 7 ? weeklyTrend : [
    { day: 'Mon', count: 0 },
    { day: 'Tue', count: 0 },
    { day: 'Wed', count: 0 },
    { day: 'Thu', count: 0 },
    { day: 'Fri', count: 0 },
    { day: 'Sat', count: 0 },
    { day: 'Sun', count: 0 },
  ];

  // Dynamic scaling for chart
  const maxCount = Math.max(...trendData.map(d => d.count), 10);
  const maxVal = Math.max(Math.ceil(maxCount / 30) * 30, 30);
  const getY = (count: number) => 165 - (count / maxVal) * 135;

  const [hoveredTrend, setHoveredTrend] = useState<number | null>(null);

  // 필터링 및 검색된 방문자
  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      const matchesSearch = 
        v.ip_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.session_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'All' ? true : v.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [visitors, searchQuery, statusFilter]);

  // 페이징 처리
  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);
  const paginatedVisitors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVisitors.slice(start, start + itemsPerPage);
  }, [filteredVisitors, currentPage]);

  // 필터 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // 가장 비중이 높은 지역(Location) 계산
  const topLocationInfo = useMemo(() => {
    if (visitors.length === 0) return { name: 'South Korea', percentage: 100 };
    const counts: Record<string, number> = {};
    visitors.forEach(v => {
      if (v.location) {
        counts[v.location] = (counts[v.location] || 0) + 1;
      }
    });
    
    let maxLocation = 'Unknown';
    let maxCount = 0;
    Object.keys(counts).forEach(loc => {
      if (counts[loc] > maxCount) {
        maxCount = counts[loc];
        maxLocation = loc;
      }
    });

    const percentage = Math.round((maxCount / visitors.length) * 100);
    return { name: maxLocation, percentage };
  }, [visitors]);

  return (
    <div className="space-y-6">
      {/* 토스트 노티피케이션 컨테이너 */}
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

      {/* 요약 메트릭 그리드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {/* 전체 방문객 */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-100 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-violet-200">
          <div className="absolute top-0 right-0 h-16 w-16 bg-violet-50/50 rounded-bl-full" />
          <p className="text-sm font-semibold text-gray-500">Total Visitors</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-gray-800">{totalVisitors}</span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${weeklyIncreaseRate >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
              {weeklyIncreaseRate >= 0 ? '+' : ''}{weeklyIncreaseRate.toFixed(1)}%
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Total unique sessions cached</p>
        </div>

        {/* 전체 로그 목록 */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-indigo-200">
          <p className="text-sm font-semibold text-gray-500">Today's Visitors</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-gray-800">
              {todayVisitors}
            </span>
            <span className="text-xs font-medium text-gray-400">unique IPs</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Measured on local system time</p>
        </div>

        {/* 실시간 세션 */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-emerald-200">
          <div className="absolute top-2 right-4 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <p className="text-sm font-semibold text-gray-500">Active Right Now</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-gray-800">{activeVisitors}</span>
            <span className="text-xs font-medium text-emerald-600">active user{(activeVisitors !== 1) ? 's' : ''}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Active sessions in last 30m</p>
        </div>

        {/* 차단된 IP 수 */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-rose-200">
          <p className="text-sm font-semibold text-gray-500">Security Rules</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-gray-800">{blockRules.length}</span>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Active Block</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Blocked IP addresses count</p>
        </div>
      </div>

      {/* SVG 그래프 & 통계 정보 레이아웃 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 그래프 카드 */}
        <div className="relative z-10 rounded-2xl border border-gray-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-800">Visitor Traffic Trend</h3>
              <p className="text-xs text-gray-400">Total sessions over the last 7 days</p>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded font-semibold">
                7 Days Window
              </span>
            </div>
          </div>

          {/* SVG 라인 차트 */}
          <div className="relative h-[200px] w-full mt-4">
            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="visitorGrad" x1="0" y1="0" x2="0" y2="1">
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
              <text x="15" y="34" className="text-[10px] fill-gray-400 font-medium">{maxVal}</text>
              <text x="15" y="79" className="text-[10px] fill-gray-400 font-medium">{Math.round(maxVal * 2 / 3)}</text>
              <text x="15" y="124" className="text-[10px] fill-gray-400 font-medium">{Math.round(maxVal * 1 / 3)}</text>
              <text x="25" y="169" className="text-[10px] fill-gray-400 font-medium">0</text>

              {/* Area & Line Calculation */}
              {/* x: 40 + i * (520/6) => i*86.66 */}
              {/* y: 165 - (count/maxVal) * 135 */}
              <path
                d={`M 40 ${getY(trendData[0].count)} 
                    L 126.6 ${getY(trendData[1].count)} 
                    L 213.3 ${getY(trendData[2].count)} 
                    L 300 ${getY(trendData[3].count)} 
                    L 386.6 ${getY(trendData[4].count)} 
                    L 473.3 ${getY(trendData[5].count)} 
                    L 560 ${getY(trendData[6].count)}
                    L 560 165 L 40 165 Z`}
                fill="url(#visitorGrad)"
              />

              <path
                d={`M 40 ${getY(trendData[0].count)} 
                    L 126.6 ${getY(trendData[1].count)} 
                    L 213.3 ${getY(trendData[2].count)} 
                    L 300 ${getY(trendData[3].count)} 
                    L 386.6 ${getY(trendData[4].count)} 
                    L 473.3 ${getY(trendData[5].count)} 
                    L 560 ${getY(trendData[6].count)}`}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive nodes */}
              {trendData.map((data, idx) => {
                const cx = 40 + idx * 86.66;
                const cy = getY(data.count);
                const isHovered = hoveredTrend === idx;

                return (
                  <g key={idx} onMouseEnter={() => setHoveredTrend(idx)} onMouseLeave={() => setHoveredTrend(null)} className="cursor-pointer">
                    {/* Vertical guideline */}
                    {isHovered && (
                      <line x1={cx} y1="30" x2={cx} y2="165" stroke="#818cf8" strokeWidth="1" strokeDasharray="3" />
                    )}
                    
                    {/* Outer glow ring */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 8 : 4}
                      className="transition-all duration-200"
                      fill={isHovered ? '#c7d2fe' : '#ffffff'}
                      stroke="#6366f1"
                      strokeWidth={isHovered ? 3 : 2}
                    />

                    {/* X axis labels */}
                    <text x={cx} y="185" textAnchor="middle" className="text-[11px] fill-gray-400 font-semibold">{data.day}</text>
                  </g>
                );
              })}
            </svg>

            {/* Custom Interactive Tooltip */}
            {hoveredTrend !== null && (
              <div
                className="absolute z-30 bg-slate-800 text-white rounded px-2.5 py-1.5 text-xs font-semibold shadow-md pointer-events-none transition-all duration-150"
                style={{
                  left: `${((40 + hoveredTrend * 86.66) / 6).toFixed(2)}%`,
                  transform: 'translate(-50%, -100%)',
                  top: `${getY(trendData[hoveredTrend].count) - 20}px`
                }}
              >
                <div className="text-[9px] text-indigo-200 font-normal">{trendData[hoveredTrend].day} Trend</div>
                <div>{trendData[hoveredTrend].count} Visitors</div>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽 패널: 브라우저/디바이스 통계 */}
        <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80">
          <h3 className="text-base font-bold text-gray-800">Browser Distribution</h3>
          <p className="text-xs text-gray-400 mb-4">Device client types mapping</p>

          <div className="space-y-3">
            {browserStats.map((stat) => {
              const getBrowserColorClass = (name: string) => {
                switch (name) {
                  case 'Google Chrome': return 'bg-indigo-500';
                  case 'Apple Safari': return 'bg-violet-500';
                  case 'Mozilla Firefox': return 'bg-pink-500';
                  case 'Microsoft Edge': return 'bg-amber-500';
                  default: return 'bg-emerald-500';
                }
              };
              const colorClass = getBrowserColorClass(stat.name);
              return (
                <div key={stat.name}>
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${colorClass}`} />
                      {stat.name}
                    </span>
                    <span>{stat.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${stat.percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4 text-center">
            <span className="inline-block text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded">
              🎯 Top Geo-Location: {topLocationInfo.name} ({topLocationInfo.percentage}%)
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* 탭 인터페이스 */}
        <div className="border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center pb-2 sm:pb-0 gap-4">
        <nav className="flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('logs')}
            className={`border-b-2 py-3 px-1 text-sm font-semibold transition-colors focus:outline-none ${
              activeTab === 'logs'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Visitor Logs
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`border-b-2 py-3 px-1 text-sm font-semibold transition-colors focus:outline-none ${
              activeTab === 'rules'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Security Rules ({blockRules.length})
          </button>
        </nav>

        {activeTab === 'logs' && (
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto pb-2 sm:pb-0 justify-end">
            {/* 필터 탭 */}
            <div className="flex gap-1 w-full sm:w-auto justify-end">
              {(['All', 'Allowed', 'Blocked'] as const).map((filter) => (
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

            {/* 검색 */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search IP, Session ID or Country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-4 text-xs text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 탭 1: 로그 매니저 */}
      {activeTab === 'logs' && (
        <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80">
          {filteredVisitors.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white">
              <p className="text-base font-medium">No visitor logs match your filters.</p>
              <button onClick={() => { setSearchQuery(''); setStatusFilter('All'); }} className="mt-2 text-sm text-indigo-600 hover:underline">
                Reset search & filters
              </button>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-gray-500">
                <thead className="bg-transparent border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                  <tr>
                    <th scope="col" className="px-1 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle">ID</th>
                    <th scope="col" className="px-1 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle min-w-[160px]">IP Address</th>
                    <th scope="col" className="px-1 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle">Location</th>
                    <th scope="col" className="px-1 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle">Session Key</th>
                    <th scope="col" className="px-1 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle min-w-[120px] whitespace-nowrap">Date</th>
                    <th scope="col" className="px-1 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle">Client</th>
                    <th scope="col" className="px-1 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle">Device</th>
                    <th scope="col" className="px-1 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle w-24">Status</th>
                    <th scope="col" className="px-1 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {paginatedVisitors.map((visitor) => {
                    const [client, device] = (visitor.browser || '').split(' / ');
                    return (
                      <tr key={visitor.visitor_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-1 py-3 font-mono text-xs text-slate-400 text-center">
                          #VIS-{visitor.visitor_id}
                        </td>
                        <td className="px-1 py-3 text-center font-semibold text-gray-900">
                          {visitor.ip_address}
                        </td>
                        <td className="px-1 py-3 text-center text-xs text-gray-500 font-medium">
                          {visitor.location}
                        </td>
                        <td className="px-1 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-mono text-xs max-w-[120px] truncate" title={visitor.session_id}>
                              {visitor.session_id}
                            </span>
                            <button
                              onClick={() => handleCopy(visitor.session_id)}
                              className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-all focus:outline-none"
                              title="Copy UUID"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-1 py-3 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          {visitor.visited_date}
                        </td>
                        <td className="px-1 py-3 text-center text-xs text-gray-700 whitespace-nowrap">
                          {client}
                        </td>
                        <td className="px-1 py-3 text-center text-xs text-gray-500 whitespace-nowrap">
                          {device}
                        </td>
                        <td className="px-1 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              visitor.status === 'Allowed'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                : 'bg-rose-50 border-rose-200 text-rose-600'
                            }`}
                            title={visitor.reason}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${visitor.status === 'Allowed' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {visitor.status}
                          </span>
                        </td>
                        <td className="px-1 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleToggleBlock(visitor.ip_address, visitor.status)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                                visitor.status === 'Allowed'
                                  ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {visitor.status === 'Allowed' ? 'Block' : 'Allow'}
                            </button>
                            <button
                              onClick={() => handleDeleteLog(visitor.visitor_id)}
                              className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all focus:outline-none"
                              title="Delete Log"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 ? (
            <div className="border-t border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Page {currentPage} of {totalPages} ({filteredVisitors.length} logs)
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
      )}

      {/* 탭 2: 차단 룰 매니저 */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* 수동 IP 등록 폼 */}
          <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80 h-fit">
            <h3 className="text-base font-bold text-gray-800 mb-4">Register Block Rule</h3>
            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label htmlFor="ip" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  IP Address
                </label>
                <input
                  type="text"
                  id="ip"
                  placeholder="e.g. 192.168.0.10"
                  value={newRuleIp}
                  onChange={(e) => setNewRuleIp(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="reason" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Reason for Block
                </label>
                <select
                  id="reason"
                  value={newRuleReason}
                  onChange={(e) => setNewRuleReason(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Abnormal requests rate">Abnormal requests rate</option>
                  <option value="Spam script injection">Spam script injection</option>
                  <option value="DDOS & scraping risk">DDOS & scraping risk</option>
                  <option value="Bot crawler exclusion">Bot crawler exclusion</option>
                  <option value="Manual admin block">Manual admin block</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-[0_1px_2px_rgba(225,29,72,0.15)] transition-all hover:bg-rose-700 focus:outline-none"
              >
                Register Exclusion Rule
              </button>
            </form>
          </div>

          {/* 등록된 규칙 목록 */}
          <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-gray-300/80 md:col-span-2">
            <h3 className="text-base font-bold text-gray-800 mb-4">Active Blocklist Rules</h3>
            {blockRules.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                No active blocklist rules configured.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {blockRules.map((rule) => (
                  <div key={rule.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm font-mono">{rule.ip_address}</span>
                        <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          Blocked
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Reason: <span className="italic font-medium">{rule.reason}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Registered: {rule.created_at}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveRule(rule.id, rule.ip_address)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                    >
                      Delete Rule (Allow)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
