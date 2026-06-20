import fs from 'fs';
import path from 'path';
import { query } from '../infra/neon';

async function downloadPosts() {
  // 파일을 저장할 public/download-posts 디렉터리 경로 설정
  const outputDir = path.join(process.cwd(), 'public', 'download-posts');

  // 디렉터리가 존재하지 않으면 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🏃‍♂️ 데이터베이스에서 모든 게시물을 가져오는 중...');
  
  // posts 테이블과 스킬트리 메타데이터가 분리된 skilltree_posts 테이블을 JOIN하여 완전한 데이터를 조회합니다.
  const result = await query<any>(
    `SELECT 
       p.slug, p.title, p.content, p.properties,
       s.domain, s.sub_domain, s.tech_start, s.parent_skill, s.child_skill
     FROM posts p
     LEFT JOIN skilltree_posts s ON p.post_id = s.post_id`
  );
  const posts = result.rows;

  console.log(`Found ${posts.length} posts. Starting download to local md files...`);

  for (const post of posts) {
    const { slug, title, content, properties, domain, sub_domain, tech_start, parent_skill, child_skill } = post;

    // JSONB 속성을 복사한 뒤, skilltree_posts 테이블의 최신 값으로 덮어씌워 동기화합니다.
    const finalProps = properties ? { ...properties } : {};
    
    if (domain !== null && domain !== undefined) finalProps.category2 = domain;
    if (sub_domain !== null && sub_domain !== undefined) finalProps.category3 = sub_domain;
    if (tech_start !== null && tech_start !== undefined) finalProps.techstart = tech_start;
    if (parent_skill !== null && parent_skill !== undefined) {
      finalProps.parentskill = parent_skill;
      delete finalProps.parentSkill; // 중복 키 방지
      delete finalProps.parent_skill;
    }
    if (child_skill !== null && child_skill !== undefined) {
      finalProps.childskill = child_skill;
      delete finalProps.childSkill;
      delete finalProps.child_skill;
    }

    // YAML Frontmatter 구성 로직
    let mdContent = '---\n';

    // title을 독립된 프론트매터 속성으로 가장 먼저 추가
    if (title) {
      const escapedTitle = title.includes(':') || title.includes('\n') ? `"${title.replace(/"/g, '\\"')}"` : title;
      mdContent += `title: ${escapedTitle}\n`;
    }

    if (finalProps && typeof finalProps === 'object') {
      for (const [key, value] of Object.entries(finalProps)) {
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