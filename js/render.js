import { DOM_IDS } from './const.js';

/**
 * project.html 페이지에 프로젝트 목록을 렌더링합니다.
 */
export async function renderProjectList(detailedPosts) {
    const container = document.getElementById(DOM_IDS.ALL_PROJECT_LIST); // ID가 통합되었습니다.
    if (!container) return; // 해당 ID의 컨테이너가 없으면 함수 종료

    const limit = container.dataset.limit ? parseInt(container.dataset.limit, 10) : null;

    // 전달받은 detailedPosts에서 'project' 타입의 게시물을 필터링합니다.
    let projectPosts = detailedPosts.filter(post => post.frontMatter.category1 === 'project overview');

    if (limit) {
        projectPosts = projectPosts.slice(0, limit);
    }

    if (projectPosts.length === 0) {
        container.innerHTML = '<p>아직 프로젝트가 없습니다.</p>';
        return;
    }

    container.innerHTML = ''; // 중복 렌더링을 방지하기 위해 컨테이너를 비웁니다.

    for (const post of projectPosts) {
        const { frontMatter, id } = post;

        const projectCard = document.createElement('div');
        projectCard.className = 'project-card'; // CSS 스타일링을 위한 클래스
        projectCard.innerHTML = `
            <a href="post.html?id=${id}">
                <div class="card-content">
                    <h3>${frontMatter['project title'] || frontMatter.title}</h3>
                    <p class="summary">${frontMatter.summary || ''}</p>
                    <div class="core-tech">
                        <!-- core tech 내용은 추후 추가 예정이므로 비워둡니다 -->
                    </div>
                </div>
            </a>
        `;
        container.appendChild(projectCard);
    }
}

/**
 * post.html 페이지에 특정 게시물의 상세 내용을 렌더링합니다. 'project overview' 타입에 대한 특별 로직을 포함합니다.
 */
export async function renderPostDetail(detailedPosts) {
    const container = document.getElementById(DOM_IDS.POST_CONTAINER);
    if (!container) return; // 해당 ID의 컨테이너가 없으면 함수 종료

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        container.innerHTML = '<h2>게시물을 찾을 수 없습니다.</h2><p>URL에 ID가 지정되지 않았습니다.</p>';
        return;
    }

    // 전달받은 detailedPosts에서 현재 게시물 정보를 찾습니다.
    const post = detailedPosts.find(p => p.id === postId);
    if (!post) {
        container.innerHTML = '<h2>게시물을 찾을 수 없습니다.</h2><p>해당 ID의 게시물이 존재하지 않습니다.</p>';
        return;
    }

    const { frontMatter, content } = post;

    // 'project overview' 게시물인 경우, 특별한 레이아웃으로 렌더링합니다.
    if (frontMatter.category1 === 'project overview') {
        const displayTitle = frontMatter['project title'] || frontMatter.title;
        document.title = `${displayTitle} - Junseo Blog`;

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
            <h1>${displayTitle}</h1>
            <p class="overview-subtitle">overview</p>
            <p class="summary">${frontMatter.summary}</p>
            ${propertiesHtml}
            <div class="post-body">${content ? marked.parse(content) : ''}</div>
        `;

        // 3. 연관 게시물(document, troubleshooting, decision) 목록을 찾아서 삽입합니다.
        const projectName = displayTitle;
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
                listContainer.className = DOM_IDS.RELATED_POSTS_LIST_CLASS;
                listContainer.innerHTML = listHtml;
                headingElement.parentNode.insertBefore(listContainer, headingElement.nextSibling);
            };

            renderRelatedPosts('document', 'document');
            renderRelatedPosts('trouble shooting', 'trouble shooting');
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
export async function renderTroubleshootingList(detailedPosts) {
    const container = document.getElementById(DOM_IDS.ALL_TROUBLESHOOTING_LOG_LIST);
    if (!container) return;

    // 전달받은 detailedPosts에서 'troubleshooting' 카테고리의 게시물을 날짜 내림차순으로 필터링 및 정렬합니다.
    const troubleshootingPosts = detailedPosts
        .filter(post => post.frontMatter.category1 === 'trouble shooting')
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
        const summary = frontMatter.summary || '';
        listHtml += `
            <li>
                <a href="post.html?id=${id}">
                    <h3>${frontMatter.title}</h3>
                    <p class="summary">${summary}</p>
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
export async function renderDecisionList(detailedPosts) {
    const container = document.getElementById(DOM_IDS.ALL_DECISION_LOG_LIST);
    if (!container) return;

    // 전달받은 detailedPosts에서 'decision' 카테고리의 게시물을 날짜 내림차순으로 필터링 및 정렬합니다.
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
        const summary = frontMatter.summary || '';
        listHtml += `
            <li>
                <a href="post.html?id=${id}">
                    <h3>${frontMatter.title}</h3>
                    <p class="summary">${summary}</p>
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