/**
 * Markdown 텍스트에서 Front Matter와 순수 콘텐츠를 분리하여 파싱합니다.
 * @param {string} markdown - 파싱할 Markdown 전체 텍스트.
 * @returns {{frontMatter: object, content: string}} - 파싱된 Front Matter 객체와 나머지 콘텐츠.
 */
function parseFrontMatter(markdown) {
    // 'g' 플래그를 추가하여 lastIndex를 사용하고, 시작 부분(^)에만 매치되도록 합니다.
    const frontMatterRegex = /^---([\s\S]*?)---\s*/g;
    const match = frontMatterRegex.exec(markdown);

    if (!match) {
        return { frontMatter: {}, content: markdown };
    }

    const frontMatterBlock = match[1].trim();
    const content = markdown.substring(frontMatterRegex.lastIndex);
    const frontMatter = {};

    frontMatterBlock.trim().split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim();
            frontMatter[key] = value.replace(/^["']|["']$/g, ''); // 따옴표 제거
        }
    });

    return { frontMatter, content };
}

/**
 * project.html 페이지에 프로젝트 목록을 렌더링합니다.
 */
async function renderProjectList() {
    const container = document.getElementById('all-project-list');
    if (!container) return; // 해당 ID의 컨테이너가 없으면 함수 종료

    const projectPosts = posts.filter(post => post.category1 === 'project');
    if (projectPosts.length === 0) {
        container.innerHTML = '<p>아직 프로젝트가 없습니다.</p>';
        return;
    }

    for (const post of projectPosts) {
        const response = await fetch(post.path);
        const markdown = await response.text();
        const { frontMatter } = parseFrontMatter(markdown);

        const projectCard = document.createElement('div');
        projectCard.className = 'project-card'; // CSS 스타일링을 위한 클래스
        projectCard.innerHTML = `
            <a href="post.html?id=${post.id}">
                <img src="${frontMatter.thumbnail || './asset/image/placeholder.png'}" alt="${frontMatter['project title']}">
                <div class="card-content">
                    <h3>${frontMatter['project title']}</h3>
                    <p>${frontMatter.summary}</p>
                </div>
            </a>
        `;
        container.appendChild(projectCard);
    }
}

/**
 * post.html 페이지에 특정 게시물의 상세 내용을 렌더링합니다.
 */
async function renderPostDetail() {
    const container = document.getElementById('post-container');
    if (!container) return; // 해당 ID의 컨테이너가 없으면 함수 종료

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        container.innerHTML = '<h2>게시물을 찾을 수 없습니다.</h2><p>URL에 ID가 지정되지 않았습니다.</p>';
        return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) {
        container.innerHTML = '<h2>게시물을 찾을 수 없습니다.</h2><p>해당 ID의 게시물이 존재하지 않습니다.</p>';
        return;
    }

    const response = await fetch(post.path);
    const markdown = await response.text();
    const { frontMatter, content } = parseFrontMatter(markdown);

    // 페이지 제목을 게시물 제목으로 업데이트
    document.title = `${frontMatter['project title'] || frontMatter.title} - Junseo Blog`;

    // 파싱된 콘텐츠를 HTML로 변환하여 렌더링
    container.innerHTML = `
        <h1>${frontMatter['project title'] || frontMatter.title}</h1>
        <div class="post-body">${content ? marked.parse(content) : ''}</div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    const loadHeader = fetch('./template/header.html').then(res => res.text()).then(html => document.querySelector('header').innerHTML = html);
    const loadFooter = fetch('./template/footer.html').then(res => res.text()).then(html => document.querySelector('footer').innerHTML = html);

    // 헤더와 푸터가 모두 로드된 후, 페이지별 콘텐츠 렌더링 실행
    Promise.all([loadHeader, loadFooter]).then(() => {
        // 현재 페이지에 필요한 렌더링 함수만 선택적으로 실행합니다.
        if (document.getElementById('all-project-list')) {
            renderProjectList();
        }
        if (document.getElementById('post-container')) {
            renderPostDetail();
        }
        // 향후 skill.html 등을 위한 렌더링 함수도 여기에 추가할 수 있습니다.
        // if (document.getElementById('all-skill-list')) renderSkillList();
    });
});