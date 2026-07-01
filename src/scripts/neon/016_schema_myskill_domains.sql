BEGIN;

CREATE TABLE IF NOT EXISTS myskill_domains (
    domain_id SERIAL PRIMARY KEY,
    domain_key VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT '💻',
    color VARCHAR(50) DEFAULT 'cyan',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial domains if table is empty
INSERT INTO myskill_domains (domain_key, title, icon, color, display_order)
VALUES 
    ('frontend', 'Frontend Development', '💻', 'cyan', 1),
    ('backend', 'Backend Development', '⚙️', 'purple', 2),
    ('database', 'Database & Caching', '🗄️', 'emerald', 3),
    ('devops', 'DevOps & Cloud', '☁️', 'amber', 4)
ON CONFLICT (domain_key) DO NOTHING;

COMMIT;
