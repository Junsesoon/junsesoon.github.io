'use server';

import { query as neonQuery } from '../infra/neon';
import { query as tursoQuery } from '../infra/turso';

export interface DBViewLog {
  view_id: number;
  post_id: string;
  post_title: string;
  post_slug: string;
  post_status: string;
  ip_address: string;
  session_id: string;
  viewed_at: string;
  is_blocked: boolean;
}

export interface ViewLogsDashboardData {
  logs: DBViewLog[];
  totalViews: number;
  todayViews: number;
  activeViews30m: number;
}

/**
 * 뷰 로그 대시보드에 필요한 기초 데이터를 데이터베이스에서 일괄 조회합니다.
 */
export async function getViewLogsDashboardData(): Promise<ViewLogsDashboardData> {
  try {
    // 한국 시간(KST) 기준으로 날짜 계산
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const todayString = kstNow.toISOString().split('T')[0];

    // 1. 차단 IP 목록 조회 (Turso SQLite)
    const blockedIps = new Set<string>();
    try {
      const blockResult = await tursoQuery(`SELECT ip_hash FROM blocked_ips`);
      blockResult.rows.forEach((r) => {
        if (r.ip_hash) {
          blockedIps.add(String(r.ip_hash));
        }
      });
    } catch (e) {
      console.error('Failed to fetch blocked IPs from Turso:', e);
    }

    // 2. 최근 뷰 로그 100건 조회 (posts 테이블과 조인하여 제목과 슬러그 가져옴)
    const result = await neonQuery(`
      SELECT 
        v.view_id, 
        v.post_id, 
        COALESCE(p.title, 'Deleted Post') as post_title,
        COALESCE(p.slug, '') as post_slug,
        CASE WHEN p.post_id IS NULL THEN 'deleted' ELSE COALESCE(p.post_status, 'published') END as post_status,
        v.ip_address, 
        v.session_id, 
        v.viewed_at::text as viewed_at
      FROM views_manage v
      LEFT JOIN posts p ON v.post_id = p.post_id
      ORDER BY v.view_id DESC
      LIMIT 100
    `);
    
    const logs: DBViewLog[] = result.rows.map((row: any) => ({
      view_id: Number(row.view_id),
      post_id: String(row.post_id),
      post_title: String(row.post_title),
      post_slug: String(row.post_slug),
      post_status: String(row.post_status),
      ip_address: String(row.ip_address),
      session_id: String(row.session_id),
      viewed_at: String(row.viewed_at),
      is_blocked: blockedIps.has(String(row.ip_address)),
    }));


    // 3. 전체 누적 뷰 수
    let totalViews = 0;
    const totalResult = await neonQuery(`
      SELECT COUNT(*) as count FROM views_manage
    `);
    if (totalResult.rows.length > 0) {
      totalViews = Number(totalResult.rows[0].count);
    }

    // 4. 오늘 뷰 수
    let todayViews = 0;
    const todayResult = await neonQuery(`
      SELECT COUNT(*) as count 
      FROM views_manage 
      WHERE DATE(viewed_at + INTERVAL '9 hours') = $1
    `, [todayString]);
    if (todayResult.rows.length > 0) {
      todayViews = Number(todayResult.rows[0].count);
    }

    // 5. 최근 30분 동안의 뷰 수
    let activeViews30m = 0;
    const activeResult = await neonQuery(`
      SELECT COUNT(*) as count 
      FROM views_manage 
      WHERE viewed_at > NOW() - INTERVAL '30 minutes'
    `);
    if (activeResult.rows.length > 0) {
      activeViews30m = Number(activeResult.rows[0].count);
    }

    return {
      logs,
      totalViews,
      todayViews,
      activeViews30m,
    };
  } catch (error) {
    console.error('Failed to fetch view logs dashboard data:', error);
    return {
      logs: [],
      totalViews: 0,
      todayViews: 0,
      activeViews30m: 0,
    };
  }
}

/**
 * views_manage 테이블에서 특정 뷰 로그를 영구적으로 삭제합니다.
 */
export async function deleteViewLogAction(viewId: number) {
  try {
    await neonQuery('DELETE FROM views_manage WHERE view_id = $1', [viewId]);
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete view log #${viewId}:`, error);
    return { success: false, error: 'Database query failed' };
  }
}

