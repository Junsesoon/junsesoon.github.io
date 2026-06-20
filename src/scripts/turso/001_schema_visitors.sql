-- 1. 차단된 IP 해시 테이블
CREATE TABLE IF NOT EXISTS blocked_ips (
    ip_hash TEXT PRIMARY KEY,
    reason TEXT NOT NULL,
    blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires ON blocked_ips(expires_at);

-- 2. IP별 접속 기록 테이블 (3일 데이터 보관용)
CREATE TABLE IF NOT EXISTS ip_request_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_hash TEXT NOT NULL,
    path TEXT NOT NULL,
    accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_logs_ip_time ON ip_request_logs(ip_hash, accessed_at);
CREATE INDEX IF NOT EXISTS idx_logs_accessed_at ON ip_request_logs(accessed_at);

-- 3. 일별 트래픽 요약 스냅샷 (영구 누적용)
CREATE TABLE IF NOT EXISTS daily_traffic_snapshots (
    snapshot_date DATE PRIMARY KEY,
    total_page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    blocked_requests_count INTEGER DEFAULT 0
);

-- 4. 일별 경로별 조회수 스냅샷 (영구 누적용)
CREATE TABLE IF NOT EXISTS daily_path_snapshots (
    snapshot_date DATE NOT NULL,
    path TEXT NOT NULL,
    view_count INTEGER DEFAULT 0,
    PRIMARY KEY (snapshot_date, path)
);
