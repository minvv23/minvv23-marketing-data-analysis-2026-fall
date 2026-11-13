/* 원문 내용을 보강한 장: 논문의 구성, 가중치의 성질, 모의자료 생성, 제2종 오류, Sun-Abraham 분해, 세 대안의 비교 */
(function () {
  'use strict';
  const { S, tw, show, svg, lin, C, viz, fmt } = DK;
  const V = c => `<tspan class="v">${c}</tspan>`;
  const sg = (v, d) => fmt(v, d ?? 3) + 'σ';

  /* ---------- 논문의 구성: 쪽수 띠, 절별 내용, 시뮬레이션의 결론 ---------- */
  viz('plan', (host, W, Hh) => {
    const v = svg(host, W, Hh), X1 = 864, TOT = 26;
    S('text', { x: 0, y: 26, cls: 'ttl', text: '본문 26쪽의 구성 (쪽수는 대략)' }, v);
    // 이름, 쪽수, 묶음 번호(0: 서론과 참고문헌, 1: 문제, 2: 대안, 3: 재분석과 권고)
    const SEC = [['서론', 2.5, 0], ['2절', 1, 1], ['3절', 9.5, 1], ['4절', 2, 2], ['5절', 8.5, 3], ['6절', 1.5, 3], ['', 1, 0]];
    let cx = 0;
    const segs = SEC.map(([n, p, part]) => { const w = p / TOT * X1, r = S('rect', { x: cx + 1.5, y: 46, width: w - 3, height: 50, fill: '#dcdde2' }, v);
      if (n) S('text', { x: cx + w / 2, y: 122, 'text-anchor': 'middle', cls: 'ax', text: n }, v); cx += w; return { r, part }; });
    const ROWS = [
      ['2-3절  TWFE 계수의 문제', '계수의 분해, Compustat 시뮬레이션, 사건연구', 'Fig. 1-5,  약 10쪽', 1],
      ['4절  대안 추정량', "Callaway-Sant'Anna, Sun-Abraham, stacked regression", 'Fig. 6-7,  약 2쪽', 2],
      ['5절  출판된 논문의 재분석', '은행 규제완화 (BLL 2010), 이사회 개혁 (FHLT 2017)', 'Table 2-3, Fig. 8-13,  약 8쪽', 3],
      ['6절  권고', '도입 시점이 다른 설계에서 보고할 것 여섯 가지', '약 1쪽', 3]];
    const rows = ROWS.map(([a, b, c, part], i) => { const y = 180 + i * 68, g = S('g', { o: 0 }, v);
      S('rect', { x: 0, y: y - 21, width: 5, height: 50, fill: C.ink }, g); S('text', { x: 20, y, cls: 'lbb', text: a }, g); S('text', { x: 20, y: y + 27, cls: 'lb', text: b }, g);
      S('text', { x: X1, y, 'text-anchor': 'end', cls: 'lbs', text: c }, g); return { g, part }; });
    // 시뮬레이션의 결론 (원문 서론): 도입 시점 × 효과의 이질성
    const mg = S('g', { o: 0 }, v), cxs = [204, 538], cys = [524, 634], cw = 326, chh = 102;
    S('text', { x: 0, y: 470, cls: 'ttl', text: '시뮬레이션의 결론 (원문 서론)' }, mg);
    ['효과가 같고 일정함', '효과가 다르거나 시간에 따라 변함'].forEach((t, j) => S('text', { x: cxs[j] + cw / 2, y: 508, 'text-anchor': 'middle', cls: 'lbs', text: t }, mg));
    ['도입 시점 하나', '도입 시점 여럿'].forEach((t, i) => S('text', { x: 0, y: cys[i] + chh / 2 + 7, cls: 'lbb', text: t }, mg));
    const CELL = [[0, 0, '편향 없음', 'Sim 1'], [0, 1, '편향 없음', 'Sim 2  효과가 커져도 같다'], [1, 0, '편향 없음', 'Sim 3'], [1, 1, '표본평균 ATT와 달라짐', 'Sim 4-6  부호가 바뀌기도 한다']];
    const cells = CELL.map(([i, j, a, b]) => { const bad = i === 1 && j === 1, g = S('g', { o: 0 }, v);
      S('rect', { x: cxs[j], y: cys[i], width: cw, height: chh, fill: bad ? C.bads : C.soft }, g);
      S('text', { x: cxs[j] + 20, y: cys[i] + 44, cls: 'lbb' + (bad ? ' fb' : ''), text: a }, g); S('text', { x: cxs[j] + 20, y: cys[i] + 74, cls: 'lb', text: b }, g); return g; });
    return B => {
      const st = Math.max(0, B), part = st === 0 ? 0 : st <= 2 ? 1 : st === 3 ? 2 : 3;
      segs.forEach(s => tw(s.r, { fill: st > 0 && s.part === part ? C.ink : (s.part && s.part < part) ? '#9c9da5' : '#dcdde2' }, { dur: 500 }));
      rows.forEach((r, i) => { const on = st >= (r.part === 1 ? 1 : r.part === 2 ? 3 : 4); show(r.g, on, { delay: on && i === 3 ? 250 : 0 }); });
      show(mg, st >= 2); cells.forEach((c, i) => show(c, st >= 2, { delay: st === 2 ? 200 + i * 260 : 0 }));
    };
  });

  /* ---------- 가중치의 성질: 관측 기간만 바꿔도 계수가 달라진다 ---------- */
  viz('gbw', (host, W, Hh) => {
    const v = svg(host, W, Hh), I = Infinity;
    // 관측 창 (열 15개: 앞 5, 처음 5, 뒤 5). k는 2기(열 6), l은 4기(열 8)에 도입. 효과는 k가 4, l이 2로 일정
    const CASE = { base: { T: 5, gk: 1, gl: 3, c0: 5, c1: 9 }, post: { T: 10, gk: 1, gl: 3, c0: 5, c1: 14 }, pre: { T: 10, gk: 6, gl: 8, c0: 0, c1: 9 } };
    const D = {};
    for (const key in CASE) { const s = CASE[key], yk = Array.from({ length: s.T }, (_, t) => t >= s.gk ? 4 : 0), yl = Array.from({ length: s.T }, (_, t) => t >= s.gl ? 2 : 0);
      const b = ST.bacon([{ n: 1, g: I, y: new Array(s.T).fill(0) }, { n: 1, g: s.gk, y: yk }, { n: 1, g: s.gl, y: yl }], s.T), f = (type, a) => b.parts.find(p => p.type === type && p.treat === a).w;
      D[key] = { w: [f('TvU', 1), f('EvL', 1), f('TvU', 2), f('LvE', 2)], delta: b.delta, dk: (s.T - s.gk) / s.T, dl: (s.T - s.gl) / s.T }; }
    const title = S('text', { x: 0, y: 26, cls: 'ttl', text: '' }, v);
    const CW = 44, TX = 176, TY = 78, RH = 34, RG = 7, ROWS = [['U', C.u, C.us, 99, 'fu'], ['k', C.c1, C.c1s, 6, 'f1'], ['l', C.c2, C.c2s, 8, 'f2']];
    ROWS.forEach(([n, , , , k], r) => S('text', { x: TX - 16, y: TY + r * (RH + RG) + RH / 2 + 7, 'text-anchor': 'end', cls: 'lbb ' + k, html: V(n) }, v));
    const cols = []; for (let c = 0; c < 15; c++) { const g = S('g', { o: 0 }, v);
      ROWS.forEach(([, col, soft, ad], r) => S('rect', { x: TX + c * CW + 1.5, y: TY + r * (RH + RG), width: CW - 3, height: RH, fill: c >= ad ? col : soft }, g));
      S('text', { x: TX + c * CW + CW / 2, y: TY + 3 * (RH + RG) + 16, 'text-anchor': 'middle', cls: 'ax', text: String(c - 4).replace('-', '−') }, g); cols.push(g); }
    const brk = (c0, c1, txt) => { const g = S('g', { o: 0 }, v), a = TX + c0 * CW + 2, b = TX + (c1 + 1) * CW - 2;
      S('path', { pts: [[a, TY - 6], [a, TY - 12], [b, TY - 12], [b, TY - 6]], stroke: C.ink, 'stroke-width': 1.5, fill: 'none' }, g); S('text', { x: (a + b) / 2, y: TY - 20, 'text-anchor': 'middle', cls: 'lbs', text: txt }, g); return g; };
    const bBase = brk(5, 9, '처음 관측한 5기'), bPost = brk(10, 14, '이후 5기 추가'), bPre = brk(0, 4, '이전 5기 추가');
    // 처치변수의 분산
    const px = lin(0, 1, 96, 420), py = lin(0, .25, 462, 300), gp = S('g', { o: 0 }, v);
    S('text', { x: 60, y: 258, cls: 'ttl', html: `${V('U')}와 비교할 때 처치변수의 분산` }, gp);
    S('line', { x1: 96, x2: 420, y1: py(0), y2: py(0), cls: 'axis' }, gp); S('line', { x1: 96, x2: 420, y1: py(.25), y2: py(.25), cls: 'grid' }, gp);
    S('text', { x: 86, y: py(.25) + 6, 'text-anchor': 'end', cls: 'ax', text: '0.25' }, gp);
    [0, .5, 1].forEach(n => S('text', { x: px(n), y: py(0) + 26, 'text-anchor': 'middle', cls: 'ax', text: n === .5 ? '0.5' : n }, gp));
    S('text', { x: 258, y: py(0) + 52, 'text-anchor': 'middle', cls: 'lbs', text: 'D̄ (관측 기간 중 처치된 기간의 비율)' }, gp);
    { const pts = []; for (let i = 0; i <= 50; i++) pts.push([px(i / 50), py(i / 50 * (1 - i / 50))]); S('path', { pts, stroke: C.ink, 'stroke-width': 2.5, fill: 'none' }, gp); }
    const mk = (n, col, k, dy) => { const g = S('g', { tx: px(.5), ty: py(.25) }, gp); S('circle', { cx: 0, cy: 0, r: 8.5, fill: col, stroke: '#fff', 'stroke-width': 2.5 }, g);
      const t = S('text', { x: 0, y: dy, 'text-anchor': 'middle', cls: 'lb halo ' + k, 'font-weight': 700, html: '' }, g); return { g, t, n }; };
    const mK = mk('k', C.c1, 'f1', -16), mL = mk('l', C.c2, 'f2', 31);
    // 네 2x2의 가중치
    const bw = lin(0, .5, 462, 300), BX = [556, 642, 728, 814], gb = S('g', { o: 0 }, v);
    S('text', { x: 520, y: 258, cls: 'ttl', text: '네 2×2의 가중치' }, gb); S('line', { x1: 516, x2: 856, y1: 462, y2: 462, cls: 'axis' }, gb);
    const NAME = [['k', 'U', 4, C.c1], ['k', 'l', 4, '#8fb1c6'], ['l', 'U', 2, C.c2], ['l', 'k', 2, '#dcc18f']];
    const bars = NAME.map(([a, b, d, col], i) => { const r = S('rect', { x: BX[i] - 29, y: 462, width: 58, height: 0, fill: col }, gb);
      const t = S('text', { x: BX[i], y: 0, 'text-anchor': 'middle', cls: 'lb', 'font-weight': 700, fmt: n => fmt(n, 3), num: 0, ty: 454 }, gb);
      S('text', { x: BX[i], y: 488, 'text-anchor': 'middle', cls: 'lb', html: `${V(a)} 대 ${V(b)}` }, gb); S('text', { x: BX[i], y: 512, 'text-anchor': 'middle', cls: 'lbs', text: 'DID ' + d }, gb); return { r, t }; });
    // 계수
    const gc = S('g', { o: 0 }, v), nx = lin(2, 4, 96, 800), NY = 716;
    const eq = S('text', { x: 96, y: 596, cls: 'lbb', html: '' }, gc);
    S('line', { x1: 96, x2: 800, y1: NY, y2: NY, cls: 'axis' }, gc);
    [2, 2.5, 3, 3.5, 4].forEach(n => { S('line', { x1: nx(n), x2: nx(n), y1: NY, y2: NY + 6, cls: 'axis' }, gc); S('text', { x: nx(n), y: NY + 28, 'text-anchor': 'middle', cls: 'ax', text: n }, gc); });
    S('line', { x1: nx(3), x2: nx(3), y1: NY - 62, y2: NY, stroke: C.ink, 'stroke-width': 2, 'stroke-dasharray': '6 5' }, gc); S('text', { x: nx(3), y: NY - 70, 'text-anchor': 'middle', cls: 'lb', text: '단위 평균 ATT 3' }, gc);
    const MK = [['base', '처음 5기', -18], ['post', '이후 5기 추가', -44], ['pre', '이전 5기 추가', -18]].map(([key, lab, dy]) => { const g = S('g', { o: 0 }, v), d = D[key].delta;
      const c = S('circle', { cx: nx(d), cy: NY, r: 9, fill: C.ink, stroke: '#fff', 'stroke-width': 2.5 }, g); const t = S('text', { x: nx(d), y: NY + dy, 'text-anchor': 'middle', cls: 'lb', 'font-weight': 700, text: `${lab} ${fmt(d, 2)}` }, g); return { g, c, t, key }; });
    // 2x2의 수 (도입 시점 6개, 미처치 집단 1개)
    const gm = S('g', { o: 0 }, v), G = 6, MP = 34, MX = 96, MY = 584;
    S('text', { x: 96, y: 562, cls: 'ttl', text: '도입 시점 6개, 미처치 집단 1개일 때의 2×2 (행은 처치집단, 열은 비교집단)' }, gm);
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) S('rect', { x: MX + j * MP, y: MY + i * MP, width: MP - 4, height: MP - 4, fill: i === j ? '#c3c6cf' : i < j ? C.ink : C.bad }, gm);
    [['#c3c6cf', '미처치 집단과 비교  6개'], [C.ink, '아직 미처치인 집단과 비교  15개'], [C.bad, '이미 처치된 집단과 비교  15개']].forEach(([c, t], i) => { S('rect', { x: 356, y: MY + 4 + i * 36, width: 20, height: 20, fill: c }, gm); S('text', { x: 388, y: MY + 20 + i * 36, cls: 'lb', text: t }, gm); });
    S('text', { x: 356, y: MY + 140, cls: 'lbb', text: '이미 처치된 집단과 비교하는 2×2의 비율 = (1 − 1/G) / 2' }, gm);
    S('text', { x: 356, y: MY + 170, cls: 'lb', text: 'G = 2일 때 25%,  3일 때 33%,  6일 때 42%,  20일 때 48%' }, gm);
    const TTL = ['세 집단을 5기 동안 관측 (효과는 k가 항상 4, l이 항상 2)', '', '', '이후 5기를 더 관측한 경우 (2×2의 DID는 그대로)', '이전 5기를 더 관측한 경우 (2×2의 DID는 그대로)'];
    return B => {
      const st = Math.max(0, B), key = st === 3 ? 'post' : st >= 4 ? 'pre' : 'base', s = CASE[key], d = D[key], o = { dur: 900 };
      title.innerHTML = (TTL[Math.min(st, 4)] || TTL[0]).replace(/\b([kl])(가|이)/g, (m, a, b) => V(a) + b);
      cols.forEach((g, c) => show(g, B >= 0 && c >= s.c0 && c <= s.c1, { dur: 400, delay: (c < 5 || c > 9) && (st === 3 || st === 4) ? 120 + Math.abs(c - 7) * 40 : 0 }));
      show(bBase, B >= 0); show(bPost, key === 'post'); show(bPre, key === 'pre');
      show(gb, st >= 1); bars.forEach((b, i) => { const w = st >= 1 ? d.w[i] : 0; tw(b.r, { y: bw(w), height: 462 - bw(w) }, o); tw(b.t, { ty: bw(w) - 8, num: w }, o); });
      show(gp, st >= 2); tw(mK.g, { tx: px(d.dk), ty: py(d.dk * (1 - d.dk)) }, o); tw(mL.g, { tx: px(d.dl), ty: py(d.dl * (1 - d.dl)) }, o);
      mK.t.innerHTML = `${V('k')}  D̄ = ${fmt(d.dk, 1)}`; mL.t.innerHTML = `${V('l')}  D̄ = ${fmt(d.dl, 1)}`; mL.t.setAttribute('text-anchor', d.dl < .5 ? 'start' : 'end'); mL.t.setAttribute('x', d.dl < .5 ? 16 : -16);
      show(gc, st >= 1 && st <= 4); const a = d.w[0] + d.w[1];
      eq.innerHTML = `TWFE 계수 = 4 × ${fmt(a, 3)} + 2 × ${fmt(1 - a, 3)} = <tspan class="big">${fmt(d.delta, 2)}</tspan>`;
      MK.forEach(m => { const on = st <= 4 && (m.key === 'base' ? st >= 1 : m.key === 'post' ? st >= 3 : st >= 4), cur = m.key === key; show(m.g, on, { delay: on && cur && st >= 3 ? 500 : 0 }); tw(m.c, { fill: cur ? C.ink : '#a4a5ab' }, { dur: 400 }); m.t.style.fill = cur ? C.ink : C.muted; });
      show(gm, st >= 5, { delay: st === 5 ? 250 : 0 });
    };
  });

  /* ---------- 모의자료 생성: 분해, 다시 뽑기, 주와 도입 시점 배정, 효과 주입, 두 가지 ATT ---------- */
  viz('dgp', (host, W, Hh) => {
    const v = svg(host, W, Hh), R = ST.rng(642), T = 36, CW = 18, X0 = 100, Y0 = 136, PH = 28, CH = 22, K = VZ.COH;
    // 기업 14개: [주(0-6), 첫 관측 연도, 마지막 관측 연도]. 주 0-2는 1989년, 3-4는 1998년, 5-6은 2007년 도입 집단
    const F = [[3, 0, 35], [0, 2, 30], [5, 0, 31], [1, 6, 35], [6, 10, 35], [2, 0, 17], [4, 4, 35], [1, 0, 35], [5, 12, 35], [0, 0, 14], [4, 0, 28], [3, 15, 35], [6, 0, 35], [2, 8, 33]];
    const cohOf = s => s <= 2 ? 0 : s <= 4 ? 1 : 2, ORD = F.map((f, i) => i).sort((a, b) => F[a][0] - F[b][0] || a - b);
    const top = S('g', {}, v), title = S('text', { x: 0, y: 26, cls: 'ttl', text: '' }, top);
    const stack = [12, 6].map(d => S('rect', { x: X0 + d, y: Y0 + d, width: T * CW, height: 14 * PH + 18, fill: '#fff', stroke: C.faint, 'stroke-width': 1.5, o: 0 }, top));
    S('rect', { x: X0 - 3, y: Y0 - 3, width: T * CW + 6, height: 14 * PH + 24, fill: '#fff' }, top);
    const op = z => Math.max(0, Math.min(.42, .16 + .13 * z));
    const lam = [0, 1].map(() => Array.from({ length: T }, () => op(R.n())));
    const firms = F.map(([s, a, b], i) => {
      const g = S('g', { ty: Y0 + i * PH, o: 0 }, top), x = X0 + a * CW, w = (b - a + 1) * CW, k = cohOf(s), gy = K[k].g - 1980;
      S('rect', { x, y: 0, width: w, height: CH, fill: '#e6e7eb' }, g);
      const al = [op(R.n()), op(R.n())], aB = S('rect', { x, y: 0, width: w, height: CH, fill: C.ink, o: 0 }, g);
      const mkL = arr => { const gg = S('g', { o: 0 }, g); for (let t = a; t <= b; t++) S('rect', { x: X0 + t * CW, y: 0, width: CW, height: CH, fill: C.ink, opacity: arr(t) }, gg); return gg; };
      const L = [mkL(t => lam[0][t]), mkL(t => lam[1][t])], E = [mkL(() => op(R.n())), mkL(() => op(R.n()))];
      const tr = S('rect', { x: X0 + Math.max(a, gy) * CW, y: 0, width: Math.max(0, (b - Math.max(a, gy) + 1) * CW), height: CH, fill: K[k].c, o: 0 }, g);
      let d = ''; for (let t = a + 1; t <= b; t++) d += `M${X0 + t * CW} 0V${CH}`; S('path', { d, stroke: '#fff', 'stroke-width': 1.5, fill: 'none', 'shape-rendering': 'crispEdges' }, g);
      const lab = S('text', { x: X0 - 12, y: CH / 2 + 6, 'text-anchor': 'end', cls: 'lbs', text: '주 ' + (s + 1), o: 0 }, g);
      return { g, al, aB, L, E, tr, lab, k, i, pos: ORD.indexOf(i) };
    });
    const sortedY = f => Y0 + f.pos * PH + f.k * 9;
    const ticks = S('g', { o: 0 }, top); [1980, 1989, 1998, 2007, 2015].forEach(n => S('text', { x: X0 + (n - 1980) * CW + CW / 2, y: Y0 + 14 * PH + 54, 'text-anchor': 'middle', cls: 'ax', text: n }, ticks));
    const cl = K.map((c, k) => { const fs = firms.filter(f => f.k === k), y = (Math.min(...fs.map(sortedY)) + Math.max(...fs.map(sortedY)) + CH) / 2; const g = S('g', { o: 0 }, top);
      S('text', { x: X0 + T * CW + 16, y: y - 4, cls: 'lbb ' + c.k, text: c.g + '년' }, g); S('text', { x: X0 + T * CW + 16, y: y + 20, cls: 'lbs', text: '도입 집단' }, g); return g; });
    const TTL = ['', 'Compustat 1980-2015년의 기업-연도 관측치 176,670개 (그림은 기업 14개로 줄인 도식)', '행 전체의 농도가 α, 열 전체의 농도가 λ, 칸마다 다른 농도가 ε', '세 분포에서 다시 뽑아 만든 패널 (처치효과는 아직 없다)', '기업에 주를, 주에 도입 시점을 무작위로 배정 (그림은 주 7개)', '도입 후 관측치에 효과를 더하고 TWFE를 추정. 500번 반복'];
    // 두 가지 표본평균 ATT (Sim 5)
    const M = SIM.get(), SIG = M.SIG, e5 = M.effY(5), att = S('g', { o: 0 }, v), ns = [17, 18, 15], yrs = K.map(c => 2016 - c.g);
    const me = K.map((c, k) => { let s = 0; for (let t = c.g - 1980; t < T; t++) s += e5[k][t]; return s / yrs[k] / SIG; });
    S('text', { x: 0, y: 26, cls: 'ttl', text: 'Sim 5의 표본평균 ATT 두 가지 (모든 코호트의 효과가 매년 0.03σ씩 커진다)' }, att);
    K.forEach((c, k) => { const y = 76 + k * 66; S('text', { x: 0, y: y + 14, cls: 'lbb ' + c.k, text: c.g + '년 코호트' }, att); S('text', { x: 0, y: y + 38, cls: 'lbs', text: ns[k] + '개 주' }, att);
      S('rect', { x: 170, y, width: yrs[k] * 13, height: 34, fill: c.c }, att); S('text', { x: 170 + yrs[k] * 13 + 14, y: y + 23, cls: 'lb', text: `도입 후 ${yrs[k]}년,  평균효과 ${sg(me[k])}` }, att); });
    const share = (y, head, sub, wts, val) => { const tot = wts.reduce((a, b) => a + b, 0); let x = 0; S('text', { x: 0, y, cls: 'lbb', text: head }, att); S('text', { x: 170, y, cls: 'lbs', text: sub }, att);
      wts.forEach((w, k) => { const ww = w / tot * 640; S('rect', { x: x + 1, y: y + 16, width: ww - 2, height: 46, fill: K[k].c }, att); S('text', { x: x + ww / 2, y: y + 46, 'text-anchor': 'middle', cls: 'lb', style: 'fill:#fff', 'font-weight': 700, text: Math.round(w / tot * 100) + '%' }, att); x += ww; });
      S('text', { x: 664, y: y + 50, cls: 'big', text: sg(val) }, att); };
    share(326, '기업평균', '코호트별 평균효과를 주의 수 17 : 18 : 15로 가중', ns, M.truth[5].firm / SIG);
    share(450, '관측치평균', '주의 수 × 도입 후 연수 459 : 324 : 135로 가중', ns.map((n, k) => n * yrs[k]), M.truth[5].obs / SIG);
    S('text', { x: 0, y: 580, cls: 'lb', text: '도입 후 기간이 긴 코호트일수록 평균효과가 크고, 관측치평균은 그 코호트에 더 큰 비중을 둔다.' }, att);
    S('text', { x: 0, y: 610, cls: 'lbs', text: '이 발표는 균형패널로 단순화해 계산했다. 원문의 불균형 패널에서는 기업마다 관측 기간도 다르다.' }, att);
    return B => {
      const st = Math.max(0, B), sc = st >= 6;
      show(top, !sc); show(att, sc, { delay: sc ? 250 : 0 }); if (sc) return;
      title.textContent = TTL[st];
      const ver = st >= 3 ? 1 : 0;
      firms.forEach((f, i) => {
        show(f.g, st >= 1, { delay: st === 1 ? i * 45 : 0 });
        tw(f.aB, { o: st >= 2 ? f.al[ver] : 0 }, { dur: 600 });
        f.L.forEach((l, j) => tw(l, { o: st >= 2 && j === ver ? 1 : 0 }, { dur: 600, delay: st === 2 ? 600 : 0 }));
        f.E.forEach((e, j) => tw(e, { o: st >= 2 && j === ver ? 1 : 0 }, { dur: 600, delay: st === 2 ? 1200 : 0 }));
        tw(f.g, { ty: st >= 4 ? sortedY(f) : Y0 + f.i * PH }, { dur: 1000, delay: st === 4 ? f.pos * 30 : 0 });
        show(f.lab, st >= 4, { delay: st === 4 ? 700 : 0 }); tw(f.tr, { o: st >= 5 ? .62 : 0 }, { dur: 700, delay: st === 5 ? f.pos * 40 : 0 });
      });
      show(ticks, st >= 1); cl.forEach(g => show(g, st >= 4, { delay: st === 4 ? 900 : 0 }));
      stack.forEach((r, i) => show(r, st >= 5, { delay: st === 5 ? 700 + i * 150 : 0 }));
    };
  });

  /* ---------- 제2종 오류: 효과가 큰데 계수는 0 근처 (Sim 5), 부호가 반대인 유의한 계수 (Sim 6) ---------- */
  viz('type2', (host, W, Hh) => {
    const v = svg(host, W, Hh), M = SIM.get(), N = M.NSIM, SIG = M.SIG, XR = W - 40;
    const title = S('text', { x: 74, y: 26, cls: 'ttl', text: '' }, v);
    const bx = lin(-.14, .5, 74, XR), by0 = 300;
    S('line', { x1: 74, x2: XR, y1: by0 + 6, y2: by0 + 6, cls: 'axis' }, v);
    [-.1, 0, .1, .2, .3, .4, .5].forEach(n => { S('line', { x1: bx(n), x2: bx(n), y1: by0 + 6, y2: by0 + 12, cls: 'axis' }, v); S('text', { x: bx(n), y: by0 + 32, 'text-anchor': 'middle', cls: 'ax', text: n === 0 ? '0' : fmt(n, 1) + 'σ' }, v); });
    S('line', { x1: bx(0), x2: bx(0), y1: 60, y2: by0 + 6, cls: 'zero' }, v);
    const dots = []; for (let i = 0; i < N; i++) dots.push(S('circle', { cx: bx(0), cy: by0, r: 2.3, fill: C.ink, o: 0 }, v));
    const tF = S('g', { o: 0, tx: bx(.3) }, v); S('line', { x1: 0, x2: 0, y1: 96, y2: by0 + 6, stroke: C.ink, 'stroke-width': 2, 'stroke-dasharray': '7 5' }, tF); const tFt = S('text', { x: -8, y: 86, 'text-anchor': 'end', cls: 'lb', text: '' }, tF);
    const tO = S('g', { o: 0, tx: bx(.3) }, v); S('line', { x1: 0, x2: 0, y1: 70, y2: by0 + 6, stroke: C.muted, 'stroke-width': 2, 'stroke-dasharray': '3 4' }, tO); const tOt = S('text', { x: -8, y: 62, 'text-anchor': 'end', cls: 'lbs', text: '' }, tO);
    const mLab = S('text', { x: 0, y: 150, cls: 'lbb halo', text: '', tx: bx(.05), o: 0 }, v);
    // 아래: t값
    const x = lin(-9, 6, 74, XR), y0 = 700, g2 = S('g', { o: 0 }, v);
    S('text', { x: 74, y: 398, cls: 'ttl', text: '같은 모의자료 500개의 t값 (주 단위 군집강건 표준오차)' }, g2);
    S('rect', { x: x(-1.96), y: 486, width: x(1.96) - x(-1.96), height: y0 + 6 - 486, fill: C.soft }, g2);
    S('line', { x1: 74, x2: XR, y1: y0 + 6, y2: y0 + 6, cls: 'axis' }, g2);
    [-8, -6, -4, -2, 0, 2, 4, 6].forEach(n => { S('line', { x1: x(n), x2: x(n), y1: y0 + 6, y2: y0 + 12, cls: 'axis' }, g2); S('text', { x: x(n), y: y0 + 32, 'text-anchor': 'middle', cls: 'ax', text: String(n).replace('-', '−') }, g2); });
    S('text', { x: XR, y: y0 + 60, 'text-anchor': 'end', cls: 'lbs', text: '띠 안이 |t| < 1.96' }, g2);
    const big = S('text', { x: 74, y: 440, cls: 'big', text: '' }, g2), sub = S('text', { x: 74, y: 468, cls: 'lbs', text: '' }, g2);
    const td = []; for (let i = 0; i < N; i++) td.push(S('circle', { cx: x(0), cy: y0, r: 2.9, fill: C.ink, o: 0 }, v));
    const SL = { 5: [.03, .03, .03], 6: [.05, .03, .01] }, TS = { 5: M.tfix(SL[5]), 6: M.tfix(SL[6]) };
    const NAME = { 5: 'Sim 5  모든 코호트의 효과가 같은 속도로 커진다', 6: 'Sim 6  코호트마다 다른 속도로 커진다' };
    return B => {
      const st = Math.max(0, B), sim = st >= 5 ? 6 : 5, o = { dur: 1000 }, tr = M.truth[sim], est = M.est(sim), m = VZ.mean(est), t = TS[sim];
      title.textContent = NAME[sim];
      show(tF, st >= 1); show(tO, st >= 1, { delay: st === 1 ? 300 : 0 }); tw(tF, { tx: bx(tr.firm / SIG) }, o); tw(tO, { tx: bx(tr.obs / SIG) }, o);
      tFt.textContent = '기업평균 ATT ' + sg(tr.firm / SIG); tOt.textContent = '관측치평균 ' + sg(tr.obs / SIG);
      const pos = VZ.dotStack(est, bx, 6, by0, 2.3, 74, XR);
      dots.forEach((d, i) => { tw(d, { o: st >= 2 ? .75 : 0 }, { dur: 300, delay: st === 2 ? i * 2.2 : 0 }); tw(d, { cx: pos[i][0], cy: pos[i][1], fill: m < 0 ? C.bad : '#7d7e86' }, { dur: 900, delay: (i % 25) * 8 }); });
      show(mLab, st >= 2, { delay: st === 2 ? 900 : 0 }); mLab.textContent = 'TWFE 평균 ' + sg(m); mLab.setAttribute('class', 'lbb halo' + (m < 0 ? ' fb' : '')); tw(mLab, { tx: bx(m) + 46 }, o);
      show(g2, st >= 3);
      let mx = 1; { const c = new Map(); t.forEach(z => { const b = Math.round(x(z) / 7); c.set(b, (c.get(b) || 0) + 1); mx = Math.max(mx, c.get(b)); }); }
      const tp = VZ.dotStack(Array.from(t), x, 7, y0, Math.min(6.2, 200 / mx), 74, XR); let ins = 0;
      td.forEach((d, i) => { const sig = Math.abs(t[i]) >= 1.96; if (!sig) ins++; const wrong = sim === 6 ? true : (st >= 4 && !sig);
        tw(d, { o: st >= 3 ? .7 : 0 }, { dur: 300, delay: st === 3 ? i * 2 : 0 }); tw(d, { cx: tp[i][0], cy: tp[i][1], fill: wrong ? C.bad : C.ink }, { dur: 900, delay: (i % 20) * 9 }); });
      const p = ins / N;
      if (sim === 5) { big.textContent = `유의하지 않은 모의자료 ${Math.round(p * 100)}%`; sub.textContent = st >= 4 ? `500개 가운데 ${ins}개에서 효과가 없다는 결론이 나온다` : `참효과는 ${sg(tr.firm / SIG)}인데 5% 수준에서 유의한 것은 ${Math.round((1 - p) * 100)}%`; sub.setAttribute('class', 'lbs' + (st >= 4 ? ' fb' : '')); }
      else { big.textContent = `유의한 음수 ${Math.round(Array.from(t).filter(z => z <= -1.96).length / N * 100)}%`; sub.textContent = '세 코호트의 참효과는 모두 양수다'; sub.setAttribute('class', 'lbs fb'); }
    };
  });

  /* ---------- Sun-Abraham 분해: 사건연구 계수 하나가 (코호트, 경과연수) 효과에 부여하는 가중치 ---------- */
  viz('sa', (host, W, Hh) => {
    const v = svg(host, W, Hh), M = SIM.get(), SIG = M.SIG, K = VZ.COH, NL = K.map(c => 2016 - c.g);
    const P = K.map(c => ST.effPath('6b', c.g)), eff = (k, e) => P[k][K[k].g - 1980 + e] / SIG;
    const CW = 28, X0 = 112, RY = [172, 252, 332], RH = 40, cxOf = e => X0 + e * CW + CW / 2, XE = X0 + 27 * CW;
    const tr = M.trueEvent(P), INFO = {};
    [3, -3, 4].forEach(l => { const w = M.evWeights(l); let own = 0, oth = 0; const big = [];
      w.forEach((r, k) => r.forEach((val, e) => { if (e === l) own += val * eff(k, e); else oth += val * eff(k, e); if (Math.abs(val) >= .1) big.push({ k, e, w: val, own: e === l }); }));
      INFO[l] = { w, own, oth, big, tru: tr.find(o => o.l === l).v }; });
    K.forEach((c, k) => S('text', { x: X0 - 12, y: RY[k] + 27, 'text-anchor': 'end', cls: 'lbb ' + c.k, text: c.g + '년' }, v));
    const cells = K.map((c, k) => Array.from({ length: NL[k] }, (_, e) => { S('rect', { x: X0 + e * CW + 1, y: RY[k], width: CW - 2, height: RH, fill: C.soft }, v); return S('rect', { x: X0 + e * CW + 1, y: RY[k], width: CW - 2, height: RH, fill: C.ink, o: 0 }, v); }));
    [0, 5, 10, 15, 20, 25].forEach(e => S('text', { x: cxOf(e), y: RY[2] + RH + 24, 'text-anchor': 'middle', cls: 'ax', text: e }, v));
    const bk = (a, b, txt) => { const xa = X0 + a * CW + 2, xb = X0 + (b + 1) * CW - 2, y = RY[2] + RH + 36; S('path', { pts: [[xa, y], [xa, y + 6], [xb, y + 6], [xb, y]], stroke: C.muted, 'stroke-width': 1.5, fill: 'none' }, v); S('text', { x: (xa + xb) / 2, y: y + 30, 'text-anchor': 'middle', cls: 'lbs', text: txt }, v); };
    bk(0, 5, '0-5기는 더미 하나씩'); bk(6, 26, '6기 이후는 한 구간으로 묶음');
    const ownBox = S('rect', { x: 0, y: RY[0] - 5, width: CW + 4, height: RY[2] + RH - RY[0] + 10, fill: 'none', stroke: C.ink, 'stroke-width': 2.5, tx: X0 + 3 * CW - 2, o: 0 }, v);
    const ownLab = S('text', { x: 0, y: 132, cls: 'lbb', text: '', tx: X0, o: 0 }, v);
    const call = Array.from({ length: 12 }, () => S('text', { x: 0, y: 0, 'text-anchor': 'middle', cls: 'lb', 'font-weight': 700, text: '', tx: X0, ty: RY[0], o: 0 }, v));
    // 아래: 참 효과 경로
    const yv = lin(0, 2.8, 650, 492), gp = S('g', { o: 0 }, v);
    S('text', { x: X0, y: 474, cls: 'ttl', text: '코호트별 참 효과 (앞 장의 사전추세 없는 자료)' }, gp);
    [0, 1, 2].forEach(n => { S('line', { x1: X0, x2: XE, y1: yv(n), y2: yv(n), cls: n === 0 ? 'axis' : 'grid' }, gp); S('text', { x: X0 - 12, y: yv(n) + 6, 'text-anchor': 'end', cls: 'ax', text: n === 0 ? '0' : n + 'σ' }, gp); });
    K.forEach((c, k) => S('path', { pts: Array.from({ length: NL[k] }, (_, e) => [cxOf(e), yv(eff(k, e))]), stroke: c.c, 'stroke-width': 3.5, fill: 'none' }, gp));
    const pd = Array.from({ length: 12 }, () => S('circle', { cx: 0, cy: 0, r: 7.5, fill: C.ink, stroke: '#fff', 'stroke-width': 2, tx: X0, ty: yv(0), o: 0 }, v));
    const ro = [['원하는 칸의 기여', 112], ['+ 다른 칸의 기여', 322], ['= TWFE 계수', 540], ['참 평균효과', 722]].map(([t, xx]) => { const g = S('g', { o: 0 }, v); S('text', { x: xx, y: 706, cls: 'lbs', text: t }, g); const n = S('text', { x: xx, y: 744, cls: 'big', text: '' }, g); return { g, n }; });
    const lt = l => (l > 0 ? '+' : l < 0 ? '−' : '') + Math.abs(l) + '기';
    return B => {
      const st = Math.max(0, B), l = st <= 3 ? 3 : st === 4 ? -3 : 4, d = INFO[l], o = { dur: 700 };
      cells.forEach((row, k) => row.forEach((c, e) => { const val = d.w[k][e], on = st >= 2 || (st === 1 && e === l); tw(c, { fill: val < 0 ? C.bad : C.ink }, { dur: 0 }); tw(c, { o: on ? Math.pow(Math.min(1, Math.abs(val) / .34), .55) : 0 }, { dur: 600, delay: st === 2 && e !== l ? 150 + e * 18 : 0 }); }));
      show(ownBox, st >= 1 && l >= 0); if (l >= 0) tw(ownBox, { tx: X0 + l * CW - 2 }, o);
      show(ownLab, st >= 1); ownLab.textContent = l >= 0 ? `${lt(l)} 계수가 추정하려는 칸` : `${lt(l)} 계수가 추정하려는 칸은 도입 전이어서 효과가 0이다`; ownLab.setAttribute('text-anchor', l >= 0 ? 'middle' : 'start'); tw(ownLab, { tx: l >= 0 ? cxOf(l) + 40 : X0 }, o);
      call.forEach((t, i) => { const b = d.big[i], on = !!b && (st >= 2 || (st === 1 && b.own)); show(t, on, { delay: on && st === 2 && !b.own ? 500 : 0 }); if (!b) return;
        t.textContent = b.own ? fmt(b.w, 2) : fmt(b.w, 2, true); t.setAttribute('class', 'lb halo' + (b.w < 0 ? ' fb' : '')); tw(t, { tx: cxOf(b.e), ty: RY[b.k] - 9 }, { dur: 0 }); });
      show(gp, st >= 3);
      pd.forEach((c, i) => { const b = d.big[i], on = !!b && st >= 3; show(c, on, { delay: on && st === 3 ? 400 : 0 }); if (b) { tw(c, { tx: cxOf(b.e), ty: yv(eff(b.k, b.e)) }, { dur: 0 }); c.setAttribute('fill', b.w < 0 ? C.bad : C.ink); } });
      ro.forEach((r, i) => show(r.g, st >= 3, { delay: st === 3 ? 600 + i * 200 : 0 }));
      const coef = d.own + d.oth; ro[0].n.textContent = sg(d.own, 2); ro[1].n.textContent = sg(d.oth, 2); ro[1].n.setAttribute('class', 'big fb'); ro[2].n.textContent = sg(coef, 2); ro[2].n.setAttribute('class', 'big' + (Math.abs(coef - d.tru) > .02 ? ' fb' : '')); ro[3].n.textContent = sg(d.tru, 2);
    };
  });

  /* ---------- 세 대안의 비교: 같은 모의자료에서의 정적 추정치 (원문 Fig. 6의 일부) ---------- */
  viz('comp', (host, W, Hh) => {
    const v = svg(host, W, Hh), M = SIM.get(), g = S('g', { o: 0 }, v), N = M.NSIM;
    const SIMS = [[4, '효과 크기가 코호트마다 다름'], [5, '모든 코호트가 같은 속도로 증가'], [6, '코호트마다 다른 속도로 증가']], EST = [['cs', "Callaway-Sant'Anna"], ['sa', 'Sun-Abraham'], ['st', 'Stacked']];
    const LX = 196, PW = (W - LX) / 3, RY = [548, 604, 660];
    S('text', { x: 0, y: 446, cls: 'ttl', text: '같은 모의자료 500개에 적용한 정적 추정치 (원문 Fig. 6의 일부)' }, g);
    EST.forEach(([, n], i) => S('text', { x: 0, y: RY[i] + 6, cls: 'lb', text: n }, g));
    SIMS.forEach(([sim, desc], j) => {
      const A = M.altDist(sim), x0 = LX + j * PW, x = lin(A.truth - .085, A.truth + .085, x0 + 8, x0 + PW - 22);
      S('text', { x: x0 + 8, y: 484, cls: 'lbb', text: 'Sim ' + sim }, g); S('text', { x: x0 + 8, y: 508, cls: 'lbs', text: desc }, g);
      S('line', { x1: x(A.truth), x2: x(A.truth), y1: 524, y2: 688, stroke: C.ink, 'stroke-width': 2, 'stroke-dasharray': '6 5' }, g);
      S('text', { x: x(A.truth), y: 716, 'text-anchor': 'middle', cls: 'lbs', text: '기준값 ' + sg(A.truth) }, g);
      EST.forEach(([key], i) => { const a = A[key].slice().sort((p, q) => p - q), lo = a[Math.floor(N * .025)], hi = a[Math.ceil(N * .975) - 1], m = VZ.mean(a), off = Math.abs(m - A.truth) > .004, col = off ? C.bad : C.ink;
        S('line', { x1: x(lo), x2: x(hi), y1: RY[i], y2: RY[i], stroke: col, 'stroke-width': 3 }, g); [lo, hi].forEach(e => S('line', { x1: x(e), x2: x(e), y1: RY[i] - 7, y2: RY[i] + 7, stroke: col, 'stroke-width': 3 }, g));
        S('circle', { cx: x(m), cy: RY[i], r: 8, fill: col, stroke: '#fff', 'stroke-width': 2 }, g);
        if (off) S('text', { x: x(hi) + 10, y: RY[i] + 6, cls: 'lb fb', 'font-weight': 700, text: fmt(m - A.truth, 3, true) + 'σ' }, g); });
    });
    return B => { show(g, B >= 4, { delay: B === 4 ? 200 : 0 }); };
  });
})();
