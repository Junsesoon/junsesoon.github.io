# junseo tech blog 1.0.0
- Initialized on 2026-02-19
- distribution 2026-05-02

## 운영목표
- 구직활동시 보유역량을 가감없이 드러내어 면접자와 구직자 사이의 불필요한 검증 시간을 최대한 줄이기 위함
- 실제 배포/운영 경험을 통해 실력을 향상시키기 위함


## 운영계획
### Phase 1(vanilla js)
- 프로젝트에 필요한 라이브러리는 전부 /asset/lib 에 저장
- CDN도 외부의존이 존재하므로 사용 안 함
- 기존 지킬(jekyll)로 빌드한 블로그는 legacy/* 브랜치에 저장한다

### Phase 2(vanilla js)
- 도메인만 구매하여 구글 애드센스를 승인받기 위한 최소 트래픽 확보 준비 작업 진행
- 데이터베이스를 연결하고 정적 사이트에서 동적 블로그로의 확장 준비

### Phase 3(switch to dynamic site)
- VPS 혹은 Cloud server 등을 활용하여 자체 배포(github pages 탈출!)
- 각종 최신 라이브러리의 활용
- 백엔드 로직 등을 전면 개편
- 구글 애드센스를 통한 유지비용 최소화

### Phase 4
- 유지보수 및 꾸준한 포스팅 활동


## 블로그 운영방식 변경사유
- 지킬 업데이트시 페이지가 깨짐(의존성 관리필요)
- 깃블로그는 Docker 사용이 어렵고 Actions도 관리가 필요함


## 게시물 데이터 자동 업데이트 방법
- `js/post-list.js` 파일은 `/post` 디렉토리의 마크다운 파일들을 기반으로 자동으로 생성된다
- `js/skill-list.js` 파일은 `/post/skill` 디렉토리의 마크다운 파일들을 기반으로 자동으로 생성된다
- 새로운 게시물을 추가하거나 기존 게시물을 수정했을 경우, 아래 명시된 명령어를 실행하여 `post/skill-list.js`를 업데이트해야 한다

```bash
node js/build-post.js
node js/build-skill.js
```


# junseo tech blog 1.1.0
- distribution 2026-05-06

## 추가기능
- GNB 버튼의 가시성을 제어할 수 있는 option code setting 지원
- post card에 category1 을 기준으로 tag 추가
- 본문 font size 및 color를 조절할 수 있는 css code 추가
- 이력서 양식을 반응형으로 변경
- skill 항목을 my skill 로 명칭 변경 -> 추후 skill tree 구현을 위해 미리 구분함
- portfolio page 와 blog page를 나누고 페이지 전환 버튼을 추가함 -> 지식형 블로그를 먼저 배포하여 트래픽을 미리 쌓아두기 위함
- frontmatter parsing logic 개선
- post 상세 페이지의 '작성일' 항목 세분화 > '최초 작성일' & '최종 수정일'로 변경
- 구글 애널리틱스 연결을 통한 트래픽 분석 활성화