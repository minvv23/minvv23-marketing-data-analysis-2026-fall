/* 추가 장 (2026-11-16, 독해가이드의 도식을 덱으로 옮김): FWL 산점도(s-fwl), 사건연구 회귀의 구조(s-esd) */
(function () {
  'use strict';
  const { S, tw, show, svg, lin, C, viz, fmtFrac, clamp } = DK;

  /* ---------- FWL: 앞 장의 여섯 칸을 (D̃, Y) 점으로 옮기면 TWFE 계수가 회귀선의 기울기다 ---------- */
  viz('fwl', (host, W, H) => {
    const v = svg(host, W, H), f = fmtFrac;
    const cw = 176, ch = 54, gp = 8, gx0 = 150, gy0 = 34;
    const cells = [
      { n: 'E', r: 0, t: 0, d: -1 / 6, y: 0, tr: 0 }, { n: 'E', r: 0, t: 1, d: 1 / 3, y: 2, tr: 1 }, { n: 'E', r: 0, t: 2, d: -1 / 6, y: 10, tr: 1 },
      { n: 'L', r: 1, t: 0, d: 1 / 6, y: 0, tr: 0 }, { n: 'L', r: 1, t: 1, d: -1 / 3, y: 0, tr: 0 }, { n: 'L', r: 1, t: 2, d: 1 / 6, y: 2, tr: 1 }];
    const col = c => c.n === 'E' ? C.c1 : C.c2;
    // 위: 앞 장의 여섯 칸 (큰 숫자 D̃, 작은 숫자 Y)
    const top = S('g', {}, v);
    ['1기', '2기', '3기'].forEach((t, i) => S('text', { x: gx0 + i * (cw + gp) + cw / 2, y: gy0 - 10, 'text-anchor': 'middle', cls: 'lbs', text: t }, top));
    [['E', 'f1'], ['L', 'f2']].forEach(([t, k], i) => S('text', { x: gx0 - 26, y: gy0 + i * (ch + gp) + ch / 2 + 9, 'text-anchor': 'middle', cls: 'lbb ' + k, text: t }, top));
    cells.forEach(c => {
      const x = gx0 + c.t * (cw + gp), y = gy0 + c.r * (ch + gp);
      c.cx0 = x + cw / 2; c.cy0 = y + ch / 2;
      S('rect', { x, y, width: cw, height: ch, fill: c.tr ? (c.n === 'E' ? C.c1s : C.c2s) : '#ffffff', stroke: c.tr ? C.ink : C.line, 'stroke-width': c.tr ? 2.5 : 1.5 }, top);
      S('text', { x: x + 14, y: y + ch / 2 + 9, 'font-size': 26, 'font-weight': 800, fill: c.d < 0 && c.tr ? C.bad : C.ink, text: f(c.d) }, top);
      S('text', { x: x + cw - 12, y: y + ch / 2 + 7, 'text-anchor': 'end', cls: 'lbs', text: 'Y = ' + c.y }, top);
    });
    S('text', { x: gx0 + 3 * (cw + gp) - gp, y: gy0 + 2 * (ch + gp) + 14, 'text-anchor': 'end', cls: 'lbs', text: '큰 숫자: 잔차 D̃ (앞 장 3단계),  작은 숫자: 결과 Y' }, top);

    // 아래: 산점도
    const x = lin(-0.42, 0.42, 110, 850), y = lin(-1, 11, 742, 268);
    const ax = S('g', {}, v);
    VZ.yAxis(ax, y, [0, 2, 4, 6, 8, 10], 110, 850, null, { zero: true });
    S('line', { x1: x(0), x2: x(0), y1: y(11), y2: y(-1), cls: 'zero' }, ax);
    [-1 / 3, -1 / 6, 1 / 6, 1 / 3].forEach(d => S('text', { x: x(d), y: y(-1) + 26, 'text-anchor': 'middle', cls: 'ax', text: f(d) }, ax));
    S('text', { x: x(0), y: y(-1) + 26, 'text-anchor': 'middle', cls: 'ax', text: '0' }, ax);
    S('text', { x: 850, y: y(-1) + 50, 'text-anchor': 'end', cls: 'lbs', text: '가로축: 잔차 D̃,  세로축: 결과 Y' }, ax);

    // 회귀선 (기울기 b, 평균점 (0, ȳ)을 지난다)
    const lineOf = (b, ybar) => [[x(-0.42), y(ybar + b * -0.42)], [x(0.42), y(ybar + b * 0.42)]];
    const reg = S('path', { pts: lineOf(-2, 7 / 3), stroke: C.bad, 'stroke-width': 3.5, fill: 'none', 'stroke-dasharray': '10 7', o: 0 }, v);
    const slope = S('text', { x: 850, y: y(7 / 3 - 2 * 0.42) + 44, 'text-anchor': 'end', cls: 'big fb', text: '기울기 −2', o: 0 }, v);
    // E 3기 강조
    const E3 = cells[2];
    const ring = S('circle', { cx: x(E3.d), cy: y(10), r: 24, fill: 'none', stroke: C.bad, 'stroke-width': 3, o: 0 }, v);
    const lever = S('path', { pts: [[x(E3.d), y(10) + 26], [x(E3.d), y(7 / 3 + 2 / 6)]], stroke: C.bad, 'stroke-width': 2.5, 'stroke-dasharray': '4 5', fill: 'none', o: 0 }, v);
    const leverT = S('text', { x: x(E3.d) + 34, y: y(10) + 6, cls: 'lbb fb', text: '효과가 가장 큰 칸이 D̃ < 0 쪽에 있다', o: 0 }, v);
    // 점과 라벨 (처음에는 위 칸 자리에서 출발)
    cells.forEach(c => {
      c.dot = S('circle', { cx: c.cx0, cy: c.cy0, r: 11, fill: c.tr ? col(c) : '#ffffff', stroke: col(c), 'stroke-width': 3, o: 0 }, v);
      const right = !(c.n === 'E' && c.t === 2) && c.d < 0;
      c.lab = c === E3 ? S('text', { x: x(c.d) - 34, y: y(c.y) + 6, 'text-anchor': 'end', cls: 'lbs', text: 'E 3기', o: 0 }, v)
        : S('text', { x: x(c.d) + (right ? -16 : 16), y: y(c.y) - 14, 'text-anchor': right ? 'end' : 'start', cls: 'lbs', text: `${c.n} ${c.t + 1}기`, o: 0 }, v);
    });

    return B => {
      const st = clamp(B, -1, 4);
      cells.forEach((c, i) => {
        const on = st >= 1, yy = (c === E3 && st >= 4) ? 2 : c.y;
        show(c.dot, on, { dur: 300 });
        tw(c.dot, on ? { cx: x(c.d), cy: y(yy) } : { cx: c.cx0, cy: c.cy0 }, { dur: 1100, delay: on && st === 1 ? 120 * i : 0 });
        tw(c.lab, { y: y(yy) + (c === E3 ? 6 : -14) }, { dur: 900 });
        show(c.lab, on, { delay: on && st === 1 ? 1300 : 0 });
      });
      const b = st >= 4 ? 2 : -2, ybar = st >= 4 ? 1 : 7 / 3;
      show(reg, st >= 2); tw(reg, { pts: lineOf(b, ybar) }, { dur: 1000 });
      tw(reg, { stroke: st >= 4 ? C.ink : C.bad }, { dur: 600 });
      show(slope, st >= 2, { delay: st === 2 ? 500 : 0 });
      slope.textContent = st >= 4 ? '기울기 +2' : '기울기 −2';
      slope.setAttribute('class', st >= 4 ? 'big' : 'big fb');
      tw(slope, { y: st >= 4 ? y(6.5) : y(ybar + b * 0.42) + 44 }, { dur: 1000 });
      show(ring, st >= 3); tw(ring, { cy: y(st >= 4 ? 2 : 10), stroke: st >= 4 ? C.ink : C.bad }, { dur: 1000 });
      show(lever, st === 3); show(leverT, st === 3, { delay: st === 3 ? 300 : 0 });
    };
  });

  /* ---------- 사건연구 회귀의 구조: 상대시점, 기준기간, 구간 묶음, 같은 상대시점 칸, 같은 해의 이미 처치된 칸 ---------- */
  viz('esd', (host, W, H) => {
    const v = svg(host, W, H), Y0 = 1983, Y1 = 2015, NY = Y1 - Y0 + 1, cw = 24, x0 = 72, rh = 58, rg = 14, y0 = 40;
    const xOf = yr => x0 + (yr - Y0) * cw;
    const COH = VZ.COH;
    // 원문 Fig. 5 사양: 묶음(−6 이하), −5..−2, (−1 기준), 0..5, 묶음(+6 이상)
    const slotOf = l => l <= -6 ? 0 : l === -1 ? 5 : l <= -2 ? l + 6 : l <= 5 ? l + 6 : 12;
    const rows = COH.map((c, r) => ({ c, y: y0 + r * (rh + rg), cells: [] }));
    rows.forEach(row => {
      S('text', { x: x0 - 10, y: row.y + rh / 2 + 7, 'text-anchor': 'end', cls: 'lbb ' + row.c.k, text: String(row.c.g) }, v);
      for (let yr = Y0; yr <= Y1; yr++) {
        const l = yr - row.c.g, post = l >= 0, x = xOf(yr);
        const r = S('rect', { x: x + 1, y: row.y, width: cw - 2, height: rh, fill: post ? row.c.cs : C.soft, stroke: 'none' }, v);
        const t = Math.abs(l) <= 6 ? S('text', { x: x + cw / 2, y: row.y + rh / 2 + 6, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, 'letter-spacing': '-0.5', fill: post ? row.c.c : C.muted, text: String(l).replace('-', '−'), o: 0 }, v) : null;
        row.cells.push({ yr, l, r, t, x, post });
      }
    });
    const gyB = y0 + 3 * (rh + rg) - rg;
    [1985, 1990, 1995, 2000, 2005, 2010, 2015].forEach(yr => S('text', { x: xOf(yr) + cw / 2, y: gyB + 26, 'text-anchor': 'middle', cls: 'ax', text: String(yr) }, v));

    // 묶음 표시 (반투명 덮개와 테두리)
    const binG = S('g', { o: 0 }, v);
    rows.forEach(row => {
      const lo = row.cells.filter(c => c.l <= -6), hi = row.cells.filter(c => c.l >= 6);
      [lo, hi].forEach((run, k) => { if (!run.length) return;
        const xa = run[0].x, xb = run[run.length - 1].x + cw;
        S('rect', { x: xa + 1, y: row.y - 3, width: xb - xa - 2, height: rh + 6, fill: '#ffffff', 'fill-opacity': .55, stroke: C.ink, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, binG);
        if (xb - xa > 110) S('text', { x: xa + 8, y: row.y + rh / 2 + 6, 'font-size': 16, 'font-weight': 700, fill: C.ink, text: k ? '+6 이상 묶음' : '−6 이하 묶음' }, binG);
      });
    });
    // 기준기간 −1 칸 (흰 칸, 점선)
    const refG = S('g', { o: 0 }, v);
    rows.forEach(row => { const c = row.cells.find(c => c.l === -1); S('rect', { x: c.x + 1, y: row.y, width: cw - 2, height: rh, fill: '#ffffff', stroke: C.ink, 'stroke-width': 2, 'stroke-dasharray': '3 3' }, refG); S('text', { x: c.x + cw / 2, y: row.y + rh / 2 + 6, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, 'letter-spacing': '-0.5', fill: C.ink, text: '−1' }, refG); });
    // +3기 칸 강조와 같은 해(2010)의 이미 처치된 칸 강조
    const p3G = S('g', { o: 0 }, v), y10G = S('g', { o: 0 }, v);
    rows.forEach(row => { const c = row.cells.find(c => c.l === 3); S('rect', { x: c.x - 1, y: row.y - 3, width: cw + 2, height: rh + 6, fill: 'none', stroke: C.ink, 'stroke-width': 3.5 }, p3G); });
    rows.slice(0, 2).forEach(row => { const c = row.cells.find(c => c.yr === 2010); S('rect', { x: c.x - 1, y: row.y - 3, width: cw + 2, height: rh + 6, fill: 'none', stroke: C.bad, 'stroke-width': 3.5 }, y10G); });
    const col10 = S('rect', { x: xOf(2010) - 3, y: y0 - 12, width: cw + 6, height: gyB - y0 + 20, fill: 'none', stroke: C.bad, 'stroke-width': 1.5, 'stroke-dasharray': '6 5', o: 0 }, v);
    const col10T = S('text', { x: xOf(2010) + cw / 2, y: y0 - 18, 'text-anchor': 'middle', cls: 'lbb fb', text: '2010년', o: 0 }, v);

    // 아래: 회귀에 들어가는 계수 줄
    const sy = 384, sw = 60, sx0 = (W - 13 * sw) / 2, slotX = k => sx0 + k * sw;
    const LAB = ['≤−6', '−5', '−4', '−3', '−2', '−1', '0', '+1', '+2', '+3', '+4', '+5', '≥+6'];
    const slotsG = S('g', { o: 0 }, v), slots = [];
    S('text', { x: sx0, y: sy - 16, cls: 'ttl', text: '회귀에 들어가는 계수 μℓ (상대시점마다 하나)' }, slotsG);
    LAB.forEach((t, k) => {
      const ref = k === 5, g = S('g', {}, slotsG);
      const r = S('rect', { x: slotX(k) + 3, y: sy, width: sw - 6, height: 56, fill: ref ? '#ffffff' : C.soft, stroke: ref ? C.ink : C.line, 'stroke-width': ref ? 2 : 1.5, 'stroke-dasharray': ref ? '3 3' : 'none' }, g);
      S('text', { x: slotX(k) + sw / 2, y: sy + 35, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, fill: ref ? C.muted : C.ink, text: t }, g);
      slots.push({ r, g, ref });
    });
    const refT = S('text', { x: slotX(5) + sw / 2, y: sy + 80, 'text-anchor': 'middle', cls: 'lbs', text: '기준 (제외)', o: 0 }, v);
    // +3기 칸에서 계수 칸으로 잇는 선
    const links = S('g', { o: 0 }, v);
    rows.forEach(row => { const c = row.cells.find(c => c.l === 3); S('path', { d: `M${c.x + cw / 2} ${row.y + rh + 3}C${c.x + cw / 2} ${sy - 40} ${slotX(9) + sw / 2} ${sy - 60} ${slotX(9) + sw / 2} ${sy - 2}`, stroke: C.ink, 'stroke-width': 1.8, fill: 'none', 'stroke-dasharray': '2 4' }, links); });
    const links10 = S('g', { o: 0 }, v);
    rows.slice(0, 2).forEach(row => { const c = row.cells.find(c => c.yr === 2010); S('path', { d: `M${c.x + cw / 2} ${row.y + rh + 3}C${c.x + cw / 2 + 40} ${sy - 50} ${slotX(12) + sw / 2} ${sy - 60} ${slotX(12) + sw / 2} ${sy - 2}`, stroke: C.bad, 'stroke-width': 1.8, fill: 'none', 'stroke-dasharray': '2 4' }, links10); });
    const note5 = S('text', { x: W / 2, y: sy + 112, 'text-anchor': 'middle', cls: 'lbb fb', text: '2010년의 연도 고정효과는 이미 처치된 칸까지 함께 사용해 추정된다', o: 0 }, v);

    return B => {
      const st = clamp(B, -1, 5);
      rows.forEach(row => row.cells.forEach((c, i) => { if (c.t) show(c.t, st >= 1 && !(st >= 2 && c.l === -1) && !(st >= 3 && Math.abs(c.l) >= 6), { delay: st === 1 ? 12 * i : 0, dur: 300 }); }));
      show(slotsG, st >= 1, { delay: st === 1 ? 400 : 0 });
      show(refG, st >= 2); show(refT, st >= 2);
      show(binG, st >= 3);
      slots.forEach((s, k) => tw(s.r, { fill: s.ref ? '#ffffff' : (st >= 3 && (k === 0 || k === 12)) ? (st >= 5 && k === 12 ? C.bads : '#e6e7ec') : (st >= 4 && k === 9) ? C.c1s : C.soft, stroke: s.ref ? C.ink : (st >= 4 && k === 9) ? C.ink : (st >= 5 && k === 12) ? C.bad : C.line }, { dur: 500 }));
      show(p3G, st >= 4); show(links, st >= 4, { delay: st === 4 ? 200 : 0 });
      show(y10G, st >= 5); show(col10, st >= 5); show(col10T, st >= 5); show(links10, st >= 5, { delay: st === 5 ? 200 : 0 }); show(note5, st >= 5, { delay: st === 5 ? 500 : 0 });
    };
  });
})();
