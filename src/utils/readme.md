# utils folder readme
수정일: 2026-06-09
게시물 데이터를 가져오고 처리하는 등 프로젝트 전반에서 사용되는 유틸리티 함수들을 관리합니다.

## Files
- `parser.ts`: 마크다운(`.md`) 파일을 읽고 Frontmatter 메타데이터와 콘텐츠를 파싱하는 핵심 유틸리티 함수들을 포함합니다. JSONB 스키마 전면 도입으로 불필요해진 레거시 데이터 파싱 헬퍼 함수들이 제거되었으며, 주로 마크다운 데이터를 DB로 전송하는 스크립트에서 사용됩니다.
- `posts.ts`: 런타임 게시물 데이터 어댑터입니다. PostgreSQL의 `posts` 테이블에서 게시물 본문과 동적 속성이 담긴 `properties` (JSONB) 컬럼, 그리고 분리된 핵심 메타데이터인 `title` 컬럼뿐만 아니라 고유 식별자(`post_id`), 상호작용 데이터(`likes_count`) 등을 포함하여 단일 쿼리로 가져오며, 이를 기반으로 게시물 목록을 정렬 및 필터링하여 반환합니다.

## 현재 게시물 조회 흐름
- 통계 데이터 조회를 위해 `getTotalPostCount()`를 호출하여 전체 게시물 개수를 반환합니다.
- 목록 페이지는 `getAllPosts()` 또는 `getCategoryPosts()`를 호출합니다.
- 상세 페이지는 `getDbPostBySlug()`를 호출한 다음 `posts.content`를 마크다운으로 렌더링합니다.
- 스킬 트리 렌더링은 `getSkillTreePosts(matchCategory2)`를 호출합니다. 1:1 확장 테이블 구조에 따라 `posts`와 `skilltree` 테이블을 JOIN하여 공통 데이터와 메타데이터를 함께 가져옵니다.
- 어댑터는 DB에서 직접 가져온 `title` 컬럼을 최우선으로 매핑하고, `properties` JSONB 안에 담긴 동적 속성들을 자바스크립트 레벨에서 전개하여 기존 UI가 기대하는 `summary`, `tags` 등의 기본 필드 구조와 완벽히 호환되도록 일관성을 유지합니다. 추가적인 필터링 및 통계 처리를 위해 `category1`, `category2` 속성과 전체 `properties` 객체를 `metadata` 속성에 담아 프론트엔드로 온전히 전달합니다.
