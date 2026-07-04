import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkSlug from 'remark-slug';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { collectTocHeadings, type TocHeading } from './parser';

const globalForMarkdown = globalThis as unknown as {
  markdownCache: Map<string, { html: string; headings: TocHeading[] }>;
};

const cache = globalForMarkdown.markdownCache ?? new Map();

if (process.env.NODE_ENV !== 'production') {
  globalForMarkdown.markdownCache = cache;
}

export interface MarkdownParseResult {
  html: string;
  headings: TocHeading[];
}

export async function getParsedMarkdown(
  slug: string,
  content: string,
  updatedAt: any
): Promise<MarkdownParseResult> {
  const timestamp = updatedAt instanceof Date ? updatedAt.getTime() : String(updatedAt || '');
  // Invalidate old cache as remark-breaks was introduced in the markdown pipeline
  const cacheKey = `${slug}_${timestamp}_v2`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  const headings: TocHeading[] = [];
  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkBreaks)
    .use(remarkGfm)
    .use(remarkSlug as any)
    .use(collectTocHeadings(headings))
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(content);

  const result: MarkdownParseResult = {
    html: String(processedContent),
    headings,
  };

  cache.set(cacheKey, result);
  return result;
}
