// Google Analytics 측정 ID
export const GA_MEASUREMENT_ID = 'G-BWB3NNP8NC';

// id 관리
export const DOM_IDS = {
    HOME_PROJECT_LIST: 'home-project-list', // 홈페이지 프로젝트 목록
    HOME_SKILL_LIST: 'HOME-skill-list', // 홈페이지 스킬 목록
    PROJECT_LIST: 'PRJ-project-list', // 프로젝트 페이지 목록
    BLOG_HOME_POST_LIST: 'blog-home-post-list', // 블로그 홈 게시물 목록
    ALL_TROUBLESHOOTING_LOG_LIST: 'TRB-troubleshooting-log-list',
    ALL_DECISION_LOG_LIST: 'DEC-decision-log-list',
    ALL_CS_LIST: 'CS-list',
    ALL_LANGUAGE_LIST: 'LANGUAGE-list',
    ALL_DATA_LIST: 'DATA-list',
    ALL_INFRA_LIST: 'INFRA-list',
    ALL_TOOLS_LIST: 'TOOLS-list',
    ALL_POST_LIST: 'POST-post-list',
    ALL_SKILL_LIST: 'SKL-skill-list',
    POST_CONTAINER: 'post-container',
    ABOUT_ME_DETAIL: 'about-me-detail',
    RELATED_POSTS_LIST_CLASS: 'related-posts-list' // 클래스 이름이지만 상수화하여 관리
};

// 프로젝트 상세 정보에 표시될 속성의 순서
export const PROJECT_PROPERTY_ORDER = ['start date', 'end date', '플랫폼', '개발인원', '담당역할', '언어', '서버', '프레임워크', 'DB', 'IDE', 'API', '라이브러리', 'tag'];

// 게시물 카테고리
export const CATEGORIES = {
    PROJECT_OVERVIEW: 'project overview',
    DOCUMENT: 'document',
    TROUBLE_SHOOTING: 'trouble shooting',
    DECISION: 'decision',
    KNOWLEDGE: 'knowledge',
    MY_SKILL: 'my skill',
    // blog-gnb categories
    CS: 'cs',
    LANGUAGE: 'Programming Language',
    DATA: 'data',
    INFRA: 'infra',
    TOOLS: 'tools',
};

// 페이지 버튼 설정
export const PAGINATION = {
    POSTS_PER_PAGE: 9,
    PREV_TEXT: '[prev]',
    NEXT_TEXT: '[next]',
};

// GNB 스타일 설정 ('portfolio-gnb' 또는 'blog-gnb')
// sessionStorage에 저장된 스타일이 있으면 그것을 사용하고, 없으면 'blog-gnb'를 기본값으로 사용합니다.
export const GNB_STYLE = sessionStorage.getItem('gnbStyle') || 'blog-gnb';

const PORTFOLIO_GNB_VISIBILITY = {
    'home': true,
    'about': true,
    'skill': true,
    'project': true,
    'post': true,
    'troubleshooting': true,
    'decision': true,
    // blog-gnb 항목 숨김
    'cs': false,
    'language': false,
    'data': false,
    'infra': false,
    'tools': false,
    'portfolio-btn': false, // 포트폴리오 GNB에서는 'Portfolio' 버튼 숨김
    'blog-btn': true,       // 포트폴리오 GNB에서는 'Blog' 버튼 표시
};

const BLOG_GNB_VISIBILITY = {
    'home': true,
    'about': false,
    'skill': false,
    'project': false,
    'post': false,
    'troubleshooting': false,
    'decision': false,
    // blog-gnb 항목 보임
    'cs': true,
    'language': true,
    'data': true,
    'infra': true,
    'tools': true,
    'portfolio-btn': false,  // 블로그 GNB에서는 'Portfolio' 버튼 숨김
    'blog-btn': false,      // 블로그 GNB에서는 'Blog' 버튼 숨김
};

// GNB 버튼 가시성 설정
export const GNB_VISIBILITY_CONFIG = {
    'blog-gnb': BLOG_GNB_VISIBILITY,
    'portfolio-gnb': PORTFOLIO_GNB_VISIBILITY,
};
export const GNB_BUTTON_VISIBILITY = GNB_VISIBILITY_CONFIG[GNB_STYLE];