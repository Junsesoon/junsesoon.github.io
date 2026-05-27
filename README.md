# junseo tech blog version 2
- distribution 2026-05-15
👉 link: https://incheon-people.com/ 👈

## 운영계획
### Phase 1(start from vanilla js)
- Legacy reset: 기존 Jekyll 기반 블로그 저장소 아카이브 및 기술 부채 청산
- Release: Vanilla JS 환경에서의 기초 렌더링 엔진 실험 및 blog v1.0.0 release
- Development method: 모든 라이브러리의 물리적 저장(/asset/lib)을 통한 외부 의존성 차단(CDN도 외부의존이 존재하므로 사용 안 함)

### Phase 2(dev to vanilla js)
- Domain: 개인 도메인 확보 및 연결
- Prepare for costs: 구글 애드센스 승인을 위한 데이터 수집 장치(GA4) 파이프라인 구축

### Phase 3(switch to hybrid site)
- ❗️Github Pages의 서버 부재로 인한 동적 배포 보류(로컬에서 완전한 동적 시스템 구현에 집중)❗️
- Engine change: Next.js 15 + React + TypeScript 기반 핵심 아키텍처 변경
- Architecture: App router 기반의 역할 중심 폴더 구조로 개편(app, components, utils 등)
- Core Concept: blog home 에 post category를 기반으로 한 기술 계보도(skill tree page) 구현

### Phase 4(local data integration)
- Data decoupling: Post를 Project repo에서 DB로 이관
- DB connection: 클라우드(가상) 서버 도입 전, 로컬 개발 환경에 serverless DB 원격 연동 테스트
- Backend logic add: 사용자 인터랙션을 위한 게시물 속성 DB화, 조회수 카운팅, 댓글 등 동적 백엔드 로직을 로컬에서 검증

### Phase 5(switch to dynamic site)👈(now!)
- Cloud infra migration: VPS/AWS 기반으로 자체 인프라 구축(github pages 탈출!)
- Deployment: 로컬 검증 완료된 코드들을 자체 서버에 정식 배포
- Optimization: 구글 애드센스를 통한 유지비용 최소화

### Phase 6(operations & maintenance)
- Stability: 시스템 안정성 모니터링 및 구글 애드센스 최적화
- Sustainability: 꾸준한 기술 포스팅

## Commit message prefix
- 2026-05-27 이후부터 적용
- **FEAT** : 새로운 기능 추가
- **FIX** : 버그 수정
- **DOCS** : 문서 수정 및 추가
- **STYLE** : 코드 스타일 관련 변경(코드 포매팅, 세미콜론 누락 등)
- **REFACTOR** : 코드 리팩토링
- **TEST** : 테스트 코드, 리팩토링 테스트 코드 추가
- **CHORE** : 빌드 task 수정, 패키지 매니저 수정(.gitignore 수정 같은 경우)

```bash
# DB test code
npx tsx src/infra/db-test.ts

# DB migration code
npx tsx src/infra/init-db.ts

# 로컬 마크다운 게시물(public/upload-posts)을 DB로 업로드
npx tsx --env-file=.env src/scripts/upload-posts.ts --write

# DB의 게시물 데이터를 로컬 마크다운 파일(public/download-posts)로 다운로드하기
npx tsx --env-file=.env src/scripts/download-posts.ts
```

## version history
### junseo tech blog 2.0.0
- distribution 2026-05-15
#### Refactoring
- Engine change: Vanilla JS > React + TypeScript + Next.js
#### modified
- style: card-style post list > list-style post list

### junseo tech blog 2.1.0
- distribution 2026-05-20
#### New
- skill tree page implementaion
#### Refactoring
- none
#### Modified
- applying styles to code block & table

### junseo tech blog 2.2.0
- distribution 2026-05-24
#### New
- Local & Remote(Neon) DB connection environments setup
#### Refactoring
- Post parsing logic & data migration scripts (markdown to PostgreSQL)
#### Modified
- Update project phase: Phase 3 -> Phase 4 (Local Data Integration)

