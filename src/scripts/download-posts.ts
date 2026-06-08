import fs from 'fs';
import path from 'path';
import { query } from '../infra/db';

async function downloadPosts() {
  // 파일을 저장할 public/download-posts 디렉터리 경로 설정
  const outputDir = path.join(process.cwd(), 'public', 'download-posts');

  // 디렉터리가 존재하지 않으면 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🏃‍♂️ 데이터베이스에서 모든 게시물을 가져오는 중...');
  
  // 변경된 단일 테이블 스키마: 한 번의 쿼리로 모든 게시물의 데이터와 속성(JSONB)을 조회합니다.
  const result = await query<{ slug: string; title: string; content: string; properties: any }>(
    'SELECT slug, title, content, properties FROM posts'
  );
  const posts = result.rows;

  console.log(`Found ${posts.length} posts. Starting download to local md files...`);

  for (const post of posts) {
    const { slug, title, content, properties } = post;

    // YAML Frontmatter 구성 로직
    let mdContent = '---\n';

    // title을 독립된 프론트매터 속성으로 가장 먼저 추가
    if (title) {
      const escapedTitle = title.includes(':') || title.includes('\n') ? `"${title.replace(/"/g, '\\"')}"` : title;
      mdContent += `title: ${escapedTitle}\n`;
    }

    if (properties && typeof properties === 'object') {
      for (const [key, value] of Object.entries(properties)) {
        if (key === 'title') continue; // properties 내부의 중복된 title은 건너뜀
        if (value === null || value === undefined || value === '') continue;
        
        if (Array.isArray(value)) {
          if (value.length > 0) {
            mdContent += `${key}:\n`;
            value.forEach(v => {
              mdContent += `  - ${v}\n`;
            });
          } else {
            mdContent += `${key}: []\n`;
          }
        } else if (key === 'summary' && typeof value === 'string') {
          // summary 속성인 경우에만 작은따옴표로 감싸고 이스케이프 처리
          mdContent += `${key}: '${value.replace(/'/g, "\\'").replace(/\n/g, '\\n')}'\n`;
        } else if (typeof value === 'string' && (value.includes(':') || value.includes('\n'))) {
          // 다른 문자열에 콜론이나 줄바꿈이 포함된 경우 안전을 위해 큰따옴표로 감싸기
          mdContent += `${key}: "${value.replace(/"/g, '\\"')}"\n`;
        } else {
          mdContent += `${key}: ${value}\n`;
        }
      }
    }
    mdContent += '---\n\n';
    mdContent += content || '';

    // slug에 '/'가 포함된 경우 하위 디렉터리까지 자동 생성되도록 처리
    const filePath = path.join(outputDir, `${slug}.md`);
    const fileDir = path.dirname(filePath);
    
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    // 마크다운 파일 작성
    fs.writeFileSync(filePath, mdContent, 'utf-8');
    console.log(`Downloaded: public/download-posts/${slug}.md`);
  }

  console.log('🟢 게시물을 모두 마크다운 파일로 변환하여 public/download-posts 디렉터리에 저장했습니다');
}

downloadPosts().catch(console.error);