'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { query } from '../infra/neon';

// IP 및 세션 기반 Rate Limit 기록용 (In-memory)
// 10초당 최대 5회까지만 허용
const likeRateLimit = new Map<string, { count: number; expiresAt: number }>();

export async function getLikeStatusAction(postId: string, sessionId: string) {
  try {
    const result = await query(
      'SELECT like_id FROM likes_manage WHERE post_id = $1 AND session_id = $2',
      [postId, sessionId]
    );
    return { success: true, isLiked: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Failed to get like status:', error);
    return { success: false, isLiked: false };
  }
}

export async function toggleLikeAction(postId: string, sessionId: string) {
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for') || 'unknown';
  const rateLimitKey = `${ip}:${sessionId}`;
  const now = Date.now();

  // 메모리 누수 방지 (데이터가 과도하게 쌓이면 주기적으로 초기화)
  if (likeRateLimit.size > 1000) {
    likeRateLimit.clear();
  }

  const record = likeRateLimit.get(rateLimitKey) ?? { count: 0, expiresAt: now + 10000 };

  if (now > record.expiresAt) {
    record.count = 1;
    record.expiresAt = now + 10000;
  } else {
    record.count += 1;
    if (record.count > 5) {
      return { success: false, message: '단시간에 너무 많은 요청이 발생했습니다. 10초 후 다시 시도해 주세요.' };
    }
  }
  likeRateLimit.set(rateLimitKey, record);

  try {
    const check = await query(
      'SELECT like_id FROM likes_manage WHERE post_id = $1 AND session_id = $2',
      [postId, sessionId]
    );
    
    if (check.rowCount && check.rowCount > 0) {
      // Unlike: 데이터 삭제 및 카운트 감소
      await query('DELETE FROM likes_manage WHERE post_id = $1 AND session_id = $2', [postId, sessionId]);
      const update = await query('UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE post_id = $1 RETURNING likes_count', [postId]);
      revalidatePath('/', 'layout');
      return { success: true, isLiked: false, likesCount: update.rows[0].likes_count };
    } else {
      // Like: 데이터 추가 및 카운트 증가
      await query('INSERT INTO likes_manage (post_id, session_id) VALUES ($1, $2)', [postId, sessionId]);
      const update = await query('UPDATE posts SET likes_count = likes_count + 1 WHERE post_id = $1 RETURNING likes_count', [postId]);
      revalidatePath('/', 'layout');
      return { success: true, isLiked: true, likesCount: update.rows[0].likes_count };
    }
  } catch (error) {
    console.error('Failed to toggle like:', error);
    return { success: false, message: '서버 오류가 발생했습니다.' };
  }
}

export async function trackSiteVisitorAction(sessionId: string) {
  if (!sessionId) return { success: false, message: 'Invalid session' };

  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for') || 'unknown';

  try {
    // 한국 시간(KST) 기준으로 현재 날짜(YYYY-MM-DD) 구하기
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const visitedDate = kstNow.toISOString().split('T')[0];

    // 오늘 방문 기록 추가 시도 (session_id + visited_date 중복 시 무시)
    const insertResult = await query(
      `INSERT INTO site_visitors (ip_address, session_id, visited_date) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (session_id, visited_date) DO NOTHING`,
      [ip, sessionId, visitedDate]
    );

    // 새롭게 추가된 데이터라면 (오늘 첫 방문) 전체 방문자 수 증가
    if (insertResult.rowCount && insertResult.rowCount > 0) {
      await query(`UPDATE site_stats SET stat_value = stat_value + 1 WHERE stat_key = 'total_visitors'`);
      return { success: true, isNewVisitor: true };
    }

    return { success: true, isNewVisitor: false };
  } catch (error) {
    console.error('Failed to track site visitor:', error);
    return { success: false, message: '서버 오류가 발생했습니다.' };
  }
}

export async function incrementViewCountAction(postId: string, sessionId: string) {
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for') || 'unknown';

  try {
    // 최근 n시간 이내에 동일한 IP에서 해당 게시물을 조회한 기록이 있는지 확인하는 방법
    // const check = await query(
    //   `SELECT view_id FROM views_manage 
    //    WHERE post_id = $1 AND ip_address = $2 
    //      AND viewed_at > NOW() - INTERVAL '24 hours'`,
    //       [postId, ip]
    // );

    // 한국 시간(KST) 기준으로 매일 새벽 4시를 쿨다운 기준점(threshold)으로 설정
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    
    const resetHour = 4; // 새벽 4시 초기화
    if (kstNow.getUTCHours() < resetHour) {
      kstNow.setUTCDate(kstNow.getUTCDate() - 1);
    }
    kstNow.setUTCHours(resetHour, 0, 0, 0);
    
    // DB 비교를 위해 다시 UTC ISO 문자열로 변환
    const thresholdUTC = new Date(kstNow.getTime() - kstOffset).toISOString();

    // 기준점(마지막 새벽 4시) 이후에 동일한 IP에서 해당 게시물을 조회한 기록이 있는지 확인
    const check = await query(
      `SELECT view_id FROM views_manage 
       WHERE post_id = $1 AND ip_address = $2 
         AND viewed_at > $3`,
      [postId, ip, thresholdUTC]
    );

    // 기록이 있다면 쿨다운 적용 (조회수 증가 안 함)
    if (check.rowCount && check.rowCount > 0) {
      return { success: true, incremented: false };
    }

    // 기록이 없다면 조회 이력 추가 및 게시물 조회수 1 증가
    await query('INSERT INTO views_manage (post_id, ip_address, session_id) VALUES ($1, $2, $3)', [postId, ip, sessionId]);
    await query('UPDATE posts SET views_count = views_count + 1 WHERE post_id = $1', [postId]);

    return { success: true, incremented: true };
  } catch (error) {
    console.error('Failed to increment view count:', error);
    return { success: false, message: '서버 오류가 발생했습니다.' };
  }
}