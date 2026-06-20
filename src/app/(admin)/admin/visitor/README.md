# Visitor Management (방문자 관리) README

수정일: 2026-06-20

블로그 관리자 대시보드 내에서 사이트 방문자 이력 조회, 실시간 트래픽 상태 모니터링, 그리고 악성 IP 차단을 수행할 수 있는 관리자 화면 세부 설명서입니다.

---

## 📂 파일 구조
- **[page.tsx](file:///home/junseo/projects/junseo-blog/src/app/%28admin%29/admin/visitor/page.tsx)** (Next.js Server Component)
  - 역할: 진입점 라우터이자 서버 컴포넌트입니다.
  - 데이터베이스의 `site_visitors` 테이블로부터 최근 100건의 고유 방문 이력을 패칭하여 클라이언트 매니저에게 주입합니다.
- **[VisitorManager.tsx](file:///home/junseo/projects/junseo-blog/src/components/VisitorManager.tsx)** (React Client Component)
  - 역할: 그래프 시각화, 방문자 이력 필터링/검색, 수동 차단(IP Block) 정책 제어 등 전반적인 사용자와의 상호작용(인터랙티브 기능)을 담당합니다.

---

## 🗄️ 데이터베이스 스키마 및 활용
방문객 관리에 관련된 데이터는 아래 두 가지 테이블 구조를 바탕으로 조회 및 캐싱을 진행합니다.
자세한 데이터베이스 마이그레이션 스크립트는 **[007_schema_visitors.sql](file:///home/junseo/projects/junseo-blog/src/scripts/007_schema_visitors.sql)** 파일을 참고해 주세요.

1. **`site_visitors` 테이블**:
   - `visitor_id` (SERIAL PRIMARY KEY)
   - `ip_address` (VARCHAR(45))
   - `session_id` (VARCHAR(255))
   - `visited_date` (DATE)
   - *특징*: `(session_id, visited_date)`에 고유 제약 조건을 두어 브라우저당 일일 1회만 중복 없이 적재되도록 설계되었습니다.
2. **`site_stats` 테이블**:
   - `total_visitors` 키의 정수 값을 활용하여 블로그 하단 통계 정보 및 관리 화면 요약 메트릭에 누적 카운트를 캐싱합니다.

---

## 🎨 주요 UI 구성 요소 및 인터랙티브 기능
사용자 경험(UX) 극대화를 위해 다양한 모션 요소와 Harmonious Color Palette를 갖추고 있습니다.

1. **요약 메트릭 카드 (Summary Metrics)**:
   - 전체 누적 방문자 수, 실시간 가상 동시 접속자 수(Flashing Green Indicator), 오늘의 순 방문자 수, 현재 적용 중인 차단 규칙 수를 제공합니다.
   - 실시간 동시 접속자 카운트는 `setInterval` 훅을 활용하여 수시로 변동 시뮬레이션을 수행해 살아있는 느낌을 줍니다.

2. **SVG 방문 트래픽 추이 차트 (Visitor Trend Chart)**:
   - Tailwind 색상 테두리와 linearGradient 채우기를 활용한 미려한 꺾은선 SVG 그래프입니다.
   - 각 날짜 노드에 마우스를 오버하면 **세부 팝업 툴팁**과 점선 가이드라인이 부드럽게 노출됩니다.

3. **브라우저 분표 및 통계**:
   - Chrome, Safari, Firefox 등 접속 클라이언트의 UserAgent 정보를 파악할 수 있는 가로형 게이지 차트가 구성되어 있습니다.

4. **검색 및 상태별 분류 필터**:
   - IP 주소, 임시 세션 ID, 접속 국가/위치에 따른 검색 기능을 지원합니다.
   - `All` / `Allowed` / `Blocked` 상태별 알약형 capsule 필터를 통해 특정 타겟 로그만 신속히 조회할 수 있습니다.

5. **인터랙티브 액션 (Actions)**:
   - **IP 차단 (Block IP)**: Allowed 상태의 로그에 대해 즉각적인 임시 차단 조치를 취하며 차단 리스트에 추가합니다.
   - **로그 행 영구 제외 (Delete Log)**: 특정 세션 흔적을 화면 뷰에서 탈락시킵니다.
   - **세션 키 복사 (Copy UUID)**: 원클릭 복사 기능이 바인딩되어 있습니다.
   - **수동 차단 규칙 설정 (Security Rules Form)**: IP 주소 형식 검증(Regular Expression) 후 악성 봇이나 스크래핑 위협 사유를 선택하여 신규 제한 IP를 등재할 수 있습니다.

6. **토스트 알림 시스템 (Toast Notifications)**:
   - 작업 성공, 경고, 알림 발생 시 우측 하단에서 슬라이드 업되는 동적 알림 시스템이 내장되어 있습니다.
