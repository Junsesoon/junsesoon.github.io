# components folder readme
수정일: 2026-05-28
- 재사용 가능한 UI 컴포넌트 (Cards, Buttons, Tags)

## Updated Components
- `actions.ts`: 폼 제출 시 컴포넌트에서 호출하는 Next.js Server Actions(데이터베이스 저장 로직 등)를 모아둔 파일입니다.
- `skilltreegrid.tsx`: 이제 `public/posts/skilltree`에서 마크다운 파일을 읽는 대신, `getSkillTreePosts()`를 통해 DB에서 스킬 트리 게시물을 불러오는 서버 컴포넌트입니다
- `SkillTreeInteractive.tsx`: `skilltreegrid.tsx`로부터 직렬화된 프론트매터(frontmatter) 형태의 메타데이터와 마크다운 콘텐츠를 전달받아 기존과 동일하게 상호작용 및 UI 계층을 렌더링하는 클라이언트 컴포넌트입니다

## Data Boundary
- 컴포넌트는 게시물 콘텐츠 조회를 위해 파일 시스템에 직접 접근해서는 안 됩니다
- 게시물 및 스킬 트리 데이터는 `src/utils/posts.ts`를 통해서만 가져와야 합니다. 이 유틸리티는 DB 스키마를 캡슐화(숨김)하여 기존 UI 컴포넌트가 기대하는 데이터 구조를 그대로 유지해 줍니다
