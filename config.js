// 공통 설정 — 소속/세부소속 목록(엑셀 '웹페이지'·'기초정보페이지' 시트 그대로)과 저장소 주소
window.CFG = {
  SUPABASE_URL: "https://sdpyjgjoowxxrtngwyee.supabase.co",
  SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcHlqZ2pvb3d4eHJ0bmd3eWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MTA0NzQsImV4cCI6MjEwNDM4NjQ3NH0.lnh1Ag1OgjwDqm93HQ2dUVG2eRKr7WL2tEGvGFEyuN8",
  TITLE: "판교이음교회 온가족예배 참석자 사전 조사",
  // 소속(탑다운) → 세부소속(탑다운). 목록이 비면 세부소속 없음. {label, items}는 구분 제목.
  // 소속(탑다운) → 세부소속(탑다운). 목록이 비면 세부소속 없음.
  GROUPS: {
    "시니어": { hint: "순장 선택", items: ["시니어1 (박정은)","시니어2 (이옥경)"] },
    "이음(여)": { hint: "순장 선택", items: ["이음1여 (노혜선)","이음2여 (허은정)","이음3여 (황은경)","이음4여 (김인순)","이음5여 (정혜영)","이음6여 (염성미)","이음7여 (차미영)","이음8여 (임지연)","이음9여 (손향)","이음10여 (임희숙)","이음11여 (정혜정)","이음12여 (이효영)","이음13여 (이소현)"] },
    "직장(여)": { hint: "순장 선택", items: ["직장1여 (최정아)","직장2여 (이지웅)","직장3여 (김성애)","직장4여 (염혜원)","직장5여 (김연주)","직장6여 (김명순)","직장7여 (이경자)","직장8여 (서경수)","직장9여 (류성숙)"] },
    "직장(남)": { hint: "순장 선택", items: ["직장1남 (정해일)","직장2남 (김한얼)","직장3남 (신동호)","직장4남 (이주흥)","직장5남 (이승헌)","직장6남 (오종흥)","직장7남 (이철환)","직장8남 (설준희)","직장9남 (김재민)","직장10남 (원현진)","직장11남 (정원호)"] },
    "부부·신혼·젊은장년": { hint: "순장 선택", items: ["부부1 (최윤성, 김수진)","부부2 (한성필)","신혼부부 (윤재동, 박효실)","젊은 장년 공동체 (이재욱)"] },
    "대학청년부": { hint: "리더이름 선택", items: ["곽주훈 리더","윤시온 리더","이민진 리더","이인혜 리더","김예지 리더","하정주 리더","정소진 리더","박수빈 리더"] },
    "고등부(엘피스)": { hint: "반 - 선생님 선택", items: ["1반-오수근A","2반-양유진","3반-노원혁","4반-김규성","5반 이원중"] },
    "중등부(아가페)": { hint: "반 - 선생님 선택", items: ["1반-조주원","2반-이은경","3반-장지연","4반-김용진","5반-이부철","6반-김태호"] },
    "무소속": { hint: "", items: [] }
  },
  UNKNOWN: "모름",
  MEAL: [["1", "식사함"], ["0", "식사안함"]],
  BUS: [["1", "교회차량필요"], ["0", "교회차량불필요"]]
};
// 세부소속 <option> HTML (공통)
CFG.subOptionsHtml = function (groupName) {
  const g = CFG.GROUPS[groupName]; if (!g || !g.items.length) return '';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return g.items.map(it => `<option>${esc(it)}</option>`).join('') + `<option>${CFG.UNKNOWN}</option>`;
};
CFG.hasSub = g => !!(CFG.GROUPS[g] && CFG.GROUPS[g].items.length);

// ---- 사람 동일성 판정(공통) ----
// 전화번호: 숫자만 → 010-1234-5678 형식
CFG.fmtPhone = function (v) {
  const d = String(v || '').replace(/\D/g, '').slice(0, 11);
  if (d.startsWith('02')) return d.length <= 2 ? d : d.length <= 5 ? d.replace(/(\d{2})(\d+)/, '$1-$2') : d.length <= 9 ? d.replace(/(\d{2})(\d{3})(\d+)/, '$1-$2-$3') : d.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
  if (d.length <= 3) return d;
  if (d.length <= 7) return d.replace(/(\d{3})(\d+)/, '$1-$2');
  if (d.length <= 10) return d.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
  return d.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
};
CFG.nameKey = n => String(n || '').replace(/\s+/g, '');
CFG.phoneTail = p => String(p || '').replace(/\D/g, '').slice(-8); // 앞 010 제외 8자리
// 이름 같고, 전화 뒤 8자리 중 6자리 이상 같으면 같은 사람 (한쪽 번호가 없으면 이름만으로 같은 사람)
// 같은 사람 판정 순서: 이름 → 전화(뒤 8자리 중 6자리 이상) → 생년. 셋 다 맞아야 같은 사람, 하나라도 비어 있거나 다르면 다른 사람.
CFG.samePerson = function (a, b) {
  if (CFG.nameKey(a.name) !== CFG.nameKey(b.name)) return false;
  const pa = CFG.phoneTail(a.phone), pb = CFG.phoneTail(b.phone);
  if (pa.length < 8 || pb.length < 8) return false;
  let same = 0; for (let i = 0; i < 8; i++) if (pa[i] === pb[i]) same++;
  if (same < 6) return false;
  const ya = String(a.birth_year || '').trim(), yb = String(b.birth_year || '').trim();
  return !!ya && !!yb && ya === yb;
};

// ---- 자녀 부서(생년 기준) — 부모가 동반으로 신청, 전체 집계 포함 + 별도 표시 ----
CFG.KIDS = [
  { label: "초등부", from: 2014, to: 2019 },
  { label: "유치부", from: 2020, to: 2023 },
  { label: "영유아부", from: 2024, to: 2026 }
];
CFG.kidDept = function (birth_year) {
  const y = parseInt(String(birth_year || '').trim(), 10); if (!y) return '';
  const k = CFG.KIDS.find(k => y >= k.from && y <= k.to); return k ? k.label : '';
};
