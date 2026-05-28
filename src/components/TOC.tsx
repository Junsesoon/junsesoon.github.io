import { type TocHeading } from '../utils/parser';

interface TOCProps {
  headings: TocHeading[];
}

export default function TOC({ headings }: TOCProps) {
  if (headings.length === 0) return null;

  return (
      <aside className="hidden lg:block sticky top-40 h-fit w-48 shrink lg:w-56 xl:w-64 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-4 text-lg font-bold text-gray-800">
          Table of Contents
        </h3>
        <nav>
          <ul className="m-0 list-none p-0 text-sm">
            {headings.map((heading, index) => (
              <li
                key={index}
                className="mb-2"
                style={{ paddingLeft: `${(heading.level - 1) * 1}rem` }}
              >
                <a
                  href={`#${heading.id}`}
                  className="block truncate rounded px-1 py-1 text-blue-600 no-underline transition-colors hover:bg-blue-50"
                  title={heading.text}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
  );
}
