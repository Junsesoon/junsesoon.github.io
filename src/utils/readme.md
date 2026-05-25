# utils folder readme
Manages utility functions used throughout the project, such as fetching and processing post data.

## 주요 파일 (Files)
- `parser.ts`: Includes utility functions that read Markdown(`.md`) files and parse Frontmatter metadata and content(e.g., using `gray-matter`). This is now mainly used by import/migration scripts that transfer Markdown data into the DB.
- `posts.ts`: Runtime post data adapter. It retrieves posts from PostgreSQL, joins common post rows with detail tables, reconstructs the old frontmatter-like metadata shape, filters/sorts post lists, and returns single post data by slug.

## Current Post Retrieval Flow
- List pages call `getAllPosts()` or `getCategoryPosts()`.
- Detail pages call `getDbPostBySlug()` and then render `posts.content` as Markdown.
- Skill tree rendering calls `getSkillTreePosts(matchCategory2)`.
- The adapter keeps UI-facing fields such as `title`, `summary`, `tags`, `category1`, `category2`, `parent skill`, `tech start`, and `doc-ver` compatible with the previous Markdown frontmatter contract.
