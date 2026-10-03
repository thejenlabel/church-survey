// 엑셀 공용 모듈 전수 테스트 — node tests/excel.test.js  (브라우저 없이 서버 경로와 같은 코드로 4시트 생성 확인)
const vm = require('vm'), fs = require('fs'), path = require('path');
const ExcelJS = require('exceljs'); const { buildWorkbook } = require('../excel_build.js');
const ctx = { console }; ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8'), ctx); const CFG = ctx.CFG;
const DATA = [
  { id: 'a', created_at: '2026-09-10T01:00:00Z', name: '홍길동', group_type: '직장(남)', sub_group: '직장1남 (정해일)', members: [ { name: '홍길동', birth_year: '1980', phone: '010-1111-2222', meal: 1, bus: 1 }, { name: '홍아이', birth_year: '2018', phone: '', meal: 1, bus: 1 }, { name: '홍아기', birth_year: '2025', phone: '', meal: 1, bus: 1 } ] },
  { id: 'b', created_at: '2026-09-11T01:00:00Z', name: '김영희', group_type: '이음(여)', sub_group: '이음1여 (노혜선)', members: [ { name: '김영희', birth_year: '1990', phone: '010-3333-4444', meal: 1, bus: 0, bus_go: 1, bus_back: 'early' } ] },
  { id: 'c', created_at: '2026-09-12T01:00:00Z', name: '무명', group_type: '무소속', sub_group: '', members: [ { name: '무명', birth_year: '2000', phone: '', meal: 0, bus: 0, bus_go: 0, bus_back: '' } ] },
  { id: 'd', created_at: '2026-09-12T02:00:00Z', name: null, group_type: '교역자', sub_group: null, members: [ { name: null, birth_year: null, phone: null, meal: null, bus: null } ] } // 깨진 데이터도 죽지 않아야
];
(async () => {
  let fail = 0; const t = (l, ok) => { if (!ok) { fail++; console.log('FAIL', l); } };
  const { wb, fname } = buildWorkbook(ExcelJS, CFG, DATA, { 'a|홍길동|go': true });
  t('4 sheets', wb.worksheets.length === 4);
  t('sheet names', wb.worksheets.map(w => w.name).join(',') === '요약,신청자별,전체명단,차량탑승자');
  const ws = wb.getWorksheet('전체명단'); t('people rows', ws.rowCount === 3 + 6);
  const bus = wb.getWorksheet('차량탑승자'); t('riders exclude 2025 baby', bus.rowCount === 3 + 3);
  t('fname', /^온가족예배_참석조사_\d{4}-\d{2}-\d{2}\.xlsx$/.test(fname));
  const buf = await wb.xlsx.writeBuffer(); t('buffer', buf.length > 5000);
  const empty = buildWorkbook(ExcelJS, CFG, [], {}); t('empty ok', empty.wb.worksheets.length === 4);
  console.log(fail ? `${fail} failed` : 'excel.test: all passed'); process.exit(fail ? 1 : 0);
})();
