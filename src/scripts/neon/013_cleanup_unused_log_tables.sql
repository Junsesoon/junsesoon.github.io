-- src/scripts/neon/013_cleanup_unused_log_tables.sql

-- Neon DB에서 불필요해진 구형 이력 관리 테이블들을 제거하여 용량을 확보합니다.
-- 경고: 이 작업은 Turso DB로 로그 데이터 이관(마이그레이션)이 완벽히 완료된 후 실행해야 합니다.

DROP TABLE IF EXISTS likes_manage;
DROP TABLE IF EXISTS views_manage;
DROP TABLE IF EXISTS site_visitors;
DROP TABLE IF EXISTS site_stats;
