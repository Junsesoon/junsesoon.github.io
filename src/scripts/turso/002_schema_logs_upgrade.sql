-- src/scripts/turso/002_schema_logs_upgrade.sql

-- 1. 좋아요 이력 관리 테이블 (중복 방지)
CREATE TABLE IF NOT EXISTS likes_manage (
    like_id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, session_id)
);
CREATE INDEX IF NOT EXISTS idx_likes_post_session ON likes_manage(post_id, session_id);

-- 2. 조회수 이력 관리 테이블 (역정규화 컬럼 포함하여 대시보드 JOIN 회피)
CREATE TABLE IF NOT EXISTS views_manage (
    view_id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL,
    post_title TEXT NOT NULL,      -- 대시보드 렌더링 시 이기종 DB JOIN을 피하기 위해 제목 역정규화
    post_slug TEXT NOT NULL,       -- 대시보드 이동 링크용 슬러그 역정규화
    ip_address TEXT NOT NULL,
    session_id TEXT NOT NULL,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_views_cooldown ON views_manage (post_id, ip_address, viewed_at);
CREATE INDEX IF NOT EXISTS idx_views_viewed_at ON views_manage (viewed_at);

-- 3. 일별 유니크 방문자 이력 테이블
CREATE TABLE IF NOT EXISTS visitors_manage (
    visitor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    session_id TEXT NOT NULL,
    visited_date DATE NOT NULL DEFAULT (DATE('now', '+9 hours')), -- KST 기준 날짜 자동 갱신
    UNIQUE(session_id, visited_date)
);
CREATE INDEX IF NOT EXISTS idx_visitors_date ON visitors_manage (visited_date);

-- 4. 전체 통계 캐싱 테이블 (Neon에서 마이그레이션)
CREATE TABLE IF NOT EXISTS site_stats (
    stat_key TEXT PRIMARY KEY,
    stat_value INTEGER DEFAULT 0
);

-- 총 방문자 수 초기 데이터 설정
INSERT INTO site_stats (stat_key, stat_value) 
VALUES ('total_visitors', 0) 
ON CONFLICT (stat_key) DO NOTHING;
