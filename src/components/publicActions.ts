'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { query } from '../infra/db';

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