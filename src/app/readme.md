# app folder readme
- Next.js App Router

## File list
- `app/page.tsx`: 블로그의 메인 페이지입니다. `src/utils/posts.ts`의 `getAllPosts()`를 호출하여 최신 게시물 목록을 표시하며, 데이터는 DB에서 가져옵니다
- `app/[category]/page.tsx`: 카테고리별 게시물 목록 페이지입니다. `getCategoryPosts()`를 호출하며, 선택된 모드에 따라 DB에 저장된 게시물을 `category1` 또는 `category2` 기준으로 필터링합니다
- `app/[category]/[id]/page.tsx`: 개별 게시물 상세 페이지입니다. 라우트 슬러그(slug)를 확인하여 일치하는 게시물을 DB에서 불러오고, 마크다운 본문을 HTML로 변환한 뒤 기존과 동일하게 메타데이터를 렌더링합니다
- `app/skilltree/page.tsx`: 스킬 트리 페이지입니다. `SkillTreeGrid`를 통해 DB 기반의 스킬 트리 데이터를 렌더링합니다

## 참고사항
- App 라우트는 렌더링 시점에 더 이상 `public/posts` 폴더의 마크다운 파일을 읽어오지 않습니다
- 화면에 렌더링될 콘텐츠가 데이터베이스 조회 결과에 의존하기 때문에, 게시물 목록 및 상세 페이지에는 `dynamic = 'force-dynamic'`이 설정되어 있습니다
- UI에서 사용하는 데이터 구조는 기존의 프론트매터(frontmatter) 형태를 최대한 유지합니다. 예를 들어 상세 페이지는 여전히 `title`, `summary`, `tags`, `startDate`, `endDate`와 같은 키를 사용하지만, 해당 값들은 DB 데이터를 기반으로 재구성된 것입니다
