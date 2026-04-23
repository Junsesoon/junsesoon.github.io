// id 관리
export const DOM_IDS = {
    ALL_PROJECT_LIST: 'all-project-list',
    ALL_TROUBLESHOOTING_LOG_LIST: 'all-troubleshooting-log-list',
    ALL_DECISION_LOG_LIST: 'all-decision-log-list',
    ALL_SKILL_LIST: 'all-skill-list',
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
};

// 페이지 버튼 설정
export const PAGINATION = {
    POSTS_PER_PAGE: 9,
    PREV_TEXT: '[prev]',
    NEXT_TEXT: '[next]',
};