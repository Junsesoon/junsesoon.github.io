# constants folder readme
수정일: 2026-05-27
- 프로젝트 전역에서 사용되는 상수(Constants)들을 모아 관리하는 폴더입니다.

## 주요 역할
- **단일 진실 공급원 (Single Source of Truth, SSOT)**: DOM ID, Google Analytics(GA) 추적 코드, API 토큰(Tokens) 등 반복적으로 참조되는 값들을 한 곳에서 관리하여 일관성을 유지합니다
- **유지보수성 향상**: 하드코딩된 문자열이나 매직 넘버(Magic number)를 방지하고, 특정 값이 변경될 때 이곳에 선언된 상수만 수정하여 애플리케이션 전체에 반영되도록 합니다

## Files
- `index.ts`: 프로젝트의 기본 상수 파일입니다
  - 글로벌 네비게이션 메뉴(`PORTFOLIO_MENU`, `BLOG_MENU`) 및 관련 타입(`MenuItem`)을 정의합니다
  - 포트폴리오/블로그 모드 전환 토글(`ENABLE_MODE_TOGGLE`)과 같은 전역 UI 설정값을 관리합니다