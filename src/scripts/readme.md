# scripts folder readme
수정일: 2026-06-02
- 마크다운 파일과 PostgreSQL 데이터베이스 간의 데이터 동기화 및 마이그레이션을 담당하는 독립적인 유틸리티 스크립트들을 관리합니다
- 데이터베이스 스키마 초기화 및 시드 데이터 주입을 위한 SQL 스크립트 파일들도 함께 관리합니다

## Files
### DB 초기화 스크립트 (SQL)
도메인 중심의 유연한 확장을 위해 하드코딩된 확장 테이블을 모두 제거하고 JSONB 및 M:N 매핑 구조로 전면 개편되었습니다.
- `001_schema_posts.sql`: 공통 필수 메타데이터와 동적 프론트매터를 담는 `properties` (JSONB) 컬럼을 가진 단일 `posts` 테이블 생성 DDL
- `002_schema_properties.sql`: 전역 속성(`property_list`)과 필수 여부(`is_essential`)를 독립적으로 관리하는 속성 관리 테이블 생성 DDL
- `003_schema_templates.sql`: 템플릿 카테고리(`template_list`)와 속성 간의 M:N 매핑을 관리하는 테이블(`template_property`) 생성 DDL

### 유틸리티 스크립트 (TS)
⚠️ **참고: 현재 아래 스크립트들은 새로운 JSONB `properties` 스키마 아키텍처에 맞추어 전면 리팩터링 작업 대기 중입니다.**
- `upload-posts.ts`: `public/upload-posts` 마크다운을 DB로 업로드하는 로직 (기존 하드코딩 확장 테이블 방식에서 JSONB 단일 저장 방식으로 변경 필요)
- `download-posts.ts`: DB에 저장된 게시물을 로컬 마크다운 파일로 복원하는 스크립트 (JSONB 파싱 방식으로 전환 필요)
  - DB의 `slug`를 읽어 자동으로 원본 카테고리 폴더 구조를 생성합니다
  - YAML Frontmatter 구성 시, 배열(`childSkill` 등)과 문자열(특히 `summary`의 작은따옴표 및 줄바꿈 이스케이프 처리)을 안전한 포맷으로 변환하여 파싱 에러를 방지합니다

## 실행 명령어
```bash
# 로컬 마크다운 게시물(public/upload-posts)을 DB로 업로드 (미리보기만 하려면 --write 생략)
npx tsx --env-file=.env src/scripts/upload-posts.ts --write

# DB의 게시물 데이터를 로컬 마크다운 파일(public/download-posts)로 다운로드하기
npx tsx --env-file=.env src/scripts/download-posts.ts
```