export interface TocHeading {
  level: number;
  text: string;
  id: string;
}

function getNodeText(node: any): string {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  if (!Array.isArray(node.children)) return '';

  return node.children.map(getNodeText).join('');
}

export function collectTocHeadings(headings: TocHeading[]) {
  return () => (tree: any) => {
    function visit(node: any) {
      if (!node) return;

      if (node.type === 'heading' && node.depth === 1) { // 목차에 표기되는 헤더 레벨 조정 영역
        const id = node.data?.hProperties?.id ?? node.data?.id;
        const text = getNodeText(node).trim();

        if (id && text) {
          headings.push({
            level: 1,
            text,
            id: String(id),
          });
        }
      }

      if (Array.isArray(node.children)) {
        node.children.forEach(visit);
      }
    }

    visit(tree);
  };
}
