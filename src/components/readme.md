# components readme
- Reusable UI pieces (Cards, Buttons, Tags)

## Updated Components
- `skilltreegrid.tsx`: Server component that now loads skill tree posts from the DB through `getSkillTreePosts()` instead of reading Markdown files from `public/posts/skilltree`.
- `SkillTreeInteractive.tsx`: Client component that continues to receive serialized `frontmatter`-like metadata and Markdown content from `skilltreegrid.tsx`, so the interaction/UI layer can render as before.

## Data Boundary
- Components should not directly access the filesystem for post content.
- Post and skill tree data should come through `src/utils/posts.ts`, which hides the DB schema and preserves the shape expected by the existing UI components.
