import { DOM_IDS, CATEGORIES, PAGINATION, PROJECT_PROPERTY_ORDER } from './const.js';

/**
 * project.html 페이지에 프로젝트 목록을 렌더링합니다.
 */
export async function renderProjectList(detailedPosts) {
    // 홈페이지(home-project-list) 또는 프로젝트 페이지(project-list)의 컨테이너를 찾습니다.
    const container = document.getElementById(DOM_IDS.HOME_PROJECT_LIST) || document.getElementById(DOM_IDS.PROJECT_LIST);

    if (!container) return; // 컨테이너가 두 페이지 모두에 없으면 함수 종료

    const limit = container.dataset.limit ? parseInt(container.dataset.limit, 10) : null;

    // 전달받은 detailedPosts에서 'project' 타입의 게시물을 필터링합니다.
    let projectPosts = detailedPosts.filter(post => post.frontMatter.category1 === CATEGORIES.PROJECT_OVERVIEW);

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
            <a href="./post-template.html?id=${id}">
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
 * post-template.html 페이지에 특정 게시물의 상세 내용을 렌더링합니다. 'project overview' 타입에 대한 특별 로직을 포함합니다
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
    
    if (frontMatter.category1 === CATEGORIES.PROJECT_OVERVIEW) {
        await renderProjectOverviewDetail(container, post, detailedPosts);
    } else {
        await renderGeneralPostDetail(container, post);
    }
}

/**
 * troubleshooting.html 페이지에 트러블슈팅 로그 목록을 렌더링합니다
 */
export async function renderTroubleshootingList(detailedPosts) {
    const container = document.getElementById(DOM_IDS.ALL_TROUBLESHOOTING_LOG_LIST);
    if (!container) return;

    const troubleshootingPosts = detailedPosts
        .filter(post => post.frontMatter.category1 === CATEGORIES.TROUBLE_SHOOTING)
        .sort((a, b) => new Date(b.frontMatter['end date']) - new Date(a.frontMatter['end date']));

    renderPaginatedList(container, troubleshootingPosts, '작성된 트러블슈팅 로그가 없습니다.');
}

/**
 * decision.html 페이지에 의사결정 로그 목록을 렌더링합니다
 */
export async function renderDecisionList(detailedPosts) {
    const container = document.getElementById(DOM_IDS.ALL_DECISION_LOG_LIST);
    if (!container) return;

    // 전달받은 detailedPosts에서 'decision' 카테고리의 게시물을 날짜 내림차순으로 필터링 및 정렬합니다
    const decisionPosts = detailedPosts
        .filter(post => post.frontMatter.category1 === CATEGORIES.DECISION)
        .sort((a, b) => new Date(b.frontMatter['end date']) - new Date(a.frontMatter['end date']));

    renderPaginatedList(container, decisionPosts, '작성된 의사결정 로그가 없습니다.');
}

/**
 * post.html 페이지에 모든 게시물(knowledge, troubleshooting, decision) 목록을 렌더링합니다.
 */
export async function renderAllPostList(detailedPosts) {
    const container = document.getElementById(DOM_IDS.ALL_POST_LIST);
    if (!container) return;

    // 'knowledge', 'trouble shooting', 'decision' 카테고리의 게시물을 날짜 내림차순으로 필터링 및 정렬합니다.
    const allowedCategories = [CATEGORIES.KNOWLEDGE, CATEGORIES.TROUBLE_SHOOTING, CATEGORIES.DECISION];
    const combinedPosts = detailedPosts
        .filter(post => allowedCategories.includes(post.frontMatter.category1))
        .sort((a, b) => new Date(b.frontMatter['end date']) - new Date(a.frontMatter['end date']));

    renderPaginatedList(container, combinedPosts, '작성된 게시물이 없습니다.');
}

/**
 * 'project overview' 타입 게시물의 상세 내용을 렌더링합니다.
 * @param {HTMLElement} container - 게시물 내용을 렌더링할 DOM 요소
 * @param {object} post - 렌더링할 게시물 객체 (frontMatter, content 포함)
 * @param {Array} detailedPosts - 모든 상세 게시물 데이터 (연관 게시물 검색용)
 */
async function renderProjectOverviewDetail(container, post, detailedPosts) {
    const { frontMatter, content } = post;
    const displayTitle = frontMatter['project title'] || frontMatter.title;
    document.title = `${displayTitle} - Junseo Blog`;

    // 1. Front Matter 속성을 테이블 형태로 만듭니다.
    let propertiesHtml = '<div class="project-properties"><h2>Project Summary</h2><table>';
    PROJECT_PROPERTY_ORDER.forEach(key => {
        if (frontMatter[key]) {
            propertiesHtml += `<tr><th>${key}</th><td>${frontMatter[key]}</td></tr>`;
        }
    });
    propertiesHtml += '</table></div>';

    // 2. 썸네일, 요약, 속성 테이블, 마크다운 본문을 포함한 기본 구조를 렌더링합니다
    container.innerHTML = `
        <h1>${displayTitle}</h1>
        <p class="overview-subtitle">overview</p>
        <p class="summary">${frontMatter.summary}</p>
        ${propertiesHtml}
        <div class="post-body">${content ? marked.parse(content) : ''}</div>
    `;

    // 3. 연관 게시물(document, troubleshooting, decision) 목록을 찾아서 삽입합니다
    const projectName = displayTitle;
    if (projectName) {
        const relatedPosts = detailedPosts.filter(p => p.frontMatter.project === projectName && p.id !== post.id);

        const renderRelatedPosts = (category, headingText) => {
            const headingElement = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).find(h => h.textContent.trim().toLowerCase() === headingText.toLowerCase());
            if (!headingElement) return;

            const postsForCategory = relatedPosts
                .filter(p => p.frontMatter.category1 === category)
                .sort((a, b) => new Date(b.frontMatter['end date']) - new Date(a.frontMatter['end date']));

            let listHtml = postsForCategory.length > 0
                ? '<ul>' + postsForCategory.slice(0, 3).map(p => `<li><a href="./post-template.html?id=${p.id}">${p.frontMatter.title}</a> (${p.frontMatter['end date'] || '날짜 없음'})</li>`).join('') + '</ul>'
                : '<p>관련 게시물이 없습니다.</p>';

            const listContainer = document.createElement('div');
            listContainer.className = DOM_IDS.RELATED_POSTS_LIST_CLASS;
            listContainer.innerHTML = listHtml;
            headingElement.parentNode.insertBefore(listContainer, headingElement.nextSibling);
        };

        renderRelatedPosts(CATEGORIES.DOCUMENT, 'document');
        renderRelatedPosts(CATEGORIES.TROUBLE_SHOOTING, 'trouble shooting');
        renderRelatedPosts(CATEGORIES.DECISION, 'decision');
    }
}

/**
 * 일반 게시물의 상세 내용을 렌더링합니다
 * @param {HTMLElement} container - 게시물 내용을 렌더링할 DOM 요소
 * @param {object} post - 렌더링할 게시물 객체 (frontMatter, content 포함)
 */
async function renderGeneralPostDetail(container, post) {
    const { frontMatter, content } = post;
    document.title = `${frontMatter.title} - Junseo Blog`;

    let dateHtml = '';
    if (frontMatter['start date']) {
        dateHtml = `<p>작성일: ${frontMatter['start date']}</p>`;
        // end date가 있고 start date와 다를 경우에만 수정일을 표시합니다.
        if (frontMatter['end date'] && frontMatter['end date'] !== frontMatter['start date']) {
            dateHtml += `<p>수정일: ${frontMatter['end date']}</p>`;
        }
    }

    container.innerHTML = `
        <h1>${frontMatter.title}</h1>
        <div class="post-meta">${dateHtml}</div>
        <div class="post-body">${content ? marked.parse(content) : ''}</div>
    `;
}

/**
 * 페이지네이션된 목록과 컨트롤을 렌더링하는 공통 함수
 * @param {HTMLElement} container - 목록을 렌더링할 DOM 요소
 * @param {Array} posts - 렌더링할 전체 게시물 배열
 * @param {string} noPostsMessage - 게시물이 없을 때 표시할 메시지
 * @param {number} postsPerPage - 페이지 당 게시물 수
 */
function renderPaginatedList(container, posts, noPostsMessage, postsPerPage = PAGINATION.POSTS_PER_PAGE) {
    if (posts.length === 0) {
        container.innerHTML = `<p>${noPostsMessage}</p>`;
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page') || '1', 10);
    const totalPages = Math.ceil(posts.length / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;

    const postsForPage = posts.slice(startIndex, startIndex + postsPerPage);

    let listHtml = '<div class="post-card-list">'; // 카드 레이아웃을 위한 컨테이너
    for (const post of postsForPage) {
        const { frontMatter, id } = post;
        // summary가 배열일 경우를 대비해 join으로 처리
        const summary = Array.isArray(frontMatter.summary) ? frontMatter.summary.join(' ') : (frontMatter.summary || '');
        listHtml += `
            <div class="post-card">
                <a href="./post-template.html?id=${id}">
                    <div class="card-content">
                        <h3>${frontMatter.title}</h3>
                        <p class="summary">${summary}</p>
                        <div class="card-footer">
                            <span class="post-date">${frontMatter['end date'] || '날짜 없음'}</span>
                        </div>
                    </div>
                </a>
            </div>`;
    }
    listHtml += '</div>';

    let paginationHtml = '';
    if (totalPages > 1) {
        paginationHtml = '<div class="pagination">';
        paginationHtml += currentPage > 1 ? `<a href="?page=${currentPage - 1}">${PAGINATION.PREV_TEXT}</a>` : `<span>${PAGINATION.PREV_TEXT}</span>`;
        paginationHtml += currentPage < totalPages ? `<a href="?page=${currentPage + 1}">${PAGINATION.NEXT_TEXT}</a>` : `<span>${PAGINATION.NEXT_TEXT}</span>`;
        paginationHtml += '</div>';
    }

    container.innerHTML = listHtml + paginationHtml;
}

/**
 * 게시물 내용(#post-container)을 기반으로 목차(#toc-list)를 생성합니다.
 * h1, h2 태그를 대상으로 합니다.
 */
export function generateToc() {
    const postContainer = document.getElementById('post-container');
    const tocList = document.getElementById('toc-list');
    const tocContainer = document.getElementById('toc-container');

    // 목차 관련 DOM 요소가 없으면 함수를 종료합니다.
    if (!tocContainer || !tocList || !postContainer) {
        if (tocContainer) tocContainer.style.display = 'none';
        return;
    }

    tocList.innerHTML = ''; // 기존 목차 초기화
    const headers = postContainer.querySelectorAll('h1, h2');

    if (headers.length === 0) {
        tocContainer.style.display = 'none'; // 헤더가 없으면 목차 컨테이너를 숨깁니다.
        return;
    }

    tocContainer.style.display = 'block'; // 헤더가 있으면 목차 컨테이너를 보여줍니다.

    headers.forEach((header, index) => {
        let id = header.id;
        if (!id) {
            id = `header-${header.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}`;
            if (document.getElementById(id)) {
                id = `${id}-${index}`; // 중복 ID 방지
            }
            header.id = id;
        }

        const li = document.createElement('li');
        li.className = `toc-item-${header.tagName.toLowerCase()}`;
        li.innerHTML = `<a href="#${id}">${header.textContent}</a>`;
        tocList.appendChild(li);
    });

    // 스크롤 위치에 따라 목차 항목을 하이라이트하는 스크롤 스파이 기능
    const tocLinks = document.querySelectorAll('#toc-list a');
    const scrollSpy = () => {
        const offset = 80; // GNB 높이(60px) + 여유(20px)
        let currentActiveId = null;

        headers.forEach(header => {
            if (header.getBoundingClientRect().top < offset) {
                currentActiveId = header.id;
            }
        });

        tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentActiveId}`) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', scrollSpy);
    scrollSpy(); // 페이지 로드 시 초기 상태를 설정하기 위해 한 번 호출합니다.
}
