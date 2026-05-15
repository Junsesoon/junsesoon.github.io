# junseo tech blog version 2
- distribution 2026-05-15
👉 link: https://incheon-people.com/ 👈

## 운영계획
### Phase 1(start from vanilla js)
- 기존 Jekyll 기반 블로그 저장소 아카이브 및 기술 부채 청산
- Vanilla JS 환경에서의 기초 렌더링 엔진 실험
- 모든 라이브러리의 물리적 저장(/asset/lib)을 통한 외부 의존성 차단(CDN도 외부의존이 존재하므로 사용 안 함)

### Phase 2(dev to vanilla js)
- 개인 도메인 확보 및 DNS 최적화
- 구글 애드센스 승인을 위한 데이터 수집 장치(GA4) 파이프라인 구축

### **Phase 3(switch to hybrid site)👈(now!)**
- Engine change: Next.js 15 + React + TypeScript
- Architecture: 역할 중심 폴더 구조로 폴더 트리 개편(Pages, Components, Utils 등)
- blog home 에 post category를 기반으로 한 기술 계보도 구현

### Phase 4(switch to dynamic site)
- VPS/AWS 기반으로 자체 인프라 구축(github pages 탈출!)
- 사용자 인터랙션을 위한 RDBMS 정식 도입
- 백엔드 로직 전면 개편
- 구글 애드센스를 통한 유지비용 최소화

### Phase 5
- 시스템 안정성 유지보수 및 꾸준한 포스팅


## version history
### junseo tech blog 2.0.0
- distribution 2026-05-15
#### Refactoring
- Engine change: Vanilla JS > React + TypeScript + Next.js
#### modified
- style: card-style post list > list-style post list