// 엑셀 생성 공용 모듈 — 브라우저(admin.html)와 서버(api/excel.js)가 같은 코드를 쓴다. 수정은 여기서만.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.buildWorkbook = factory().buildWorkbook;
})(typeof self !== 'undefined' ? self : this, function () {
  // ExcelJS: 라이브러리, CFG: config.js, DATA: admin_list 결과, CHECK: {탑승키: true/false}
  function buildWorkbook(ExcelJS, CFG, DATA, CHECK) {
    DATA = Array.isArray(DATA) ? DATA : []; CHECK = CHECK || {};
    const keyOf = n => CFG.nameKey(n);
    // 사람 식별(admin.html buildIdentity와 같은 규칙): 이름+전화로 같은 사람이면 같은 키
    const IDMAP = new Map(); const reps = [];
    for (const s of DATA) for (const m of (s.members || [])) {
      let rep = reps.find(r => CFG.samePerson(r, m));
      if (!rep) { rep = { key: keyOf(m.name) + '#' + reps.length, name: m.name, phone: m.phone, birth_year: m.birth_year }; reps.push(rep); }
      else if (!CFG.phoneTail(rep.phone) && CFG.phoneTail(m.phone)) rep.phone = m.phone;
      IDMAP.set(m, rep.key);
    }
    const buildIdentity = () => {};
    const idOf = m => IDMAP.get(m) || keyOf(m.name);
    const riderKey = (s, m, leg) => s.id + '|' + keyOf(m.name) + (leg ? '|' + leg : '');
    const kstDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }); // YYYY-MM-DD
  const OX = v => v ? 'O' : 'X';
  const fmtTime = t => new Date(t).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  const NAVY = 'FF2E3A8C', LIGHT = 'FFEEF1F8', LINE = 'FFD9DEEA';
  const wb = new ExcelJS.Workbook(); wb.creator = '판교이음교회'; wb.created = new Date();
  const border = { top: { style: 'thin', color: { argb: LINE } }, bottom: { style: 'thin', color: { argb: LINE } }, left: { style: 'thin', color: { argb: LINE } }, right: { style: 'thin', color: { argb: LINE } } };
  // 공통: 시트 만들기(제목 줄 + 머리글 + 데이터), 열 너비·고정·필터·스타일
  function sheet(name, title, cols, rows, opts = {}) {
    const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 3 }] });
    ws.mergeCells(1, 1, 1, cols.length);
    const t = ws.getCell(1, 1); t.value = title; t.font = { name: 'Malgun Gothic', size: 14, bold: true, color: { argb: NAVY } }; t.alignment = { vertical: 'middle' };
    ws.getRow(1).height = 26;
    ws.getCell(2, 1).value = `기준 ${fmtTime(Date.now())} · ${opts.sub || rows.length + '건'}`; ws.getCell(2, 1).font = { name: 'Malgun Gothic', size: 9, color: { argb: 'FF6B7280' } };
    const hr = ws.getRow(3); hr.values = cols.map(c => c.h); hr.height = 22;
    hr.eachCell(c => { c.font = { name: 'Malgun Gothic', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }; c.alignment = { horizontal: 'center', vertical: 'middle' }; c.border = border; });
    rows.forEach((r, i) => {
      const row = ws.addRow(cols.map(c => r[c.k] ?? '')); row.height = 20;
      row.eachCell({ includeEmpty: true }, (cell, ci) => {
        const col = cols[ci - 1];
        cell.font = { name: 'Malgun Gothic', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: col.align || 'left' };
        cell.border = border;
        if (i % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } };
        if (col.k === 'meal' || col.k === 'bus' || col.k === 'ride') cell.font = { name: 'Malgun Gothic', size: 10, bold: cell.value === 'O', color: { argb: cell.value === 'O' ? NAVY : 'FF9CA3AF' } };
        if (col.k === 'dept' && cell.value) { cell.font = { name: 'Malgun Gothic', size: 10, color: { argb: 'FF9A5B00' } }; }
      });
    });
    cols.forEach((c, i) => ws.getColumn(i + 1).width = c.w);
    ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3 + rows.length, column: cols.length } };
    if (opts.total) { const tr = ws.addRow(opts.total(cols)); tr.eachCell({ includeEmpty: true }, c => { c.font = { name: 'Malgun Gothic', bold: true, size: 10 }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE1E6F3' } }; c.border = border; c.alignment = { vertical: 'middle', horizontal: 'center' }; }); tr.getCell(1).alignment = { horizontal: 'left' }; }
    ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
    return ws;
  }
  const sorted = DATA.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // ① 요약
  buildIdentity();
  const uniq = new Map();
  for (const s of DATA) for (const m of s.members) { const k = idOf(m); const p = uniq.get(k) || { meal: 0, bus: 0, ex: 0, dept: CFG.kidDept(m.birth_year) }; const ok = CFG.countsFor(m); uniq.set(k, { ...p, meal: p.meal || (m.meal && ok ? 1 : 0), bus: p.bus || (m.bus && ok ? 1 : 0), ex: p.ex || (!ok && (m.meal || m.bus) ? 1 : 0), young: p.young || (CFG.isYoung(m.birth_year) ? 1 : 0) }); }
  const P = [...uniq.values()];
  const cnt = f => P.filter(f).length;
  const mO = cnt(p => p.meal && !p.young), mY = cnt(p => p.meal && p.young);
  const sumRows = [
    { k: '총 참석 인원', v: P.length, meal: cnt(p => p.meal), bus: cnt(p => p.bus), note: `신청 ${DATA.length}건` },
    { k: '식사 인원 · 초등생 이상', v: mO, meal: mO, bus: '-', note: `${mO}명 × ${CFG.MEAL_FEE.older.toLocaleString()}원 = ${(mO * CFG.MEAL_FEE.older).toLocaleString()}원` },
    { k: '식사 인원 · 유치부', v: mY, meal: mY, bus: '-', note: `${mY}명 × ${CFG.MEAL_FEE.young.toLocaleString()}원 = ${(mY * CFG.MEAL_FEE.young).toLocaleString()}원` },
    { k: '식사비 합계', v: '', meal: '', bus: '', note: `${(mO * CFG.MEAL_FEE.older + mY * CFG.MEAL_FEE.young).toLocaleString()}원` },
    ...CFG.KIDS.map(kd => ({ k: kd.label, v: cnt(p => p.dept === kd.label), meal: cnt(p => p.dept === kd.label && p.meal), bus: cnt(p => p.dept === kd.label && p.bus), note: `${kd.from}~${kd.to}년생${kd.label === '영유아부' ? ' · 식사·교회 차량 미집계' : ''}` }))
  ];
  const bySub = {}; for (const s of DATA) { const key = s.group_type + (s.sub_group ? ' · ' + s.sub_group : ''); const o = bySub[key] = bySub[key] || { sub: key, n: 0, total: 0, meal: 0, bus: 0 }; o.n++; for (const m of s.members) { o.total++; if (m.meal && CFG.countsFor(m)) o.meal++; if (m.bus && CFG.countsFor(m)) o.bus++; } }
  const SUMCOLS = [{ h: '항목', k: 'k', w: 22 }, { h: '인원', k: 'v', w: 9, align: 'center' }, { h: '식사', k: 'meal', w: 9, align: 'center' }, { h: '교회 차량', k: 'bus', w: 9, align: 'center' }, { h: '비고', k: 'note', w: 52 }];
  const ws0 = sheet('요약', '온가족예배 참석자 사전조사 · 요약', SUMCOLS, sumRows, { sub: `신청 ${DATA.length}건 · 참석 ${P.length}명` });
  ws0.autoFilter = undefined;
  ws0.addRow([]);
  const h2 = ws0.addRow(['소속별', '신청 건수', '총인원', '식사', '교회 차량']); h2.height = 22;
  h2.eachCell(c => { c.font = { name: 'Malgun Gothic', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A63A9' } }; c.alignment = { horizontal: 'center', vertical: 'middle' }; c.border = border; });
  Object.values(bySub).sort((a, b) => a.sub.localeCompare(b.sub, 'ko')).forEach((o, i) => { const r = ws0.addRow([o.sub, o.n, o.total, o.meal, o.bus]); r.height = 20; r.eachCell({ includeEmpty: true }, (c, ci) => { c.font = { name: 'Malgun Gothic', size: 10 }; c.border = border; c.alignment = { vertical: 'middle', horizontal: ci === 1 ? 'left' : 'center' }; if (i % 2 === 1) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } }; }); });
  const tot = Object.values(bySub).reduce((a, o) => ({ n: a.n + o.n, total: a.total + o.total, meal: a.meal + o.meal, bus: a.bus + o.bus }), { n: 0, total: 0, meal: 0, bus: 0 });
  const tr0 = ws0.addRow(['합계', tot.n, tot.total, tot.meal, tot.bus]); tr0.eachCell({ includeEmpty: true }, (c, ci) => { c.font = { name: 'Malgun Gothic', bold: true, size: 10 }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE1E6F3' } }; c.border = border; c.alignment = { vertical: 'middle', horizontal: ci === 1 ? 'left' : 'center' }; });

  // ② 신청자별
  sheet('신청자별', '신청자별 명단', [
    { h: '번호', k: 'no', w: 6, align: 'center' }, { h: '신청자', k: 'name', w: 12 }, { h: '소속', k: 'group', w: 16 }, { h: '세부소속', k: 'sub', w: 22 },
    { h: '생년', k: 'birth', w: 8, align: 'center' }, { h: '전화번호', k: 'phone', w: 15, align: 'center' }, { h: '식사', k: 'meal', w: 6, align: 'center' }, { h: '교회 차량', k: 'bus', w: 7, align: 'center' },
    { h: '동반 가족', k: 'fam', w: 30 }, { h: '총인원', k: 'total', w: 8, align: 'center' }, { h: '식사인원', k: 'mealN', w: 9, align: 'center' }, { h: '교회 차량 인원', k: 'busN', w: 10, align: 'center' }, { h: '제출시각', k: 'time', w: 18, align: 'center' }
  ], sorted.map((s, i) => { const me = s.members[0] || {}; return { no: i + 1, name: s.name, group: s.group_type, sub: s.sub_group || '', birth: me.birth_year || '', phone: me.phone || '', meal: OX(me.meal), bus: OX(me.bus),
    fam: s.members.slice(1).map(m => m.name + (m.birth_year ? `(${m.birth_year})` : '')).join(', '), total: s.members.length, mealN: s.members.filter(m => m.meal && CFG.countsFor(m)).length, busN: s.members.filter(m => m.bus && CFG.countsFor(m)).length, time: fmtTime(s.created_at) }; }),
  { total: cols => cols.map(c => c.k === 'no' ? '합계' : c.k === 'total' ? sorted.reduce((a, s) => a + s.members.length, 0) : c.k === 'mealN' ? sorted.reduce((a, s) => a + s.members.filter(m => m.meal && CFG.countsFor(m)).length, 0) : c.k === 'busN' ? sorted.reduce((a, s) => a + s.members.filter(m => m.bus && CFG.countsFor(m)).length, 0) : '') });

  // ③ 전체명단(개인별)
  const people = sorted.flatMap(s => s.members.map((m, i) => ({ m, s, self: i === 0 })));
  sheet('전체명단', '참석자 전체 명단 (개인별)', [
    { h: '번호', k: 'no', w: 6, align: 'center' }, { h: '이름', k: 'name', w: 12 }, { h: '생년', k: 'birth', w: 8, align: 'center' }, { h: '부서', k: 'dept', w: 9, align: 'center' },
    { h: '전화번호', k: 'phone', w: 15, align: 'center' }, { h: '식사', k: 'meal', w: 6, align: 'center' }, { h: '교회 차량', k: 'bus', w: 7, align: 'center' }, { h: '집계', k: 'cnt', w: 8, align: 'center' },
    { h: '소속', k: 'group', w: 16 }, { h: '세부소속', k: 'sub', w: 22 }, { h: '신청자', k: 'by', w: 12 }, { h: '구분', k: 'kind', w: 7, align: 'center' }
  ], people.map((p, i) => ({ no: i + 1, name: p.m.name, birth: p.m.birth_year || '', dept: CFG.kidDept(p.m.birth_year), phone: p.m.phone || '', meal: OX(p.m.meal), bus: OX(p.m.bus), cnt: CFG.countsFor(p.m) ? '포함' : '제외', group: p.s.group_type, sub: p.s.sub_group || '', by: p.s.name, kind: p.self ? '본인' : '동반' })));

  // ④ 차량 탑승자
  const riders = people.filter(p => CFG.busAny(p.m) && CFG.countsFor(p.m)).sort((a, b) => String(a.m.name || '').localeCompare(String(b.m.name || ''), 'ko'));
  sheet('차량탑승자', '교회 차량 탑승자 명단', [
    { h: '번호', k: 'no', w: 6, align: 'center' }, { h: '이름', k: 'name', w: 12 }, { h: '생년', k: 'birth', w: 8, align: 'center' }, { h: '전화번호', k: 'phone', w: 15, align: 'center' }, { h: '소속', k: 'sub', w: 22 }, { h: '신청자', k: 'by', w: 12 },
    { h: '교회→현지', k: 'go', w: 10, align: 'center' }, { h: '현지(1시)→교회', k: 'early', w: 13, align: 'center' }, { h: '현지(끝나고)→교회', k: 'late', w: 15, align: 'center' },
    { h: '탑승 확인(가는)', k: 'cgo', w: 13, align: 'center' }, { h: '탑승 확인(1시)', k: 'cearly', w: 13, align: 'center' }, { h: '탑승 확인(끝나고)', k: 'clate', w: 15, align: 'center' }
  ], riders.map((p, i) => ({ no: i + 1, name: p.m.name, birth: p.m.birth_year || '', phone: p.m.phone || '', sub: p.s.sub_group || p.s.group_type, by: p.s.name,
    go: OX(CFG.busGo(p.m)), early: OX(CFG.busBack(p.m) === 'early'), late: OX(CFG.busBack(p.m) === 'late'),
    cgo: CFG.busGo(p.m) ? OX(CHECK[riderKey(p.s, p.m, 'go')]) : '', cearly: CFG.busBack(p.m) === 'early' ? OX(CHECK[riderKey(p.s, p.m, 'early')]) : '', clate: CFG.busBack(p.m) === 'late' ? OX(CHECK[riderKey(p.s, p.m, 'late')]) : '' })));

    const fname = `온가족예배_참석조사_${kstDate}.xlsx`;
    return { wb, fname };
  }
  return { buildWorkbook };
});
