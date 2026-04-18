document.addEventListener('DOMContentLoaded', () => {
    // Header 로드
    fetch('./template/header.html')
        .then(response => response.text())
        .then(html => {
            document.querySelector('header').innerHTML = html;
        })
        .catch(error => console.error('Error loading header:', error));

    // Footer 로드
    fetch('./template/footer.html')
        .then(response => response.text())
        .then(html => {
            document.querySelector('footer').innerHTML = html;
        })
        .catch(error => console.error('Error loading footer:', error));

    // 여기에 기존의 페이지별 콘텐츠 렌더링 로직을 추가합니다.
});