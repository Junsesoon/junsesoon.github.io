/**
 * 모든 게시물의 상세 정보(Front Matter, 콘텐츠 포함)를 저장하는 전역 캐시 변수입니다.
 * 페이지 로드 시 한 번만 빌드하여 반복적인 fetch 요청을 방지합니다.
 */
let detailedPosts = [];

/**
 * post-list.js의 모든 게시물 경로를 기반으로 Markdown 파일을 가져와 파싱한 후,
 * detailedPosts 배열에 상세 정보를 채웁니다.
 */
async function buildDetailedPosts() {
    if (detailedPosts.length > 0) return; // 이미 빌드되었다면 실행하지 않음

    const promises = posts.map(async (post) => {
        const response = await fetch(post.path);
        const markdown = await response.text();
        const { frontMatter, content } = parseFrontMatter(markdown);
        return { ...post, frontMatter, content };
    });

    detailedPosts = await Promise.all(promises);
}

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

    // 미리 빌드된 detailedPosts에서 'project' 타입의 게시물을 필터링합니다.
    const projectPosts = detailedPosts.filter(post => post.frontMatter.category1 === 'project overview');
    if (projectPosts.length === 0) {
        container.innerHTML = '<p>아직 프로젝트가 없습니다.</p>';
        return;
    }

    container.innerHTML = ''; // 중복 렌더링을 방지하기 위해 컨테이너를 비웁니다.

    for (const post of projectPosts) {
        const { frontMatter } = post;

        const projectCard = document.createElement('div');
        projectCard.className = 'project-card'; // CSS 스타일링을 위한 클래스
        projectCard.innerHTML = `
            <a href="post.html?id=${post.id}">
                <div class="card-content">
                    <h3>${frontMatter['project title'] || frontMatter.title}</h3>
                    <p>${frontMatter.summary}</p>
                </div>
            </a>
        `;
        container.appendChild(projectCard);
    }
}

/**
 * post.html 페이지에 특정 게시물의 상세 내용을 렌더링합니다. 'project overview' 타입에 대한 특별 로직을 포함합니다.
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

    // 미리 빌드된 detailedPosts에서 현재 게시물 정보를 찾습니다.
    const post = detailedPosts.find(p => p.id === postId);
    if (!post) {
        container.innerHTML = '<h2>게시물을 찾을 수 없습니다.</h2><p>해당 ID의 게시물이 존재하지 않습니다.</p>';
        return;
    }

    const { frontMatter, content } = post;

    // 'project overview' 게시물인 경우, 특별한 레이아웃으로 렌더링합니다.
    if (frontMatter.category1 === 'project overview') {
        document.title = `${frontMatter['project title']} - Junseo Blog`;

        // 1. Front Matter 속성을 테이블 형태로 만듭니다.
        let propertiesHtml = '<div class="project-properties"><h2>Project Summary</h2><table>';
        const propertyOrder = ['start date', 'end date', '플랫폼', '개발인원', '담당역할', '언어', '서버', '프레임워크', 'DB', 'IDE', 'API', '라이브러리', 'tag'];
        propertyOrder.forEach(key => {
            if (frontMatter[key]) {
                propertiesHtml += `<tr><th>${key}</th><td>${frontMatter[key]}</td></tr>`;
            }
        });
        propertiesHtml += '</table></div>';

        // 2. 썸네일, 요약, 속성 테이블, 마크다운 본문을 포함한 기본 구조를 렌더링합니다.
        container.innerHTML = `
            <h1>${frontMatter['project title']}</h1>
            <p class="overview-subtitle">overview</p>
            <p class="summary">${frontMatter.summary}</p>
            ${propertiesHtml}
            <div class="post-body">${content ? marked.parse(content) : ''}</div>
        `;

        // 3. 연관 게시물(document, troubleshooting, decision) 목록을 찾아서 삽입합니다.
        const projectName = frontMatter['project title'];
        if (projectName) {
            const relatedPosts = detailedPosts.filter(p => p.frontMatter.project === projectName && p.id !== postId);

            const renderRelatedPosts = (category, headingText) => {
                const headingElement = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).find(h => h.textContent.trim().toLowerCase() === headingText.toLowerCase());
                if (!headingElement) return;

                const postsForCategory = relatedPosts
                    .filter(p => p.frontMatter.category1 === category)
                    .sort((a, b) => new Date(b.frontMatter.date) - new Date(a.frontMatter.date));

                let listHtml = postsForCategory.length > 0
                    ? '<ul>' + postsForCategory.slice(0, 3).map(p => `<li><a href="post.html?id=${p.id}">${p.frontMatter.title}</a> (${p.frontMatter.date || '날짜 없음'})</li>`).join('') + '</ul>'
                    : '<p>관련 게시물이 없습니다.</p>';

                const listContainer = document.createElement('div');
                listContainer.className = 'related-posts-list';
                listContainer.innerHTML = listHtml;
                headingElement.parentNode.insertBefore(listContainer, headingElement.nextSibling);
            };

            renderRelatedPosts('document', 'document');
            renderRelatedPosts('troubleshooting', 'trouble shooting');
            renderRelatedPosts('decision', 'decision');
        }
    } else {
        // 일반 게시물 렌더링
        document.title = `${frontMatter.title} - Junseo Blog`;
        container.innerHTML = `
            <h1>${frontMatter.title}</h1>
            <div class="post-meta">${frontMatter.date ? `<p>작성일: ${frontMatter.date}</p>` : ''}</div>
            <div class="post-body">${content ? marked.parse(content) : ''}</div>
        `;
    }
}

/**
 * troubleshooting.html 페이지에 트러블슈팅 로그 목록을 렌더링합니다.
 */
async function renderTroubleshootingList() {
    const container = document.getElementById('all-troubleshooting-log-list');
    if (!container) return;

    // 'troubleshooting' 카테고리의 게시물을 날짜 내림차순으로 필터링 및 정렬합니다.
    const troubleshootingPosts = detailedPosts
        .filter(post => post.frontMatter.category1 === 'troubleshooting')
        .sort((a, b) => new Date(b.frontMatter.date) - new Date(a.frontMatter.date));

    if (troubleshootingPosts.length === 0) {
        container.innerHTML = '<p>아직 작성된 트러블슈팅 로그가 없습니다.</p>';
        return;
    }

    // 페이지네이션 로직
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page') || '1', 10);
    const postsPerPage = 9;
    const totalPages = Math.ceil(troubleshootingPosts.length / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;

    // 현재 페이지에 해당하는 게시물만 선택합니다.
    const postsForPage = troubleshootingPosts.slice(startIndex, startIndex + postsPerPage);

    let listHtml = '<ul class="post-list">'; // CSS 스타일링을 위한 클래스
    for (const post of postsForPage) {
        const { frontMatter, id } = post;
        const summary = frontMatter.summary || '요약 정보가 없습니다.';
        listHtml += `
            <li>
                <a href="post.html?id=${id}">
                    <h3>${frontMatter.title || '제목 없음'}</h3>
                    <p>${summary}</p>
                    <span class="post-date">${frontMatter.date || '날짜 없음'}</span>
                </a>
            </li>`;
    }
    listHtml += '</ul>';

    // 페이지네이션 컨트롤
    let paginationHtml = '';
    if (totalPages > 1) {
        paginationHtml = '<div class="pagination">';
        if (currentPage > 1) {
            paginationHtml += `<a href="?page=${currentPage - 1}">[prev]</a>`;
        } else {
            paginationHtml += `<span>[prev]</span>`;
        }
        if (currentPage < totalPages) {
            paginationHtml += `<a href="?page=${currentPage + 1}">[next]</a>`;
        } else {
            paginationHtml += `<span>[next]</span>`;
        }
        paginationHtml += '</div>';
    }

    container.innerHTML = listHtml + paginationHtml;
}

/**
 * decision.html 페이지에 의사결정 로그 목록을 렌더링합니다.
 */
async function renderDecisionList() {
    const container = document.getElementById('all-decision-log-list');
    if (!container) return;

    // 'decision' 카테고리의 게시물을 날짜 내림차순으로 필터링 및 정렬합니다.
    const decisionPosts = detailedPosts
        .filter(post => post.frontMatter.category1 === 'decision')
        .sort((a, b) => new Date(b.frontMatter.date) - new Date(a.frontMatter.date));

    if (decisionPosts.length === 0) {
        container.innerHTML = '<p>아직 작성된 의사결정 로그가 없습니다.</p>';
        return;
    }

    // 페이지네이션 로직
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page') || '1', 10);
    const postsPerPage = 9;
    const totalPages = Math.ceil(decisionPosts.length / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;

    // 현재 페이지에 해당하는 게시물만 선택합니다.
    const postsForPage = decisionPosts.slice(startIndex, startIndex + postsPerPage);

    let listHtml = '<ul class="post-list">'; // CSS 스타일링을 위한 클래스
    for (const post of postsForPage) {
        const { frontMatter, id } = post;
        const summary = frontMatter.summary || '요약 정보가 없습니다.';
        listHtml += `
            <li>
                <a href="post.html?id=${id}">
                    <h3>${frontMatter.title || '제목 없음'}</h3>
                    <p>${summary}</p>
                    <span class="post-date">${frontMatter.date || '날짜 없음'}</span>
                </a>
            </li>`;
    }
    listHtml += '</ul>';

    // 페이지네이션 컨트롤
    let paginationHtml = '';
    if (totalPages > 1) {
        paginationHtml = '<div class="pagination">';
        if (currentPage > 1) {
            paginationHtml += `<a href="?page=${currentPage - 1}">[prev]</a>`;
        } else {
            paginationHtml += `<span>[prev]</span>`;
        }
        if (currentPage < totalPages) {
            paginationHtml += `<a href="?page=${currentPage + 1}">[next]</a>`;
        } else {
            paginationHtml += `<span>[next]</span>`;
        }
        paginationHtml += '</div>';
    }

    container.innerHTML = listHtml + paginationHtml;
}

document.addEventListener('DOMContentLoaded', () => {
    const loadHeader = fetch('./template/header.html').then(res => res.text()).then(html => document.querySelector('header').innerHTML = html);
    const loadFooter = fetch('./template/footer.html').then(res => res.text()).then(html => document.querySelector('footer').innerHTML = html);

    Promise.all([loadHeader, loadFooter]).then(async () => {
        await buildDetailedPosts(); // 모든 포스트 정보를 미리 빌드합니다.

        if (document.getElementById('all-project-list')) {
            renderProjectList();
        }
        if (document.getElementById('post-container')) {
            renderPostDetail();
        }
        if (document.getElementById('all-troubleshooting-log-list')) {
            renderTroubleshootingList();
        }
        if (document.getElementById('all-decision-log-list')) {
            renderDecisionList();
        }
    });
});