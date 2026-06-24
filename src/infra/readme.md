# infra folder readme
수정일: 2026-06-20
- 데이터베이스 연결 및 외부 서비스를 관리하는 인프라 계층입니다

## 파일 목록
- `infra/neon.ts`: Neon DB(PostgreSQL) 연결 관리자입니다. 애플리케이션 전체에서 데이터베이스 연결을 효율적으로 관리하고 재사용하기 위해 `pg` 커넥션 풀을 구현합니다.
- `infra/neon-test.ts`: Neon DB 연결 진단 유틸리티입니다. 하트비트 쿼리(`SELECT NOW()`) 및 현재 데이터베이스에 존재하는 모든 테이블 목록을 출력합니다.
- `infra/neon-init.ts`: `src/scripts/neon/` 폴더 내의 스키마 생성 SQL 스크립트를 파일명 순서대로 동적 실행하여 데이터베이스를 안전하게 초기화합니다.
- `infra/turso.ts`: Turso DB(SQLite/Libsql) 연결 관리자입니다. `DB_ENV` 환경 변수가 `'local'`일 때는 로컬 SQLite 파일(`file:Logs.db`)을 사용하도록 우회하며, 원격일 경우 환경 변수(`TURSO_DB_URL`, `TURSO_AUTH_TOKEN`)를 통해 연결 클라이언트를 싱글톤으로 설정하여 제공합니다. 단일 쿼리 실행을 지원하는 `query` 헬퍼 함수를 제공합니다.
- `infra/turso-init.ts`: `src/scripts/turso/` 폴더 내의 SQLite용 SQL 스크립트를 순차 분할 실행하여 Turso 데이터베이스를 안전하게 마이그레이션합니다.
- `infra/turso-test.ts`: Turso DB(SQLite) 연결 진단 유틸리티입니다. 서버 시간과 현재 생성되어 있는 테이블 목록을 출력합니다.
- `infra/r2.ts`: Cloudflare R2 스토리지 연동을 위한 AWS SDK S3 클라이언트 설정 파일입니다. 버킷 이름, 공개 URL 등 관련 환경 변수를 캡슐화하여 제공합니다.
- `infra/r2-test.ts`: R2 스토리지 인스턴스에 대한 연결 상태, 환경 변수 및 인증 정보(접근 권한)가 올바르게 설정되었는지 확인하는 진단 테스트 스크립트입니다.

## 가이드라인
- **결합도 낮추기 (Maintain Decoupling)**: 인프라 관련 코드(DB 설정, 외부 API 클라이언트 등)는 비즈니스 로직(`app/` 또는 `utils/`)과 격리하여 유지하세요

## 게시물 DB 런타임 참고 사항
- Next.js 서버 컴포넌트를 렌더링하는 환경에서는 `DB_ENV` (local/remote), `LOCAL_DB_*` (HOST, PORT, USER, PASSWORD, DATABASE, SSL) 및 `REMOTE_DB_*` 환경 변수가 반드시 설정되어 있어야 합니다
- 앱(`app/`) 및 컴포넌트 코드는 `pg`를 직접 호출해서는 안 됩니다. 데이터베이스 스키마가 렌더링 코드로부터 분리된 상태를 유지할 수 있도록, 게시물을 불러올 때는 반드시 `src/utils/posts.ts`를 사용하세요
