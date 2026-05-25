# styles
edit date: 2026-05-17
This folder keeps only CSS that is still useful in a Tailwind-first Next.js app.

## Files
- `globals.css`: Tailwind CSS v4 entrypoint. Import Tailwind with `@import "tailwindcss";`, then keep only app-wide base styles and global selectors that cannot be expressed directly with `className`.
- `atom-one-dark.css`: Highlight.js theme for code blocks rendered from Markdown.

## Style Rules
- Prefer Tailwind utility classes in React components and app pages.
- Use `globals.css` only for true global concerns: document defaults, Markdown HTML from `dangerouslySetInnerHTML`, external-library output, or selectors that React cannot attach classes to directly.
- Put custom global CSS inside a Tailwind layer such as `@layer base` or `@layer components` so it composes predictably with Tailwind.
- Avoid adding page-specific layout files such as `layout.css`, `component.css`, `theme.css`, or `style.css`. If a style belongs to one component, keep it in that component as Tailwind classes.
- Keep third-party library CSS separate only when it is a vendor theme or generated stylesheet.

## Removed Legacy Files
- `base.css`: Merged into `globals.css`.
- `component.css`: The active Markdown styles were merged into `globals.css`; page and TOC layout moved to Tailwind classes.
- `layout.css`: Replaced by Tailwind classes in `layout.tsx` and `GNB.tsx`.
- `theme.css`: Replaced by Tailwind color utilities and the Markdown styles in `globals.css`.
- `style.css`: Removed with the old responsive overrides; current responsive behavior should be expressed with Tailwind responsive variants.
