/* 14-18장: 재분석(BLL, FHLT)의 요약 도식, 논문 이후의 재분석 */
(function () {
  'use strict';
  const { S, tw, show, svg, lin, C, viz, fmt } = DK;
  // 계수 그림 한 줄: 점, 95% 구간, 값
  function coefRow(g, x, yy, est, se, o) {
    const lo = est - 1.96 * se, hi = est + 1.96 * se, col = o.col || C.ink, r = S('g', { o: 0 }, g);
    S('line', { x1: x(lo), x2: x(hi), y1: yy, y2: yy, stroke: col, 'stroke-width': 3 }, r);
    [lo, hi].forEach(e => S('line', { x1: x(e), x2: x(e), y1: yy - 7, y2: yy + 7, stroke: col, 'stroke-width': 3 }, r));
    S('circle', { cx: x(est), cy: yy, r: 8.5, fill: o.sig ? col : '#fff', stroke: col, 'stroke-width': 3 }, r);
    S('text', { x: o.lx, y: yy + 6, cls: 'lb', text: o.name }, r);
    S('text', { x: o.vx, y: yy + 6, 'text-anchor': 'end', cls: 'lb' + (o.col === C.bad ? ' fb' : ''), 'font-weight': 700, text: `${fmt(est, 3)} (${o.seTxt})` }, r);
    return r;
  }

  /* ---------- 14. BLL: 분해와 대안 추정치 ---------- */
  viz('bll', (host, W, Hh) => {
    const v = svg(host, W, Hh);
    // 분해 (원문 Fig. 8 iii)
    const mx = lin(0, 1, 468, 850), my = lin(-.035, .012, 372, 78), g1 = S('g', { o: 0 }, v);
    S('text', { x: 420, y: 30, cls: 'ttl', text: 'TWFE 계수 −0.022의 분해 (원문 Fig. 8 iii)' }, g1);
    [0, -.01, -.02, -.03].forEach(n => { S('line', { x1: 468, x2: 850, y1: my(n), y2: my(n), cls: n === 0 ? 'axis' : 'grid' }, g1); S('text', { x: 458, y: my(n) + 5.5, 'text-anchor': 'end', cls: 'ax', text: n === 0 ? '0' : fmt(n, 2) }, g1); });
    const b1 = S('g', { o: 0 }, v), r1 = S('rect', { x: mx(0), y: my(0), width: mx(.857) - mx(0), height: 0, fill: C.bad }, b1);
    const t1 = S('g', { o: 0 }, v); S('text', { x: (mx(0) + mx(.857)) / 2, y: my(-.011), 'text-anchor': 'middle', cls: 'lbb', style: 'fill:#fff', text: '나중 완화 주 대 이미 완화한 주' }, t1); S('text', { x: (mx(0) + mx(.857)) / 2, y: my(-.011) + 28, 'text-anchor': 'middle', cls: 'lb', style: 'fill:#fff', text: '가중치 85.7%,  평균 DID −0.027' }, t1);
    const b2 = S('g', { o: 0 }, v), r2 = S('rect', { x: mx(.857), y: my(0), width: mx(1) - mx(.857), height: 0, fill: '#b9bcc6' }, b2);
    const t2 = S('g', { o: 0 }, v); S('text', { x: 850, y: my(.005) - 36, 'text-anchor': 'end', cls: 'lbb', text: '먼저 완화한 주 대 아직 미완화 주' }, t2); S('text', { x: 850, y: my(.005) - 10, 'text-anchor': 'end', cls: 'lb', text: '가중치 14.3%,  평균 DID +0.005' }, t2);
    const sum = S('g', { o: 0 }, v); S('line', { x1: 468, x2: 850, y1: my(-.022), y2: my(-.022), stroke: C.ink, 'stroke-width': 3 }, sum);
    S('text', { x: mx(.857) - 12, y: my(-.022) - 9, 'text-anchor': 'end', cls: 'lb', style: 'fill:#fff', text: '면적의 합 = TWFE −0.022' }, sum);
    S('text', { x: 468, y: 412, cls: 'lb', text: '0.857 × (−0.027) + 0.143 × 0.005 = ' }, sum).innerHTML = '0.857 × (−0.027) + 0.143 × 0.005 = <tspan font-weight="700">−0.022</tspan>';
    // 대안 추정치 (원문 Table 2)
    const fx = lin(-.045, .022, 300, 720), g2 = S('g', { o: 0 }, v);
    S('text', { x: 0, y: 512, cls: 'ttl', text: '로그 Gini에 대한 효과 추정치와 95% 구간 (원문 Table 2)' }, g2);
    [-.04, -.03, -.02, -.01, 0, .01, .02].forEach(n => { S('line', { x1: fx(n), x2: fx(n), y1: 530, y2: 744, cls: n === 0 ? 'axis' : 'grid' }, g2); S('text', { x: fx(n), y: 768, 'text-anchor': 'middle', cls: 'ax', text: n === 0 ? '0' : fmt(n, 2) }, g2); });
    const ref = S('line', { x1: fx(-.022), x2: fx(-.022), y1: 530, y2: 744, stroke: C.bad, 'stroke-width': 2, 'stroke-dasharray': '6 5', o: 0 }, v);
    const rows = [coefRow(v, fx, 568, -.022, .008, { name: 'TWFE (원 논문 복제)', lx: 0, vx: 880, sig: true, col: C.bad, seTxt: '0.008' }), coefRow(v, fx, 634, .001, .007, { name: "Callaway-Sant'Anna", lx: 0, vx: 880, sig: false, seTxt: '0.007' }), coefRow(v, fx, 700, 0, .005, { name: 'Stacked', lx: 0, vx: 880, sig: false, seTxt: '0.005' })];
    return B => {
      const st = Math.max(0, B);
      show(g1, st >= 2); show(b1, st >= 2); tw(r1, { y: st >= 2 ? my(0) : my(0), height: st >= 2 ? my(-.027) - my(0) : 0 }, { dur: 800, ease: 'out', delay: st === 2 ? 300 : 0 }); show(t1, st >= 2, { delay: st === 2 ? 900 : 0 });
      show(b2, st >= 3); tw(r2, { y: st >= 3 ? my(.005) : my(0), height: st >= 3 ? my(0) - my(.005) : 0 }, { dur: 600, ease: 'out' }); show(t2, st >= 3, { delay: st === 3 ? 400 : 0 }); show(sum, st >= 3, { delay: st === 3 ? 900 : 0 });
      show(g2, st >= 4); rows.forEach((r, i) => show(r, st >= 4, { delay: st === 4 ? 200 + i * 350 : 0 })); show(ref, st >= 4, { delay: st === 4 ? 1300 : 0 });
    };
  });

  /* ---------- 16. FHLT: 추정법별 결과 ---------- */
  viz('fhlt', (host, W, Hh) => {
    const v = svg(host, W, Hh), x = lin(-.25, .45, 290, 720);
    S('text', { x: 0, y: 28, cls: 'ttl', text: "Tobin's Q에 대한 효과 추정치와 95% 구간 (원문 Table 3)" }, v);
    [-.2, 0, .2, .4].forEach(n => { S('line', { x1: x(n), x2: x(n), y1: 52, y2: 428, cls: n === 0 ? 'axis' : 'grid' }, v); S('text', { x: x(n), y: 452, 'text-anchor': 'middle', cls: 'ax', text: n === 0 ? '0' : fmt(n, 1) }, v); });
    const mk = (yy, e, se, name, sig, seTxt) => coefRow(v, x, yy, e, se, { name, lx: 28, vx: 880, sig, seTxt });
    const gA = S('text', { x: 0, y: 80, cls: 'lbb', text: '주요 개혁', o: 0 }, v), gB = S('text', { x: 0, y: 262, cls: 'lbb', text: '최초 개혁', o: 0 }, v);
    const A = [mk(114, .110, .05, 'TWFE (통제 없음)', true, '0.05'), mk(158, .062, .135, "Callaway-Sant'Anna", false, '0.135'), mk(202, .063, .051, 'Stacked', false, '0.051')];
    const Bq = [mk(296, .136, .07, 'TWFE (통제 없음)', true, '0.07'), mk(340, .116, .094, "Callaway-Sant'Anna", false, '0.094'), mk(384, .166, .055, 'Stacked', true, '0.055')];
    const ref = S('g', { o: 0 }, v); S('line', { x1: x(.110), x2: x(.110), y1: 92, y2: 222, stroke: C.ink, 'stroke-width': 2, 'stroke-dasharray': '6 5' }, ref);
    S('rect', { x: x(.062 - 1.96 * .135) - 8, y: 140, width: x(.062 + 1.96 * .135) - x(.062 - 1.96 * .135) + 16, height: 36, fill: 'none', stroke: C.ink, 'stroke-width': 2.5 }, ref);
    S('text', { x: x(.110) + 8, y: 232, cls: 'lbs', text: '원래 추정치 0.110' }, ref);
    return B => {
      const st = Math.max(0, B);
      show(gA, st >= 1); A.forEach((r, i) => show(r, st >= 1, { delay: st === 1 ? 200 + i * 350 : 0 }));
      show(gB, st >= 2); Bq.forEach((r, i) => show(r, st >= 2, { delay: st === 2 ? 200 + i * 350 : 0 }));
      show(ref, st >= 4, { delay: 200 });
    };
  });

  /* ---------- 18. 논문 이후의 대규모 재분석 ---------- */
  viz('after', (host, W, Hh) => {
    const v = svg(host, W, Hh), x = lin(0, 30, 330, 820);
    S('text', { x: 330, y: 30, cls: 'ttl', text: 'TWFE와 부호가 반대인 비교의 비율' }, v);
    [0, 10, 20, 30].forEach(n => { S('line', { x1: x(n), x2: x(n), y1: 92, y2: 590, cls: n === 0 ? 'axis' : 'grid' }, v); S('text', { x: x(n), y: 616, 'text-anchor': 'middle', cls: 'ax', text: n + '%' }, v); });
    S('rect', { x: 330, y: 50, width: 18, height: 18, fill: C.ink }, v); S('text', { x: 356, y: 65, cls: 'lbs', text: 'CS 계열과 비교' }, v);
    S('rect', { x: 500, y: 50, width: 18, height: 18, fill: '#b9bcc6' }, v); S('text', { x: 526, y: 65, cls: 'lbs', text: 'imputation 계열과 비교' }, v);
    const grp = (yy, name, src, n, vals) => { const g = S('g', { o: 0 }, v), bars = [];
      S('text', { x: 0, y: yy + 22, cls: 'big', text: name }, g); S('text', { x: 0, y: yy + 50, cls: 'lb', text: src }, g); S('text', { x: 0, y: yy + 76, cls: 'lbs', text: n }, g);
      vals.forEach((val, i) => { const r = S('rect', { x: x(0), y: yy + i * 48, width: 0, height: 38, fill: i === 0 ? C.ink : '#b9bcc6' }, g), t = S('text', { x: 0, y: yy + i * 48 + 26, cls: 'lbb', text: fmt(val, 1) + '%', tx: x(0) + 10, o: 0 }, g); bars.push({ r, t, val }); });
      return { g, bars }; };
    const G = [grp(112, '경제학', 'Hull (2026)', '116편, 1,430개 사양', [14.9, 12.0]), grp(282, '정치학', 'Chiu 등 (2026, APSR)', '49편', []), grp(430, '경영, 마케팅', 'Proserpio (2026)', '40편, 355개 사양', [25.1, 18.0])];
    const pol = S('g', { o: 0 }, v); S('text', { x: x(0) + 14, y: 282 + 22, cls: 'lbb', text: '부호가 반대인 연구 0편 (49편 중)' }, pol); S('text', { x: x(0) + 14, y: 282 + 52, cls: 'lb', text: '5% 수준에서 유의하지 않은 연구는 1편에서 12편으로 증가' }, pol);
    const note = S('g', { o: 0 }, v); S('text', { x: 0, y: 676, cls: 'lbb', text: '부호가 반대이고 그 차이까지 유의한 비교의 비율' }, note);
    S('text', { x: 0, y: 708, cls: 'lb', text: '경제학 3.9%, 2.8%' }, note); S('text', { x: 240, y: 708, cls: 'lb', text: '경영과 마케팅 10.2%, 7.2%' }, note);
    S('text', { x: 0, y: 746, cls: 'lbs', text: 'Hull, arXiv 2610.39995 v2.  Chiu, Lan, Liu & Xu, APSR 120(1).  Proserpio, arXiv 2611.11003 v2.' }, note);
    return B => {
      const st = Math.max(0, B);
      G.forEach((g, i) => { const on = st >= i + 1; show(g.g, on); g.bars.forEach((b, j) => { tw(b.r, { width: on ? x(b.val) - x(0) : 0 }, { dur: 900, ease: 'out', delay: on && st === i + 1 ? 250 + j * 200 : 0 }); tw(b.t, { tx: on ? x(b.val) + 10 : x(0) + 10, o: on ? 1 : 0 }, { dur: 900, ease: 'out', delay: on && st === i + 1 ? 250 + j * 200 : 0 }); }); });
      show(pol, st >= 2, { delay: st === 2 ? 600 : 0 }); show(note, st >= 4);
    };
  });
})();
