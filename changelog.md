## version history

### junseo tech blog 1.0.0
- distribution 2026-05-02

### junseo tech blog 1.1.0
- distribution 2026-05-07

### junseo tech blog 1.1.1
- distribution 2026-05-07

### junseo tech blog 1.2.0
- distribution 2026-05-10

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

### junseo tech blog 2.6.0
- distribution 2026-06-08
#### New
- 게시물 '좋아요(유익함)' 상호작용 기능 추가 (Optimistic UI 및 애니메이션 적용)
- 블로그 메인 및 관리자 대시보드에 주요 통계(조회수, 방문자 등) 표시 기능 추가
- views, visitors, likes 카운트 및 어뷰징 차단(쿨다운)을 위한 DB table 추가
#### Refactoring
- skill tree post의 고유 메타데이터를 관리하는 DB 확장 테이블(skilltree) 분리
#### Modified
- root/readme.md 에서 버전 히스토리 및 백로그 분리
- skill tree overlay 방식을 사이드 패널에서 중앙 팝업 모달로 변경 및 관리자 전용 '수정' 버튼 연동
- 게시물 편집기에서 속성 추가시 타입 선택 기능 지원

### junseo tech blog 2.7.0
- distribution 2026-06-10
#### New
- 스킬 트리 카드에 마우스 호버시 연결된 선이 강조되는 상호작용 기능 추가
#### Refactoring
- portfolio page를 구현하는 folder를 (public)에서 (protected)로 분리
- actions.ts에 있던 skilltree 관련 서버 액션 코드를 skillTreeActions.ts로 분리
- 게시물 제목을 별도 DB 컬럼으로 분리하여 저장
#### Modified
- 관리자 페이지 UI 수정(manage button들을 blog stats 하단에 3x2 grid로 재배치)