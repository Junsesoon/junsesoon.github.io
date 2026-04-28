// 이 스크립트는 Node.js 환경에서 실행되어야 합니다.
// 브라우저에서 직접 실행되지 않습니다.
// `node js/build-post.js` 명령어로 실행하여 `js/post.js` 파일을 생성/업데이트합니다.

const fs = require('fs'); // Node.js 파일 시스템 모듈
const path = require('path');

// 마크다운 게시물 파일들이 위치한 디렉토리
const postsDirectory = path.join(__dirname, '../../junseo-blog/post');
// 생성될 post-list.js 파일의 경로
const outputFilePath = path.join(__dirname, './post-list.js');
// 2. 확인용 로그 추가 (어디를 보고 있는지 터미널에 찍어줍니다)

console.log("-----------------------------------------");
console.log("🛠  빌드 자동화 스크립트 실행");

/**
 * Markdown 텍스트에서 Front Matter를 파싱합니다.
 * 이 함수는 빌드 스크립트에서 사용되며, main.js의 parseFrontMatter와 유사하지만
 * 콘텐츠 분리 없이 Front Matter만 추출합니다.
 * @param {string} markdown - 파싱할 Markdown 전체 텍스트.
 * @returns {object} - 파싱된 Front Matter 객체.
 */
function parseFrontMatterForBuild(markdown) {
    const frontMatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = frontMatterRegex.exec(markdown);

    if (!match) {
        return {};
    }

    const frontMatterBlock = match[1];
    const frontMatter = {};
    const lines = frontMatterBlock.split('\n');
    let currentKey = null;

    lines.forEach(line => {
        if (line.trim() === '') return;

        const lineIndent = line.match(/^\s*/)[0].length;
        const trimmedLine = line.trimStart();

        const colonIndex = trimmedLine.indexOf(':');
        const isNewKey = colonIndex > -1 && lineIndent === 0;

        if (isNewKey) {
            currentKey = trimmedLine.substring(0, colonIndex).trim();
            const value = trimmedLine.substring(colonIndex + 1).trim();
            if (value) { // 값이 있는 경우에만 할당
                frontMatter[currentKey] = value.replace(/^["']|["']$/g, '');
            }
        } else if (currentKey && trimmedLine.startsWith('-') && lineIndent > 0) {
            const listItem = trimmedLine.substring(1).trim().replace(/^["']|["']$/g, '');
            if (!Array.isArray(frontMatter[currentKey])) {
                frontMatter[currentKey] = [];
            }
            frontMatter[currentKey].push(listItem);
        }
    });

    // category1이 배열인 경우 첫 번째 항목을 사용합니다.
    if (Array.isArray(frontMatter.category1)) {
        frontMatter.category1 = frontMatter.category1[0] || null;
    }

    return frontMatter;
}

async function generatePostsData() {
    let postsData = [];

    try {
        // 게시물 디렉토리가 존재하는지 확인
        if (!fs.existsSync(postsDirectory)) {
            console.warn(`경고: 게시물 디렉토리를 찾을 수 없습니다: ${postsDirectory}. 빈 posts.js 파일이 생성됩니다.`);
            await fs.promises.writeFile(outputFilePath, 'const posts = [];\n', 'utf8');
            return;
        }

        const files = await fs.promises.readdir(postsDirectory);

        for (const file of files) {
            if (file.endsWith('.md')) {
                const filePath = path.join(postsDirectory, file);
                const markdownContent = await fs.promises.readFile(filePath, 'utf8');

                const frontMatter = parseFrontMatterForBuild(markdownContent);

                const id = file.replace(/\.md$/, ''); // 파일명에서 .md 확장자 제거
                const category1 = frontMatter.category1 || 'uncategorized'; // Front Matter에 category1이 없으면 'uncategorized'로 기본값 설정
                const postPath = `./post/${file}`; // HTML 파일 기준 게시물 경로

                postsData.push({ id, category1, path: postPath });
            }
        }

        const outputContent = `const posts = ${JSON.stringify(postsData, null, 4)};\n`;
        await fs.promises.writeFile(outputFilePath, outputContent, 'utf8');
        console.log(`성공적으로 ${outputFilePath} 파일을 생성했습니다.`);

    } catch (error) {
        console.error('게시물 데이터 생성 중 오류 발생:', error);
        // 오류 발생 시 빈 posts 배열을 가진 파일을 생성하여 애플리케이션이 깨지지 않도록 함
        await fs.promises.writeFile(outputFilePath, 'const posts = [];\n', 'utf8');
    }
}

generatePostsData();