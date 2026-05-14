import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import remarkSlug from 'remark-slug';

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

function extractHeadings(content: string): Array<{ level: number; text: string; id: string }> {
  const headingRegex = /^#{1,6}\s+(.+)$/gm;
  const headings: Array<{ level: number; text: string; id: string }> = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[0].length - match[1].length - 1; // #의 개수
    const text = match[1].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 특수문자 제거
      .replace(/\s+/g, '-') // 공백을 -로
      .replace(/-+/g, '-'); // 연속된 -를 하나로

    headings.push({ level, text, id });
  }

  return headings;
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

  // TOC 생성
  const headings = extractHeadings(content);

  // HTML 생성 시 헤딩에 ID 추가
  const processedContent = await remark()
    .use(remarkSlug)
    .use(remarkHtml)
    .process(content);
  const contentHtml = processedContent.toString();

  const postData = data as PostData;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .toc-link:hover {
            background-color: #e3f2fd !important;
          }
        `
      }} />
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
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
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </article>
      </main>

      {headings.length > 0 && (
        <aside style={{
          position: 'sticky',
          top: '2rem',
          height: 'fit-content',
          background: '#f9f9f9',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #e1e1e1'
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: '#333'
          }}>
            Table of Contents
          </h3>
          <nav>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: '0.9rem'
            }}>
              {headings.map((heading, index) => (
                <li key={index} style={{
                  marginBottom: '0.5rem',
                  paddingLeft: `${(heading.level - 1) * 1}rem`
                }}>
                  <a
                    href={`#${heading.id}`}
                    style={{
                      color: '#0070f3',
                      textDecoration: 'none',
                      display: 'block',
                      padding: '0.25rem 0',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    className="toc-link"
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      )}
    </div>
    </>
  );
}