import { parseFrontMatter } from './parser.js';
import { renderProjectList, renderPostDetail, renderTroubleshootingList, renderDecisionList } from './render.js';
import { posts } from './post-list.js';

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
    'index.html': [renderProjectList],
    'project.html': [renderProjectList],
    'post.html': [renderPostDetail],
    'troubleshooting.html': [renderTroubleshootingList],
    'decision.html': [renderDecisionList],
    'skill.html': [], // Placeholder for renderSkillList
    'about.html': [], // Placeholder for renderAboutMe
};

async function router(posts) {
    const pathname = window.location.pathname;
    // Extract filename from path. Handles both root '/' and '/index.html' as 'index.html'.
    const pageName = pathname.endsWith('/') ? 'index.html' : pathname.substring(pathname.lastIndexOf('/') + 1);

    const renderFunctions = routes[pageName];

    if (renderFunctions) {
        for (const renderFunc of renderFunctions) {
            await renderFunc(posts);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loadHeader = fetch('/template/header.html').then(res => res.text()).then(html => document.querySelector('header').innerHTML = html);
    const loadFooter = fetch('/template/footer.html').then(res => res.text()).then(html => document.querySelector('footer').innerHTML = html);

    Promise.all([loadHeader, loadFooter]).then(async () => {
        await buildDetailedPosts(); // 모든 포스트 정보를 미리 빌드합니다.
        await router(detailedPosts);
    });
});