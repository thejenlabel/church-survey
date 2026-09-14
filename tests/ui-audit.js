// 브라우저 콘솔에서 실행: 겹침·가로넘침·잘림 자동 점검
window.uiAudit = function () {
  const issues = [];
  const vw = document.documentElement.clientWidth;
  // 1) 가로 스크롤
  if (document.documentElement.scrollWidth > vw + 1) issues.push({ type: 'page-overflow', detail: `${document.documentElement.scrollWidth} > ${vw}` });
  // 2) 화면 밖으로 나간 요소
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || !el.offsetParent && cs.position !== 'fixed') continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (r.right > vw + 1 && !el.closest('.tbl')) issues.push({ type: 'overflow-x', el: el.tagName + '.' + el.className, right: Math.round(r.right) });
    // 3) 내용 잘림(넘치는데 숨김 처리도 없음)
    if (el.children.length === 0 && el.scrollWidth > el.clientWidth + 1 && cs.overflow === 'visible' && cs.textOverflow !== 'ellipsis' && cs.whiteSpace !== 'nowrap')
      issues.push({ type: 'clipped', el: el.tagName + '.' + el.className, text: (el.textContent || '').slice(0, 20) });
  }
  // 4) 형제 요소 세로 겹침(같은 부모의 블록 행)
  const check = (sel) => {
    const rows = [...document.querySelectorAll(sel)];
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1].getBoundingClientRect(), b = rows[i].getBoundingClientRect();
      if (a.height && b.height && b.top < a.bottom - 1) issues.push({ type: 'overlap', sel, i, gap: Math.round(b.top - a.bottom) });
    }
  };
  ['.scard', '#rows tr', '.member', '.mem', '.rider', '.kid', '.stat'].forEach(check);
  // 5) 터치 목표 너무 작음
  for (const b of document.querySelectorAll('button, select, input')) {
    const cs = getComputedStyle(b); if (cs.display === 'none' || b.type === 'hidden') continue;
    const r = b.getBoundingClientRect(); if (r.height && r.height < 28) issues.push({ type: 'small-target', el: b.className || b.id, h: Math.round(r.height) });
  }
  return issues;
};
