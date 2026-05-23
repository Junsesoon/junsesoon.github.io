import path from 'path';
import SkillTreeInteractive from './SkillTreeInteractive';
import { getSkillTreePosts } from '../utils/posts';

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
  const COLUMNS = 12;
  const nodes = new Map<string, SkillNode>();
  const posts = await getSkillTreePosts(matchCategory2);

  // 1. DB 게시물을 순회하며 노드 맵 생성
  posts.forEach(post => {
    try {
      const serializedData = JSON.parse(JSON.stringify(post.metadata));

      let parents: string[] = [];
      const parentSkill = post.metadata['parent skill'];
      if (parentSkill) {
        parents = Array.isArray(parentSkill) ? parentSkill : [parentSkill];
      }

      let yearStr = '';
      if (post.metadata['tech start']) {
        const startStr = String(post.metadata['tech start']);
        const match = startStr.match(/\d{4}/);
        yearStr = match ? match[0] : startStr;
      }

      const nodeName = path.basename(post.slug);
      const fileName = `${nodeName}.md`;
      nodes.set(nodeName, {
        file: fileName,
        hasCat3: !!post.metadata.category3,
        parents: parents.map(p => path.parse(String(p)).name), // 확장자 제거
        year: yearStr,
        content: post.content,
        frontmatter: serializedData,
      });
    } catch (err) {
      console.error(`Failed to parse skill tree post: ${post.slug}`, err);
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
