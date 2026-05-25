// 이 스크립트는 Node.js 환경에서 실행되어야 합니다.
// `node js/build-skill.js` 명령어로 실행하여 `js/skill-list.js` 파일을 생성/업데이트합니다.

const fs = require('fs');
const path = require('path');

const postsRootDirectory = path.join(__dirname, '../post');
const outputFilePath = path.join(__dirname, './skill-list.js');

console.log("-----------------------------------------");
console.log("🛠  Skill List 빌드 스크립트 실행");

/**
 * 스킬 마크다운의 Front Matter를 파싱합니다.
 * @param {string} markdown - 파싱할 Markdown 전체 텍스트.
 * @returns {object} - 파싱된 Front Matter 객체.
 */
function parseFrontMatterForSkillBuild(markdown) {
    const frontMatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = frontMatterRegex.exec(markdown);
    if (!match) return {};

    const frontMatterBlock = match[1];
    const frontMatter = {};
    const lines = frontMatterBlock.split('\n');

    lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();

            // 배열 형태의 값을 처리합니다. e.g., [value1, value2]
            if (value.startsWith('[') && value.endsWith(']')) {
                const arrayContent = value.substring(1, value.length - 1).trim();
                // 'tag'는 배열로, 나머지는 첫 번째 요소만 문자열로 저장합니다.
                if (key === 'tag') {
                    value = arrayContent ? arrayContent.split(',').map(item => item.trim().replace(/^["']|["']$/g, '')) : [];
                } else {
                    value = arrayContent.split(',')[0].trim().replace(/^["']|["']$/g, '');
                }
            } else {
                value = value.replace(/^["']|["']$/g, '');
            }
            frontMatter[key] = value;
        }
    });
    return frontMatter;
}

async function getAllMarkdownFiles(dir, fileList = [], baseDir = dir) {
    const files = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            await getAllMarkdownFiles(fullPath, fileList, baseDir);
        } else if (file.isFile() && file.name.endsWith('.md')) {
            const relativePath = path.relative(baseDir, fullPath);
            fileList.push(relativePath);
        }
    }
    return fileList;
}

async function generateSkillsData() {
    let skillsData = [];

    try {
        if (!fs.existsSync(postsRootDirectory)) {
            console.warn(`경고: 게시물 디렉토리를 찾을 수 없습니다: ${postsRootDirectory}.`);
            return;
        }

        const markdownRelativePaths = await getAllMarkdownFiles(postsRootDirectory);

        for (const relativePath of markdownRelativePaths) {
            const posixRelativePath = relativePath.replace(/\\/g, '/');

            if (posixRelativePath.includes('template')) continue;

            const filePath = path.join(postsRootDirectory, relativePath);
            const markdownContent = await fs.promises.readFile(filePath, 'utf8');
            const frontMatter = parseFrontMatterForSkillBuild(markdownContent);

            if (frontMatter.category1 === 'my skill') { // Changed from 'skill' to 'my skill'
                const id = path.basename(posixRelativePath, '.md');
                
                let category2 = frontMatter.category2 || 'uncategorized';
                // category2 값을 정규화하여 일관성을 유지합니다.
                category2 = category2.replace(/\s/g, '').toLowerCase(); // 공백 제거 및 소문자 변환
                if (category2 === 'backend') category2 = 'Back end';
                else if (category2 === 'frontend') category2 = 'Front end';

                skillsData.push({
                    id: id,
                    title: frontMatter.title || id,
                    category2: category2, // category2는 그대로 유지
                    familiar: frontMatter.familiar || '', // 'proficiency' 대신 'familiar' 사용
                    summary: frontMatter.summary || '',
                    thumbnail: frontMatter.thumbnail || frontMatter.logo || '',
                    link: `/post-template.html?id=${id}`
                });
            }
        }

        const fileContent = `export const skills = ${JSON.stringify(skillsData, null, 4)};\n`;
        await fs.promises.writeFile(outputFilePath, fileContent, 'utf8');

        console.log(`✅ ${outputFilePath} 파일이 성공적으로 생성되었습니다.`);
        console.log(`✅ 총 ${skillsData.length}개의 스킬이 처리되었습니다.`);
    } catch (error) {
        console.error('🚨 스킬 데이터를 생성하는 중 오류가 발생했습니다:', error);
    }
    console.log("-----------------------------------------");
}

generateSkillsData();