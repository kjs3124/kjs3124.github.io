# kjs3124.github.io

## Vercel 환경변수

- `BLOB_READ_WRITE_TOKEN`: Vercel Blob 저장소 연결 토큰
- `ADMIN_CODES`: 최초 관리자 코드 또는 복구용 fallback 코드 목록, 쉼표로 구분

## 저장 구조

- 참여 기록: Vercel Blob의 `participants/{이름}.json`
- 관리자 코드: Vercel Blob의 `config/admin.json`
- 발음 연습 문장: Vercel Blob의 `config/pronunciation-sentences.json`
  - 문장 유형: `general`, `writing`, `presentation`
  - 관리자 화면 입력 형식: `[글쓰기 안내] 문장`, `[발표 경청] 문장`, 유형 생략 시 일반 문장
- 관리자 페이지는 `participants/` 하위 JSON 목록을 읽어서 표시
