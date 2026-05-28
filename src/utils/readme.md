# utils folder readme
수정일: 2026-05-27
게시물 데이터를 가져오고 처리하는 등 프로젝트 전반에서 사용되는 유틸리티 함수들을 관리합니다.

## Files
- `parser.ts`: 마크다운(`.md`) 파일을 읽고 Frontmatter 메타데이터와 콘텐츠를 파싱하는(예: `gray-matter` 사용) 유틸리티 함수들을 포함합니다. 현재는 주로 마크다운 데이터를 DB로 전송하는 업로드/마이그레이션 스크립트에서 사용됩니다.
- `posts.ts`: 런타임 게시물 데이터 어댑터입니다. PostgreSQL에서 게시물을 가져와 공통 게시물 행과 상세 테이블을 조인(join)하고, 기존의 프론트매터(frontmatter) 형태의 메타데이터 구조를 재구성하며, 게시물 목록을 필터링/정렬하고, slug를 통해 단일 게시물 데이터를 반환합니다.

## 현재 게시물 조회 흐름
- 목록 페이지는 `getAllPosts()` 또는 `getCategoryPosts()`를 호출합니다.
- 상세 페이지는 `getDbPostBySlug()`를 호출한 다음 `posts.content`를 마크다운으로 렌더링합니다.
- 스킬 트리 렌더링은 `getSkillTreePosts(matchCategory2)`를 호출합니다.
- 어댑터는 `title`, `summary`, `tags`, `category1`, `category2`, `parentSkill`, `techStart`, `docVer` 등 UI에서 사용하는 필드들을 이전 마크다운 프론트매터 규칙과 일관되게 유지합니다.
