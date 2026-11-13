/* 6-9장: Goodman-Bacon 분해, 시뮬레이션 1-6, 2x2 진단, 제1종 오류 */
(function () {
  'use strict';
  const { S, tw, show, svg, lin, C, viz, fmt, fmtFrac, chips, H } = DK;
  const sg = v => fmt(v, 3) + 'σ';

  /* ---------- 6. 세 집단 예제의 분해: 면적 = 가중치 × DID ---------- */
  viz('bacon', (host, W, Hh) => {
    const v = svg(host, W, Hh), T = 5, I = Infinity;
    const V = c => `<tspan class="v">${c}</tspan>`;
    const Y = { U: [0, 0, 0, 0, 0], k: [0, 1, 3, 5, 7], l: [0, 0, 0, 1, 3] };
    const X = t => 120 + t * 160, y = lin(0, 7, 270, 56);
    // 위: 세 집단의 경로
    const top = S('g', {}, v);
    const win = S('rect', { x: X(0) - 44, y: 40, width: 4 * 160 + 88, height: 246, fill: C.soft, o: 0 }, top);
    const split = S('line', { x1: 0, x2: 0, y1: 40, y2: 286, stroke: C.ink, 'stroke-width': 1.5, 'stroke-dasharray': '5 5', o: 0, tx: X(.5) }, top);
    VZ.yAxis(top, y, [0, 2, 4, 6], 76, 800); [1, 2, 3, 4, 5].forEach((n, i) => S('text', { x: X(i), y: 312, 'text-anchor': 'middle', cls: 'ax', text: n + '기' }, top));
    const ln = {}, col = { U: C.u, k: C.c1, l: C.c2 }, kk = { U: 'fu', k: 'f1', l: 'f2' };
    ['U', 'k', 'l'].forEach(n => {
      const g = S('g', { o: 0 }, top); S('path', { pts: Y[n].map((e, t) => [X(t), y(e)]), stroke: col[n], 'stroke-width': 4, fill: 'none', 'stroke-linejoin': 'round' }, g);
      Y[n].forEach((e, t) => S('circle', { cx: X(t), cy: y(e), r: 6.5, fill: col[n] }, g));
      S('text', { x: X(4) + 18, y: y(Y[n][4]) + (n === 'U' ? -8 : 8), cls: 'lbb ' + kk[n], html: V(n) }, g); ln[n] = g;
    });
    const title = S('text', { x: 76, y: 26, cls: 'ttl', text: '' }, v);
    // 아래: 가중치 × DID
    const bx = lin(0, 1, 110, 770), by = lin(-3, 5, 724, 404), bot = S('g', { o: 0 }, v);
    [-2, 0, 2, 4].forEach(n => { S('line', { x1: 110, x2: 770, y1: by(n), y2: by(n), cls: n === 0 ? 'axis' : 'grid' }, bot); S('text', { x: 100, y: by(n) + 5.5, 'text-anchor': 'end', cls: 'ax', text: String(n).replace('-', '−') }, bot); });
    const ORD = [['TvU', 'k', 'U'], ['TvU', 'l', 'U'], ['EvL', 'k', 'l'], ['LvE', 'l', 'k']].map(r => r.concat([`${V(r[1])} 대 ${V(r[2])}`]));
    const bars = ORD.map(([type, a, b, name]) => {
      const badp = type === 'LvE', g = S('g', { o: 0 }, v);
      const r = S('rect', { x: 110, y: by(0), width: 0, height: 0, fill: badp ? C.bad : '#c3c6cf' }, g);
      const nm = S('text', { x: 0, y: 0, 'text-anchor': 'middle', cls: 'lbb' + (badp ? ' fb' : ''), html: name, tx: 110, ty: 0 }, g);
      const dv = S('text', { x: 0, y: 0, 'text-anchor': 'middle', cls: 'lb', style: badp ? 'fill:#fff' : '', text: '', tx: 110, ty: 0 }, g);
      const wv = S('text', { x: 0, y: 0, 'text-anchor': 'middle', cls: 'lbs halo', text: '', tx: 110, ty: 0 }, g);
      return { type, a, b, g, r, nm, dv, wv, badp };
    });
    const tru = S('g', { o: 0 }, v); S('line', { x1: 110, x2: 770, y1: by(10 / 3), y2: by(10 / 3), stroke: C.ink, 'stroke-width': 2, 'stroke-dasharray': '7 6' }, tru);
    S('text', { x: 778, y: by(10 / 3) + 6, cls: 'lb', text: '참 평균 3.33' }, tru);
    const est = S('g', { o: 0, ty: by(1.5) }, v); S('line', { x1: 110, x2: 770, y1: 0, y2: 0, stroke: C.ink, 'stroke-width': 3 }, est);
    const estT = S('text', { x: 778, y: 6, cls: 'lbb', text: 'TWFE 1.50' }, est);
    let nU = 1;
    const NU = [0, 1, 2, 4, 10], dOf = n => ST.bacon([{ n, g: I, y: Y.U }, { n: 1, g: 1, y: Y.k }, { n: 1, g: 3, y: Y.l }].filter(g => g.n > 0), T).delta;
    const ch = chips(host, 'U의 단위 수와 TWFE 계수', NU.map(n => `${n}<small>${fmt(dOf(n), 2)}</small>`), i => { nU = NU[i]; layout(true); }, 'top:726px;left:110px'); ch.el.__s = {}; let lastB = -1;
    function layout(anim) {
      const groups = [{ n: nU, g: I, y: Y.U, id: 'U' }, { n: 1, g: 1, y: Y.k, id: 'k' }, { n: 1, g: 3, y: Y.l, id: 'l' }].filter(g => g.n > 0);
      const bc = ST.bacon(groups, T), o = { dur: anim ? 800 : 0 }; let cum = 0;
      bars.forEach(b => {
        const p = bc.parts.find(p => p.type === b.type && groups[p.treat].id === b.a && groups[p.ctrl].id === b.b), w = p ? p.w : 0, e = p ? p.est : 0;
        const x0 = bx(cum), x1 = bx(cum + w), pw = x1 - x0; cum += w; b.w = w;
        tw(b.r, { x: x0, width: Math.max(0, pw), y: Math.min(by(0), by(e)), height: Math.abs(by(e) - by(0)) }, o);
        const mid = (x0 + x1) / 2, wide = pw >= 64;
        tw(b.nm, { tx: mid, ty: e >= 0 ? by(e) - 12 : by(e) + 26, o: wide ? 1 : 0 }, o);
        tw(b.dv, { tx: mid, ty: (by(e) + by(0)) / 2 + 6, o: wide ? 1 : 0 }, o); b.dv.textContent = 'DID ' + fmt(e, 0);
        tw(b.wv, { tx: mid, ty: e >= 0 ? by(0) + 24 : by(0) - 10, o: wide ? 1 : 0 }, o); b.wv.textContent = '가중치 ' + (nU === 1 ? fmtFrac(w) : fmt(w, 2));
      });
      tw(est, { ty: by(bc.delta) }, o); estT.textContent = 'TWFE ' + fmt(bc.delta, 2);
      estT.setAttribute('class', 'lbb' + (bc.delta < 0 ? ' fb' : ''));
    }
    const WIN = [null, ['k', 'U', 0, 4, .5, `${V('k')} 대 ${V('U')}  (처치집단 ${V('k')}, 비교집단 ${V('U')})`], ['l', 'U', 0, 4, 2.5, `${V('l')} 대 ${V('U')}  (처치집단 ${V('l')}, 비교집단 ${V('U')})`], ['k', 'l', 0, 2, .5, `${V('k')} 대 ${V('l')}  (처치집단 ${V('k')}, 비교집단은 아직 미처치인 ${V('l')})`], ['l', 'k', 1, 4, 2.5, `${V('l')} 대 ${V('k')}  (처치집단 ${V('l')}, 비교집단은 이미 처치된 ${V('k')})`]];
    return B => {
      const st = Math.max(0, B), wn = WIN[st] || null;
      ['U', 'k', 'l'].forEach((n, i) => tw(ln[n], { o: B < 0 ? 0 : (wn && n !== wn[0] && n !== wn[1]) ? .16 : 1 }, { dur: 450, delay: B === 0 ? 150 + i * 120 : 0 }));
      show(win, !!wn); show(split, !!wn);
      if (wn) { tw(win, { x: X(wn[2]) - 44, width: (wn[3] - wn[2]) * 160 + 88, fill: st === 4 ? C.bads : C.soft }, { dur: 600 }); tw(split, { tx: X(wn[4]) }, { dur: 600 }); title.innerHTML = wn[5]; title.setAttribute('class', 'ttl' + (st === 4 ? ' fb' : '')); }
      else { title.textContent = '세 집단의 결과 (무처치 결과는 0)'; title.setAttribute('class', 'ttl'); }
      show(bot, B >= 1);
      if (B < 6) { if (ch.get() !== 1) ch.set(1); else layout(false); } else if (lastB < 6) ch.set(0);
      lastB = B;
      bars.forEach((b, i) => show(b.g, B >= i + 1, { delay: B === i + 1 ? 350 : 0 }));
      show(tru, B >= 5, { delay: B === 5 ? 300 : 0 }); show(est, B >= 5, { delay: B === 5 ? 700 : 0 });
      tw(ch.el, { o: B >= 6 ? 1 : 0 }, { dur: 400 }); ch.el.style.pointerEvents = B >= 6 ? 'auto' : 'none';
    };
  });

  /* ---------- 7. 시뮬레이션 1-6: 같은 500개 모의자료에 효과만 바꿔 넣는다 ---------- */
  viz('sim', (host, W, Hh) => {
    const v = svg(host, W, Hh), M = SIM.get(), T = M.T, SIG = M.SIG;
    const X = lin(1980, 2015, 74, W - 96), y = lin(-.3, 1.5, 318, 34), yr = t => 1980 + t;
    VZ.yAxis(v, y, [0, .5, 1, 1.5], 74, W - 96, n => n === 0 ? '0' : n.toFixed(1) + 'σ');
    VZ.xAxis(v, X, [1980, 1989, 1998, 2007, 2015], 330, null, { line: false });
    const title = S('text', { x: 74, y: 22, cls: 'ttl', text: '' }, v);
    const vl = [1989, 1998, 2007].map((g, k) => S('line', { x1: X(g) - 12, x2: X(g) - 12, y1: 34, y2: 322, stroke: [C.c1, C.c2, C.c3][k], 'stroke-width': 1.5, 'stroke-dasharray': '5 5', o: 0 }, v));
    const path = arr => arr.map((e, t) => [X(yr(t)), y(e / SIG)]);
    const zero = new Array(T).fill(0);
    const base = M.sample(3);                               // 효과를 넣기 전 잡음(공통)
    const stNoise = base.st.map((s, i) => s.y.map((val, t) => val - M.effY(3)[s.k][t]));
    const stL = stNoise.map(n => S('path', { pts: path(n), stroke: C.u, 'stroke-width': 1, fill: 'none', o: 0 }, v));
    const mL = [0, 1, 2].map(() => S('path', { pts: path(zero), stroke: C.u, 'stroke-width': 4, fill: 'none', 'stroke-linejoin': 'round', o: 0 }, v));
    const mT = [0, 1, 2].map(() => S('text', { x: W - 88, y: 0, cls: 'lbb', text: '', ty: y(0), o: 0 }, v));
    // 아래: 추정치 500개
    const bx = lin(-.14, .58, 74, W - 96), by0 = 716, ticks = [-.1, 0, .1, .2, .3, .4, .5];
    const bot = S('g', { o: 0 }, v); S('line', { x1: 74, x2: W - 96, y1: by0 + 6, y2: by0 + 6, cls: 'axis' }, bot);
    ticks.forEach(n => { S('line', { x1: bx(n), x2: bx(n), y1: by0 + 6, y2: by0 + 12, cls: 'axis' }, bot); S('text', { x: bx(n), y: by0 + 32, 'text-anchor': 'middle', cls: 'ax', text: n === 0 ? '0' : fmt(n, 1) + 'σ' }, bot); });
    S('text', { x: 74, y: 386, cls: 'ttl', text: 'TWFE 추정치 δ̂  (모의자료 500개)' }, bot);
    S('line', { x1: bx(0), x2: bx(0), y1: 420, y2: by0 + 6, cls: 'zero' }, bot);
    const dots = []; for (let i = 0; i < M.NSIM; i++) dots.push(S('circle', { cx: bx(0), cy: by0, r: 2.3, fill: C.ink, o: 0 }, v));
    const tF = S('g', { o: 0, tx: bx(.5) }, v); S('line', { x1: 0, x2: 0, y1: 428, y2: by0 + 6, stroke: C.ink, 'stroke-width': 2, 'stroke-dasharray': '7 5' }, tF); const tFt = S('text', { x: -8, y: 420, 'text-anchor': 'end', cls: 'lb', text: '' }, tF);
    const tO = S('g', { o: 0, tx: bx(.5) }, v); S('line', { x1: 0, x2: 0, y1: 428, y2: by0 + 6, stroke: C.muted, 'stroke-width': 2, 'stroke-dasharray': '3 4' }, tO); const tOt = S('text', { x: 8, y: 420, cls: 'lbs', text: '' }, tO);
    const mLab = S('text', { x: 0, y: 560, cls: 'lbb', text: '', tx: bx(.5), o: 0 }, v);
    const NAME = [null, 'Sim 1  일괄 도입, 일정한 효과', 'Sim 2  일괄 도입, 커지는 효과', 'Sim 3  순차 도입, 같은 크기의 일정한 효과', 'Sim 4  순차 도입, 코호트별로 다른 일정한 효과', 'Sim 5  순차 도입, 같은 속도로 커지는 효과', 'Sim 6  순차 도입, 코호트별로 다른 속도로 커지는 효과'];
    const LAB = { A: ['1998년 도입', '미처치'], B: ['1989년 코호트', '1998년 코호트', '2007년 코호트'] };
    const COLS = { A: [C.c2, C.u], B: [C.c1, C.c2, C.c3] }, stK = { A: s => s < 25 ? 0 : 1, B: s => s < 17 ? 0 : s < 35 ? 1 : 2 };
    return B => {
      const sim = Math.max(1, Math.min(6, B)), on = B >= 1, des = M.desOf(sim), eff = M.effY(sim), o = { dur: 1000 };
      title.textContent = on ? NAME[sim] : '효과를 넣기 전의 모의자료 하나';
      vl.forEach((l, k) => show(l, on && (des === 'B' || k === 1)));
      stL.forEach((p, s) => { const k = stK[des](s); tw(p, { pts: path(stNoise[s].map((n, t) => n + (on ? eff[k][t] : 0))), stroke: on ? COLS[des][k] : C.u, o: B < 0 ? 0 : .3 }, o); });
      const smp = M.sample(sim);
      mL.forEach((p, k) => { const has = on && k < eff.length; tw(p, { o: has ? 1 : 0 }, { dur: 400 }); if (has) tw(p, { pts: path(smp.mean[k]), stroke: COLS[des][k] }, o);
        show(mT[k], has, { delay: 300 }); if (has) { mT[k].textContent = LAB[des][k]; tw(mT[k], { ty: y(smp.mean[k][T - 1] / SIG) + 6, fill: COLS[des][k] }, o); mT[k].style.fill = COLS[des][k]; } });
      // 라벨이 겹치면 벌린다
      if (on) { const ys = eff.map((e, k) => y(smp.mean[k][T - 1] / SIG) + 6), idx = ys.map((_, i) => i).sort((a, b) => ys[a] - ys[b]); for (let i = 1; i < idx.length; i++) if (ys[idx[i]] - ys[idx[i - 1]] < 24) ys[idx[i]] = ys[idx[i - 1]] + 24; eff.forEach((_, k) => tw(mT[k], { ty: ys[k] }, o)); }
      show(bot, B >= 0);
      const est = M.est(sim), pos = VZ.dotStack(est, bx, 6, by0, 2.3, 74, W - 96), tr = M.truth[sim], same = Math.abs(tr.firm - tr.obs) < 1e-9, m = VZ.mean(est);
      dots.forEach((d, i) => { tw(d, { o: on ? .75 : 0 }, { dur: 300, delay: B === 1 ? i * 2.2 : 0 }); if (on) tw(d, { cx: pos[i][0], cy: pos[i][1], fill: m < 0 ? C.bad : '#7d7e86' }, { dur: 900, delay: (i % 25) * 8 }); });
      show(tF, on); show(tO, on && !same); show(mLab, on, { delay: B === 1 ? 900 : 0 });
      if (on) { tw(tF, { tx: bx(tr.firm / SIG) }, o); tw(tO, { tx: bx(tr.obs / SIG) }, o); const left = m > .3; mLab.setAttribute('text-anchor', left ? 'end' : 'start'); tw(mLab, { tx: bx(m) + (left ? -46 : 46) }, o);
        tFt.textContent = same ? '참 ATT ' + sg(tr.firm / SIG) : '기업평균 ATT ' + sg(tr.firm / SIG); tOt.textContent = '관측치평균 ' + sg(tr.obs / SIG);
        mLab.textContent = 'TWFE 평균 ' + sg(m); mLab.setAttribute('class', 'lbb' + (m < 0 ? ' fb' : '')); }
    };
  });

  /* ---------- 8. 여섯 개 2x2의 추정치와 참값 ---------- */
  viz('diag', (host, W, Hh) => {
    const v = svg(host, W, Hh), M = SIM.get(), SIG = M.SIG, coh = M.DES.B.coh, yy = ['89', '98', '07'];
    const x = lin(0, .25, 96, 800), y = lin(-.8, .62, 400, 44);
    VZ.yAxis(v, y, [-.6, -.4, -.2, 0, .2, .4, .6], 96, 800, n => n === 0 ? '0' : fmt(n, 1) + 'σ');
    VZ.xAxis(v, x, [0, .05, .1, .15, .2, .25], 400, n => n === 0 ? '0' : fmt(n, 2), { x0: 96, x1: 800 });
    S('text', { x: 800, y: 452, 'text-anchor': 'end', cls: 'lbs', text: '가로: TWFE가 부여한 가중치,  세로: 2×2의 DID' }, v);
    const title = S('text', { x: 800, y: 26, 'text-anchor': 'end', cls: 'ttl', text: '' }, v);
    const calc = sim => { const eff = M.effY(sim), b = ST.bacon(M.groupsOf('B', eff), M.T);
      return { delta: b.delta, parts: b.parts.map(p => { const g = coh[p.treat] - 1980; let s = 0, n = 0; for (let t = Math.max(p.split, 0); t < p.win[1]; t++) { s += eff[p.treat][t]; n++; } return { ...p, tru: s / n }; }) }; };
    const D = { 4: calc(4), 5: calc(5), 6: calc(6) };
    const tri = (cx, cy, r) => [[cx, cy - r], [cx + r * .92, cy + r * .72], [cx - r * .92, cy + r * .72]];
    const marks = D[4].parts.map((p, i) => {
      const badp = p.type === 'LvE', col = badp ? C.bad : C.ink, g = S('g', { o: 0 }, v);
      const arrow = S('line', { x1: 0, x2: 0, y1: 0, y2: 0, stroke: col, 'stroke-width': 2, 'stroke-dasharray': '3 4', tx: x(p.w) }, g);
      const hollow = badp ? S('path', { pts: tri(0, 0, 10), close: true, fill: '#fff', stroke: col, 'stroke-width': 2.5, tx: x(p.w), ty: y(0) }, g) : S('circle', { cx: 0, cy: 0, r: 8.5, fill: '#fff', stroke: col, 'stroke-width': 2.5, tx: x(p.w), ty: y(0) }, g);
      const solid = badp ? S('path', { pts: tri(0, 0, 10), close: true, fill: col, tx: x(p.w), ty: y(0) }, g) : S('circle', { cx: 0, cy: 0, r: 8.5, fill: col, tx: x(p.w), ty: y(0) }, g);
      const lab = S('text', { x: 0, y: badp ? 31 : -17, 'text-anchor': 'middle', cls: 'lb' + (badp ? ' fb' : ''), text: `'${yy[p.treat]} 대 '${yy[p.ctrl]}`, tx: x(p.w), ty: y(0) }, g);
      return { g, arrow, hollow, solid, lab, badp };
    });
    // 범례
    const lg = S('g', {}, v); S('circle', { cx: 104, cy: 20, r: 7, fill: C.ink }, lg); S('text', { x: 118, y: 26, cls: 'lbs', text: '먼저 도입 대 아직 미처치' }, lg);
    S('path', { pts: tri(332, 21, 8.5), close: true, fill: C.bad }, lg); S('text', { x: 346, y: 26, cls: 'lbs', text: '나중 도입 대 이미 처치' }, lg);
    S('circle', { cx: 546, cy: 20, r: 6.5, fill: '#fff', stroke: C.muted, 'stroke-width': 2 }, lg); S('text', { x: 560, y: 26, cls: 'lbs', text: '참 ATT' }, lg);
    // 수치 줄
    const ro = [['TWFE (면적의 합)', 96], ['기업평균 ATT', 390], ['세모 셋의 가중치 합', 640]].map(([t, xx]) => { const g = S('g', { o: 0 }, v); S('text', { x: xx, y: 484, cls: 'lbs', text: t }, g); const n = S('text', { x: xx, y: 518, cls: 'big', text: '' }, g); return { g, n }; });
    // 아래: 가장 나쁜 2x2 (2007년 코호트 대 1989년 코호트)
    const bg = S('g', { o: 0 }, v), bx = lin(1989, 2015, 96, 760), by = lin(0, 1.4, 758, 592), e6 = M.effY(6);
    S('rect', { x: bx(2006.5), y: 588, width: bx(2015) - bx(2006.5) + 10, height: 172, fill: C.soft }, bg);
    [0, .5, 1].forEach(n => { S('line', { x1: 96, x2: 770, y1: by(n), y2: by(n), cls: n === 0 ? 'axis' : 'grid' }, bg); if (n) S('text', { x: 86, y: by(n) + 5.5, 'text-anchor': 'end', cls: 'ax', text: fmt(n, 1) + 'σ' }, bg); });
    [1989, 1998, 2007, 2015].forEach(n => S('text', { x: bx(n), y: 782, 'text-anchor': 'middle', cls: 'ax', text: n }, bg));
    const seg = k => { const out = []; for (let t = 9; t < 36; t++) out.push([bx(1980 + t), by(e6[k][t] / SIG)]); return out; };
    S('path', { pts: seg(0), stroke: C.c1, 'stroke-width': 4, fill: 'none' }, bg); S('path', { pts: seg(2), stroke: C.c3, 'stroke-width': 4, fill: 'none' }, bg);
    S('text', { x: 96, y: 578, cls: 'ttl fb', text: "'07 대 '89  (1989-2015년)" }, bg);
    S('text', { x: bx(2002), y: by(.92), 'text-anchor': 'end', cls: 'lb f1', text: '비교집단 변화 +0.68σ' }, bg); S('text', { x: bx(2006), y: by(.12), 'text-anchor': 'end', cls: 'lb f3', text: '처치집단 변화 +0.05σ' }, bg);
    S('text', { x: 778, y: by(.62), cls: 'lbb fb', text: '0.05 − 0.68' }, bg); S('text', { x: 778, y: by(.62) + 28, cls: 'lbb fb', text: '= −0.63σ' }, bg);
    S('text', { x: bx(2011), y: 610, 'text-anchor': 'middle', cls: 'lbs', text: '도입 후' }, bg);
    return B => {
      const sim = B <= 1 ? 4 : B === 2 ? 5 : 6, d = D[sim], o = { dur: 900 };
      title.textContent = `Sim ${sim}`;
      marks.forEach((m, i) => { const p = d.parts[i], ye = y(p.est / SIG), yt = y(p.tru / SIG);
        show(m.g, B >= 1, { delay: B === 1 ? i * 90 : 0 }); tw(m.solid, { ty: ye }, o); tw(m.hollow, { ty: yt }, o); tw(m.arrow, { y1: yt, y2: ye }, o); tw(m.lab, { ty: ye }, o); });
      const tr = M.truth[sim].firm / SIG, ws = d.parts.filter(p => p.type === 'LvE').reduce((a, p) => a + p.w, 0);
      ro.forEach((r, i) => show(r.g, B >= 1, { delay: B === 1 ? 600 : 0 }));
      ro[0].n.textContent = sg(d.delta / SIG); ro[0].n.setAttribute('class', 'big' + (d.delta < 0 ? ' fb' : '')); ro[1].n.textContent = sg(tr); ro[2].n.textContent = fmt(ws, 2);
      show(bg, B >= 4);
    };
  });

  /* ---------- 9. 기대 ATT = 0인데 유의한 t값 ---------- */
  viz('type1', (host, W, Hh) => {
    const v = svg(host, W, Hh), M = SIM.get(), N = M.NSIM;
    const x = lin(-22, 22, 70, 840), y0 = 352;
    const band = S('rect', { x: x(-1.96), y: 96, width: x(1.96) - x(-1.96), height: y0 - 90, fill: C.soft }, v);
    S('line', { x1: 70, x2: 840, y1: y0 + 6, y2: y0 + 6, cls: 'axis' }, v);
    [-20, -10, 0, 10, 20].forEach(n => { S('line', { x1: x(n), x2: x(n), y1: y0 + 6, y2: y0 + 12, cls: 'axis' }, v); S('text', { x: x(n), y: y0 + 32, 'text-anchor': 'middle', cls: 'ax', text: String(n).replace('-', '−') }, v); });
    S('text', { x: 840, y: y0 + 58, 'text-anchor': 'end', cls: 'lbs', text: 't값 (주 단위 군집 표준오차). 22를 넘는 값은 양 끝에 표시' }, v);
    S('text', { x: x(1.96) + 12, y: 116, cls: 'lbs', text: '띠 안이 |t| < 1.96' }, v);
    const dots = []; for (let i = 0; i < N; i++) dots.push(S('circle', { cx: x(0), cy: y0, r: 2.9, fill: C.ink, o: 0 }, v));
    const big = S('text', { x: 70, y: 56, cls: 'big', text: '' }, v), sub = S('text', { x: 70, y: 84, cls: 'lbs', text: '' }, v);
    const hT = S('text', { x: 840, y: 56, 'text-anchor': 'end', cls: 'ttl', text: '' }, v);
    // 아래: 이질성에 따른 비유의 비율
    const HS = []; for (let i = 0; i <= 40; i++) HS.push(i * .0025);
    const ins = HS.map(h => M.insig(h)), cx = lin(0, .1, 96, 820), cy = lin(0, 1, 742, 482), g2 = S('g', { o: 0 }, v);
    [0, .25, .5, .75, 1].forEach(n => { S('line', { x1: 96, x2: 820, y1: cy(n), y2: cy(n), cls: n === 0 ? 'axis' : 'grid' }, g2); S('text', { x: 86, y: cy(n) + 5.5, 'text-anchor': 'end', cls: 'ax', text: Math.round(n * 100) + '%' }, g2); });
    [0, .025, .05, .075, .1].forEach(n => S('text', { x: cx(n), y: 768, 'text-anchor': 'middle', cls: 'ax', text: (n * 100).toFixed(1).replace('.0', '') + '%' }, g2));
    S('line', { x1: 96, x2: 820, y1: cy(.95), y2: cy(.95), stroke: C.bad, 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }, g2); S('text', { x: 820, y: cy(.95) - 9, 'text-anchor': 'end', cls: 'lbs fb', text: '설계상 95%' }, g2);
    S('text', { x: 96, y: 462, cls: 'ttl', text: '유의하지 않은 모의자료의 비율' }, g2); S('text', { x: 820, y: 790, 'text-anchor': 'end', cls: 'lbs', text: '코호트별 증가 속도의 표준편차 (σ 대비)' }, g2);
    const clip = S('clipPath', { id: 'cl-type1' }, v), cr = S('rect', { x: 90, y: 470, width: 0, height: 290 }, clip);
    S('path', { pts: HS.map((h, i) => [cx(h), cy(ins[i])]), stroke: C.ink, 'stroke-width': 3.5, fill: 'none', 'stroke-linejoin': 'round', 'clip-path': 'url(#cl-type1)' }, g2);
    const mk = S('circle', { cx: 0, cy: 0, r: 8, fill: C.ink, stroke: '#fff', 'stroke-width': 2.5, tx: cx(0), ty: cy(ins[0]) }, g2);
    const HB = [0, 0, .01, .03, .1];
    return B => {
      const st = Math.max(0, Math.min(4, B)), h = HB[st], idx = Math.round(h / .0025), t = M.tstats(h), o = { dur: 1000 };
      const tc = Array.from(t, z => Math.max(-22, Math.min(22, z))); let mx = 1; { const c = new Map(); tc.forEach(z => { const b = Math.round(x(z) / 7); c.set(b, (c.get(b) || 0) + 1); mx = Math.max(mx, c.get(b)); }); }
      const pos = VZ.dotStack(tc, x, 7, y0, Math.min(6.2, 232 / mx), 70, 840);
      dots.forEach((d, i) => { const sig = Math.abs(t[i]) >= 1.96; tw(d, { o: B >= 1 ? (sig ? .8 : .5) : 0 }, { dur: 300, delay: B === 1 ? i * 2 : 0 }); tw(d, { cx: pos[i][0], cy: pos[i][1], fill: sig ? C.bad : C.ink }, { dur: 1000, delay: (i % 20) * 9 }); });
      const p = ins[idx]; big.textContent = B >= 1 ? `유의하지 않은 모의자료 ${Math.round(p * 100)}%` : '';
      sub.textContent = B >= 1 ? `기대 ATT는 0인데 ${Math.round((1 - p) * 100)}%가 5% 수준에서 유의` : ''; sub.setAttribute('class', 'lbs' + (p < .9 ? ' fb' : ''));
      hT.textContent = B >= 1 ? `증가 속도의 표준편차 = σ의 ${(h * 100).toFixed(0)}%` : '';
      show(g2, B >= 1, { delay: B === 1 ? 500 : 0 }); tw(cr, { width: cx(h) - 90 + 4 }, o); tw(mk, { tx: cx(h), ty: cy(p) }, o);
    };
  });
})();
