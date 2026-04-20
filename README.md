# junsesoon.github.io (new)

Initialized on 2026-02-19.
기존 지킬(jekyll)로 빌드한 블로그는 legacy/* 브랜치에 저장

# 블로그 운영방식 변경사유
- 지킬 업데이트시 페이지가 깨짐(의존성 관리필요)
- 깃블로그는 Docker 사용이 어렵고 Actions도 관리가 필요하므로 의존성 관리 최소화 버전으로 갈 것

# 운영방식
- 프로젝트에 필요한 라이브러리는 전부 /asset/lib 에 저장
- CDN도 외부의존이 존재하므로 사용 안 함

# 게시물 데이터 자동 생성
`js/post-list.js` 파일은 `/post` 디렉토리의 마크다운 파일들을 기반으로 자동으로 생성됩니다.
새로운 게시물을 추가하거나 기존 게시물을 수정했을 경우, 다음 명령어를 실행하여 `js/post-list.js`를 업데이트해야 합니다.

```bash
node js/build-post.js
```