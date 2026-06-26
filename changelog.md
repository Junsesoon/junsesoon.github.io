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
- distribution 2026-06-21
#### New
- 스킬 트리 상세 정보 UI를 중앙 팝업 모달에서 우측 사이드 드로어(Side Drawer) 슬라이드 애니메이션으로 전면 개편
- 스킬 트리 그리드 렌더링 시 데이터 개수에 비례하여 동적으로 행(Row)을 조절하는 기능 추가
- DB `skilltree_domains` 테이블 기반 스킬 트리 페이지의 도메인(카테고리) 목록 동적 렌더링 적용
- 게시물 작성 및 수정 시 원본 데이터를 보호하는 안전한 '임시저장(Draft)' 기능 추가
- 관리자 대시보드 게시물 목록에 Draft(미발행) 및 Editing(수정 중) 상태를 시각적으로 구분하는 동적 뱃지 UI 추가
- 관리자 대시보드 게시물 목록에서 Status(상태) 헤더 클릭 시 상태별 정렬(Sort) 기능 추가
- Next.js Metadata API를 활용한 동적 사이트맵(`sitemap.ts`) 생성 및 GNB 카테고리 자동 매핑 기능 추가
- 검색 엔진 최적화(SEO)를 위한 `robots.txt` 추가 (렌더링 필수 경로 차단 해제 및 보호/포트폴리오 경로 크롤링 방지)
- 에디터 작성 중 변경 사항이 있을 시 경고를 띄워주는 isDirty 감지 로직 추가 누락 • 템플릿 매니저 내 고정값( Fixed Value ) UI 지원 및 마크다운 동기화 버그 픽스 누락
#### Refactoring
- 템플릿 관리자(`TemplateManager`) 및 스킬 트리 관리자(`SkillTreeManager`)의 모바일/소형 화면 반응형 최적화 (가로 스크롤 방지 등)
- 게시물 생성, 수정, 임시저장 비즈니스 로직을 `actions.ts`에서 `postActions.ts`로 분리하여 역할 분리 및 코드 응집도 향상
#### Modified
- BFCache 환경에서 뒤로가기 시 스킬 트리 드래그 팬 스크롤 상태가 고착화되는 버그 수정 및 안정성 강화
- 관리자 대시보드 게시물 목록 테이블의 Action 버튼을 직관적인 SVG 아이콘으로 교체하고 삭제 확인(Confirm) 프롬프트 추가
- 관리자 대시보드 테이블의 열(Column) 너비를 최적화하여 좁은 화면에서도 제목(Title) 영역의 가독성 향상
- 관리자 대시보드 상단 통계 카드에 실제 임시저장(Drafts) 중인 게시물 개수가 동기화되도록 수정


### junseo tech blog 3.0.0
distribution 2026-06-24
#### New
- Major number version up❗Turso DB 연결로 인한 과거 버전과 DB 호환 어려움
- 게시물 데이터베이스(Neon)와 방문자 로그/통계 데이터베이스(Turso)의 아키텍처 이기종 분리 및 연동 완료
- 관리자 메인 대시보드 통계 카드에서 이기종 분리된 데이터를 실시간 병렬 집계하도록 쿼리 개편
- 관리자 페이지 세션 만료 시간을 실시간으로 알려주는 시각적 타이머 기능 추가
- 악성/어뷰징 IP 해시를 탐지하고 즉각 차단/해제할 수 있는 실데이터 IP 차단 기능 탑재
- 스킬 트리 관리자 페이지 내 스킬 카드 목록에 페이지네이션(Pagination) 및 정렬 옵션 추가
- 속성(property_list)에 필수 여부(is_required) 컬럼을 도입하고 시스템 핵심 필수 속성의 임의 수정/삭제 방지
잠금(Locked) 기능 적용
#### Refactoring
- 초기 TTFB 응답 지연 해결, DB 쿼리 효율화, 컴파일 캐싱 및 CSS 렌더링 전반의 성능 최적화
- Neon DB에서 기존 로그 테이블을 정리하고 Turso DB로 안전하게 데이터를 이전하는 마이그레이션 스크립트(`migrate-logs.ts`) 개발
#### Modified
- 관리자 대시보드를 반응형 사이드바가 포함된 현대적인 Apple-style 레이아웃으로 대개편
- 속성 및 템플릿 관리 등 모든 관리자 서브 페이지의 디자인 톤앤매너를 메인 대시보드 스타일로 일관되게 통합
- 한글 슬러그(Slug) 게시물의 라우트 파라미터 디코딩 및 사이트맵(Sitemap) 경로 인코딩 처리 수정
- 모바일 환경에서의 테이블 가로 스크롤 방지, 속성명 말줄임표 처리 등 대시보드 디테일 레이아웃 최적화
- 템플릿 마크다운 파일과의 업로드 동기화 시 비동기 순서로 인한 덮어쓰기 오류 수정


### junseo tech blog 3.1.0
distribution 2026-06-26
#### New
- **포트폴리오 2.0 (PF2) 페이지 개편 및 동적 기능 구현**
  - 포트폴리오 2.0용 소개(About), 프로젝트(Projects), 기술(Skills) 구조 개발
  - About 페이지 내 프로젝트 타임라인 컴포넌트 추가 및 DB 실시간 동적 연동
  - 타임라인 클릭 시 상세 정보 고정(Pin-Lock) 및 세부 호버 인터랙션 구현
  - Projects 및 Skills 페이지 모듈별 전환 애니메이션 및 연동 고도화
  - 관리자 전용 타임라인(About) 항목 실시간 추가, 수정, 삭제 관리 기능 구현
- **디자인 리뉴얼 및 애니메이션 고도화**
  - 스킬 트리 페이지를 3D 우주 공간 감성의 다크 스페이스 글래스모피즘(Dark Space Glassmorphism) 테마로 전면 리뉴얼
  - View Transitions API 기반의 매끄럽고 모던한 페이지 전환 효과 적용
- **속성 및 조회수 트래킹 세분화**
  - 게시물 업로드 스크립트 실행 시, 사용자 정의 발행일/수정일 속성을 보존하고 동기화하는 로직 복구
  - 스킬 트리 상세 오버레이 클릭 시 일반 조회와 분리된 개별 조회수 집계 기능 추가
#### Refactoring
- **프로젝트 아키텍처 및 디렉토리 구조 최적화**
  - 프론트엔드 컴포넌트를 역할군에 따라 모듈화하여 분리 재배치
  - 서버 및 클라이언트 액션 함수들을 독립 폴더(`src/actions`)로 이관하여 코드 응집도 향상
#### Modified
- **관리자 방문자 분석 페이지 실데이터 연동**
  - 방문 로그 목록 및 브라우저 분포 카드에 실제 수집된 User-Agent 데이터 파싱 결과(브라우저/OS) 바인딩
  - 15% 임의 확률 차단 목업 대신, DB 차단 규칙(`blocked_ips`)을 조회하여 방문자 상태와 정확히 매핑하도록 개선
  - 하드코딩된 위치 정보 통계를 방문 기록을 기반으로 동적 1위 국가(Top Geo-Location) 및 비율을 실시간 산출하도록 변경
  - Turso SQL 초기화 스크립트(`turso-init.ts`) 실행 시 컬럼 중복 추가 에러를 무시하도록 예외 처리하여 멱등성 보완
- **UX 개선 및 기타 수정**
  - 스킬 트리 오버레이 모달 반응형 레이아웃 대응 및 글래스모피즘 디자인 목차(TOC) 사이드바 추가
  - 관리자 대시보드 내 'Back to Home' 버튼을 뒤로가기 브라우저 흐름을 보존하는 `sessionStorage` 기반 'Back' 기능으로 대체
  - About 페이지 타임라인 목록 렌더링 시 발생하는 미세한 지터링(Jittering) 스크롤 현상 보완