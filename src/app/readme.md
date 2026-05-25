# app folder readme
- Next.js App Router

## Files
- `app/page.tsx`: The main page of the blog. It displays the latest post list by calling `getAllPosts()` from `src/utils/posts.ts`, which retrieves posts from the DB.
- `app/[category]/page.tsx`: Post list page by category. It calls `getCategoryPosts()` and filters DB-backed posts by `category1` or `category2` depending on the selected mode.
- `app/[category]/[id]/page.tsx`: Individual post detail page. It resolves the route slug, loads the matching post from the DB, converts the stored Markdown body to HTML, and renders metadata as before.
- `app/skilltree/page.tsx`: Skill tree page. It renders DB-backed skill tree data through `SkillTreeGrid`.

## Data Rendering Notes
- App routes no longer read Markdown files from `public/posts` at render time.
- The post list/detail pages are marked with `dynamic = 'force-dynamic'` because the rendered content depends on database reads.
- The UI contract remains close to the old frontmatter shape. For example, detail pages still consume keys such as `title`, `summary`, `tags`, `start date`, and `end date`, but those values are reconstructed from DB rows.
