import fs from 'fs';
import path from 'path';
import { query } from '../infra/db';
import { getDbPostBySlug } from '../utils/posts';

async function downloadPosts() {
  // 파일을 저장할 public/download-posts 디렉터리 경로 설정
  const outputDir = path.join(process.cwd(), 'public', 'download-posts');

  // 디렉터리가 존재하지 않으면 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🏃‍♂️ 데이터베이스에서 모든 게시물을 가져오는 중...');
  
  // DB에서 모든 게시물의 slug를 조회합니다.
  const result = await query<{ slug: string }>('SELECT slug FROM posts');
  const slugs = result.rows.map(row => row.slug);

  console.log(`Found ${slugs.length} posts. Starting download to local md files...`);

  for (const slug of slugs) {
    // utils/posts.ts의 함수를 사용하여 DB의 게시물 정보와 결합된 메타데이터를 가져옵니다.
    const post = await getDbPostBySlug(slug);
    if (!post) continue;

    // YAML Frontmatter 구성 로직
    let mdContent = '---\n';
    for (const [key, value] of Object.entries(post.metadata)) {
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
    mdContent += '---\n\n';
    mdContent += post.content;

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