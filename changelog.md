## version history
### junseo tech blog 2.0.0
- distribution 2026-05-15
#### Refactoring
- Engine change: Vanilla JS > React + TypeScript + Next.js
#### modified
- style: card-style post list > list-style post list

### junseo tech blog 2.1.0
- distribution 2026-05-20
#### New
- skill tree page implementaion
#### Refactoring
- none
#### Modified
- applying styles to code block & table

### junseo tech blog 2.2.0
- distribution 2026-05-24
#### New
- Local & Remote(Neon) DB connection environments setup
#### Refactoring
- Post parsing logic & data migration scripts (markdown to PostgreSQL)
#### Modified
- Update project phase: Phase 3 -> Phase 4 (Local Data Integration)

### junseo tech blog 2.3.0
- distribution 2026-05-28
#### New
- JWT-based authentication system using `jose` library
- Rate limiting for admin login to prevent brute-force attacks
#### Refactoring
- Refactored Skill Tree grid placement algorithm for stricter parent-child relationships
#### Modified
- Improved responsive design for Table of Contents (TOC) sidebar
- Added distinct Red color theme for Portfolio mode GNB

### junseo tech blog 2.4.0
- distribution 2026-06-01
#### New
- Cloudflare R2 서비스를 활용한 이미지 업로드 기능 추가
- 관리자 페이지 템플릿 매니저 추가
- 관리자 페이지 게시물 목록 정렬 기능 추가
#### Refactoring
- 목차 UX 개선(반응형 목차 및 스크롤 위치 표시 기능 추가)
- 콜드 스타트 방지를 위한 ISR 캐싱 시간 변경
- DB 초기화 로직을 schema/seed SQL로 분리
#### Modified
- 관리자 세션 만료 정책 도입

### junseo tech blog 2.5.0
- distribution 2026-06-04
#### New
- 관리자 페이지 전역 속성(Property) 관리 기능 및 컴포넌트 추가
- 관리자 페이지 게시물 다중 선택 및 Location 속성 일괄 수정(Batch Update) 기능 추가
- 관리자 페이지 게시물 목록 테이블 정렬(Sort) 기능 추가
#### Refactoring
- 데이터베이스 스키마 전면 개편: 게시물 속성 저장을 JSONB (`properties` 컬럼) 방식으로 통합하여 스키마 유연성 확보
- Property, Template 도메인을 완전히 분리하고 M:N 매핑 구조로 개선
- 변경된 JSONB 스키마에 맞춘 게시물 업로드/다운로드 스크립트(`upload-posts.ts`, `download-posts.ts`) 리팩터링 완료
- 관리자 대시보드 게시물 목록을 클라이언트 컴포넌트(`PostListClient.tsx`)로 분리하여 인터랙션(상태 관리) 구조 개선