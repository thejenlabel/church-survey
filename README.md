# 온가족예배 참석자 사전조사

- `index.html` — 참석자 입력 폼 (QR/링크 배포용) · `youth.html` — 중고등부 전용 폼(가는/오는 차량 따로, 동반 없음)
- `form.js` — 두 폼 공용 스크립트 (`window.FORM_MODE` = "all" | "youth")
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
- 식사비: `CFG.MEAL_FEE` 초등생 이상 20,000원 · 유치부 12,000원 — 관리자 식사 타일과 엑셀 요약에 인원×단가·합계 표시. 영유아부(24년생~)는 식사·교회차 미집계

## 차량 구간 (2026-09-14)
- 구간 3개: 교회→현지(go) · 현지(1시)→교회(early) · 현지(끝나고)→교회(late)
- 신청 저장값: `bus_go`(0/1), `bus_back`(""|early|late), `bus`(둘 중 하나라도 탑승이면 1)
- 기존 왕복 신청(옛 데이터)은 `bus=1` → 가는 차량 + 끝나고 출발로 자동 해석(원본은 그대로)
- 탑승 확인 키: `신청서id|이름|구간` (옛 키 `신청서id|이름`도 보존)
- **원복**: `config.js`의 `CFG.YOUTH_MODE = false` → 관리자 차량 탭이 예전 단일 목록으로 돌아감. 데이터는 손대지 않음

## 엑셀 다운로드가 안 될 때 (2026-10-03)
- **카카오톡·네이버 등 앱 안의 브라우저**는 파일 저장이 막혀 있어 버튼을 눌러도 아무 일이 안 생긴다. 관리자 페이지가 이를 감지해 상단에 안내 + "외부 브라우저로 열기" 버튼을 띄운다(카카오톡은 `kakaotalk://web/openExternal`로 크롬·사파리 자동 전환, 비밀번호는 다시 입력).
- PC·크롬·사파리에서는 정상. 실패 시 이제 화면에 오류 메시지가 뜬다(종전엔 조용히 실패). 엑셀 라이브러리(cdnjs)가 막힌 네트워크면 jsdelivr로 자동 대체.
