-- src/scripts/neon/015_schema_timeline_items.sql

-- Timeline Items(Category 3 및 Bar Color) 관리 테이블
CREATE TABLE IF NOT EXISTS timeline_item_list (
  timeline_item_id SERIAL PRIMARY KEY,
  item_name VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'project', 'work', 'education'
  bar_color VARCHAR(50) NOT NULL,          -- e.g. 'Amber', 'Blue', 'Green'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 초기 기초 데이터 추가 (certi. 제외)
INSERT INTO timeline_item_list (item_name, bar_color) VALUES
('project', 'Amber'),
('work', 'Blue'),
('education', 'Green')
ON CONFLICT (item_name) DO NOTHING;
