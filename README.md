# 온가족예배 참석자 사전조사

- `index.html` — 참석자 입력 폼 (QR/링크 배포용)
- `admin.html` — 관리자 페이지 (비밀번호 입력 → 전체/다락방별 집계, 이름 검색, 엑셀 다운로드, 삭제)
- `config.js` — 소속/세부소속 목록 + 저장소 주소. 순장·리더 명단이 바뀌면 여기만 수정
- 저장소: Supabase `church-survey` (ap-northeast-2), 테이블 `submissions`
- 관리자 비밀번호: Supabase `admin_config` 테이블의 `password` 값 (현재 eeum2026)

## 배포
- **공개 주소(Vercel): https://ieum-family-worship.vercel.app** (프로젝트 ieum-family-worship, 2026-09-08 Netlify 무료 크레딧 소진으로 이전)
- 재배포: 이 폴더에서 `npx -y vercel@latest deploy --prod --yes`
- 옛 주소: Netlify https://ieum-family-worship.netlify.app (크레딧 소진, 정지 가능) · GitHub Pages https://thejenlabel.github.io/church-survey/ (백업)

## 집계 규칙
- 자녀 부서: 생년 기준 자동(초등부 2014~2019 · 유치부 2020~2023 · 영유아부 2024~2026), `config.js` `CFG.KIDS`
- 식사·교회차 인원: `config.js` `CFG.EXCLUDE_BIRTH_FROM = 2024` → 2024년 이후 출생은 식사·교회차 집계에서 자동 제외(총 참석에는 포함). 부모가 식사/차량을 체크한 경우에만 '미집계 인원'으로 따로 표시
- 유치부 식사비: `CFG.MEAL_FEE` (1인 12,000원) — 관리자 유치부 칸과 엑셀 요약에 인원×단가 표시
