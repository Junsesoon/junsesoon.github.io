import path from 'path';
import SkillTreeInteractive from './SkillTreeInteractive';
import { getSkillTreePosts } from '../../utils/posts';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/utils/auth';


export interface SkillNode {
  postId: string;
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
  likesCount?: number;
}

interface SkillTreeGridProps {
  title?: string;
  description?: string;
  matchCategory2: string;
  colorIndex?: number;
}

export default async function SkillTreeGrid({ title, description, matchCategory2, colorIndex }: SkillTreeGridProps) {
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
      const parentSkill = post.metadata.parentskill;
      if (parentSkill) {
        parents = (Array.isArray(parentSkill) ? parentSkill : [parentSkill])
          .map(p => String(p).trim());
      }

      let yearStr = '';
      if (post.metadata.techstart) {
        const startStr = String(post.metadata.techstart);
        const match = startStr.match(/\d{4}/);
        yearStr = match ? match[0] : startStr;
      }

      // URL 슬러그 대신 title을 스킬 카드의 식별자로 사용 (매칭을 위해 소문자 변환)
      const rawTitle = post.metadata.title ? String(post.metadata.title).trim() : path.basename(post.slug);
      const nodeKey = rawTitle.toLowerCase();
      const fileName = `${path.basename(post.slug)}.md`;

      nodes.set(nodeKey, {
        postId: post.post_id || '',
        file: fileName,
        title: rawTitle, // 화면에 표시될 원본 대소문자 유지
        hasCat3: !!post.metadata.category3,
        parents: parents.map(p => p.toLowerCase()), // path.parse(확장자 제거) 삭제 및 소문자 매칭
        year: yearStr,
        content: post.content || '',
        frontmatter: serializedData,
        slug: post.slug,
        col: -1,
        row: -1,
        likesCount: post.likes_count || 0,
      });
    } catch (err) {
      console.error(`Failed to parse skill tree post: ${post.slug}`, err);
    }
  });

  // 2. New layout algorithm to calculate row and column for each node (Top-Down DFS)
  const columnOccupancy: number[] = new Array(COLUMNS).fill(0);

  // 2-1. 자식 노드를 빠르게 찾기 위한 매핑 (Top-Down 탐색용)
  const childrenMap = new Map<string, string[]>();
  nodes.forEach((node, nodeName) => {
    if (!childrenMap.has(nodeName)) childrenMap.set(nodeName, []);
    node.parents.forEach(parentName => {
      if (nodes.has(parentName)) {
        if (!childrenMap.has(parentName)) childrenMap.set(parentName, []);
        childrenMap.get(parentName)!.push(nodeName);
      }
    });
  });

  // 2-2. 정렬 함수 (연도 오름차순 -> 알파벳 순)
  const sortNodes = (names: string[]) => {
    return names.sort((a, b) => {
      const nodeA = nodes.get(a)!;
      const nodeB = nodes.get(b)!;
      const yearA = parseInt(nodeA.year || '9999', 10);
      const yearB = parseInt(nodeB.year || '9999', 10);
      if (yearA !== yearB) return yearA - yearB;
      return a.localeCompare(b);
    });
  };

  const placed = new Set<string>();

  const placeNode = (nodeName: string, force: boolean = false) => {
    if (placed.has(nodeName)) return;
    const node = nodes.get(nodeName);
    if (!node) return;

    // 부모가 아직 모두 배치되지 않았다면 대기 (다중 부모의 경우 마지막 부모가 배치될 때 함께 배치됨)
    if (!force) {
      const unplacedParents = node.parents.filter(p => nodes.has(p) && !placed.has(p));
      if (unplacedParents.length > 0) return;
    }

    let targetCol = node.hasCat3 ? 1 : 0;
    let minStartRow = 0;

    if (node.parents.length > 0) {
      let maxParentCol = -1;
      node.parents.forEach(parentName => {
        const parentNode = nodes.get(parentName);
        // 이미 배치된 부모만 고려
        if (parentNode && placed.has(parentName)) {
          maxParentCol = Math.max(maxParentCol, parentNode.col);
          minStartRow = Math.max(minStartRow, parentNode.row);
        }
      });
      targetCol = Math.max(targetCol, maxParentCol + 1);
    }

    const targetRow = Math.max(minStartRow, columnOccupancy[targetCol] || 0);
    node.col = targetCol;
    node.row = targetRow;
    placed.add(nodeName);

    // 서브트리가 차지하는 공간을 자신보다 왼쪽 열에도 예약하여 형제 노드가 파고드는 것을 방지
    for (let c = 0; c <= targetCol; c++) {
      columnOccupancy[c] = Math.max(columnOccupancy[c] || 0, targetRow + 1);
    }

    // 자식 노드들을 정렬하여 순차적으로 깊이 우선 탐색(DFS) 배치
    const children = childrenMap.get(nodeName) || [];
    sortNodes([...children]).forEach(childName => {
      placeNode(childName);
    });
  };

  // 2-3. 최상위 부모 노드(Root) 찾기 및 분류 (연결된 트리 vs 독립된 노드)
  const connectedRoots: string[] = [];
  const isolatedNodes: string[] = [];

  Array.from(nodes.keys()).forEach(name => {
    const node = nodes.get(name)!;
    const validParents = node.parents.filter(p => nodes.has(p));
    if (validParents.length === 0) {
      const children = childrenMap.get(name) || [];
      if (children.length > 0) {
        connectedRoots.push(name);
      } else {
        isolatedNodes.push(name);
      }
    }
  });

  // 2-4. Root부터 Top-Down(DFS) 방식으로 배치 시작
  // 자식이 있는(연결된) 트리를 상단에 우선 배치합니다.
  sortNodes(connectedRoots).forEach(rootName => placeNode(rootName));
  
  // 아무 연결이 없는 고립된 노드들을 마지막에 배치하여 최하단으로 내립니다.
  sortNodes(isolatedNodes).forEach(rootName => placeNode(rootName));

  // 2-5. 순환 참조(Cycle) 등으로 인해 정상적으로 배치되지 못한 노드 처리 (Fallback)
  let unplaced = Array.from(nodes.keys()).filter(k => !placed.has(k));
  while (unplaced.length > 0) {
    const nodeToForce = sortNodes(unplaced)[0];
    placeNode(nodeToForce, true);
    unplaced = Array.from(nodes.keys()).filter(k => !placed.has(k));
  };

  const nodesRecord: Record<string, SkillNode> = Object.fromEntries(nodes);

  const ACCENT_BORDERS = [
    'border-sky-500/60',
    'border-emerald-500/60',
    'border-purple-500/60',
    'border-amber-500/60',
    'border-rose-500/60'
  ];
  const borderClass = ACCENT_BORDERS[(colorIndex ?? 0) % ACCENT_BORDERS.length];

  return (
    <div className="w-full">
      {(title || description) && (
        <header className={`mb-6 px-4 border-l-2 ${borderClass} pl-4 py-1`}>
          {title && <h2 className="text-2xl sm:text-3xl font-bold text-theme-text-title tracking-tight">{title}</h2>}
          {description && <p className="text-sm text-theme-text-muted mt-1.5 leading-relaxed">{description}</p>}
        </header>
      )}
      <SkillTreeInteractive
        nodes={nodesRecord} 
        COLUMNS={COLUMNS} 
        isAdmin={isAdmin}
        colorIndex={colorIndex ?? 0}
      />
    </div>
  );
}
