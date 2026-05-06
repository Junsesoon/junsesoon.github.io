import { GA_MEASUREMENT_ID } from './const.js';

/**
 * gtag.js 스크립트를 문서 헤더에 삽입하여 Google Analytics 4를 초기화
 * 이 함수는 애플리케이션이 시작될 때 한 번만 호출되어야 함
 */
export function initGA() {
    if (!GA_MEASUREMENT_ID) {
        console.error('GA Measurement ID is missing from const.js.');
        return;
    }

    // 표준 GA 스니펫처럼 gtag 함수를 전역 함수로 만들어야 함
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
        window.dataLayer.push(arguments);
    };

    gtag('js', new Date());
    // 초기 설정은 초기 페이지 로드를 위한 첫 번째 page_view를 전송
    gtag('config', GA_MEASUREMENT_ID);

    // Google 태그(gtag.js) 라이브러리를 비동기적으로 삽입
    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(gtagScript);
}

/**
 * 페이지 조회수를 수동으로 추적함. 이는 단일 페이지 애플리케이션(SPA)에 필수적
 * 페이지를 완전히 새로고침하지 않고 콘텐츠가 동적으로 로드됨
 * 이 함수는 새로운 콘텐츠가 렌더링되고 문서 제목이 업데이트된 후에 호출되어야 함
 */
export function trackPostView() {
    if (typeof window.gtag !== 'function' || !GA_MEASUREMENT_ID) {
        console.error('gtag is not available or Measurement ID is missing.');
        return;
    }

    // 업데이트된 페이지 제목과 위치를 포함하는 'page_view' 이벤트를 전송
    gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname + window.location.search,
    });
}
