/* 0-5장: 표지, 논문의 질문, 2x2 복습, staggered 설정, 반례, 음의 가중치 */
(function () {
  'use strict';
  const { S, tw, show, svg, lin, C, viz, fmtFrac } = DK;

  /* ---------- 0. 표지: 도입 시점이 순차로 채워지는 격자 ---------- */
  viz('cover', (host, W, H) => {
    const v = svg(host, W, H), t = VZ.tiles(v, 4, 70, W - 8, 470, { gap: 35 });
    t.blocks.forEach(b => S('text', { x: t.x0, y: b.y0 - 10, cls: 'lb ' + b.c.k, 'font-weight': 700, text: `${b.c.g}년 도입 (${b.c.n}개 주)` }, v));
    VZ.xAxis(v, yr => t.xOf(yr) + t.cw / 2, [1980, 1989, 1998, 2007, 2015], t.y0 + t.h + 8, null, { line: false });
    S('text', { x: t.x0 + t.w, y: t.y0 + t.h + 62, 'text-anchor': 'end', cls: 'lbs', text: '행은 주, 열은 연도. 색칠된 칸이 도입 후' }, v);
    return B => t.cursor(B < 0 ? 1980 : 2016, { dur: 2600, ease: 'inout', delay: 300 });
  });

  /* ---------- 1. DID 논문 744편 ---------- */
  viz('why', (host, W, H) => {
    const v = svg(host, W, H), N = 744, COLS = 31, sp = 24, x0 = (W - (COLS - 1) * sp) / 2, y0 = 16, dots = [];
    for (let i = 0; i < N; i++) dots.push(S('circle', { cx: x0 + (i % COLS) * sp, cy: y0 + Math.floor(i / COLS) * sp, r: 8.2, fill: '#d3d4d9', stroke: '#d3d4d9', 'stroke-width': 2.2, o: 0 }, v));
    const yb = y0 + 24 * sp + 14, lab = [];
    [['744', 'DID를 사용한 논문', 150], ['407', '도입 시점이 다른 설계 (54.7%)', 440], ['394', '2010년 이후 발표 (빈 점 13편은 그 이전)', 706]].forEach(([n, t, x]) => {
      const g = S('g', { o: 0 }, v); S('text', { x, y: yb + 14, 'text-anchor': 'middle', cls: 'big', text: n + '편' }, g); S('text', { x, y: yb + 42, 'text-anchor': 'middle', cls: 'lbs', text: t }, g); lab.push(g);
    });
    return B => {
      dots.forEach((d, i) => {
        const wave = ((i % COLS) + Math.floor(i / COLS)) * 9;
        tw(d, { o: B >= 1 ? 1 : 0 }, { dur: 300, delay: B === 1 ? wave : 0 });
        const stag = i < 407, old = i < 13;
        tw(d, { fill: (B >= 3 && old) ? '#ffffff' : (B >= 2 && stag) ? C.ink : '#d3d4d9', stroke: (B >= 2 && stag) ? C.ink : '#d3d4d9' }, { dur: 450, delay: B === 2 ? wave * .6 : 0 });
      });
      lab.forEach((g, i) => show(g, B >= i + 1, { delay: B === i + 1 ? 500 : 0 }));
    };
  });

  /* ---------- 2. 2x2 DID: 비교집단의 변화를 옮겨 붙인다 ---------- */
  viz('two', (host, W, H) => {
    const v = svg(host, W, H), xp = 250, xq = 640, y = lin(20, 66, 620, 60);
    VZ.yAxis(v, y, [30, 40, 50, 60], 130, 800, null, { zero: false });
    S('line', { x1: 130, x2: 800, y1: 620, y2: 620, cls: 'axis' }, v);
    S('text', { x: xp, y: 652, 'text-anchor': 'middle', cls: 'lb', text: '도입 전' }, v); S('text', { x: xq, y: 652, 'text-anchor': 'middle', cls: 'lb', text: '도입 후' }, v);
    const P = (a, b) => [[xp, y(a)], [xq, y(b)]];
    // 비교집단의 변화 표시(수평 점선과 +4)
    const cBase = S('line', { x1: xp, x2: xq, y1: y(30), y2: y(30), stroke: C.u, 'stroke-width': 1.5, 'stroke-dasharray': '5 5', o: 0 }, v);
    const cBr = VZ.vbr(v, 'su'), cLab = S('text', { x: xq + 34, y: y(32) + 6, cls: 'lbb fu', text: '+4', o: 0 }, v);
    // 옮겨 붙는 복사본 (반사실)
    const ghost = S('path', { pts: P(30, 34), stroke: C.u, 'stroke-width': 3, 'stroke-dasharray': '9 7', fill: 'none', o: 0, ty: 0 }, v);
    const cf = S('g', { o: 0 }, v); S('circle', { cx: xq, cy: y(54), r: 7, fill: '#fff', stroke: C.c1, 'stroke-width': 3 }, cf); S('text', { x: xq, y: y(54) + 32, 'text-anchor': 'middle', cls: 'lb f1 halo', text: '반사실 54' }, cf);
    const lineC = S('path', { pts: P(30, 34), stroke: C.u, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round', draw: 0 }, v);
    const lineT = S('path', { pts: P(50, 60), stroke: C.c1, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round', draw: 0 }, v);
    const pre = S('g', { o: 0 }, v), post = S('g', { o: 0 }, v);
    [[xp, 50, C.c1, 'f1', pre, -18], [xp, 30, C.u, 'fu', pre, -18], [xq, 60, C.c1, 'f1', post, -18], [xq, 34, C.u, 'fu', post, 30]].forEach(([x, val, col, k, g, dy]) => {
      S('circle', { cx: x, cy: y(val), r: 8, fill: col }, g); S('text', { x, y: y(val) + dy, 'text-anchor': 'middle', cls: 'lbb ' + k, text: val }, g);
    });
    S('text', { x: xp - 24, y: y(50) + 6, 'text-anchor': 'end', cls: 'lbb f1', text: 'T 처치집단' }, pre); S('text', { x: xp - 24, y: y(30) + 6, 'text-anchor': 'end', cls: 'lbb fu', text: 'C 비교집단' }, pre);
    const aBr = VZ.vbr(v, 's1'), aLab = S('text', { x: xq + 70, y: y(57) + 7, cls: 'big f1', text: 'ATT = 6', o: 0 }, v);
    cBr.set(xq + 24, y(30), y(34)); aBr.set(xq + 60, y(54), y(60));
    const dy = y(50) - y(30);
    return B => {
      show(pre, B >= 0, { delay: 150 });
      tw(lineC, { draw: B >= 1 ? 1 : 0 }, { dur: 700, ease: 'out' }); tw(lineT, { draw: B >= 1 ? 1 : 0 }, { dur: 700, ease: 'out' });
      show(post, B >= 1, { delay: B === 1 ? 600 : 0 });
      show(cBase, B >= 2); show(cBr.g, B >= 2, { delay: B === 2 ? 250 : 0 }); show(cLab, B >= 2, { delay: B === 2 ? 450 : 0 });
      show(ghost, B >= 3, { dur: 250 }); tw(ghost, { ty: B >= 3 ? dy : 0, stroke: B >= 3 ? C.c1 : C.u }, { dur: 1000, delay: B === 3 ? 350 : 0 });
      show(cf, B >= 3, { delay: B === 3 ? 1300 : 0 });
      show(aBr.g, B >= 4, { delay: B === 4 ? 150 : 0 }); show(aLab, B >= 4, { delay: B === 4 ? 400 : 0 });
    };
  });

  /* ---------- 3. Staggered 설정 ---------- */
  viz('stag', (host, W, H) => {
    const v = svg(host, W, H), t = VZ.tiles(v, 152, 34, W - 160, 470, { gap: 15 });
    t.blocks.forEach(b => { const m = (b.y0 + b.y1) / 2; S('text', { x: 138, y: m - 3, 'text-anchor': 'end', cls: 'lbb ' + b.c.k, text: b.c.g + '년 도입' }, v); S('text', { x: 138, y: m + 21, 'text-anchor': 'end', cls: 'lbs', text: b.c.n + '개 주' }, v); });
    VZ.xAxis(v, yr => t.xOf(yr) + t.cw / 2, [1980, 1989, 1998, 2007, 2015], t.y0 + t.h + 8, null, { line: false });
    // 2010년 열
    const col = S('g', { o: 0 }, v); S('rect', { x: t.xOf(2010), y: t.y0 - 6, width: t.cw, height: t.h + 12, fill: 'none', stroke: C.ink, 'stroke-width': 3 }, col);
    S('text', { x: t.xOf(2010) + t.cw / 2, y: 20, 'text-anchor': 'middle', cls: 'lbb', text: '2010년' }, col);
    const plates = [];
    t.blocks.forEach(b => plates.push(S('text', { x: t.xOf(2010) - 16, y: (b.y0 + b.y1) / 2 + 6, 'text-anchor': 'end', cls: 'lbb', text: `도입 ${2010 - b.c.g}년 뒤` }, col)));
    // 2x2 두 개 예시
    const ok = S('g', { o: 0 }, v), bad = S('g', { o: 0 }, v), b = t.blocks;
    S('rect', { x: t.xOf(1980) + 2, y: b[0].y0 + 2, width: t.xOf(1998) - t.xOf(1980) - 4, height: b[1].y1 - b[0].y0 - 4, fill: 'none', stroke: C.ink, 'stroke-width': 3.5 }, ok);
    S('text', { x: t.x0, y: t.y0 - 12, cls: 'lbb', text: '① 1989년 코호트 대 아직 미처치인 1998년 코호트' }, ok);
    S('rect', { x: t.xOf(1998) + 2, y: b[1].y0 + 2, width: t.xOf(2016) - t.xOf(1998) - 4, height: b[2].y1 - b[1].y0 - 4, fill: 'none', stroke: C.bad, 'stroke-width': 3.5, 'stroke-dasharray': '10 6' }, bad);
    S('text', { x: t.xOf(2016), y: t.y0 + t.h + 64, 'text-anchor': 'end', cls: 'lbb fb', text: '② 2007년 코호트 대 이미 처치된 1998년 코호트' }, bad);
    plates.forEach(p => VZ.plate(p));
    return B => {
      t.cursor(B >= 1 ? 2016 : 1980, { dur: 1700, ease: 'inout' });
      show(col, B === 2 || B === 3);
      show(ok, B >= 4, { delay: B === 4 ? 100 : 0 }); show(bad, B >= 4, { delay: B === 4 ? 900 : 0 });
    };
  });

  /* ---------- 4. 가장 작은 반례: E(0,2,10), L(0,0,2) ---------- */
  viz('neg', (host, W, H) => {
    const v = svg(host, W, H), X = [210, 470, 730], y = lin(-7, 11, 560, 40), dx = 6;
    VZ.yAxis(v, y, [-6, -4, -2, 0, 2, 4, 6, 8, 10], 120, 800, n => String(n).replace('-', '−'));
    ['1기', '2기', '3기'].forEach((t, i) => S('text', { x: X[i], y: 592, 'text-anchor': 'middle', cls: 'lb', text: t }, v));
    S('text', { x: 124, y: y(0) + 24, cls: 'lbs', text: '무처치 결과 = 0' }, v);
    // 비교 구간 음영
    const win = S('rect', { x: X[0], y: 40, width: X[1] - X[0], height: 520, fill: C.soft, o: 0 }, v); v.insertBefore(win, v.firstChild);
    const winLab = S('text', { x: (X[0] + X[1]) / 2, y: 30, 'text-anchor': 'middle', cls: 'lbb', text: '비교 ①', o: 0 }, v);
    const adopt = S('g', { o: 0 }, v);
    [[1, C.c1, 'f1', 'E 도입'], [2, C.c2, 'f2', 'L 도입']].forEach(([i, col, k, t]) => { S('line', { x1: X[i], x2: X[i], y1: y(0) + 8, y2: y(0) + 44, stroke: col, 'stroke-width': 2 }, adopt); S('text', { x: X[i], y: y(0) + 64, 'text-anchor': 'middle', cls: 'lbs ' + k, text: t }, adopt); });
    const E = [0, 2, 10], L = [0, 0, 2];
    const ghost = S('path', { pts: [[X[1], y(2)], [X[2], y(10)]], stroke: C.c1, 'stroke-width': 3, 'stroke-dasharray': '9 7', fill: 'none', o: 0, ty: 0 }, v);
    const gEnd = S('g', { o: 0 }, v); S('circle', { cx: X[2], cy: y(8), r: 7, fill: '#fff', stroke: C.c2, 'stroke-width': 3 }, gEnd);
    S('text', { x: X[2] + 16, y: y(8) + 6, cls: 'lb f2', text: '반사실 8' }, gEnd);
    S('text', { x: X[2] - 18, y: y(3.9), 'text-anchor': 'end', cls: 'lb f2', text: 'E의 변화 +8' }, gEnd);
    const lE = S('path', { pts: E.map((e, i) => [X[i] - dx, y(e)]), stroke: C.c1, 'stroke-width': 4, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round', draw: 0 }, v);
    const lL = S('path', { pts: L.map((e, i) => [X[i] + dx, y(e)]), stroke: C.c2, 'stroke-width': 4, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round', draw: 0 }, v);
    const pts = S('g', { o: 0 }, v);
    E.forEach((e, i) => S('circle', { cx: X[i] - dx, cy: y(e), r: 8, fill: C.c1 }, pts)); L.forEach((e, i) => S('circle', { cx: X[i] + dx, cy: y(e), r: 8, fill: C.c2 }, pts));
    S('text', { x: X[1] - dx - 14, y: y(2) - 12, 'text-anchor': 'end', cls: 'lbb f1', text: '2' }, pts); S('text', { x: X[2] - dx - 16, y: y(10) + 6, 'text-anchor': 'end', cls: 'lbb f1', text: '10' }, pts);
    S('text', { x: X[2] + dx + 16, y: y(2) + 7, cls: 'lbb f2', text: '2' }, pts);
    S('text', { x: X[2] + 22, y: y(10) - 16, cls: 'lbb f1', text: 'E' }, pts); S('text', { x: X[2] + 44, y: y(2) + 7, cls: 'lbb f2', text: 'L' }, pts);
    const br = VZ.vbr(v, 'sb'); br.set(X[2] + 108, y(8), y(2)); const brL = S('text', { x: X[2] + 116, y: y(5) + 10, cls: 'big fb', text: '−6', o: 0 }, v);
    const t1 = S('text', { x: 120, y: 640, cls: 'lb', o: 0 }, v); t1.innerHTML = '<tspan font-weight="700">비교 ①</tspan>  DID = (2 − 0) − (0 − 0) = <tspan font-weight="700">2</tspan>';
    const t2 = S('text', { x: 120, y: 672, cls: 'lb', o: 0 }, v); t2.innerHTML = '<tspan font-weight="700">비교 ②</tspan>  DID = (2 − 0) − (10 − 2) = <tspan font-weight="700" fill="#c8553d">−6</tspan>';
    // 수직선: 참효과와 TWFE
    const nl = S('g', { o: 0 }, v), nx = lin(-6, 10, 160, 760), ny = 740;
    S('line', { x1: nx(-6.6), x2: nx(10.6), y1: ny, y2: ny, cls: 'axis' }, nl);
    [-6, -4, -2, 0, 2, 4, 6, 8, 10].forEach(n => { S('line', { x1: nx(n), x2: nx(n), y1: ny, y2: ny + 6, cls: 'axis' }, nl); S('text', { x: nx(n), y: ny + 26, 'text-anchor': 'middle', cls: 'ax', text: String(n).replace('-', '−') }, nl); });
    S('circle', { cx: nx(2), cy: ny - 12, r: 7, fill: C.c1 }, nl); S('circle', { cx: nx(2), cy: ny - 29, r: 7, fill: C.c2 }, nl); S('circle', { cx: nx(10), cy: ny - 12, r: 7, fill: C.c1 }, nl);
    S('text', { x: nx(6), y: ny - 16, 'text-anchor': 'middle', cls: 'lbs', text: '참효과 2, 2, 10' }, nl);
    const tw5 = S('g', { o: 0 }, v); S('rect', { x: nx(-2) - 8, y: ny - 20, width: 16, height: 16, fill: C.bad, transform: `rotate(45 ${nx(-2)} ${ny - 12})` }, tw5);
    S('text', { x: nx(-2), y: ny - 32, 'text-anchor': 'middle', cls: 'lbb fb', text: 'TWFE −2' }, tw5);
    const gdy = y(0) - y(2);
    return B => {
      tw(lE, { draw: B >= 1 ? 1 : 0 }, { dur: 900, ease: 'out' }); tw(lL, { draw: B >= 1 ? 1 : 0 }, { dur: 900, ease: 'out' });
      show(pts, B >= 1, { delay: B === 1 ? 700 : 0 }); show(adopt, B >= 1, { delay: B === 1 ? 900 : 0 });
      show(win, B >= 2 && B <= 4); show(winLab, B >= 2 && B <= 4);
      tw(win, { x: B >= 3 ? X[1] : X[0] }, { dur: 700 }); tw(winLab, { x: B >= 3 ? (X[1] + X[2]) / 2 : (X[0] + X[1]) / 2 }, { dur: 700 }); winLab.textContent = B >= 3 ? '비교 ②' : '비교 ①';
      show(t1, B >= 2, { delay: B === 2 ? 300 : 0 });
      show(ghost, B >= 3, { dur: 250, delay: B === 3 ? 500 : 0 }); tw(ghost, { ty: B >= 3 ? gdy : 0, stroke: B >= 3 ? C.c2 : C.c1 }, { dur: 1000, delay: B === 3 ? 850 : 0 });
      show(gEnd, B >= 3, { delay: B === 3 ? 1850 : 0 });
      show(br.g, B >= 4, { delay: B === 4 ? 150 : 0 }); show(brL, B >= 4, { delay: B === 4 ? 400 : 0 }); show(t2, B >= 4, { delay: B === 4 ? 600 : 0 });
      show(nl, B >= 5); show(tw5, B >= 5, { delay: B === 5 ? 600 : 0 });
    };
  });

  /* ---------- 5. 음의 가중치: D → 예측값 → D̃ → 가중치 ---------- */
  viz('wt', (host, W, H) => {
    const v = svg(host, W, H), cw = 212, ch = 186, gp = 12, x0 = 112, y0 = 86, f = fmtFrac;
    const D = [[0, 1, 1], [0, 0, 1]], Y = [[0, 2, 10], [0, 0, 2]], rm = [2 / 3, 1 / 3], cm = [0, 1 / 2, 1], gm = 1 / 2;
    const pred = D.map((r, i) => r.map((_, t) => rm[i] + cm[t] - gm)), Dt = D.map((r, i) => r.map((d, t) => d - pred[i][t])), w = Dt.map(r => r.map(x => x * 3));
    const calc = [[null, '1 × 2 = 2', '−1/2 × 10 = −5'], [null, null, '1/2 × 2 = 1']];
    ['1기', '2기', '3기'].forEach((t, i) => S('text', { x: x0 + i * (cw + gp) + cw / 2, y: y0 - 18, 'text-anchor': 'middle', cls: 'lbb', text: t }, v));
    [['E', 'f1'], ['L', 'f2']].forEach(([t, k], i) => S('text', { x: x0 - 30, y: y0 + i * (ch + gp) + ch / 2 + 12, 'text-anchor': 'middle', cls: 'big ' + k, text: t }, v));
    const cells = [];
    for (let i = 0; i < 2; i++) for (let t = 0; t < 3; t++) {
      const x = x0 + t * (cw + gp), yy = y0 + i * (ch + gp), on = D[i][t] === 1, g = S('g', {}, v);
      const r = S('rect', { x, y: yy, width: cw, height: ch, fill: '#ffffff', stroke: on ? C.ink : C.line, 'stroke-width': on ? 3.5 : 1.5 }, g);
      S('text', { x: x + cw - 12, y: yy + 26, 'text-anchor': 'end', cls: 'lbs', text: 'Y = ' + Y[i][t] }, g);
      const mk = (txt, size) => S('text', { x: x + cw / 2, y: yy + ch / 2 + 26, 'text-anchor': 'middle', 'font-size': size || 58, 'font-weight': 800, text: txt, o: 0 }, g);
      const L = [mk(String(D[i][t])), mk(f(pred[i][t])), mk(f(Dt[i][t])), mk(on ? f(w[i][t]) : '', 58), mk(calc[i][t] || '', 29)];
      const tag = S('text', { x: x + 12, y: yy + 26, cls: 'lbs', text: '', o: 1 }, g);
      cells.push({ i, t, on, r, L, tag, g });
    }
    // 여백의 평균들
    const mar = S('g', { o: 0 }, v);
    rm.forEach((m, i) => { S('text', { x: x0 + 3 * (cw + gp) + 6, y: y0 + i * (ch + gp) + ch / 2 - 4, cls: 'lbs', text: '단위 평균' }, mar); S('text', { x: x0 + 3 * (cw + gp) + 6, y: y0 + i * (ch + gp) + ch / 2 + 24, cls: 'lbb', text: f(m) }, mar); });
    cm.forEach((m, t) => { S('text', { x: x0 + t * (cw + gp) + cw / 2, y: y0 + 2 * (ch + gp) + 24, 'text-anchor': 'middle', cls: 'lbs', text: '시점 평균 ' }, mar).innerHTML = `시점 평균 <tspan font-weight="700" fill="#1b1b1f">${f(m)}</tspan>`; });
    S('text', { x: x0 + 3 * (cw + gp) + 6, y: y0 + 2 * (ch + gp) + 24, cls: 'lbs', text: '' }, mar).innerHTML = `전체 <tspan font-weight="700" fill="#1b1b1f">1/2</tspan>`;
    const head = S('text', { x: x0, y: 40, cls: 'ttl', text: '' }, v);
    const HEAD = ['처치변수 D', '처치변수 D', '고정효과가 만든 예측값', '잔차 D̃ = D − 예측값', '처치된 칸의 가중치 w', '가중치 × 효과'];
    const flag = S('g', { o: 0 }, v); const c3 = cells[2];
    S('text', { x: x0 + 2 * (cw + gp) + cw / 2, y: y0 + ch - 14, 'text-anchor': 'middle', cls: 'lbs fb', 'font-weight': 700, text: '1을 넘는 예측값' }, flag);
    return B => {
      const st = Math.max(0, Math.min(5, B)); head.textContent = HEAD[st];
      const layer = st <= 1 ? 0 : st - 1;
      cells.forEach(c => {
        c.L.forEach((tx, k) => show(tx, B >= 0 && k === layer && !(layer >= 3 && !c.on), { dur: 380, delay: (k === layer && B > 0) ? 180 : 0 }));
        let fill = '#ffffff';
        if (st <= 1) fill = c.on ? (c.i === 0 ? C.c1s : C.c2s) : '#ffffff';
        else if (st === 2) fill = pred[c.i][c.t] > 1 ? C.bads : C.soft;
        else if (st === 3) fill = Dt[c.i][c.t] < 0 ? C.bads : '#e6e7ec';
        else fill = c.on ? (w[c.i][c.t] < 0 ? C.bads : '#e6e7ec') : '#ffffff';
        tw(c.r, { fill }, { dur: 500 });
        tw(c.g, { o: (st >= 4 && !c.on) ? .35 : 1 }, { dur: 400 });
        const neg = (st === 3 && Dt[c.i][c.t] < 0) || (st >= 4 && c.on && w[c.i][c.t] < 0);
        c.L.forEach(tx => tx.setAttribute('fill', neg ? C.bad : C.ink));
      });
      show(mar, st === 2 || st === 3, { delay: st === 2 ? 200 : 0 }); show(flag, st === 2, { delay: 500 });
    };
  });
})();
