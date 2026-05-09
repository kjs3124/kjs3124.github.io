# kjs3124.github.io

## Vercel 환경변수

- `ADMIN_CODES`: 쉼표로 구분한 관리자 코드 목록
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob 저장소 연결 토큰

## 참여 기록 저장 구조

- Vercel Blob의 `participants/{이름}.json` 파일에 이름별로 저장
- 관리자 페이지는 `participants/` 하위 JSON 목록을 읽어서 표시
