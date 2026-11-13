/* 여러 장이 함께 쓰는 도식 부품 */
const VZ = (function () {
  'use strict';
  const { S, tw, show, lin, C } = DK;
  const COH = [{ g: 1989, n: 17, c: C.c1, cs: C.c1s, k: 'f1' }, { g: 1998, n: 18, c: C.c2, cs: C.c2s, k: 'f2' }, { g: 2007, n: 15, c: C.c3, cs: C.c3s, k: 'f3' }];

  // 가로 눈금(세로축): 격자선과 숫자
  function yAxis(g, y, ticks, x0, x1, f, o) {
    o = o || {};
    ticks.forEach(v => { S('line', { x1: x0, x2: x1, y1: y(v), y2: y(v), cls: (o.zero !== false && v === 0) ? 'zero' : 'grid' }, g); S('text', { x: x0 - 10, y: y(v) + 5.5, 'text-anchor': 'end', cls: 'ax', text: f ? f(v) : v }, g); });
  }
  function xAxis(g, x, ticks, y0, f, o) {
    o = o || {};
    if (o.line !== false) S('line', { x1: o.x0 ?? x(ticks[0]), x2: o.x1 ?? x(ticks[ticks.length - 1]), y1: y0, y2: y0, cls: 'axis' }, g);
    ticks.forEach(v => { S('line', { x1: x(v), x2: x(v), y1: y0, y2: y0 + 6, cls: 'axis' }, g); S('text', { x: x(v), y: y0 + 26, 'text-anchor': 'middle', cls: 'ax', text: f ? f(v) : v }, g); });
  }
  // 도입 시점 그림: 세 코호트 블록, 행은 주, 열은 연도. cursor(연도)까지 도입 후 칸을 칠한다.
  function tiles(parent, x0, y0, w, h, o) {
    o = o || {}; const g = S('g', {}, parent), gap = o.gap ?? 12, Y0 = 1980, T = 36, rowH = Math.floor((h - gap * 2) / 50), cw = Math.floor(w / T);
    x0 = Math.round(x0 + (w - cw * T) / 2); w = cw * T; h = rowH * 50 + gap * 2;
    const xOf = yr => x0 + (yr - Y0) * cw; const blocks = []; let y = y0;
    COH.forEach((c, k) => {
      const bh = c.n * rowH;
      S('rect', { x: x0, y, width: w, height: bh, fill: c.cs }, g);
      const fg = S('rect', { x: xOf(c.g), y, width: 0, height: bh, fill: c.c }, g);
      blocks.push({ y0: y, y1: y + bh, fg, c, k }); y += bh + gap;
    });
    // 흰 선으로 칸을 나눈다
    let d = ''; for (let i = 1; i < T; i++) d += `M${x0 + i * cw} ${y0}V${y0 + h}`;
    if (!o.noRows) blocks.forEach(b => { for (let r = 1; r < b.c.n; r++) d += `M${x0} ${b.y0 + r * rowH}H${x0 + w}`; });
    S('path', { d, stroke: '#fff', 'stroke-width': o.sep ?? 2, fill: 'none', 'shape-rendering': 'crispEdges' }, g);
    function cursor(yr, opt) { blocks.forEach(b => tw(b.fg, { width: Math.max(0, xOf(Math.min(yr, 2016)) - xOf(b.c.g)) }, opt)); }
    return { g, xOf, cw, rowH, blocks, cursor, x0, y0, w, h };
  }
  // 점 히스토그램: 값 배열을 가로 위치로 옮기고 같은 칸의 점을 위로 쌓는다
  function dotStack(vals, x, bin, y0, dy, xmin, xmax) {
    const cnt = new Map(), out = new Array(vals.length);
    for (let i = 0; i < vals.length; i++) { const px = Math.max(xmin, Math.min(xmax, x(vals[i]))), b = Math.round(px / bin), n = cnt.get(b) || 0; cnt.set(b, n + 1); out[i] = [b * bin, y0 - n * dy]; }
    return out;
  }
  const mean = a => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s / a.length; };
  // 세로 괄호 (값 차이 표시): x 위치에 y1~y2 선과 양 끝 눈금
  function vbr(parent, cls) { const g = S('g', { o: 0 }, parent); const l = S('path', { pts: [[0, 0], [0, 0]], cls: cls || 'si', 'stroke-width': 2.5, fill: 'none' }, g); return { g, set(x, y1, y2, o) { tw(l, { pts: [[x - 7, y1], [x, y1], [x, y2], [x - 7, y2]] }, o); } }; }
  // 글자 뒤에 흰 판을 깐다 (격자나 선 위의 라벨). 슬라이드가 보이는 상태에서 호출해야 크기를 잴 수 있다.
  function plate(t, pad, fill) { const b = t.getBBox(), p = pad ?? 5; const r = S('rect', { x: b.x - p - 2, y: b.y - p + 1, width: b.width + 2 * p + 4, height: b.height + 2 * p - 2, fill: fill || '#ffffff' }); t.parentNode.insertBefore(r, t); return r; }
  return { COH, yAxis, xAxis, tiles, dotStack, mean, vbr, plate };
})();
