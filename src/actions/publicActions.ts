'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { query as neonQuery } from '../infra/neon';
import { query as tursoQuery } from '../infra/turso';

// IP 및 세션 기반 Rate Limit 기록용 (In-memory)
// 10초당 최대 5회까지만 허용
const likeRateLimit = new Map<string, { count: number; expiresAt: number }>();

export async function getLikeStatusAction(postId: string, sessionId: string) {
  try {
    const result = await tursoQuery(
      'SELECT like_id FROM likes_manage WHERE post_id = ? AND session_id = ?',
      [postId, sessionId]
    );
    return { success: true, isLiked: (result.rows?.length ?? 0) > 0 };
  } catch (error) {
    console.error('Failed to get like status:', error);
    return { success: false, isLiked: false };
  }
}

export async function toggleLikeAction(postId: string, sessionId: string) {
  const headerList = await headers();
  const rawIp = headerList.get('x-forwarded-for') || 'unknown';
  const ip = rawIp.split(',')[0].trim();
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
    const check = await tursoQuery(
      'SELECT like_id FROM likes_manage WHERE post_id = ? AND session_id = ?',
      [postId, sessionId]
    );
    
    if (check.rows && check.rows.length > 0) {
      // Unlike: Turso에서 삭제 및 Neon에서 카운트 감소
      await tursoQuery('DELETE FROM likes_manage WHERE post_id = ? AND session_id = ?', [postId, sessionId]);
      const update = await neonQuery('UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE post_id = $1 RETURNING likes_count', [postId]);
      revalidatePath('/', 'layout');
      return { success: true, isLiked: false, likesCount: update.rows[0].likes_count };
    } else {
      // Like: Turso에 추가 및 Neon에서 카운트 증가
      await tursoQuery('INSERT INTO likes_manage (post_id, session_id) VALUES (?, ?)', [postId, sessionId]);
      const update = await neonQuery('UPDATE posts SET likes_count = likes_count + 1 WHERE post_id = $1 RETURNING likes_count', [postId]);
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
  const rawIp = headerList.get('x-forwarded-for') || 'unknown';
  const ip = rawIp.split(',')[0].trim();
  const userAgent = headerList.get('user-agent') || '';

  try {
    // 한국 시간(KST) 기준으로 현재 날짜(YYYY-MM-DD) 구하기
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const visitedDate = kstNow.toISOString().split('T')[0];

    // 오늘 방문 기록 추가 시도 (Turso DB의 visitors_manage 테이블 사용)
    const insertResult = await tursoQuery(
      `INSERT INTO visitors_manage (ip_address, session_id, visited_date, user_agent) 
       VALUES (?, ?, ?, ?) 
       ON CONFLICT (session_id, visited_date) DO NOTHING`,
      [ip, sessionId, visitedDate, userAgent]
    );

    // 새롭게 추가된 데이터라면 (오늘 첫 방문) 전체 방문자 수 증가
    if (insertResult.rowsAffected && insertResult.rowsAffected > 0) {
      await tursoQuery(`UPDATE site_stats SET stat_value = stat_value + 1 WHERE stat_key = 'total_visitors'`);
      return { success: true, isNewVisitor: true };
    }

    return { success: true, isNewVisitor: false };
  } catch (error) {
    console.error('Failed to track site visitor:', error);
    return { success: false, message: '서버 오류가 발생했습니다.' };
  }
}

export async function incrementViewCountAction(postId: string, sessionId: string, viewType: 'detail' | 'overlay' = 'detail', isAdmin: boolean = false) {
  const headerList = await headers();
  const rawIp = headerList.get('x-forwarded-for') || 'unknown';
  const ip = rawIp.split(',')[0].trim();

  // 1. Turso에 기록하고 쿨다운을 별도로 매길 post_id 정의
  const tursoPostId = viewType === 'overlay' ? `${postId}-overlay` : postId;

  try {
    // KST 기준으로 매일 새벽 4시를 쿨다운 기준점(threshold)으로 설정
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

    // 2. 기준점 이후에 동일한 IP에서 해당 게시물을 조회한 기록이 있는지 Turso DB에서 확인
    const check = await tursoQuery(
      `SELECT view_id FROM views_manage 
       WHERE post_id = ? AND ip_address = ? 
         AND viewed_at > ?`,
      [tursoPostId, ip, thresholdUTC]
    );

    // 기록이 있다면 쿨다운 적용 (조회수 증가 안 함)
    if (check.rows && check.rows.length > 0) {
      return { success: true, incremented: false };
    }

    // 3. Neon DB의 posts 테이블에서 역정규화 보관을 위한 글 제목(title)과 슬러그(slug) 조회
    const postQuery = await neonQuery(
      'SELECT title, slug FROM posts WHERE post_id = $1',
      [postId]
    );
    const postTitle = postQuery.rows[0]?.title || 'Unknown Post';
    const postSlug = postQuery.rows[0]?.slug || '';

    // 오버레이 조회 로그를 구분할 수 있도록 제목 정보만 가공 (슬러그는 404 방지를 위해 순수 슬러그 유지)
    const targetTitle = viewType === 'overlay' ? `${postTitle} (Overlay)` : postTitle;

    // 4. 기록이 없다면 Turso DB에 조회 이력 추가
    const targetSessionId = isAdmin ? `admin_${sessionId}` : sessionId;
    await tursoQuery(
      'INSERT INTO views_manage (post_id, post_title, post_slug, ip_address, session_id) VALUES (?, ?, ?, ?, ?)',
      [tursoPostId, targetTitle, postSlug, ip, targetSessionId]
    );

    // 5. 상세 글 진입(detail)인 경우에만 Neon DB의 views_count 1 증가 (관리자 제외)
    if (viewType === 'detail' && !isAdmin) {
      await neonQuery('UPDATE posts SET views_count = views_count + 1 WHERE post_id = $1', [postId]);
    }

    return { success: true, incremented: true };
  } catch (error) {
    console.error('Failed to increment view count:', error);
    return { success: false, message: '서버 오류가 발생했습니다.' };
  }
}