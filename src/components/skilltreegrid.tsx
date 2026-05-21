import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import SkillTreeInteractive from './SkillTreeInteractive';

interface SkillNode {
  file: string;
  hasCat3: boolean;
  parents: string[];
  colIndex?: number;
  year?: string;
  content: string;
  frontmatter: Record<string, any>;
}

interface SkillTreeGridProps {
  title?: string;
  description?: string;
  matchCategory2: string;
}

export default async function SkillTreeGrid({ title, description, matchCategory2 }: SkillTreeGridProps) {
  // /public/posts/skilltree 하위의 모든 마크다운 파일을 재귀적으로 읽기
  const baseDirPath = path.join(process.cwd(), 'public', 'posts', 'skilltree');
  let files: string[] = [];

  const getAllMarkdownFiles = (dir: string): string[] => {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(getAllMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
    return results;
  };

  try {
    files = getAllMarkdownFiles(baseDirPath);
  } catch (error) {
    console.error('Failed to read directory:', error);
  }

  const COLUMNS = 12;
  
  const nodes = new Map<string, SkillNode>();

  // 1. 파일들을 순회하며 노드 맵 생성
  files.forEach(filePath => {
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);

      // category4까지 있는 포스트는 나중에 따로 처리하기 위해 제외
      if (data.category4) {
        return;
      }

      // frontmatter의 category2가 일치하는 포스트만 해당 그리드에 포함
      const cat2 = data.category2;
      if (!cat2) return;
      
      const categories = Array.isArray(cat2) ? cat2 : [cat2];
      const isMatch = categories.some(cat => String(cat).toLowerCase() === matchCategory2.toLowerCase());
      if (!isMatch) return;

      const serializedData = JSON.parse(JSON.stringify(data));

      let parents: string[] = [];
      const parentSkill = data['parent skill'];
      if (parentSkill) {
        parents = Array.isArray(parentSkill) ? parentSkill : [parentSkill];
      }

      let yearStr = '';
      if (data['tech start']) {
        const startStr = String(data['tech start']);
        const match = startStr.match(/\d{4}/);
        yearStr = match ? match[0] : startStr;
      }

      const fileName = path.basename(filePath);
      const nodeName = path.parse(fileName).name;
      nodes.set(nodeName, {
        file: fileName,
        hasCat3: !!data.category3,
        parents: parents.map(p => path.parse(String(p)).name), // 확장자 제거
        year: yearStr,
        content,
        frontmatter: serializedData,
      });
    } catch (err) {
      console.error(`Failed to parse file: ${filePath}`, err);
    }
  });

  // 2. 재귀적으로 열(Column) 인덱스를 계산하는 함수
  const getColIndex = (name: string, visited: Set<string>): number => {
    const node = nodes.get(name);
    if (!node) return 0;
    
    if (node.colIndex !== undefined) return node.colIndex;
    if (visited.has(name)) return node.hasCat3 ? 1 : 0; // 순환 참조 방지
    
    visited.add(name);

    let baseColIndex = node.hasCat3 ? 1 : 0;
    
    if (node.parents.length > 0) {
      let maxParentCol = -1;
      node.parents.forEach(p => {
        if (nodes.has(p)) {
          const pCol = getColIndex(p, new Set(visited));
          if (pCol > maxParentCol) {
            maxParentCol = pCol;
          }
        }
      });
      
      if (maxParentCol !== -1) {
        // 부모의 최대 열 + 1 과 자신의 기본 열 중 큰 값 사용
        baseColIndex = Math.max(baseColIndex, maxParentCol + 1);
      }
    }

    node.colIndex = baseColIndex;
    return baseColIndex;
  };

  const columnsData: string[][] = Array.from({ length: COLUMNS }, () => []);

  // 3. 계산된 열 인덱스를 바탕으로 데이터 배치
  for (const [name, node] of nodes.entries()) {
    const colIndex = getColIndex(name, new Set());
    const finalCol = Math.min(colIndex, COLUMNS - 1); // 컬럼 수를 넘어가면 마지막 컬럼에 배치
    columnsData[finalCol].push(node.file);
  }

  // 4. 각 열(Column) 내에서 연도(year) 기준 오름차순 정렬
  columnsData.forEach(col => {
    col.sort((fileA, fileB) => {
      const nodeA = nodes.get(path.parse(fileA).name);
      const nodeB = nodes.get(path.parse(fileB).name);
      
      const parseYear = (yearStr?: string) => {
        if (!yearStr) return 9999; // 연도가 없으면 가장 뒤로 보냄
        const parsed = parseInt(yearStr, 10);
        return isNaN(parsed) ? 9999 : parsed;
      };

      const yearA = parseYear(nodeA?.year);
      const yearB = parseYear(nodeB?.year);

      if (yearA !== yearB) return yearA - yearB;
      return fileA.localeCompare(fileB); // 연도가 같으면 파일명 알파벳순 정렬
    });
  });

  const nodesRecord: Record<string, SkillNode> = {};
  nodes.forEach((value, key) => {
    nodesRecord[key] = value;
  });

  return (
    <div className="w-full">
      {(title || description) && (
        <header className="mb-2 px-4">
          {title && <h2 className="text-3xl font-bold text-gray-800">{title}</h2>}
          {description && <p className="text-sm text-gray-500 mt-2">{description}</p>}
        </header>
      )}
      <SkillTreeInteractive 
        columnsData={columnsData} 
        nodes={nodesRecord} 
        COLUMNS={COLUMNS} 
      />
    </div>
  );
}