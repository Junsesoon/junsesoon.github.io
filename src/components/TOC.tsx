import { type TocHeading } from '../utils/parser';

interface TOCProps {
  headings: TocHeading[];
}

export default function TOC({ headings }: TOCProps) {
  if (headings.length === 0) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .toc-link:hover {
            background-color: #e3f2fd !important;
          }
        `
      }} />
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
    </>
  );
}
