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
import '../../../styles/component.css';

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
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
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
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 200px',
      gap: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: 'sans-serif'
    }}>
      <main style={{ minWidth: 0 }}>
        <article>
          <header style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {postData.title || id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </h1>
            <div style={{ color: '#666', margin: '0.5rem 0', lineHeight: '1.6' }}>
              <p style={{ margin: 0 }}>
                작성일: {formatKoreanDate(postData['start date']) ?? '정보 없음'}
              </p>
              <p style={{ margin: 0 }}>
                수정일: {formatKoreanDate(postData['end date']) ?? '정보 없음'}
              </p>
            </div>
            {postData.summary && (
              <p style={{ fontSize: '1.1rem', color: '#333', margin: '1rem 0' }}>
                {postData.summary}
              </p>
            )}
            {postData.tags && postData.tags.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Tags:</strong>{' '}
                {postData.tags.map((tag: string) => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-block',
                      background: '#f0f0f0',
                      padding: '0.2rem 0.5rem',
                      margin: '0.2rem',
                      borderRadius: '4px',
                      fontSize: '0.9rem'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div
            style={{ lineHeight: '1.6', fontSize: '1rem' }}
             className="post-body"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </article>
      </main>

      <TOC headings={headings} />
    </div>
  );
}
