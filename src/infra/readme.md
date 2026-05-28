# infra folder readme
수정일: 2026-05-27
- 데이터베이스 연결 및 외부 서비스를 관리하는 인프라 계층입니다

## 파일 목록
- `infra/db.ts`: 중앙 집중식 데이터베이스 연결 관리자입니다. 애플리케이션 전체에서 데이터베이스 연결을 효율적으로 관리하고 재사용하기 위해 `pg`(node-postgres)를 사용하여 타입이 지정된 커넥션 풀(connection pool)을 구현합니다. 이제 런타임 게시물 렌더링은 `src/utils/posts.ts`를 통해 이 연결에 의존합니다

- `infra/test-db.ts`: 데이터베이스 연결 진단 유틸리티입니다. 하트비트 쿼리(`SELECT NOW()`)를 실행하여 PostgreSQL 인스턴스에 대한 연결 상태, 환경 변수 및 인증 정보가 올바른지 확인합니다
- `infra/init-db.ts`: SQL 시드(seed) 파일을 기반으로 데이터베이스 스키마를 초기화합니다

## 가이드라인
- **결합도 낮추기 (Maintain Decoupling)**: 인프라 관련 코드(DB 설정, 외부 API 클라이언트 등)는 비즈니스 로직(`app/` 또는 `utils/`)과 격리하여 유지하세요

## 게시물 DB 런타임 참고 사항
- Next.js 서버 컴포넌트를 렌더링하는 환경에서는 `DB_ENV` (local/remote), `LOCAL_DB_*` (HOST, PORT, USER, PASSWORD, DATABASE, SSL) 및 `REMOTE_DB_*` 환경 변수가 반드시 설정되어 있어야 합니다
- 앱(`app/`) 및 컴포넌트 코드는 `pg`를 직접 호출해서는 안 됩니다. 데이터베이스 스키마가 렌더링 코드로부터 분리된 상태를 유지할 수 있도록, 게시물을 불러올 때는 반드시 `src/utils/posts.ts`를 사용하세요
