'use server';

import { query as neonQuery } from '../infra/neon';
import { query as tursoQuery } from '../infra/turso';

export interface VisitorDashboardData {
  visitors: any[];
  totalVisitors: number;
  todayVisitors: number;
  activeVisitors: number;
  blockRules: any[];
  weeklyIncreaseRate: number;
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

    // 1. 최근 고유 방문 이력 100건 조회
    const result = await neonQuery(`
      SELECT 
        visitor_id, 
        ip_address, 
        session_id, 
        visited_date::text as visited_date
      FROM site_visitors
      ORDER BY visitor_id DESC
      LIMIT 100
    `);
    const visitors = result.rows;

    // 2. 전체 누적 방문객 수 조회
    let totalVisitors = 0;
    const statsResult = await neonQuery(`
      SELECT stat_value FROM site_stats WHERE stat_key = 'total_visitors'
    `);
    if (statsResult.rows.length > 0) {
      totalVisitors = Number(statsResult.rows[0].stat_value);
    }

    // 3. 오늘 방문객 수 조회
    let todayVisitors = 0;
    const todayResult = await neonQuery(`
      SELECT COUNT(DISTINCT session_id) as today_count 
      FROM site_visitors 
      WHERE visited_date = $1
    `, [todayString]);
    if (todayResult.rows.length > 0) {
      todayVisitors = Number(todayResult.rows[0].today_count);
    }

    // 4. 실시간 접속자 수 조회 (최근 30분 이내에 활동이 있는 고유 세션 수)
    let activeVisitors = 0;
    const activeResult = await neonQuery(`
      SELECT COUNT(DISTINCT session_id) as active_count 
      FROM views_manage 
      WHERE viewed_at > NOW() - INTERVAL '30 minutes'
    `);
    if (activeResult.rows.length > 0) {
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
      const last7DaysResult = await neonQuery(`
        SELECT COUNT(*) as count 
        FROM site_visitors 
        WHERE visited_date > $1
      `, [sevenDaysAgoString]);
      const last7DaysCount = last7DaysResult.rows.length > 0 ? Number(last7DaysResult.rows[0].count) : 0;
      const total7DaysAgo = totalVisitors - last7DaysCount;

      if (total7DaysAgo > 0) {
        weeklyIncreaseRate = (last7DaysCount / total7DaysAgo) * 100;
      } else if (last7DaysCount > 0) {
        weeklyIncreaseRate = 100.0;
      }
    } catch (e) {
      console.error('Failed to calculate weekly increase rate:', e);
    }

    return {
      visitors,
      totalVisitors,
      todayVisitors,
      activeVisitors,
      blockRules,
      weeklyIncreaseRate,
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
