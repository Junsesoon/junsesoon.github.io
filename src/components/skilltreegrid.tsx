import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface SkillNode {
  file: string;
  hasCat3: boolean;
  parents: string[];
  colIndex?: number;
  year?: string;
}

export default async function SkillTreeGrid() {
  // /public/posts/skilltree 디렉토리에서 파일 목록 읽기
  const dirPath = path.join(process.cwd(), 'public', 'posts', 'skilltree');
  let files: string[] = [];
  try {
    files = fs.readdirSync(dirPath).filter(file => file.endsWith('.md'));
  } catch (error) {
    console.error('Failed to read directory:', error);
  }

  const COLUMNS = 12;
  
  const nodes = new Map<string, SkillNode>();

  // 1. 파일들을 순회하며 노드 맵 생성
  files.forEach(file => {
    try {
      const filePath = path.join(dirPath, file);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);

      // category4까지 있는 포스트는 나중에 따로 처리하기 위해 제외
      if (data.category4) {
        return;
      }

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

      const nodeName = path.parse(file).name;
      nodes.set(nodeName, {
        file,
        hasCat3: !!data.category3,
        parents: parents.map(p => path.parse(String(p)).name), // 확장자 제거
        year: yearStr,
      });
    } catch (err) {
      console.error(`Failed to parse file: ${file}`, err);
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

  const maxRows = Math.max(10, ...columnsData.map(col => col.length));
  const INITIAL_ROWS = maxRows; // 각 열 중 가장 파일이 많은 열에 맞춰 행 수 자동 조절
  const TOTAL_CELLS = COLUMNS * INITIAL_ROWS;

  // 전체 셀 배열 생성
  const gridCells = Array.from({ length: TOTAL_CELLS }, (_, i) => i);

  return (
    <div className="w-full flex justify-center py-10 overflow-x-auto">
      {/* Grid Container
        - grid-cols-[repeat(12,60px)]: 60px 너비의 12개 컬럼 생성
        - gap-x-[20px] gap-y-[20px]: 간격 적용
      */}
      <div 
        className="grid gap-x-[20px] gap-y-[20px] w-max" // cell 간격 조정 영역
        style={{ gridTemplateColumns: `repeat(${COLUMNS}, 60px)` }}
      >
        {gridCells.map((index) => {
          // 현재 셀의 열과 행 인덱스 계산
          const colIndex = index % COLUMNS;
          const rowIndex = Math.floor(index / COLUMNS);
          const file = rowIndex < columnsData[colIndex].length ? columnsData[colIndex][rowIndex] : null;
          const displayName = file ? path.parse(file).name : null;
          const nodeInfo = displayName ? nodes.get(displayName) : null;

          return (
            <div
              key={index}
              className={`
                h-[50px] rounded-md transition-all duration-300 flex flex-col items-center justify-center text-[10px] text-center overflow-hidden break-all px-1
                ${file 
                  ? 'bg-white/10 backdrop-blur-md border border-white/20 text-black shadow-[0_0_10px_rgba(0,123,255,0.2)]' // 활성 상태 (글래스모피즘 + 테크 블루 글로우)
                  : 'bg-white/5 border border-dashed border-white/10 opacity-20 hover:opacity-40' // 비활성 상태 (투명도 조절)
                }
              `}
            >
              {/* 셀 위치에 맞춰 파일명 노출 */}
              {displayName && <span>{displayName}</span>}
              {nodeInfo?.year && <span className="text-[8px] opacity-70">{nodeInfo.year}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}