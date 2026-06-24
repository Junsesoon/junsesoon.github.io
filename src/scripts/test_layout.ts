import 'dotenv/config';
import { getSkillTreePosts } from '../utils/posts';
import path from 'path';

interface SkillNode {
  file: string;
  title: string;
  parents: string[];
  col: number;
  row: number;
}

async function simulate(occupancyRule: 'original' | 'only_current' | 'immediate_left' | 'none') {
  const matchCategory2 = 'PL';
  const COLUMNS = 10;
  const posts = await getSkillTreePosts(matchCategory2);
  const nodes = new Map<string, SkillNode>();

  posts.forEach(post => {
    let parents: string[] = [];
    const parentSkill = post.metadata.parentskill;
    if (parentSkill) {
      parents = (Array.isArray(parentSkill) ? parentSkill : [parentSkill])
        .map(p => String(p).trim());
    }

    const rawTitle = post.metadata.title ? String(post.metadata.title).trim() : path.basename(post.slug);
    const nodeKey = rawTitle.toLowerCase();
    const fileName = `${path.basename(post.slug)}.md`;

    nodes.set(nodeKey, {
      file: fileName,
      title: rawTitle,
      parents: parents.map(p => p.toLowerCase()),
      col: -1,
      row: -1,
    });
  });

  const columnOccupancy: number[] = new Array(COLUMNS).fill(0);
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

  const sortNodes = (names: string[]) => {
    return names.sort((a, b) => a.localeCompare(b));
  };

  const placed = new Set<string>();

  const placeNode = (nodeName: string, force: boolean = false) => {
    if (placed.has(nodeName)) return;
    const node = nodes.get(nodeName);
    if (!node) return;

    if (!force) {
      const unplacedParents = node.parents.filter(p => nodes.has(p) && !placed.has(p));
      if (unplacedParents.length > 0) return;
    }

    let targetCol = 0;
    let minStartRow = 0;

    if (node.parents.length > 0) {
      let maxParentCol = -1;
      node.parents.forEach(parentName => {
        const parentNode = nodes.get(parentName);
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

    // Occupancy reservation rules
    if (occupancyRule === 'original') {
      for (let c = 0; c <= targetCol; c++) {
        columnOccupancy[c] = Math.max(columnOccupancy[c] || 0, targetRow + 1);
      }
    } else if (occupancyRule === 'only_current') {
      columnOccupancy[targetCol] = Math.max(columnOccupancy[targetCol] || 0, targetRow + 1);
    } else if (occupancyRule === 'immediate_left') {
      const startCol = Math.max(0, targetCol - 1);
      for (let c = startCol; c <= targetCol; c++) {
        columnOccupancy[c] = Math.max(columnOccupancy[c] || 0, targetRow + 1);
      }
    } else if (occupancyRule === 'none') {
      // do nothing
    }

    const children = childrenMap.get(nodeName) || [];
    sortNodes([...children]).forEach(childName => {
      placeNode(childName);
    });
  };

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

  sortNodes(connectedRoots).forEach(rootName => placeNode(rootName));
  sortNodes(isolatedNodes).forEach(rootName => placeNode(rootName));

  let unplaced = Array.from(nodes.keys()).filter(k => !placed.has(k));
  while (unplaced.length > 0) {
    const nodeToForce = sortNodes(unplaced)[0];
    placeNode(nodeToForce, true);
    unplaced = Array.from(nodes.keys()).filter(k => !placed.has(k));
  }

  const nodesArray = Array.from(nodes.values());
  const maxRows = Math.max(3, ...nodesArray.map(n => n.row + 1));
  console.log(`Rule "${occupancyRule}": Max Rows = ${maxRows}`);
}

async function run() {
  await simulate('original');
  await simulate('only_current');
  await simulate('immediate_left');
  await simulate('none');
}

run().catch(console.error);
