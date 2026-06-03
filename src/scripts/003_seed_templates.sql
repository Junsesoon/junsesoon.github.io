-- src/scripts/03_seed_templates.sql
-- src/scripts/003_seed_templates.sql

-- 1. 템플릿 목록(카테고리) 시드 데이터 주입
-- 속성이 없는(empty) 템플릿인 'knowledge'도 여기에 독립적으로 추가할 수 있습니다.
INSERT INTO template_list (template_name)
VALUES 
  ('project'),
  ('knowledge'),
  ('troubleshooting')
ON CONFLICT (template_name) DO NOTHING;

-- 2. 템플릿별 속성(Property) 시드 데이터 주입
-- 'project' 템플릿 속성 추가
INSERT INTO template_property (template_id, property_key, is_required)
SELECT t.template_id, v.property_key, v.is_required
FROM template_list t
CROSS JOIN (
  VALUES 
    ('DB', true),
    ('IDE', true),
    ('Library', false)
) AS v(property_key, is_required)
WHERE t.template_name = 'project'
ON CONFLICT (template_id, property_key) DO NOTHING;

-- 'troubleshooting' 템플릿 속성 추가
INSERT INTO template_property (template_id, property_key, is_required)
SELECT t.template_id, v.property_key, v.is_required
FROM template_list t
CROSS JOIN (
  VALUES 
    ('issue', true),
    ('solution', false)
) AS v(property_key, is_required)
WHERE t.template_name = 'troubleshooting'
ON CONFLICT (template_id, property_key) DO NOTHING;