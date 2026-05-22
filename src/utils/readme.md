# utils folder readme
Manages utility functions used throughout the project, such as fetching and processing post data.

## 주요 파일 (Files)
- `parser.ts`: Includes utility functions that read Markdown(`.md`) files and parse Frontmatter metadata and content(e.g., using `gray-matter`)
- `posts.ts`: It is responsible for the actual data handling logic, such as retrieving the entire list of posts based on parsed post data, filtering by category, sorting, or retrieving single post data corresponding to a specific slug