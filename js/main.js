import { parseFrontMatter } from './parser.js';
import {
    renderProjectList, renderPostDetail, renderTroubleshootingList,
    renderDecisionList, renderAllPostList, generateToc, renderBlogHomeList,
    renderHomeSkills, renderSkillCards, showSkillOverlay, closeSkillOverlay
} from './render.js';
import { posts } from './post-list.js'; // 모든 게시물 목록
import { GNB_BUTTON_VISIBILITY, GNB_STYLE } from './const.js'; // GNB 버튼 가시성 설정을 위한 상수 임포트

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
    'index.html': [renderBlogHomeList],
    'portfolio-home.html': [renderProjectList, renderHomeSkills],
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
    // 경로에서 파일 이름을 추출. 루트('/')는 'index.html'로 처리합니다.
    let pageName = pathname.substring(pathname.lastIndexOf('/') + 1);
    if (pageName === '') {
        pageName = 'index.html';
    }

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
    const gnb = document.querySelector('.gnb');
    if (gnb) {
        // 기존 GNB 스타일 클래스를 제거하고 현재 설정된 스타일 클래스를 추가합니다.
        gnb.classList.remove('portfolio-gnb', 'blog-gnb');
        gnb.classList.add(GNB_STYLE);

        // GNB 스타일에 따라 Home 링크를 동적으로 변경합니다.
        const homeLink = document.querySelector('[data-gnb-id="home"] a');
        if (homeLink) {
            if (GNB_STYLE === 'blog-gnb') {
                homeLink.href = './index.html'; // 블로그 홈
            } else { // 'portfolio-gnb'
                homeLink.href = './portfolio-home.html'; // 포트폴리오 홈
            }
        }
    }

    const gnbButtons = document.querySelectorAll('[data-gnb-id]'); // GNB 버튼을 식별하는 셀렉터
    gnbButtons.forEach(button => {
        const buttonId = button.dataset.gnbId;
        if (buttonId && GNB_BUTTON_VISIBILITY.hasOwnProperty(buttonId)) {
            if (GNB_BUTTON_VISIBILITY[buttonId] === false) {
                button.style.display = 'none'; // false면 button 숨김
            } else {
                button.style.display = ''; // true면 기본값(보임)으로 설정
            }
        } else if (buttonId) {
            // GNB_BUTTON_VISIBILITY 설정에 없는 버튼은 기본적으로 숨깁니다.
            button.style.display = 'none';
        }
    });
}

/**
 * GNB 스타일 전환 버튼에 대한 이벤트 리스너를 설정합니다.
 */
function setupGnbSwitchListeners() {
    const portfolioBtn = document.querySelector('[data-gnb-id="portfolio-btn"]');
    const blogBtn = document.querySelector('[data-gnb-id="blog-btn"]');

    if (portfolioBtn) {
        portfolioBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.setItem('gnbStyle', 'portfolio-gnb');
            window.location.href = './portfolio-home.html'; // 포트폴리오 홈으로 이동
        });
    }

    if (blogBtn) {
        blogBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.setItem('gnbStyle', 'blog-gnb');
            window.location.href = './index.html'; // 블로그 홈으로 이동
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loadHeader = fetch('./template/header.html').then(res => res.text()).then(html => document.querySelector('header').innerHTML = html);
    const loadFooter = fetch('./template/footer.html').then(res => res.text()).then(html => document.querySelector('footer').innerHTML = html);

    Promise.all([loadHeader, loadFooter]).then(async () => {
        await buildDetailedPosts(); // 모든 포스트 정보를 미리 빌드합니다.
        await router(detailedPosts);
        applyGnbVisibility(); // 헤더 로드 후 GNB 가시성 적용
        setupGnbSwitchListeners(); // GNB 전환 버튼 리스너 설정
    });
});