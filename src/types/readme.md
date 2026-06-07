# types folder readme
수정일: 2026-05-27
프로젝트 전반에서 사용되는 TypeScript 타입 정의 및 인터페이스를 관리합니다

## 파일 목록
- `blog.ts`: 블로그 게시물과 메타데이터를 위한 핵심 인터페이스를 포함합니다. 주요 타입은 다음과 같습니다
  - `Post`: 게시물 목록을 렌더링하는 데 사용되는 기본 게시물 정보(`post_id`, `likes_count`, `slug`, `title`, `date`, `excerpt`)와, 필터링 및 통계 산출을 위한 카테고리(`category1`, `category2`) 및 확장 속성(`metadata`)을 포함합니다
  - `FrontMatter`: 데이터베이스에서 재구성되거나 마크다운 파일에서 파싱된 유연한 메타데이터 구조를 정의합니다(예: `parentSkill` 배열)
  - `PostFilterOptions`: 카테고리별 게시물 조회를 필터링하기 위한 옵션입니다
  - `PostWithFrontmatter`: 내부 처리를 위해 카테고리 데이터를 포함하는 확장된 게시물 타입입니다
  - `DbPost`: 게시물 상세 페이지 및 스킬트리 렌더링에 사용되는 데이터베이스 조회용 타입으로, 마크다운 본문(`content`)과 `FrontMatter` 메타데이터, 그리고 상호작용 속성(`likes_count`) 등을 포함합니다

## 가이드라인
- **도메인 타입 중앙화 (Centralized Domain Types)**: 데이터 계층(`utils/posts.ts`, `infra/`)과 UI 계층(`app/`, `components/`) 간의 일관성을 보장하기 위해 공유 도메인 모델(게시물, 스킬, 카테고리 등)은 이 디렉터리에 유지하세요
- **엄격한 타입 지정 (Strict Typing)**: 런타임 렌더링 오류를 방지하기 위해 데이터베이스 어댑터와 Next.js React 컴포넌트 간에 이동하는 데이터에는 인터페이스와 타입을 엄격하게 사용하세요
- **단일 진실 공급원 (Single Source of Truth, SSOT)**: 데이터 구조가 두 개 이상의 파일에서 사용되는 경우, 특정 유틸리티나 컴포넌트 파일에서 내보내기(export)보다는 이곳에 정의해야 합니다
