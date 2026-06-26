'use server';

import { query as tursoQuery } from '../infra/turso';
import { parseUserAgent } from '../utils/userAgent';

export interface VisitorDashboardData {
  visitors: any[];
  totalVisitors: number;
  todayVisitors: number;
  activeVisitors: number;
  blockRules: any[];
  weeklyIncreaseRate: number;
  weeklyTrend: { day: string; count: number }[];
  browserStats: { name: string; percentage: number }[];
}

/**
 * 방문자 관리 대시보드에 필요한 기초 데이터를 데이터베이스에서 일괄 조회합니다.
 */
export async function getVisitorDashboardData(): Promise<VisitorDashboardData> {
  try {
    // 한국 시간(KST) 기준으로 날짜 계산
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const todayString = kstNow.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(kstNow.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0];

    // 1. 최근 고유 방문 이력 100건 조회 (Turso DB의 visitors_manage 테이블 사용)
    const result = await tursoQuery(`
      SELECT 
        visitor_id, 
        ip_address, 
        session_id, 
        visited_date,
        user_agent
      FROM visitors_manage
      ORDER BY visitor_id DESC
      LIMIT 100
    `);
    
    // SQLite query helper가 반환하는 객체 형식을 UI 구조에 맞춰 매핑
    const visitors = result.rows.map((row: any) => {
      let browserInfo = '';
      if (row.user_agent) {
        const parsed = parseUserAgent(String(row.user_agent));
        browserInfo = `${parsed.browser} / ${parsed.device}`;
      }
      return {
        visitor_id: Number(row.visitor_id),
        ip_address: String(row.ip_address),
        session_id: String(row.session_id),
        visited_date: String(row.visited_date),
        browser: browserInfo,
      };
    });

    // 2. 전체 누적 방문객 수 조회 (Turso DB의 site_stats 테이블 사용)
    let totalVisitors = 0;
    const statsResult = await tursoQuery(`
      SELECT stat_value FROM site_stats WHERE stat_key = 'total_visitors'
    `);
    if (statsResult.rows && statsResult.rows.length > 0) {
      totalVisitors = Number(statsResult.rows[0].stat_value);
    }

    // 3. 오늘 방문객 수 조회 (Turso DB의 visitors_manage 테이블 사용)
    let todayVisitors = 0;
    const todayResult = await tursoQuery(`
      SELECT COUNT(DISTINCT session_id) as today_count 
      FROM visitors_manage 
      WHERE visited_date = ?
    `, [todayString]);
    if (todayResult.rows && todayResult.rows.length > 0) {
      todayVisitors = Number(todayResult.rows[0].today_count);
    }

    // 4. 실시간 접속자 수 조회 (최근 30분 이내에 활동이 있는 고유 세션 수, SQLite 문법)
    let activeVisitors = 0;
    const activeResult = await tursoQuery(`
      SELECT COUNT(DISTINCT session_id) as active_count 
      FROM views_manage 
      WHERE viewed_at > datetime('now', '-30 minutes')
    `);
    if (activeResult.rows && activeResult.rows.length > 0) {
      activeVisitors = Number(activeResult.rows[0].active_count);
    }

    // 5. 차단 IP 룰 목록 조회 (Turso SQLite)
    let blockRules: any[] = [];
    try {
      const rulesResult = await tursoQuery(`
        SELECT ip_hash as ip_address, reason, datetime(blocked_at, 'localtime') as created_at 
        FROM blocked_ips 
        ORDER BY blocked_at DESC
      `);
      blockRules = rulesResult.rows.map((r, idx) => ({
        id: `rule-${idx}-${r.ip_address}`,
        ip_address: String(r.ip_address),
        reason: String(r.reason),
        created_at: String(r.created_at || ''),
      }));
    } catch (e) {
      console.error('Failed to fetch block rules from Turso DB:', e);
    }

    // 6. 지난 7일간 방문자 수 계산 및 주간 증가율 계산 (7일전 누적 vs 현재 누적 비교)
    let weeklyIncreaseRate = 0;
    try {
      const last7DaysResult = await tursoQuery(`
        SELECT COUNT(*) as count 
        FROM visitors_manage 
        WHERE visited_date > ?
      `, [sevenDaysAgoString]);
      const last7DaysCount = last7DaysResult.rows && last7DaysResult.rows.length > 0 ? Number(last7DaysResult.rows[0].count) : 0;
      const total7DaysAgo = totalVisitors - last7DaysCount;

      if (total7DaysAgo > 0) {
        weeklyIncreaseRate = (last7DaysCount / total7DaysAgo) * 100;
      } else if (last7DaysCount > 0) {
        weeklyIncreaseRate = 100.0;
      }
    } catch (e) {
      console.error('Failed to calculate weekly increase rate:', e);
    }

    // 7. 최근 7일간의 일별 고유 방문자 수 추이 조회 (Turso DB)
    const trendDays: { dateStr: string; label: string }[] = [];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(kstNow.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const label = dayLabels[d.getUTCDay()]; // KST 보정 시간의 UTC 요일 사용
      trendDays.push({ dateStr, label });
    }

    const startDateString = trendDays[0].dateStr;
    const trendResult = await tursoQuery(`
      SELECT visited_date, COUNT(DISTINCT session_id) as count
      FROM visitors_manage
      WHERE visited_date >= ?
      GROUP BY visited_date
    `, [startDateString]);

    const countMap = new Map<string, number>();
    trendResult.rows.forEach((row: any) => {
      countMap.set(String(row.visited_date), Number(row.count));
    });

    const weeklyTrend = trendDays.map(day => ({
      day: day.label,
      count: countMap.get(day.dateStr) || 0,
    }));

    // 8. 브라우저 분포 통계 계산 (최근 1000건 샘플링)
    const uaResult = await tursoQuery(`
      SELECT user_agent FROM visitors_manage
      WHERE user_agent IS NOT NULL AND user_agent != ''
      ORDER BY visitor_id DESC
      LIMIT 1000
    `);

    const browserCounts: Record<string, number> = {
      'Google Chrome': 0,
      'Apple Safari': 0,
      'Mozilla Firefox': 0,
      'Microsoft Edge': 0,
      'Opera / Other': 0
    };

    let totalWithUA = 0;
    uaResult.rows.forEach((row: any) => {
      const parsed = parseUserAgent(String(row.user_agent));
      const b = parsed.browser;
      let mappedName = 'Opera / Other';
      if (b === 'Chrome') mappedName = 'Google Chrome';
      else if (b === 'Safari') mappedName = 'Apple Safari';
      else if (b === 'Firefox') mappedName = 'Mozilla Firefox';
      else if (b === 'Edge') mappedName = 'Microsoft Edge';
      
      browserCounts[mappedName]++;
      totalWithUA++;
    });

    const browserStats = totalWithUA > 0 ? Object.keys(browserCounts).map(name => {
      const count = browserCounts[name];
      const percentage = Math.round((count / totalWithUA) * 100);
      return { name, percentage };
    }) : [
      { name: 'Google Chrome', percentage: 45 },
      { name: 'Apple Safari', percentage: 30 },
      { name: 'Mozilla Firefox', percentage: 10 },
      { name: 'Microsoft Edge', percentage: 10 },
      { name: 'Opera / Other', percentage: 5 }
    ];

    return {
      visitors,
      totalVisitors,
      todayVisitors,
      activeVisitors,
      blockRules,
      weeklyIncreaseRate,
      weeklyTrend,
      browserStats,
    };
  } catch (error) {
    console.error('Failed to fetch visitor dashboard data:', error);
    return {
      visitors: [],
      totalVisitors: 0,
      todayVisitors: 0,
      activeVisitors: 0,
      blockRules: [],
      weeklyIncreaseRate: 0,
      weeklyTrend: [],
      browserStats: [
        { name: 'Google Chrome', percentage: 45 },
        { name: 'Apple Safari', percentage: 30 },
        { name: 'Mozilla Firefox', percentage: 10 },
        { name: 'Microsoft Edge', percentage: 10 },
        { name: 'Opera / Other', percentage: 5 }
      ],
    };
  }
}

/**
 * Turso DB에 새로운 IP 차단 규칙을 등록합니다.
 */
export async function addBlockRule(ip: string, reason: string) {
  try {
    await tursoQuery(
      `INSERT INTO blocked_ips (ip_hash, reason) 
       VALUES (?, ?) 
       ON CONFLICT(ip_hash) DO UPDATE SET reason = ?`,
      [ip, reason, reason]
    );
    return { success: true };
  } catch (error) {
    console.error('Failed to add block rule to Turso DB:', error);
    return { success: false, error: 'Database transaction failed' };
  }
}

/**
 * Turso DB에서 특정 IP 차단 규칙을 해제(삭제)합니다.
 */
export async function removeBlockRule(ip: string) {
  try {
    await tursoQuery('DELETE FROM blocked_ips WHERE ip_hash = ?', [ip]);
    return { success: true };
  } catch (error) {
    console.error('Failed to remove block rule from Turso DB:', error);
    return { success: false, error: 'Database transaction failed' };
  }
}
