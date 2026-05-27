# types folder readme
Manages TypeScript type definitions and interfaces used throughout the project.

## Files
- `blog.ts`: Contains core interfaces for blog posts and metadata. Key types include:
  - `Post`: Basic post information (slug, title, date, excerpt) used for rendering post lists.
  - `FrontMatter`: Defines the flexible metadata structure reconstructed from the database or parsed from Markdown files (e.g., `parentSkill` arrays).
  - `PostFilterOptions`: Options for filtering post queries by categories.
  - `PostWithFrontmatter`: Extended post type for internal processing that includes category data.

## Guidelines
- **Centralized Domain Types**: Keep shared domain models (like posts, skills, categories) in this directory to ensure consistency between the data layer (`utils/posts.ts`, `infra/`) and the UI layer (`app/`, `components/`).
- **Strict Typing**: Use interfaces and types strictly for data moving between the database adapter and Next.js React components to prevent runtime rendering errors.
- **Single Source of Truth**: If a data structure is used in more than one file, it should be defined here rather than exported from a specific utility or component file.
