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

### junseo tech blog 2.8.0
- distribution 2026-06-13
#### New
- 기존 속성의 이름을 다른 존재하는 속성 이름으로 변경 시, 사용자 확인을 거쳐 두 속성을 안전하게 병합(Merge)하는 기능 추가
- 속성 타입(Type) 변경 및 병합 시, 기존 게시물의 JSONB 데이터를 DB단에서 안전하게 일괄 형변환하는 트랜잭션 및 충돌 역추적 로직 추가
- 게시물 작성 에디터(`PostEditor.tsx`)에서 속성 타입(`number`, `boolean`, `date` 등)에 맞게 폼 필드가 동적으로 렌더링되고 제출 시 캐스팅되도록 개선
- 스킬 트리 관리자 페이지에서 도메인뿐만 아니라 스킬 카드를 직접 추가 및 수정할 수 있도록 개선
- 속성 관리 최적화 도구 추가 (Check, Refresh를 통해 문제 속성 자동 탐지 및 일괄 수정/제거 지원)
- 시스템 핵심 속성(Core Property)의 임의 수정을 방지하는 잠금(Locked) 표시 및 하드코딩 보호 장치 추가
#### Refactoring
- `actions.ts`에 존재하던 속성 관리 서버 액션들을 `propertyActions.ts`로 분리하여 코드 응집도 향상
#### Modified
- `PropertyManager` 및 `TemplateManager`에서 타입 뱃지를 클릭해 즉시 타입을 수정할 수 있도록 인라인 드롭다운 UX 개선
- 에디터 및 관리자 페이지에서 새로운 속성 추가 시 타입 선택 드롭다운이 항상 노출되며, 기존 전역 속성의 타입은 자동 매핑 및 고정(`disabled`)되도록 변경
- 배열 타입 속성 입력 시 콤마(,) 구분 방식을 직관적인 태그(Tag) 인라인 UI 기반으로 변경하여 사용성 강화
- 브라우저 기본 Alert 창을 커스텀 모달 UI로 전면 교체
- 게시물 에디터(`PostEditor.tsx`) UI를 옵시디언(Obsidian) 스타일로 전면 개편
- 속성 데이터 타입별로 고유한 텍스트 색상을 부여하여 시각적 구분감 강화

### junseo tech blog 2.9.0
- distribution 2026-06-? (예정)
#### New
- 스킬 트리 상세 정보 UI를 중앙 팝업 모달에서 우측 사이드 드로어(Side Drawer) 슬라이드 애니메이션으로 전면 개편
- 스킬 트리 그리드 렌더링 시 데이터 개수에 비례하여 동적으로 행(Row)을 조절하는 기능 추가
- DB `skilltree_domains` 테이블 기반 스킬 트리 페이지의 도메인(카테고리) 목록 동적 렌더링 적용
#### Refactoring
- 템플릿 관리자(`TemplateManager`) 및 스킬 트리 관리자(`SkillTreeManager`)의 모바일/소형 화면 반응형 최적화 (가로 스크롤 방지 등)
#### Modified
- 관리자 페이지 직관적인 입력 폼 도입 및 테이블 액션 버튼을 SVG 아이콘으로 교체하여 화면 공간 효율성 증대
- BFCache 환경에서 뒤로가기 시 스킬 트리 드래그 팬 스크롤 상태가 고착화되는 버그 수정 및 안정성 강화
