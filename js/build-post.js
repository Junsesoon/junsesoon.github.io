// 이 스크립트는 Node.js 환경에서 실행되어야 합니다.
// 브라우저에서 직접 실행되지 않습니다.
// `node js/build-post.js` 명령어로 실행하여 `js/post.js` 파일을 생성/업데이트합니다.

const fs = require('fs'); // Node.js 파일 시스템 모듈
const path = require('path');

// 마크다운 게시물 파일들이 위치한 디렉토리
const postsRootDirectory = path.join(__dirname, '../../junseo-blog/post');
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

/**
 * 주어진 디렉토리 내의 모든 마크다운 파일 경로를 재귀적으로 찾습니다.
 * @param {string} dir - 검색을 시작할 디렉토리 경로.
 * @param {string[]} fileList - 찾은 파일 경로를 저장할 배열.
 * @param {string} baseDir - 상대 경로 계산을 위한 기준 디렉토리.
 * @returns {Promise<string[]>} - 마크다운 파일들의 상대 경로 배열. (예: "category/post-name.md")
 */
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

async function generatePostsData() {
    let postsData = [];

    try {
        // 게시물 루트 디렉토리가 존재하는지 확인
        if (!fs.existsSync(postsRootDirectory)) {
            console.warn(`경고: 게시물 디렉토리를 찾을 수 없습니다: ${postsRootDirectory}. 빈 posts.js 파일이 생성됩니다.`);
            await fs.promises.writeFile(outputFilePath, 'const posts = [];\n', 'utf8');
            return;
        }

        // 모든 마크다운 파일의 상대 경로를 가져옵니다.
        const markdownRelativePaths = await getAllMarkdownFiles(postsRootDirectory);

        for (const relativePath of markdownRelativePaths) {
            // Windows 경로 구분자(\)를 POSIX 구분자(/)로 통일합니다.
            const posixRelativePath = relativePath.replace(/\\/g, '/');

            // 'template' 문자열을 포함하는 경로(폴더 또는 파일)는 건너뜁니다.
            if (posixRelativePath.includes('template')) {
                console.log(`🟡 템플릿 파일/폴더를 건너뜁니다: ${posixRelativePath}`);
                continue;
            }

            const filePath = path.join(postsRootDirectory, relativePath);
            const markdownContent = await fs.promises.readFile(filePath, 'utf8');

            const frontMatter = parseFrontMatterForBuild(markdownContent);

            // 파일명만 ID로 사용합니다. (예: "파이썬")
            const id = path.basename(posixRelativePath, '.md');
            const category1 = frontMatter.category1 || 'uncategorized'; // Front Matter에 category1이 없으면 'uncategorized'로 기본값 설정
            const postPath = `./post/${posixRelativePath}`; // HTML 파일 기준 게시물 경로 (예: "./post/knowledge/파이썬.md")

            postsData.push({ id, category1, path: postPath });
        }

        const fileContent = `export const posts = ${JSON.stringify(postsData, null, 4)};\n`;
        await fs.promises.writeFile(outputFilePath, fileContent, 'utf8');

        console.log(`✅ ${outputFilePath} 파일이 성공적으로 생성되었습니다.`);
        console.log(`✅ 총 ${postsData.length}개의 게시물이 처리되었습니다.`);
    } catch (error) {
        console.error('🚨 게시물 데이터를 생성하는 중 오류가 발생했습니다:', error);
    }
    console.log("-----------------------------------------");
}

// 스크립트 실행
generatePostsData();