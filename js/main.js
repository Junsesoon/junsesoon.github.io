import { parseFrontMatter } from './parser.js';
import {
    renderProjectList, renderPostDetail, renderTroubleshootingList,
    renderDecisionList, renderAllPostList, generateToc,
    renderHomeSkills, renderSkillCards, showSkillOverlay, closeSkillOverlay
} from './render.js';
import { posts } from './post-list.js'; // 모든 게시물 목록
import { GNB_BUTTON_VISIBILITY } from './const.js'; // GNB 버튼 가시성 설정을 위한 상수 임포트

/**
 * 모든 게시물의 상세 정보(Front Matter, 콘텐츠 포함)를 저장하는 전역 캐시 변수입니다.
 * 페이지 로드 시 한 번만 빌드하여 반복적인 fetch 요청을 방지합니다.
 */
let detailedPosts = [];

async function buildDetailedPosts() {
    if (detailedPosts.length > 0) return; // 이미 빌드되었다면 실행하지 않음

    const promises = posts.map(async (post) => {
        const response = await fetch(post.path);
        const markdown = await response.text();
        const { frontMatter, content } = parseFrontMatter(markdown);

        // Front Matter에 'title'이 없으면, 게시물 ID(파일명)를 기본 제목으로 사용합니다.
        if (!frontMatter.title) {
            frontMatter.title = post.id;
        }
        return { ...post, frontMatter, content };
    });

    detailedPosts = await Promise.all(promises);
}

const routes = {
    'index.html': [renderProjectList, renderHomeSkills],
    'project.html': [renderProjectList],
    'post.html': [renderAllPostList],
    'troubleshooting.html': [renderTroubleshootingList],
    'decision.html': [renderDecisionList],
    'post-template.html': [renderPostDetail],
    'skill.html': [renderSkillCards],
    'about.html': [], // Placeholder for renderAboutMe
};

async function router(posts) {
    const pathname = window.location.pathname;
    // 경로에서 파일 이름을 추출. 루트, '/', '/index.html' 모두 'index.html'로 처리함
    const pageName = pathname.endsWith('/') ? 'index.html' : pathname.substring(pathname.lastIndexOf('/') + 1);

    const renderFunctions = routes[pageName];

    if (renderFunctions) {
        for (const renderFunc of renderFunctions) {
            await renderFunc(posts);
        }

        // post-template.html 페이지인 경우, 렌더링 후 목차를 생성합니다.
        if (pageName === 'post-template.html') {
            generateToc();
        }
    }
}

/**
 * GNB 버튼의 가시성을 설정합니다.
 * const.js에 정의된 GNB_BUTTON_VISIBILITY 설정을 기반으로 버튼을 숨기거나 표시합니다.
 */
function applyGnbVisibility() {
    const gnbButtons = document.querySelectorAll('[data-gnb-id]'); // GNB 버튼을 식별하는 셀렉터
    gnbButtons.forEach(button => {
        const buttonId = button.dataset.gnbId;
        if (buttonId && GNB_BUTTON_VISIBILITY.hasOwnProperty(buttonId)) {
            if (GNB_BUTTON_VISIBILITY[buttonId] === false) {
                button.style.display = 'none'; // false면 button 숨김
            } else {
                button.style.display = ''; // true면 기본값(보임)으로 설정
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const loadHeader = fetch('./template/header.html').then(res => res.text()).then(html => document.querySelector('header').innerHTML = html);
    const loadFooter = fetch('./template/footer.html').then(res => res.text()).then(html => document.querySelector('footer').innerHTML = html);

    Promise.all([loadHeader, loadFooter]).then(async () => {
        await buildDetailedPosts(); // 모든 포스트 정보를 미리 빌드합니다.
        await router(detailedPosts);
        applyGnbVisibility(); // 헤더 로드 후 GNB 가시성 적용
    });
});