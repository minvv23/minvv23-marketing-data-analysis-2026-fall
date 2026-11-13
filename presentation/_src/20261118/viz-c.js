/* 10-13장: 사건연구, CS와 SA, stacked, 대안 추정량의 성능 */
(function () {
  'use strict';
  const { S, tw, show, svg, lin, C, viz, fmt } = DK;
  const V = c => `<tspan class="v">${c}</tspan>`;
  const sgn = n => n === 0 ? '0' : fmt(n, 1) + 'σ';
  // 단계 안에서 시간차로 이어지는 장면. 장을 넘기면 대기 중인 것을 취소하고, 즉시 모드에서는 마지막 장면만 그린다.
  function sequencer() { let ts = []; return { clear() { ts.forEach(clearTimeout); ts = []; }, run(scenes, gap) { this.clear(); if (!DK.live) { scenes[scenes.length - 1](); return; } scenes.forEach((f, i) => { if (i === 0) f(); else ts.push(setTimeout(f, i * gap)); }); } }; }

  /* ---------- 10. TWFE 사건연구 ---------- */
  viz('event', (host, W, Hh) => {
    const v = svg(host, W, Hh), M = SIM.get();
    const x = lin(-5, 5, 124, 790), y = lin(-.3, .4, 404, 56);
    VZ.yAxis(v, y, [-.2, -.1, 0, .1, .2, .3, .4], 96, 820, sgn);
    for (let l = -5; l <= 5; l++) S('text', { x: x(l), y: 432, 'text-anchor': 'middle', cls: 'ax', text: String(l).replace('-', '−') }, v);
    const axT = S('text', { x: 820, y: 458, 'text-anchor': 'end', cls: 'lbs', text: '도입 기준 상대시간 (년)', o: 1 }, v);
    S('line', { x1: x(-.5), x2: x(-.5), y1: 56, y2: 410, stroke: C.faint, 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }, v);
    const title = S('text', { x: 96, y: 30, cls: 'ttl', text: '' }, v);
    const P = { a: [1989, 1998, 2007].map(g => ST.effPath('6b', g)), b: [1989, 1998, 2007].map(g => ST.sim7Path(g)) };
    const D = {}; for (const k of ['a', 'b']) { const ev = M.event(P[k]), m = new Map(ev.map(o => [o.l, o])); m.set(-1, { l: -1, mean: 0, lo: 0, hi: 0 }); D[k] = { ev: [...m.values()].sort((p, q) => p.l - q.l), tr: M.trueEvent(P[k]) }; }
    const truth = S('path', { pts: D.a.tr.map(o => [x(o.l), y(o.v)]), stroke: C.ink, 'stroke-width': 3.5, 'stroke-dasharray': '10 7', fill: 'none', o: 0 }, v);
    const est = S('g', { o: 0 }, v), marks = D.a.ev.map(o => ({ w: S('line', { x1: x(o.l), x2: x(o.l), y1: y(0), y2: y(0), stroke: C.bad, 'stroke-width': 2.5 }, est), p: S('circle', { cx: x(o.l), cy: 0, r: 7, fill: C.bad, ty: y(0) }, est) }));
    const ring = S('circle', { cx: x(-3), cy: 0, r: 15, fill: 'none', stroke: C.ink, 'stroke-width': 2.5, ty: y(0), o: 0 }, v);
    const lg = S('g', { o: 0 }, v); S('line', { x1: 560, x2: 600, y1: 24, y2: 24, stroke: C.ink, 'stroke-width': 3.5, 'stroke-dasharray': '10 7' }, lg); const lgT = S('text', { x: 608, y: 30, cls: 'lbs', text: '참 평균효과' }, lg);
    const lg2 = S('g', { o: 0 }, v); S('circle', { cx: 722, cy: 24, r: 6.5, fill: C.bad }, lg2); S('text', { x: 736, y: 30, cls: 'lbs', text: 'TWFE' }, lg2);
    // 5단계: -3기 계수가 싣는 비교
    const g5 = S('g', { o: 0 }, v), t = VZ.tiles(g5, 150, 484, 660, 214, { gap: 10, noRows: true }); DK.instant(() => t.cursor(2016));
    t.blocks.forEach(b => S('text', { x: t.x0 - 12, y: (b.y0 + b.y1) / 2 + 6, 'text-anchor': 'end', cls: 'lbs ' + b.c.k, 'font-weight': 700, text: b.c.g + '년' }, g5));
    [1980, 1989, 1998, 2007, 2015].forEach(n => S('text', { x: t.xOf(n) + t.cw / 2, y: t.y0 + t.h + 22, 'text-anchor': 'middle', cls: 'ax', text: n }, g5));
    const cell = (k, yr, fill, stroke, txt, col) => { const b = t.blocks[k]; S('rect', { x: t.xOf(yr) + 1, y: b.y0 + 1, width: t.cw - 2, height: b.y1 - b.y0 - 2, fill, stroke, 'stroke-width': 3 }, g5); if (txt) S('text', { x: t.xOf(yr) + t.cw / 2, y: (b.y0 + b.y1) / 2 + 7, 'text-anchor': 'middle', 'font-size': 19, 'font-weight': 800, style: 'fill:' + col, text: txt }, g5); };
    [[1, 1995], [1, 1997], [2, 2004], [2, 2006]].forEach(([k, yr]) => cell(k, yr, '#fff', C.ink));
    [[0, 1995, '−'], [0, 1997, '+'], [0, 2004, '−'], [0, 2006, '+'], [1, 2004, '−'], [1, 2006, '+']].forEach(([k, yr, s]) => cell(k, yr, s === '+' ? C.ink : C.bad, '#fff', s, '#fff'));
    S('text', { x: 150, y: 474, cls: 'lbs', text: '흰 칸은 −3기와 −1기에 있는 아직 미처치 코호트,  + −는 같은 해의 이미 처치된 코호트' }, g5);
    return B => {
      const st = Math.max(0, B), k = (st === 3 || st === 4) ? 'b' : 'a', d = D[k], o = { dur: 900 };
      title.textContent = st === 0 ? '' : k === 'a' ? '사전추세 없음, 효과는 커짐' : '효과 0, 사전추세 있음';
      show(truth, st >= 1, { delay: st === 1 ? 200 : 0 }); show(lg, st >= 1); tw(truth, { pts: d.tr.map(p => [x(p.l), y(p.v)]) }, o);
      const estOn = st === 2 || st >= 4; show(est, estOn, { delay: estOn && (st === 2 || st === 4) ? 500 : 0 }); show(lg2, estOn);
      marks.forEach((m, i) => { const e = d.ev[i]; tw(m.p, { ty: y(e.mean) }, o); tw(m.w, { y1: y(e.lo), y2: y(e.hi) }, o); });
      lgT.textContent = k === 'a' ? '참 평균효과' : '참 경로'; show(axT, st !== 5);
      show(ring, st === 5, { delay: 400 }); tw(ring, { ty: y(D.a.ev[2].mean) }, { dur: 0 });
      show(g5, st === 5, { delay: st === 5 ? 300 : 0 });
    };
  });

  /* ---------- 11. CS: (g, t)마다 깨끗한 2x2 ---------- */
  viz('cs', (host, W, Hh) => {
    const v = svg(host, W, Hh), cw = 124, ch = 66, gp = 6, x0 = 150, y0 = 58, I = Infinity;
    const R = [{ n: 'U', g: I, y: [0, 0, 0, 0, 0], c: C.u, cs: C.us, k: 'fu' }, { n: 'k', g: 1, y: [0, 1, 3, 5, 7], c: C.c1, cs: C.c1s, k: 'f1' }, { n: 'l', g: 3, y: [0, 0, 0, 1, 3], c: C.c2, cs: C.c2s, k: 'f2' }];
    const cx = t => x0 + t * (cw + gp), cy = r => y0 + r * (ch + gp);
    [1, 2, 3, 4, 5].forEach((n, t) => S('text', { x: cx(t) + cw / 2, y: y0 - 14, 'text-anchor': 'middle', cls: 'lbb', text: n + '기' }, v));
    const cells = R.map((row, r) => { S('text', { x: x0 - 26, y: cy(r) + ch / 2 + 10, 'text-anchor': 'middle', cls: 'big ' + row.k, html: V(row.n) }, v);
      return row.y.map((val, t) => { const on = t >= row.g; S('rect', { x: cx(t), y: cy(r), width: cw, height: ch, fill: on ? row.cs : '#fff', stroke: C.line, 'stroke-width': 1.5 }, v);
        S('text', { x: cx(t) + cw / 2, y: cy(r) + ch / 2 + 9, 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 700, text: val }, v);
        return S('rect', { x: cx(t) + 3, y: cy(r) + 3, width: cw - 6, height: ch - 6, fill: 'none', stroke: C.ink, 'stroke-width': 4, o: 0 }, v); }); });
    S('text', { x: x0, y: cy(3) + 14, cls: 'lbs', text: '칸의 숫자는 결과 Y (무처치 결과 0). 색칠된 칸이 도입 후' }, v);
    const f1 = S('text', { x: x0, y: cy(3) + 62, cls: 'ttl', text: '', o: 0 }, v), f2 = S('text', { x: x0, y: cy(3) + 94, cls: 'ttl fb', text: '', o: 0 }, v);
    // 결과 표
    const ry = cy(3) + 126, res = {};
    S('text', { x: x0 - 14, y: ry + 34, 'text-anchor': 'end', cls: 'lbs', html: `ATT(${V('k')}, t)` }, v); S('text', { x: x0 - 14, y: ry + 34 + 56, 'text-anchor': 'end', cls: 'lbs', html: `ATT(${V('l')}, t)` }, v);
    [[1, 1, 1], [1, 2, 3], [1, 3, 5], [1, 4, 7], [2, 3, 1], [2, 4, 3]].forEach(([r, t, val]) => { const yy = ry + (r - 1) * 56; S('rect', { x: cx(t), y: yy, width: cw, height: 50, fill: 'none', stroke: C.line, 'stroke-width': 1.5 }, v);
      res[r + '-' + t] = S('text', { x: cx(t) + cw / 2, y: yy + 35, 'text-anchor': 'middle', cls: 'big ' + R[r].k, text: val, o: 0 }, v); });
    const agg = S('g', { o: 0 }, v);
    [['3.33', '칸 평균', '여섯 칸을 같은 비중으로', 60], ['3', '코호트 평균', `${V('k')} 4, ${V('l')} 2를 같은 비중으로`, 330], ['1, 3, 5, 7', '상대시간별', '도입 0, 1, 2, 3기 뒤', 600]].forEach(([n, a, b, xx]) => { S('text', { x: xx, y: 636, cls: 'lbb', text: a }, agg); S('text', { x: xx, y: 686, 'font-size': 40, 'font-weight': 800, text: n }, agg); S('text', { x: xx, y: 716, cls: 'lbs', html: b }, agg); });
    const sq = sequencer();
    function focus(r, t, bad) {
      const row = R[r], ctrl = R.map((c, i) => i).filter(i => R[i].g > t || (bad && i === 1));
      cells.forEach((rw, i) => rw.forEach((h, tt) => { const mine = i === r && (tt === t || tt === row.g - 1), c = ctrl.includes(i) && (tt === t || tt === row.g - 1);
        h.setAttribute('stroke', mine ? row.c : (bad && i === 1) ? C.bad : C.ink); h.setAttribute('stroke-dasharray', mine ? 'none' : '9 6'); tw(h, { o: (mine || c) ? 1 : 0 }, { dur: 300 }); }));
      const a = row.y[t], b0 = row.y[row.g - 1];
      if (bad) { f2.innerHTML = `${V('k')}와 비교하면  (${a} − ${b0}) − (${R[1].y[t]} − ${R[1].y[row.g - 1]}) = −1`; tw(f2, { o: 1 }, { dur: 300 }); }
      else { f1.innerHTML = `ATT(${V(row.n)}, ${t + 1}기) = (${a} − ${b0}) − (0 − 0) = ${a - b0}`; tw(f1, { o: 1 }, { dur: 300 }); tw(res[r + '-' + t], { o: 1 }, { dur: 300, delay: 250 }); }
    }
    const clearHL = () => cells.forEach(rw => rw.forEach(h => tw(h, { o: 0 }, { dur: 300 })));
    return B => {
      sq.clear(); const st = Math.max(0, B);
      const shown = st >= 3 ? 6 : st === 2 ? 4 : st === 1 ? 1 : 0;
      Object.keys(res).forEach((k, i) => { if (i >= shown) tw(res[k], { o: 0 }, { dur: 200 }); });
      if (st !== 3) tw(f2, { o: 0 }, { dur: 200 });
      if (st === 0) { clearHL(); tw(f1, { o: 0 }, { dur: 200 }); }
      else if (st === 1) sq.run([() => focus(1, 1)], 0);
      else if (st === 2) sq.run([() => focus(1, 2), () => focus(1, 3), () => focus(1, 4)], 1300);
      else if (st === 3) sq.run([() => focus(2, 3), () => focus(2, 4), () => { focus(2, 3); focus(2, 3, true); }], 1300);
      else { clearHL(); tw(f1, { o: 0 }, { dur: 200 }); Object.values(res).forEach(r => tw(r, { o: 1 }, { dur: 200 })); }
      if (st === 3 && !DK.live) Object.values(res).forEach(r => tw(r, { o: 1 }));
      if (st === 2 && !DK.live) ['1-1', '1-2', '1-3', '1-4'].forEach(k => tw(res[k], { o: 1 }));
      show(agg, st === 4);
    };
  });

  /* ---------- 12. Stacked: 사건별 자료를 잘라 쌓는다 ---------- */
  viz('stack', (host, W, Hh) => {
    const v = svg(host, W, Hh), cw = 78, ch = 40, gp = 4, x0 = 130, y0 = 60, I = Infinity;
    const rows = [{ n: 'U', g: I, e: 0, c: C.us, k: 'fu' }, { n: 'k', g: 1, e: 2, c: C.c1s, k: 'f1' }, { n: 'l', g: 3, e: 6, c: C.c2s, k: 'f2' }, { n: 'l', g: 3, e: 6, c: C.c2s, k: 'f2' }, { n: 'l', g: 3, e: 6, c: C.c2s, k: 'f2' }];
    const X = t => x0 + t * (cw + gp), Y = r => y0 + r * (ch + gp), val = (r, t) => t >= rows[r].g ? rows[r].e : 0;
    S('text', { x: x0, y: 30, cls: 'ttl', text: '원자료' }, v);
    [1, 2, 3, 4, 5].forEach((n, t) => S('text', { x: X(t) + cw / 2, y: y0 - 10, 'text-anchor': 'middle', cls: 'ax', text: n + '기' }, v));
    const mkCell = (parent, r, t) => { const g = S('g', { tx: 0, ty: 0 }, parent); S('rect', { x: X(t), y: Y(r), width: cw, height: ch, fill: t >= rows[r].g ? rows[r].c : '#fff', stroke: '#cfd1d6', 'stroke-width': 1.5 }, g);
      S('text', { x: X(t) + cw / 2, y: Y(r) + ch / 2 + 7, 'text-anchor': 'middle', 'font-size': 19, 'font-weight': 700, text: val(r, t) }, g); return g; };
    rows.forEach((row, r) => { S('text', { x: x0 - 20, y: Y(r) + ch / 2 + 8, 'text-anchor': 'middle', cls: 'lbb ' + row.k, html: V(row.n) }, v); for (let t = 0; t < 5; t++) mkCell(v, r, t); });
    S('text', { x: X(5) + 10, y: Y(0) + 26, cls: 'lbs', text: '칸의 숫자는 결과 Y' }, v); S('text', { x: X(5) + 10, y: Y(0) + 52, cls: 'lbs', text: '색칠된 칸이 도입 후' }, v);
    const ex = S('g', { o: 0 }, v); S('rect', { x: X(2) - 2, y: Y(1) - 2, width: 3 * (cw + gp), height: ch + 4, fill: 'none', stroke: C.bad, 'stroke-width': 3, 'stroke-dasharray': '8 5' }, ex);
    S('text', { x: X(5) + 10, y: Y(1) + ch / 2 + 7, cls: 'lb fb', html: `이미 처치된 ${V('k')}는 제외` }, ex);
    // 사건별 자료 (복사본이 원자료 자리에서 내려온다)
    const SY = 330, ST1 = { rs: [0, 1, 2, 3, 4], cs: [0, 1, 2], x: 130, y: SY }, ST2 = { rs: [0, 2, 3, 4], cs: [2, 3, 4], x: 130 + 3 * (cw + gp) + 96, y: SY };
    [ST1, ST2].forEach((s, si) => { s.g = S('g', { o: 0 }, v); s.cl = []; s.rs.forEach((r, i) => s.cs.forEach((t, j) => { const c = mkCell(s.g, r, t); c.__to = [s.x + j * (cw + gp) - X(t), s.y + i * (ch + gp) - Y(r)]; s.cl.push(c); }));
      s.lab = S('g', { o: 0 }, v); const nm = si === 0 ? 'k' : 'l';
      S('text', { x: s.x, y: SY - 14, cls: 'ttl', html: `${V(nm)}의 사건 자료 (${si === 0 ? '1-3기' : '3-5기'})` }, s.lab);
      S('text', { x: s.x, y: SY + 5 * (ch + gp) + 26, cls: 'lb', html: si === 0 ? `처치 ${V('k')} 1단위, 비교 4단위` : `처치 ${V('l')} 3단위, 비교 ${V('U')} 1단위` }, s.lab);
      S('text', { x: s.x, y: SY + 5 * (ch + gp) + 58, cls: 'big', text: 'DID = ' + (si === 0 ? 2 : 6) }, s.lab);
      s.rs.forEach((r, i) => S('text', { x: s.x - 18, y: s.y + i * (ch + gp) + ch / 2 + 7, 'text-anchor': 'middle', cls: 'lbs ' + rows[r].k, html: V(rows[r].n) }, s.lab)); });
    // 가중치 막대
    const wb = S('g', { o: 0 }, v), bx0 = 130, bw = 620, w1 = 16 / 31, by = 652;
    S('rect', { x: bx0, y: by, width: bw * w1, height: 44, fill: '#c3c6cf' }, wb); S('rect', { x: bx0 + bw * w1, y: by, width: bw * (1 - w1), height: 44, fill: '#e2e3e8' }, wb);
    S('text', { x: bx0 + bw * w1 / 2, y: by + 29, 'text-anchor': 'middle', cls: 'lb', html: `${V('k')} 자료  16/31` }, wb); S('text', { x: bx0 + bw * w1 + bw * (1 - w1) / 2, y: by + 29, 'text-anchor': 'middle', cls: 'lb', html: `${V('l')} 자료  15/31` }, wb);
    S('text', { x: bx0, y: by - 14, cls: 'lbs', text: 'stacked 회귀가 두 자료에 부여한 가중치' }, wb);
    S('text', { x: bx0, y: by + 74, cls: 'ttl', text: 'stacked = (16 × 2 + 15 × 6) / 31 = 3.94' }, wb); S('text', { x: bx0 + 430, y: by + 74, cls: 'ttl fm', text: '처치 단위 평균 ATT = 5' }, wb);
    const why = S('g', { o: 0 }, v); S('text', { x: bx0, y: by + 104, cls: 'lb', text: '가중치는 관측치 수 × 처치 단위 비율의 분산에 비례한다.' }, why);
    S('text', { x: bx0, y: by + 130, cls: 'lb', html: `${V('k')} 자료 15 × (1/5)(4/5) = 2.40` }, why); S('text', { x: bx0 + 300, y: by + 130, cls: 'lb', html: `${V('l')} 자료 12 × (3/4)(1/4) = 2.25` }, why);
    return B => {
      const st = Math.max(0, B);
      [ST1, ST2].forEach((s, si) => { const on = st >= si + 2; show(s.g, on, { dur: 250 }); s.cl.forEach((c, i) => tw(c, { tx: on ? c.__to[0] : 0, ty: on ? c.__to[1] : 0 }, { dur: 1000, delay: on && st === si + 2 ? 250 + i * 25 : 0 })); show(s.lab, on, { delay: on && st === si + 2 ? 1300 : 0 }); });
      show(ex, st >= 3, { delay: st === 3 ? 200 : 0 }); show(wb, st >= 4); show(why, st >= 5);
    };
  });

  /* ---------- 13. 대안 추정량: 경로와 분포 ---------- */
  viz('alt', (host, W, Hh) => {
    const v = svg(host, W, Hh), M = SIM.get(), SIG = M.SIG, A = M.altDist(6), P6 = M.effY(6);
    const x = lin(-5, 5, 124, 790), y = lin(-.12, .28, 352, 48);
    VZ.yAxis(v, y, [-.1, 0, .1, .2], 96, 820, sgn);
    for (let l = -5; l <= 5; l++) S('text', { x: x(l), y: 380, 'text-anchor': 'middle', cls: 'ax', text: String(l).replace('-', '−') }, v);
    S('line', { x1: x(-.5), x2: x(-.5), y1: 48, y2: 358, stroke: C.faint, 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }, v);
    const tr = M.trueEvent(P6, [1989, 1998]);
    const truth = S('path', { pts: tr.map(o => [x(o.l), y(o.v)]), stroke: C.ink, 'stroke-width': 3.5, 'stroke-dasharray': '10 7', fill: 'none', o: 0 }, v);
    const full = arr => { const m = new Map(arr.map(o => [o.l, o.v / SIG])); const out = []; for (let l = -5; l <= 5; l++) out.push(m.has(l) ? m.get(l) : 0); return out; };
    const evm = new Map(M.event(P6).map(o => [o.l, o.mean])); const twE = []; for (let l = -5; l <= 5; l++) twE.push(l === -1 ? 0 : evm.get(l));
    const SER = [{ n: 'TWFE', e: twE, c: C.bad, d: A.tw }, { n: "Callaway-Sant'Anna", e: full(A.base.csE), c: C.ink, d: A.cs }, { n: 'Sun-Abraham', e: full(A.base.saE), c: C.ink, d: A.sa }, { n: 'Stacked', e: full(A.base.stE), c: C.ink, d: A.st }];
    SER.forEach((s, si) => { s.g = S('g', { o: 0 }, v); S('path', { pts: s.e.map((val, i) => [x(i - 5), y(val)]), stroke: s.c, 'stroke-width': 2, fill: 'none' }, s.g);
      s.e.forEach((val, i) => { const cx = x(i - 5), cy = y(val); if (si === 2) S('circle', { cx, cy, r: 11.5, fill: 'none', stroke: s.c, 'stroke-width': 2.5 }, s.g); else if (si === 3) S('rect', { x: cx - 6.5, y: cy - 6.5, width: 13, height: 13, fill: s.c, transform: `rotate(45 ${cx} ${cy})` }, s.g); else S('circle', { cx, cy, r: 7, fill: s.c }, s.g); });
      const ye = y(s.e[10]); s.lab = si === 3 ? S('text', { x: x(5) - 16, y: ye - 16, 'text-anchor': 'end', cls: 'lb', text: 'Stacked' }, s.g) : S('text', { x: x(5) + 16, y: ye + (si === 1 ? 22 : si === 2 ? 44 : 6), cls: 'lb' + (si === 0 ? ' fb' : ''), text: ['TWFE', 'CS', 'SA'][si] }, s.g); });
    S('text', { x: 820, y: 404, 'text-anchor': 'end', cls: 'lbs', text: '도입 기준 상대시간 (년)' }, v);
    const title = S('text', { x: 96, y: 28, cls: 'ttl', text: '' }, v);
    const lg = S('g', { o: 0 }, v); S('line', { x1: 600, x2: 640, y1: 22, y2: 22, stroke: C.ink, 'stroke-width': 3.5, 'stroke-dasharray': '10 7' }, lg); S('text', { x: 648, y: 28, cls: 'lbs', text: '참 효과 경로 (1989, 1998년 코호트)' }, lg);
    // 아래: 정적 추정치 분포
    const bx = lin(-.14, .26, 250, 820), rowH = 84, by = i => 510 + i * rowH, ND = 250;
    const bot = S('g', { o: 0 }, v); [-.1, 0, .1, .2].forEach(n => S('text', { x: bx(n), y: by(3) + 30, 'text-anchor': 'middle', cls: 'ax', text: sgn(n) }, bot));
    S('line', { x1: bx(0), x2: bx(0), y1: by(0) - 70, y2: by(3) + 6, cls: 'zero' }, bot);
    S('line', { x1: bx(A.truth), x2: bx(A.truth), y1: by(0) - 78, y2: by(3) + 6, stroke: C.ink, 'stroke-width': 2, 'stroke-dasharray': '7 5' }, bot);
    S('text', { x: bx(A.truth), y: by(0) - 86, 'text-anchor': 'middle', cls: 'lbs', text: `기준값 ${fmt(A.truth, 3)}σ` }, bot);
    S('text', { x: 96, y: by(0) - 86, cls: 'ttl', text: '정적 추정치 (도입 후 5년)' }, bot);
    SER.forEach((s, i) => { s.r = S('g', { o: 0 }, v); S('line', { x1: 250, x2: 820, y1: by(i) + 5, y2: by(i) + 5, cls: 'grid' }, s.r); S('text', { x: 96, y: by(i) - 12, cls: 'lb', text: s.n }, s.r);
      const m = VZ.mean(s.d); S('text', { x: 96, y: by(i) + 12, cls: 'lbs' + (m < 0 ? ' fb' : ''), text: `평균 ${fmt(m, 3)}σ` }, s.r);
      VZ.dotStack(s.d.slice(0, ND), bx, 5, by(i), 2.1, 250, 820).forEach(p => S('circle', { cx: p[0], cy: p[1], r: 2.2, fill: s.c, opacity: .6 }, s.r)); });
    return B => {
      const st = Math.max(0, B), cur = Math.min(st, 4) - 1;
      show(truth, st >= 1, { delay: st === 1 ? 200 : 0 }); show(lg, st >= 1); show(bot, st >= 1);
      title.textContent = st === 0 ? '' : st === 5 ? '세 대안의 추정 경로' : SER[cur].n + ' 추정 경로';
      SER.forEach((s, i) => { tw(s.g, { o: st === 5 ? (i === 0 ? .3 : 1) : i === cur ? 1 : (i === 0 && st >= 2) ? .25 : 0 }, { dur: 500, delay: i === cur ? 300 : 0 }); show(s.r, st >= i + 1, { delay: st === i + 1 ? 600 : 0 }); });
    };
  });
})();
