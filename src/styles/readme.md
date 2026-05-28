# styles folder readme
수정일: 2026-05-27
이 폴더는 Tailwind 중심의 Next.js 앱에서 여전히 유효한 CSS 파일들만 보관합니다

## Files
- `globals.css`: Tailwind CSS v4의 진입점(entrypoint)입니다. `@import "tailwindcss";`를 통해 Tailwind를 가져오고, `className`으로 직접 표현할 수 없는 앱 전체의 기본 스타일과 전역 선택자만 이곳에 유지하세요
- `atom-one-dark.css`: 마크다운에서 렌더링된 코드 블록에 적용되는 Highlight.js 테마 파일입니다

## 스타일 규칙
- React 컴포넌트와 앱 페이지에서는 가급적 Tailwind 유틸리티 클래스를 사용하세요
- `globals.css`는 문서의 기본값, `dangerouslySetInnerHTML`을 통한 마크다운 HTML, 외부 라이브러리 출력 요소, 또는 React가 클래스를 직접 부여할 수 없는 선택자 등 진정한 의미의 '전역 스타일'에만 사용하세요
- 커스텀 전역 CSS를 작성할 때는 `@layer base`나 `@layer components` 같은 Tailwind 레이어 내부에 선언하여 Tailwind와 예측 가능하게 결합되도록 하세요
- `layout.css`, `component.css`, `theme.css`, `style.css` 같은 특정 페이지/컴포넌트 전용 레이아웃 파일은 추가하지 마세요. 특정 컴포넌트에 종속된 스타일이라면 해당 컴포넌트 내부에서 Tailwind 클래스로 해결해야 합니다
- 서드파티 라이브러리 CSS는 외부 벤더 테마이거나 자동 생성된 스타일시트인 경우에만 별도의 파일로 유지하세요

## 제거된 레거시 파일
- `base.css`: `globals.css`에 병합되었습니다
- `component.css`: 유효한 마크다운 스타일은 `globals.css`에 병합되었으며, 페이지 및 목차(TOC) 레이아웃 스타일은 컴포넌트 내 Tailwind 클래스로 이동되었습니다.
- `layout.css`: `layout.tsx`와 `GNB.tsx` 내의 Tailwind 클래스로 대체되었습니다
- `theme.css`: Tailwind 색상 유틸리티 클래스와 `globals.css`의 마크다운 스타일로 대체되었습니다
- `style.css`: 기존의 구형 반응형 오버라이드 코드와 함께 제거되었습니다. 현재의 반응형 동작은 Tailwind의 반응형 접두사(variants)로 구현되어야 합니다
