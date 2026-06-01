# scripts folder readme
수정일: 2026-06-02
- 마크다운 파일과 PostgreSQL 데이터베이스 간의 데이터 동기화 및 마이그레이션을 담당하는 독립적인 유틸리티 스크립트들을 관리합니다
- 데이터베이스 스키마 초기화 및 시드 데이터 주입을 위한 SQL 스크립트 파일들도 함께 관리합니다

## Files
### DB 초기화 스크립트 (SQL)
- 기존의 단일 `seed-001.sql` 파일은 멱등성 보장 및 도메인 중심 관리를 위해 다음 세 개의 파일로 분리되었습니다.
- `001_schema_posts.sql`: 게시물 및 스킬 트리 관련 테이블(`posts`, `skill_tree` 등) 생성 DDL 스크립트
- `002_schema_templates.sql`: 템플릿 관리용 테이블(`templates`) 생성 DDL 스크립트
- `003_seed_templates.sql`: 초기 템플릿 기본 데이터(DB, IDE 등)를 주입하는 DML 시드 스크립트

### 유틸리티 스크립트 (TS)
- `upload-posts.ts`: `public/upload-posts` 폴더의 마크다운 파일들을 읽어 Frontmatter를 파싱한 뒤, DB(`posts`, `skill_tree`, `project` 등 테이블)에 업로드(Upsert)하는 스크립트입니다
  - `category1`, `category2` 값을 기반으로 URL 슬러그(`slug`) 및 폴더 경로를 동적으로 생성합니다
  - 모든 Frontmatter 키를 표준 `camelCase`로 정규화하여 안전하게 저장합니다
  - `--limit=N` 옵션을 통해 일부 파일만 테스트할 수 있으며, `--write` 옵션이 있어야 실제 데이터베이스에 반영됩니다
- `download-posts.ts`: DB에 저장된 게시물 데이터를 다시 로컬 마크다운 파일(`public/download-posts`)로 다운로드(복원)하는 스크립트입니다
  - DB의 `slug`를 읽어 자동으로 원본 카테고리 폴더 구조를 생성합니다
  - YAML Frontmatter 구성 시, 배열(`childSkill` 등)과 문자열(특히 `summary`의 작은따옴표 및 줄바꿈 이스케이프 처리)을 안전한 포맷으로 변환하여 파싱 에러를 방지합니다

## 실행 명령어
```bash
# 로컬 마크다운 게시물(public/upload-posts)을 DB로 업로드 (미리보기만 하려면 --write 생략)
npx tsx --env-file=.env src/scripts/upload-posts.ts --write

# DB의 게시물 데이터를 로컬 마크다운 파일(public/download-posts)로 다운로드하기
npx tsx --env-file=.env src/scripts/download-posts.ts
```