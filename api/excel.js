// 서버 엑셀 생성 — 인앱 브라우저(카카오톡 등)는 blob 저장이 막혀 있어 서버가 만든 파일을 일반 https 로 내려준다.
// POST {pw} → 5분짜리 토큰 / GET ?t=토큰 → xlsx. 비밀번호 검증은 Supabase admin_check 그대로.
const crypto = require('crypto'), fs = require('fs'), path = require('path'), vm = require('vm');
const ExcelJS = require('exceljs');
const { buildWorkbook } = require('../excel_build.js');
function loadCFG() { const ctx = { console }; ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8'), ctx); return ctx.CFG; }
const CFG = loadCFG();
const SECRET = process.env.EXCEL_SECRET || crypto.createHash('sha256').update('excel|' + CFG.SUPABASE_KEY).digest('hex');
const KEY = crypto.createHash('sha256').update(SECRET).digest();
const TTL = 5 * 60 * 1000;
function seal(pw) { const iv = crypto.randomBytes(12); const c = crypto.createCipheriv('aes-256-gcm', KEY, iv); const enc = Buffer.concat([c.update(JSON.stringify({ pw, exp: Date.now() + TTL }), 'utf8'), c.final()]); return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64url'); }
function unseal(t) { try { const b = Buffer.from(String(t || ''), 'base64url'); const d = crypto.createDecipheriv('aes-256-gcm', KEY, b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28)); const o = JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8')); return o.exp > Date.now() ? o.pw : null; } catch (e) { return null; } }
async function rpc(fn, args) {
  const r = await fetch(CFG.SUPABASE_URL + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CFG.SUPABASE_KEY, Authorization: 'Bearer ' + CFG.SUPABASE_KEY }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error('저장소 응답 ' + r.status + ': ' + (await r.text()).slice(0, 200));
  return r.json();
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'POST') {
      const pw = String((req.body && req.body.pw) || '').trim();
      if (!pw || !(await rpc('admin_check', { pw }))) return res.status(401).send('비밀번호가 틀렸습니다.');
      return res.status(200).json({ t: seal(pw) });
    }
    if (req.method === 'GET') {
      const pw = unseal(req.query && req.query.t);
      if (!pw) return res.status(401).send('링크가 만료되었습니다. 관리자 페이지에서 엑셀 다운로드를 다시 눌러 주세요.');
      const [DATA, rows] = await Promise.all([rpc('admin_list', { pw }), rpc('admin_checkins', { pw })]);
      const CHECK = {}; for (const r of rows || []) CHECK[r.key] = r.checked;
      const { wb, fname } = buildWorkbook(ExcelJS, CFG, DATA, CHECK);
      const buf = Buffer.from(await wb.xlsx.writeBuffer());
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="family_worship_${new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })}.xlsx"; filename*=UTF-8''${encodeURIComponent(fname)}`);
      res.setHeader('Content-Length', String(buf.length));
      return res.status(200).send(buf);
    }
    res.setHeader('Allow', 'GET, POST'); return res.status(405).send('허용되지 않는 요청');
  } catch (e) { console.error(e); return res.status(500).send('엑셀 생성 실패: ' + (e && e.message || e)); }
};
module.exports._seal = seal; // 테스트용
