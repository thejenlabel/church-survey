# 온가족예배 참석자 사전조사

- `index.html` — 참석자 입력 폼 (QR/링크 배포용)
- `admin.html` — 관리자 페이지 (비밀번호 입력 → 전체/다락방별 집계, 이름 검색, 엑셀 다운로드, 삭제)
- `config.js` — 소속/세부소속 목록 + 저장소 주소. 순장·리더 명단이 바뀌면 여기만 수정
- 저장소: Supabase `church-survey` (ap-northeast-2), 테이블 `submissions`
- 관리자 비밀번호: Supabase `admin_config` 테이블의 `password` 값
