# scripts folder readme
수정일: 2026-06-09
- 마크다운 파일과 PostgreSQL 데이터베이스 간의 데이터 동기화 및 마이그레이션을 담당하는 독립적인 유틸리티 스크립트들을 관리합니다
- 데이터베이스 스키마 초기화 및 시드 데이터 주입을 위한 SQL 스크립트 파일들도 함께 관리합니다

## Files
### DB 초기화 스크립트 (SQL)
도메인 중심의 유연한 확장을 위해 하드코딩된 확장 테이블을 모두 제거하고 JSONB 및 M:N 매핑 구조로 전면 개편되었습니다.
- `001_schema_posts.sql`: 공통 필수 메타데이터와 동적 프론트매터를 담는 `properties` (JSONB) 컬럼을 가진 단일 `posts` 테이블 생성 DDL
- `002_schema_properties.sql`: 전역 속성(`property_list`)과 필수 여부(`is_essential`)를 독립적으로 관리하는 속성 관리 테이블 생성 DDL
- `003_schema_templates.sql`: 템플릿 카테고리(`template_list`)와 속성 간의 M:N 매핑을 관리하는 테이블(`template_property`) 생성 DDL
- `004_schema_likes.sql`: 좋아요(유익함) 조회를 위한 `posts` 테이블 역정규화 컬럼(`likes_count`) 추가 및 세션 기반 중복/도배 차단을 위한 `likes_manage` 테이블 생성 DDL
- `005_schema_skilltree.sql`: 스킬 트리 고유 속성(도메인, 연도, 부모/자식 참조 등)을 관리하기 위한 1:1 확장 테이블(`skilltree`) 생성 DDL
- `006_schema_views.sql`: 게시물 조회수 집계를 위한 `posts` 테이블 역정규화 컬럼(`views_count`) 추가 및 어뷰징 방지(쿨다운)용 조회 이력 관리 테이블(`views_manage`) 생성 DDL
- `007_schema_visitors.sql`: 사이트 전역의 일간 순 방문자(Unique Visitor) 추적을 위한 `site_visitors` 테이블 및 전체 방문자 통계 캐싱용 `site_stats` 테이블 생성 DDL
- `008_schema_post_title.sql`: JSONB 객체 내부에 저장되던 게시물 제목(`title`)을 독립적인 컬럼으로 분리하고 기존 데이터를 안전하게 마이그레이션하는 DDL 및 DML

### 유틸리티 스크립트 (TS)
- `upload-posts.ts`: `public/upload-posts` 마크다운을 읽어 DB로 업로드하는 스크립트입니다.
  - 마크다운의 Frontmatter에서 핵심 속성인 제목(`title`)을 추출해 별도 컬럼으로 분리 저장하고, 나머지 속성들은 단일 JSONB 객체 형태로 `posts` 테이블의 `properties` 컬럼에 안전하게 통합 저장(Upsert)합니다.
  - 단, 카테고리가 `skilltree`인 경우 공통 정보는 `posts`에, 고유 정보는 `skilltree` 테이블에 분리 저장하여 1:1 확장 테이블 구조를 유지합니다. 일반 카테고리로 변경될 경우 잉여 데이터를 자동 정리(Clean-up)합니다.
  - `--write` 플래그 없이 실행 시 실제 DB 변경 없이 파싱 결과 요약(Dry Run)만 출력합니다.
  - `--limit=N` 플래그를 통해 파싱할 파일 개수를 제한하여 테스트해 볼 수 있습니다.
- `download-posts.ts`: DB에 저장된 게시물 데이터(별도 분리된 `title` 컬럼 및 `properties` JSONB)를 로컬 마크다운 파일(`public/download-posts`)로 다시 복원하는 스크립트입니다.
  - DB의 `slug`를 읽어 자동으로 원본 카테고리 폴더 구조를 생성합니다
  - JSONB로 관리되던 객체를 YAML Frontmatter로 구성 시, 배열 속성과 문자열(특히 `summary` 등의 작은따옴표 및 줄바꿈 이스케이프 처리)을 안전한 포맷으로 변환하여 파싱 에러를 방지합니다.

## 실행 명령어
```bash
# 로컬 마크다운 게시물(public/upload-posts)을 DB로 업로드 (미리보기만 하려면 --write 생략)
npx tsx --env-file=.env src/scripts/upload-posts.ts --write

# DB의 게시물 데이터를 로컬 마크다운 파일(public/download-posts)로 다운로드하기
npx tsx --env-file=.env src/scripts/download-posts.ts
```