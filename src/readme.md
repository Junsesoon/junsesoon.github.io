# src 폴더 설명
This folder contains the core source code of the blog project being migrated to Next.js

## 폴더 구조
- `app/`: Next.js App Router-related files are located here. They include page routing, layouts, UI components, and more
- `components/`: Manage UI components (e.g., cards, buttons, tags) that are reused throughout the blog
- `constants/`: Manage constants. Single Source of Truth (SSOT) for DOM IDs, GA, and Tokens
- `data/`: Mock/Seed data for testing UI during build time
- `infra/`: Infrastructure layer. Manages connections to external services and resources, such as database configurations (db.ts) and external API clients. It acts as the gateway to the outside world.
- `js/`: It contains client-side logic used in existing static sites (vanilla JS). It includes `parser.js`, `render.js`, `main.js`, etc., and currently, only parts of it can be referenced during the Next.js migration process
- `styles/`: Manages style-related files such as global CSS (`globals.css`) and code block highlighting theme (`atom-one-dark.css`)
- `types/`: Defines TypeScript types used throughout the project (e.g., the `Post` type)
- `utils/`: Manages utility functions used throughout the project. Runtime post retrieval is now DB-backed through `utils/posts.ts`, while Markdown parsing in `utils/parser.ts` is used for import/migration workflows

## Post Data Flow
- Traditional method: Markdown files under `public/posts/...` were parsed at render time and routed directly to pages
- Current method: Markdown frontmatter and content are imported into PostgreSQL first. App routes call `utils/posts.ts`, which reads from the DB, reconstructs the metadata shape expected by the UI, and renders posts dynamically
- DB-backed pages are marked as dynamic so list, detail, and skill tree views fetch current database content instead of relying on deleted local Markdown files
