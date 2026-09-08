// 공통 설정 — 소속/세부소속 목록(엑셀 '웹페이지'·'기초정보페이지' 시트 그대로)과 저장소 주소
window.CFG = {
  SUPABASE_URL: "https://sdpyjgjoowxxrtngwyee.supabase.co",
  SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcHlqZ2pvb3d4eHJ0bmd3eWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MTA0NzQsImV4cCI6MjEwNDM4NjQ3NH0.lnh1Ag1OgjwDqm93HQ2dUVG2eRKr7WL2tEGvGFEyuN8",
  TITLE: "판교이음교회 온가족예배 참석자 사전 조사",
  // 소속(탑다운) → 세부소속(탑다운). 목록이 비면 세부소속 없음. {label, items}는 구분 제목.
  GROUPS: {
    "다락방(시니어,낮,직장)": {
      hint: "다락방별 순장 선택",
      items: ["시니어1 (박정은)","시니어2 (이옥경)","이음1여 (노혜선)","이음2여 (허은정)","이음3여 (황은경)","이음4여 (김인순)","이음5여 (정혜영)","이음6여 (염성미)","이음7여 (차미영)","이음8여 (임지연)","이음9여 (손향)","이음10여 (임희숙)","이음11여 (정혜정)","이음12여 (이효영)","이음13여 (이소현)","직장1여 (최정아)","직장2여 (이지웅)","직장3여 (김성애)","직장4여 (염혜원)","직장5여 (김연주)","직장6여 (김명순)","직장7여 (이경자)","직장8여 (서경수)","직장9여 (류성숙)","직장1남 (정해일)","직장2남 (김한얼)","직장3남 (신동호)","직장4남 (이주흥)","직장5남 (이승헌)","직장6남 (오종흥)","직장7남 (이철환)","직장8남 (설준희)","직장9남 (김재민)","작장10남 (원현진)","직장11남 (정원호)","부부1 (최윤성, 김수진)","부부2 (한성필)","신혼부부 (윤재동, 박효실)","젊은 장년 공동체 (이재욱)"]
    },
    "대학청년부": {
      hint: "리더이름 선택",
      items: ["곽주훈 리더","윤시온 리더","이민진 리더","이인혜 리더","김예지 리더","하정주 리더","정소진 리더","박수빈 리더"]
    },
    "중고등부": {
      hint: "반 - 선생님 선택",
      items: [
        { label: "엘피스(고등부)", items: ["1반-오수근A","2반-양유진","3반-노원혁","4반-김규성","5반 이원중"] },
        { label: "아가페(중등부)", items: ["1반-조주원","2반-이은경","3반-장지연","4반-김용진","5반-이부철","6반-김태호"] }
      ]
    },
    "무소속": { hint: "", items: [] }
  },
  UNKNOWN: "모름",
  MEAL: [["1", "식사함"], ["0", "식사안함"]],
  BUS: [["1", "교회차량필요"], ["0", "교회차량불필요"]]
};
// 세부소속을 <option>/<optgroup> HTML로 (공통)
CFG.subOptionsHtml = function (groupName) {
  const g = CFG.GROUPS[groupName]; if (!g || !g.items.length) return '';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return g.items.map(it => typeof it === 'string'
    ? `<option>${esc(it)}</option>`
    : `<optgroup label="${esc(it.label)}">${it.items.map(s => `<option>${esc(s)}</option>`).join('')}</optgroup>`).join('') + `<option>${CFG.UNKNOWN}</option>`;
};
CFG.hasSub = g => !!(CFG.GROUPS[g] && CFG.GROUPS[g].items.length);
