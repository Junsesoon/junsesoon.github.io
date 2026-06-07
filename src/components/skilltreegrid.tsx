import path from 'path';
import SkillTreeInteractive from './SkillTreeInteractive';
import { getSkillTreePosts } from '../utils/posts';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/utils/auth';


export interface SkillNode {
  file: string;
  title: string;
  hasCat3: boolean;
  parents: string[];
  year?: string;
  content: string;
  frontmatter: Record<string, any>;
  slug: string;
  col: number;
  row: number;
}

interface SkillTreeGridProps {
  title?: string;
  description?: string;
  matchCategory2: string;
}

export default async function SkillTreeGrid({ title, description, matchCategory2 }: SkillTreeGridProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_auth')?.value;
  const isAdmin = token ? await verifyAdminToken(token) : false;

  const COLUMNS = 12;
  const nodes = new Map<string, SkillNode>();
  const posts = await getSkillTreePosts(matchCategory2);

  // 1. DB 게시물을 순회하며 노드 맵 생성
  posts.forEach(post => {
    try {
      const serializedData = JSON.parse(JSON.stringify(post.metadata));

      let parents: string[] = [];
      const parentSkill = post.metadata.parentSkill;
      if (parentSkill) {
        parents = Array.isArray(parentSkill) ? parentSkill : [parentSkill];
      }

      let yearStr = '';
      if (post.metadata.techStart) {
        const startStr = String(post.metadata.techStart);
        const match = startStr.match(/\d{4}/);
        yearStr = match ? match[0] : startStr;
      }

      const nodeName = path.basename(post.slug);
      const fileName = `${nodeName}.md`;
      nodes.set(nodeName, {
        file: fileName,
        title: post.metadata.title || nodeName,
        hasCat3: !!post.metadata.category3,
        parents: parents.map(p => path.parse(String(p)).name), // 확장자 제거
        year: yearStr,
        content: post.content || '',
        frontmatter: serializedData,
        slug: post.slug,
        col: -1,
        row: -1,
      });
    } catch (err) {
      console.error(`Failed to parse skill tree post: ${post.slug}`, err);
    }
  });

  // 2. New layout algorithm to calculate row and column for each node
  const columnOccupancy: number[] = new Array(COLUMNS).fill(0);

  const calculatePositions = (nodeName: string) => {
    const node = nodes.get(nodeName);
    // Already processed or node does not exist
    if (!node || node.col !== -1) {
      return;
    }

    // category3 값이 있으면 2열(인덱스 1), 없으면 1열(인덱스 0)부터 시작
    let targetCol = node.hasCat3 ? 1 : 0;
    let minStartRow = 0;

    // Process parents first to determine column and minimum row
    if (node.parents.length > 0) {
      let maxParentCol = -1;
      node.parents.forEach(parentName => {
        const parentNode = nodes.get(parentName);
        if (parentNode) {
          calculatePositions(parentName); // Recurse
          maxParentCol = Math.max(maxParentCol, parentNode.col);
          // Requirement 1: Child row must be >= parent row
          minStartRow = Math.max(minStartRow, parentNode.row);
        }
      });
      targetCol = Math.max(targetCol, maxParentCol + 1);
    }

    // Requirement 2: Resolve collisions and stacking
    const targetRow = Math.max(minStartRow, columnOccupancy[targetCol]);

    node.col = targetCol;
    node.row = targetRow;

    // Reserve this spot and update the next available row for the column
    columnOccupancy[targetCol] = targetRow + 1;
  };

  // Sort nodes to process them in a deterministic order (e.g., by year, then name)
  const sortedNodeNames = Array.from(nodes.keys()).sort((a, b) => {
    const nodeA = nodes.get(a)!;
    const nodeB = nodes.get(b)!;
    const yearA = parseInt(nodeA.year || '9999', 10);
    const yearB = parseInt(nodeB.year || '9999', 10);
    if (yearA !== yearB) return yearA - yearB;
    return a.localeCompare(b);
  });

  // Calculate positions for all nodes
  sortedNodeNames.forEach(nodeName => {
    calculatePositions(nodeName);
  });

  const nodesRecord: Record<string, SkillNode> = Object.fromEntries(nodes);

  return (
    <div className="w-full">
      {(title || description) && (
        <header className="mb-2 px-4">
          {title && <h2 className="text-3xl font-bold text-gray-800">{title}</h2>}
          {description && <p className="text-sm text-gray-500 mt-2">{description}</p>}
        </header>
      )}
      <SkillTreeInteractive
        nodes={nodesRecord} 
        COLUMNS={COLUMNS} 
        isAdmin={isAdmin}
      />
    </div>
  );
}
