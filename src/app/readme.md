# app folder readme
- Next.js App Router

## Files
- `app/page.tsx`: The main page of the blog. It serves as a landing page displaying the list of all posts
- `app/[category]/page.tsx`: Post list page by category. Filters and displays posts belonging to specific categories, such as `knowledge` and `project`
- `app/[category]/[id]/page.tsx`: Individual post detail page. Renders the full content of a specific post written in Markdown