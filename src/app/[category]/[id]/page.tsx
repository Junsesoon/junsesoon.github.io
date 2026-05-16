import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkSlug from 'remark-slug';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import TOC from '../../../components/TOC';
import { collectTocHeadings, type TocHeading } from '../../../utils/parser';

interface PostData {
  title: string;
  summary?: string;
  tags?: string[];
  category1?: string[];
  category2?: string[];
  'start date'?: string;
  'end date'?: string;
  [key: string]: any;
}

function formatKoreanDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}. ${mm}. ${dd}.`;
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}) {
  const { category, id } = await params;

  const filePath = path.join(process.cwd(), 'public', 'posts', category, `${id}.md`);

  if (!fs.existsSync(filePath)) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1>Post not found</h1>
        <p>The requested post could not be found.</p>
      </main>
    );
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const headings: TocHeading[] = [];

  // Markdown to HTML with syntax highlighting
  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkSlug as any)
    .use(collectTocHeadings(headings))
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(content);
  const contentHtml = String(processedContent);

  const postData = data as PostData;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_200px] gap-8 p-8 font-sans">
      <main className="min-w-0">
        <article>
          <header className="mb-8">
            <h1 className="mb-2 text-4xl">
              {postData.title || id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </h1>
            <div className="my-2 text-gray-600">
              <p>
                작성일: {formatKoreanDate(postData['start date']) ?? '정보 없음'}
              </p>
              <p>
                수정일: {formatKoreanDate(postData['end date']) ?? '정보 없음'}
              </p>
            </div>
            {postData.summary && (
              <p className="my-4 text-lg text-gray-800">
                {postData.summary}
              </p>
            )}
            {postData.tags && postData.tags.length > 0 && (
              <div className="mt-4">
                <strong>Tags:</strong>{' '}
                {postData.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="m-1 inline-block rounded bg-gray-100 px-2 py-1 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div
            className="post-body text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </article>
      </main>

      <TOC headings={headings} />
    </div>
  );
}
