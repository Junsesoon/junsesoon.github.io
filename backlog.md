# To do list🚀
- [기능] blog stats를 실제 데이터로 출력하기
- [기능] 다양한 테마 mode 추가하기
- [기능] 게시물 검색 기능(Search) 구현
- [기능] 게시물 댓글 시스템 구현(자체 DB로 구축)
- [기능] blog/portfolio page를 mode로 논리적으로 분리하지 않고 물리적 분리로 전환
- [운영] GA4 파이프라인 점검 및 구글 애드센스 승인/최적화 작업
- [운영] 에러 및 시스템 안정성 모니터링 환경 구축
- [문서화] 블로그 상세 설명 및 소개 페이지 작성

# Idea💡
- skill tree 에서 card 클릭시 category4를 기준으로 생성되는 부채꼴 인터랙션
- Portfolio 모드 진입 시 전용 커스텀 테마(Red point) UI/UX 고도화
- 출력용/웹용을 스위칭 할 수 있는 about page 디자인
- 서버 배치(Cron) 작업을 통한 R2 스토리지 내 미사용 이미지 주기적 클린업 로직
- LLM을 활용한 게시물 추천 챗봇
- 블로그 소개시 들어갈 내용 후보: (1)프로젝트 소개 및 정체성 (2)기술 스택 및 아키텍처 (3)디렉토리 구조
- view manage page 도입(DB table은 아래와 같이 구성)
    - session_id: 사용자의 브라우저 로컬 스토리지에 발급한 고유 난수(UUID)
    - target_path: 사용자가 정확히 어떤 게시물이나 URL을 조회했는지 기록
    - referer: 사용자가 어떤 링크를 타고 내 블로그에 들어왔는지(예: https://google.com, https://github.com 등) 기록하는 HTTP 헤더 정보
    - user_agent: 접속한 기기의 브라우저, OS 버전, 기기 종류를 담고 있는 HTTP 헤더
    - DB의 소규모 저장공간 500mb 고려하여 기록 저장 기간 등을 설정해야함