# Welcom to junseo tech blog
- distribution 2026-05-15
👉 link: https://incheon-people.com/ 👈

블로그에 대한 상세한 소개 및 설명은 추후 업데이트 될 예정입니다


# 📑version history
[📄업데이트 내역 보기](./CHANGELOG.md)

# Commit message prefix
- 2026-05-27 이후부터 적용
- **FEAT** : 새로운 기능 추가
- **FIX** : 버그 수정
- **DOCS** : 문서 수정 및 추가
- **STYLE** : 코드 스타일 관련 변경(코드 포매팅, 세미콜론 누락 등)
- **REFACTOR** : 코드 리팩토링
- **TEST** : 테스트 코드, 리팩토링 테스트 코드 추가
- **CHORE** : 빌드 task 수정, 패키지 매니저 수정(.gitignore 수정 같은 경우)

# 블로그 운영을 위한 테스트 코드
```bash
# DB test code
npx tsx src/infra/db-test.ts

# DB migration code
npx tsx src/infra/init-db.ts

# 로컬 마크다운 게시물(public/upload-posts)을 DB로 업로드
npx tsx --env-file=.env src/scripts/upload-posts.ts --write

# DB의 게시물 데이터를 로컬 마크다운 파일(public/download-posts)로 다운로드하기
npx tsx --env-file=.env src/scripts/download-posts.ts

# Image DB server connection test code
npx tsx --env-file=.env src/infra/r2-test.ts

```
