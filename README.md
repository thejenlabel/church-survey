# 온가족예배 참석자 사전조사

- `index.html` — 참석자 입력 폼 (QR/링크 배포용)
- `admin.html` — 관리자 페이지 (비밀번호 입력 → 전체/다락방별 집계, 이름 검색, 엑셀 다운로드, 삭제)
- `config.js` — 소속/세부소속 목록 + 저장소 주소. 순장·리더 명단이 바뀌면 여기만 수정
- 저장소: Supabase `church-survey` (ap-northeast-2), 테이블 `submissions`
- 관리자 비밀번호: Supabase `admin_config` 테이블의 `password` 값

## 배포
- 공개 주소(Netlify): https://ieum-family-worship.netlify.app (site id 560d0940-426c-44f4-958a-3dd5c7096071, 팀 zueisong)
- 재배포: 코드 수정 후 이 폴더에서 Netlify MCP `deploy-site`가 주는 `npx -y @netlify/mcp@latest --site-id ... --proxy-path ...` 명령 실행
- GitHub Pages(https://thejenlabel.github.io/church-survey/)는 백업용으로 남아 있음
