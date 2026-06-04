# app folder readme
수정일: 2026-06-01
- Next.js App Router

## File list
### (public) 라우트 그룹
- `app/(public)/page.tsx`: 블로그의 메인 페이지입니다. `src/utils/posts.ts`의 `getAllPosts()`를 호출하여 최신 게시물 목록을 표시하며, 데이터는 DB에서 가져옵니다
- `app/(public)/[category]/page.tsx`: 카테고리별 게시물 목록 페이지입니다. `getCategoryPosts()`를 호출하며, 선택된 모드에 따라 DB에 저장된 게시물을 `category1` 또는 `category2` 기준으로 필터링합니다
- `app/(public)/[category]/[...id]/page.tsx`: 개별 게시물 상세 페이지입니다. 라우트 slug를 확인하여 일치하는 게시물을 DB에서 불러오고, 마크다운 본문을 HTML로 변환한 뒤 기존과 동일하게 메타데이터를 렌더링합니다
- `app/(public)/skilltree/page.tsx`: 스킬 트리 페이지입니다. `SkillTreeGrid`를 통해 DB 기반의 스킬 트리 데이터를 렌더링합니다

### (protected) 및 (admin) 라우트 그룹
- `app/(protected)/...`: 로그인 및 인증이 필요한 사용자 전용 페이지들이 위치할 라우트 그룹입니다
- `app/(admin)/...`: 블로그 관리자 전용 페이지(대시보드, 게시물 작성/수정, 전역 속성(Property) 관리, 템플릿 관리 등)가 위치할 라우트 그룹입니다

### api 라우트
- `app/api/upload/route.ts`: Cloudflare R2 스토리지에 마크다운 에디터의 이미지를 업로드하거나 작성 중 취소된 불필요한 이미지를 삭제하는 서버리스 API 엔드포인트입니다. 로컬 파일명 노출과 중복을 방지하기 위해 UUID를 활용하여 안전한 Object Key를 생성합니다.

## 참고사항
- App 라우트는 렌더링 시점에 더 이상 `public/posts` 폴더의 마크다운 파일을 읽어오지 않습니다
- 렌더링 성능 최적화를 위해 `force-dynamic` 대신 ISR(`export const revalidate = 1200`) 및 SSG(`generateStaticParams`) 캐싱 전략을 적용하여 데이터베이스 커넥션 고갈을 방지합니다
- ISR Edge Caching을 활용하여 Vercel 서버리스 환경의 Cold Start로 인한 사용자 응답 지연을 방지합니다
- UI에서 사용하는 데이터 구조는 기존의 frontmatter 형태를 최대한 유지합니다. 예를 들어 상세 페이지는 여전히 `title`, `summary`, `tags`, `startDate`, `endDate`와 같은 키를 사용하지만, 해당 값들은 DB 데이터를 기반으로 재구성된 것입니다
