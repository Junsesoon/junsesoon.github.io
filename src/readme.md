# src 폴더 설명
This folder contains the core source code of the blog project being migrated to Next.js

## 폴더 구조
- **`app/`**: Next.js App Router-related files are located here. They include page routing, layouts, UI components, and more
- **`components/`**: Manage UI components (e.g., cards, buttons, tags) that are reused throughout the blog
- **`js/`**: It contains client-side logic used in existing static sites (vanilla JS). It includes `parser.js`, `render.js`, `main.js`, etc., and currently, only parts of it can be referenced during the Next.js migration process
- **`styles/`**: Manages style-related files such as global CSS (`globals.css`) and code block highlighting theme (`atom-one-dark.css`)
- **`types/`**: Defines TypeScript types used throughout the project (e.g., the `Post` type)
- **`utils/`**: Manages utility functions used throughout the project, such as fetching and processing post data
