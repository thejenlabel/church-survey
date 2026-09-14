const $ = id => document.getElementById(id);
const YOUTH = window.FORM_MODE === 'youth'; // 중고등부 전용 폼
const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const H = { 'Content-Type': 'application/json', apikey: CFG.SUPABASE_KEY, Authorization: 'Bearer ' + CFG.SUPABASE_KEY, Prefer: 'return=minimal' };
const rpc = async (fn, args) => { const r = await fetch(CFG.SUPABASE_URL + '/rest/v1/rpc/' + fn, { method: 'POST', headers: H, body: JSON.stringify(args) }); if (!r.ok) throw new Error(await r.text()); const t = await r.text(); return t ? JSON.parse(t) : null; };

// 이름은 띄어쓰기 불가(중복 방지) — 입력 즉시 공백 제거 · 전화는 대시 자동 · 생년은 부서 표시
document.addEventListener('input', e => {
  if (e.target.matches('#name, .m-name') && /\s/.test(e.target.value)) e.target.value = e.target.value.replace(/\s+/g, '');
  if (e.target.matches('.m-phone')) { const f = CFG.fmtPhone(e.target.value); if (f !== e.target.value) e.target.value = f; }
  if (e.target.matches('.m-birth')) { const d = CFG.kidDept(e.target.value); const tag = e.target.closest('.year-wrap') ? e.target.closest('.year-wrap').parentElement.querySelector('.dept') : e.target.parentElement.querySelector('.dept'); if (tag) tag.textContent = d ? d + ' (출생년도 기준 자동)' : ''; }
});
$('title').textContent = YOUTH ? CFG.TITLE_YOUTH : CFG.TITLE; document.title = YOUTH ? CFG.TITLE_YOUTH : CFG.TITLE;
if (YOUTH) { $('add').hidden = true; }

// 단계 표시: 1 본인 · 2 소속 · 3 인원 · 4 완료(숨김)
function setStep(n) { const st = document.querySelectorAll('#steps .st'); st.forEach((el, i) => { el.classList.toggle('on', i + 1 === n); el.classList.toggle('done', i + 1 < n); }); $('steps').hidden = n === 4; }
function show(id) { for (const s of ['step1', 'stepG', 'step2', 'done']) $(s).hidden = s !== id; $('backTop').hidden = id === 'step1'; window.scrollTo(0, 0); }

// 선택형 안내창
function choose(msg, btns) {
  return new Promise(resolve => {
    $('modalMsg').textContent = msg; $('modalBtns').innerHTML = '';
    for (const b of btns) { const el = document.createElement('button'); el.className = 'btn' + (b.primary ? '' : ' ghost'); el.textContent = b.label; el.onclick = () => { $('modal').hidden = true; resolve(b.value); }; $('modalBtns').appendChild(el); }
    $('modal').hidden = false;
  });
}

// 소속 옵션
for (const g of (YOUTH ? CFG.YOUTH_GROUPS : Object.keys(CFG.GROUPS))) { const o = document.createElement('option'); o.value = g; o.textContent = g; $('group').appendChild(o); }
$('group').addEventListener('change', () => {
  const g = $('group').value; $('sub').innerHTML = '';
  if (!CFG.hasSub(g)) { $('subWrap').hidden = true; return; }
  $('subWrap').hidden = false;
  $('sub').innerHTML = `<option value="">${CFG.GROUPS[g].hint}</option>` + CFG.subOptionsHtml(g);
});

// 상태
let ME = { name: '', phone: '' };   // 1단계 입력
let EDIT = null;                    // 수정 모드: { id, name }
let PULL = [];                      // 남의 신청서에 동반으로 들어 있던 본인 항목 [{sid, name}] → 저장 후 그쪽에서 뺀다

// ===== 1단계: 이름·전화 → 기존 신청 확인 =====
$('next1').onclick = async () => {
  const name = $('name').value.replace(/\s+/g, ''), phone = CFG.fmtPhone($('phone').value);
  if (!name) { $('err1').textContent = '이름을 입력해 주세요.'; $('name').focus(); return; }
  if (CFG.phoneTail(phone).length < 8) { $('err1').textContent = '전화번호를 입력해 주세요.'; $('phone').focus(); return; }
  $('err1').textContent = ''; $('next1').disabled = true;
  ME = { name, phone }; EDIT = null; PULL = [];
  try {
    const sim = await rpc('find_similar', { p_tails: [CFG.phoneTail(phone)] }) || [];
    const me = { name, phone };
    const hits = sim.filter(x => CFG.samePerson(me, { name: x.person, phone: x.phone }));
    // 1) 본인이 신청자로 낸 신청서가 있으면 → 수정 여부
    const own = hits.find(x => x.is_self);
    if (own) {
      const exact = CFG.nameKey(own.person) === CFG.nameKey(name);
      const msg = exact
        ? `${own.person}님은 이미 입력이 되었습니다.\n수정을 원하십니까?`
        : `혹시 ${own.person}님이신가요?\n같은 전화번호로 이미 신청한 내역이 있습니다.`;
      const pick = await choose(msg, [{ label: exact ? '수정하기' : `네, ${own.person} 신청 수정`, value: 'edit', primary: true }, { label: exact ? '취소' : '아니요, 처음 신청합니다', value: 'new' }]);
      if (pick === 'edit') { await startEdit(own.sid, phone); return; }
      if (exact) return; // 취소
    }
    // 2) 남의 신청서에 동반으로만 있는 경우 → 새로 신청하고, 저장 후 그쪽에서 뺀다(조용히)
    PULL = hits.filter(x => !x.is_self).map(x => ({ sid: x.sid, name: x.person }));
    show('stepG'); setStep(2);
  } catch (e) { $('err1').textContent = '확인 중 오류가 났습니다. 잠시 후 다시 시도해 주세요.'; console.error(e); }
  finally { $('next1').disabled = false; }
};

// 수정 모드 진입: 기존 신청서 전부 불러오기
async function startEdit(sid, phone) {
  const list = await rpc('get_own', { p_id: sid, p_phone: phone }) || [];
  if (!list.length) { await choose('수정할 정보가 없습니다.', [{ label: '확인', value: true, primary: true }]); return; }
  const own = list[0];
  EDIT = { id: own.id, name: own.name };
  $('group').value = own.group_type; $('group').dispatchEvent(new Event('change')); if (CFG.hasSub(own.group_type)) $('sub').value = own.sub_group || '';
  $('members').innerHTML = '';
  own.members.forEach((m, i) => addMember(m.name, i === 0, m));
  $('step2Title').textContent = '신청 내용 수정 — 인원 정보를 고치거나 삭제하세요';
  $('submit').textContent = '수정 완료';
  show('step2'); setStep(3);
}

// ===== 2단계: 소속 =====
$('next2').onclick = () => {
  const g = $('group').value;
  if (!g) { $('errG').textContent = '소속을 선택해 주세요.'; $('group').focus(); return; }
  if (CFG.hasSub(g) && !$('sub').value) { $('errG').textContent = '세부소속을 선택해 주세요.'; $('sub').focus(); return; }
  $('errG').textContent = '';
  if (!EDIT) { $('members').innerHTML = ''; addMember(ME.name, true, { phone: ME.phone }); $('step2Title').textContent = '본인 포함, 함께 참석하는 가족을 모두 적어 주세요'; $('submit').textContent = '완료'; }
  show('step2'); setStep(3);
};

// ===== 3단계: 인원 =====
function addMember(name = '', isSelf = false, data = null) {
  const d = document.createElement('div');
  d.className = 'member';
  const seg = (cls, opts, cols = 2) => `<input type="hidden" class="${cls}"><div class="seg${cols === 3 ? ' three' : ''}">${opts.map(([v, t]) => `<button type="button" data-v="${v}">${t}</button>`).join('')}</div>`;
  const selfBtn = isSelf && EDIT ? '<button type="button" class="rm self" aria-label="본인 삭제">본인 삭제</button>' : '';
  // 본인(새 신청)은 1단계에서 이름·전화를 이미 받았으므로 다시 묻지 않고 한 줄로 보여준다
  const selfFixed = isSelf && !EDIT;
  d.innerHTML = selfFixed ? `
    <div class="member-h"><h4>본인</h4></div>
    <div class="self-line"><b>${esc(name)}</b><span>${esc(data && data.phone || '')}</span></div>
    <input type="hidden" class="m-name"><input type="hidden" class="m-phone">
    <div class="row">
      <div><label>출생년도 <em>필수</em></label><div class="year-wrap"><input class="m-birth" inputmode="numeric" maxlength="4" placeholder="1980" autocomplete="off"><span>년</span></div><div class="dept hint"></div></div>
      <div class="row-gap"></div>
      <div><label>식사</label>${seg('m-meal', CFG.MEAL)}</div>
      ${YOUTH ? `<div><label>가는 차량 (교회 → 현지)</label>${seg('m-busgo', CFG.BUS_GO)}</div><div><label>오는 차량 (현지 → 교회)</label>${seg('m-busback', CFG.BUS_BACK, 3)}</div><input type="hidden" class="m-bus">` : `<div><label>교회 차량</label>${seg('m-bus', CFG.BUS)}</div>`}
    </div>` : `
    <div class="member-h"><h4>${isSelf ? '본인' : '동반 가족'}</h4>${isSelf ? selfBtn : '<button type="button" class="rm" aria-label="삭제">삭제</button>'}</div>
    <div class="row">
      <div><label>이름</label><input class="m-name" placeholder="이름" autocomplete="off"></div>
      <div><label>출생년도 <em>필수</em></label><div class="year-wrap"><input class="m-birth" inputmode="numeric" maxlength="4" placeholder="1980" autocomplete="off"><span>년</span></div><div class="dept hint"></div></div>
      <div><label>전화번호 <em>필수</em>${isSelf ? '' : ' <small class="hint" style="display:inline">(' + CFG.PHONE_OPTIONAL_FROM + '년 이후 출생은 생략 가능)</small>'}</label><input class="m-phone" inputmode="numeric" maxlength="13" placeholder="01012345678" autocomplete="off"></div>
      <div class="row-gap"></div>
      <div><label>식사</label>${seg('m-meal', CFG.MEAL)}</div>
      ${YOUTH ? `<div><label>가는 차량 (교회 → 현지)</label>${seg('m-busgo', CFG.BUS_GO)}</div><div><label>오는 차량 (현지 → 교회)</label>${seg('m-busback', CFG.BUS_BACK, 3)}</div><input type="hidden" class="m-bus">` : `<div><label>교회 차량</label>${seg('m-bus', CFG.BUS)}</div>`}
    </div>`;
  d.querySelector('.m-name').value = name;
  d.querySelectorAll('.seg').forEach(g => g.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    g.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    g.previousElementSibling.value = b.dataset.v;
  }));
  if (data) {
    d.querySelector('.m-birth').value = data.birth_year || ''; d.querySelector('.m-phone').value = data.phone || '';
    const pre = (cls, v) => { const inp = d.querySelector('.' + cls); if (!inp || v === undefined || v === null) return; inp.value = String(v); const sib = inp.nextElementSibling; const b = sib && sib.classList && sib.classList.contains('seg') ? sib.querySelector(`button[data-v="${v}"]`) : null; if (b) b.classList.add('on'); };
    if (data.meal !== undefined && data.meal !== '') pre('m-meal', +data.meal);
    if (YOUTH) { if (data.bus !== undefined || data.bus_go !== undefined) { pre('m-busgo', CFG.busGo(data)); pre('m-busback', CFG.busBack(data)); } }
    else if (data.bus !== undefined && data.bus !== '') pre('m-bus', +data.bus);
  }
  $('members').appendChild(d);
  if (data) d.querySelector('.m-birth').dispatchEvent(new Event('input', { bubbles: true }));
  const rm = d.querySelector('.rm:not(.self)'); if (rm) rm.onclick = () => d.remove();
  const rs = d.querySelector('.rm.self'); if (rs) rs.onclick = deleteOwn;
}
$('add').onclick = () => addMember();

// 수정 모드: 본인 삭제 = 신청 전체 삭제
async function deleteOwn() {
  const n = document.querySelectorAll('.member').length;
  const ok = await choose(`본인을 삭제하면 신청한 전체 인원(${n}명)이 모두 삭제됩니다.\n정말 삭제할까요?`, [{ label: '전체 삭제', value: true, primary: true }, { label: '취소', value: false }]);
  if (!ok) return;
  try { await rpc('delete_own', { p_id: EDIT.id, p_name: EDIT.name }); }
  catch (e) { $('err2').textContent = '삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.'; return; }
  show('done'); setStep(4);
  $('done').querySelector('p').textContent = '신청이 삭제되었습니다';
  $('summary').innerHTML = `${EDIT.name}님의 신청(${n}명)을 모두 삭제했습니다.`;
}

// 뒤로
$('backTop').onclick = () => {
  if (!$('done').hidden) { location.reload(); return; }
  if (!$('step2').hidden) { if (EDIT) { location.reload(); return; } show('stepG'); setStep(2); return; }
  if (!$('stepG').hidden) { show('step1'); setStep(1); }
};

// 완료
$('submit').onclick = async () => {
  const rows = [...document.querySelectorAll('.member')];
  const members = [];
  const fail = msg => { $('err2').textContent = msg; $('err2').scrollIntoView({ block: 'center', behavior: 'smooth' }); };
  for (const r of rows) {
    const m = { name: r.querySelector('.m-name').value.replace(/\s+/g, ''), birth_year: r.querySelector('.m-birth').value.trim(), phone: CFG.fmtPhone(r.querySelector('.m-phone').value), meal: r.querySelector('.m-meal').value, bus: r.querySelector('.m-bus').value };
    if (YOUTH) { // 가는/오는 차량 → bus(둘 중 하나라도 탑승), bus_go, bus_back
      const go = r.querySelector('.m-busgo').value, back = r.querySelector('.m-busback').value;
      const goSel = r.querySelector('.m-busgo + .seg .on'), backSel = r.querySelector('.m-busback + .seg .on');
      m.bus_go = go === '' ? '' : +go; m.bus_back = back; m.bus = (goSel && backSel) ? ((+go || back) ? 1 : 0) : '';
      m._busPicked = !!(goSel && backSel);
    }
    const isSelf = r === rows[0];
    if (!isSelf && !m.name && !m.birth_year && !m.phone && m.meal === '' && m.bus === '') { r.remove(); continue; }
    if (!m.name) return fail('이름이 비어 있는 칸이 있습니다.');
    if (!/^\d{4}$/.test(m.birth_year)) return fail(`${isSelf ? '본인' : m.name + '님'} 생년 4자리를 입력해 주세요.`);
    // 전화번호: 본인 필수, 동반도 필수(단 PHONE_OPTIONAL_FROM년 이후 출생은 생략 가능) — 같은 사람 판정이 전화로 이뤄지므로
    const phoneOptional = !isSelf && +m.birth_year >= CFG.PHONE_OPTIONAL_FROM;
    if (!phoneOptional && CFG.phoneTail(m.phone).length < 8) return fail(`${isSelf ? '본인' : m.name + '님'} 전화번호를 입력해 주세요.`);
    if (m.meal === '' || (YOUTH ? !m._busPicked : m.bus === '')) return fail(`${m.name}님의 식사·차량을 선택해 주세요.`);
    m.meal = +m.meal; m.bus = +m.bus; delete m._busPicked;
    if (!YOUTH) { m.bus_go = m.bus; m.bus_back = m.bus ? 'late' : ''; } // 기존 폼(왕복)은 가는 차량 + 끝나고 출발로 저장
    members.push(m);
  }
  // 한 신청서 안에 같은 사람이 두 번 들어가는 것 방지
  for (let i = 0; i < members.length; i++) for (let j = i + 1; j < members.length; j++) {
    if (CFG.samePerson(members[i], members[j])) return fail(`${members[i].name}님과 ${members[j].name}님이 같은 사람으로 보입니다(이름·전화 동일). 한 명만 남겨 주세요.`);
    if (CFG.nameKey(members[i].name) === CFG.nameKey(members[j].name) && members[i].birth_year === members[j].birth_year) return fail(`${members[i].name}님이 두 번 들어 있습니다. 한 명만 남겨 주세요.`);
  }
  $('err2').textContent = '';
  $('submit').disabled = true; const label = $('submit').textContent; $('submit').textContent = '저장 중…';
  const g = $('group').value;
  const body = { name: members[0].name, group_type: g, sub_group: CFG.hasSub(g) ? $('sub').value : '', members };
  try {
    if (EDIT) {
      // 수정 모드에서도 새로 적은 가족이 남의 신청서에 동반으로 있으면 그쪽에서 뺀다(본인 신청서 id는 제외)
      const pulls = [];
      try {
        const tails = [...new Set(members.slice(1).map(m => CFG.phoneTail(m.phone)).filter(t => t.length === 8))];
        const sim = tails.length ? (await rpc('find_similar', { p_tails: tails }) || []) : [];
        for (const m of members.slice(1)) for (const x of sim) if (x.sid !== EDIT.id && !x.is_self && CFG.samePerson(m, { name: x.person, phone: x.phone, birth_year: x.birth_year })) pulls.push({ sid: x.sid, name: x.person });
      } catch (e) { console.error(e); }
      await rpc('replace_submission_by_id', { p_id: EDIT.id, p_name: body.name, p_group: body.group_type, p_sub: body.sub_group, p_members: members });
      for (const p of pulls) { try { await rpc('remove_member', { p_sid: p.sid, p_name: p.name }); } catch (e) { console.error(e); } }
      $('done').querySelector('p').textContent = '수정되었습니다';
    } else {
      // 남의 신청서에 동반으로 들어 있던 본인·가족 항목을 먼저 찾아 둔다(저장 전에 조회 → 본인 신청서는 아직 없으므로 안전)
      const pulls = [...PULL];
      try {
        const tails = [...new Set(members.slice(1).map(m => CFG.phoneTail(m.phone)).filter(t => t.length === 8))];
        const sim = tails.length ? (await rpc('find_similar', { p_tails: tails }) || []) : [];
        for (const m of members.slice(1)) for (const x of sim) if (!x.is_self && CFG.samePerson(m, { name: x.person, phone: x.phone, birth_year: x.birth_year })) pulls.push({ sid: x.sid, name: x.person });
      } catch (e) { console.error(e); }
      const r = await fetch(CFG.SUPABASE_URL + '/rest/v1/submissions', { method: 'POST', headers: H, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(await r.text());
      // 저장 후 그쪽 신청서에서 뺀다 → 소속·정보는 본인 신청서가 정본
      for (const p of pulls) { try { await rpc('remove_member', { p_sid: p.sid, p_name: p.name }); } catch (e) { console.error(e); } }
      $('done').querySelector('p').textContent = '제출되었습니다';
    }
    const meal = members.filter(m => m.meal).length, bus = members.filter(m => m.bus).length;
    $('summary').innerHTML = `<b>총 ${members.length}명 참석</b> · 식사 ${meal}명 · 교회 차량 ${bus}명<ul class="done-list">${members.map(m => `<li>${m.name}${m.birth_year ? ' (' + m.birth_year + ')' : ''} — ${m.meal ? '식사함' : '식사안함'} · ${YOUTH ? ('가는 차량 ' + (CFG.busGo(m) ? 'O' : 'X') + ' · 오는 차량 ' + ({ '': 'X', early: '1시', late: '끝나고' }[CFG.busBack(m)] || 'X')) : (m.bus ? '교회차량' : '차량불필요')}</li>`).join('')}</ul>`;
    show('done'); setStep(4);
  } catch (e) {
    $('err2').textContent = '저장에 실패했습니다. 잠시 후 다시 시도해 주세요.';
    $('submit').disabled = false; $('submit').textContent = label; console.error(e);
  }
};
