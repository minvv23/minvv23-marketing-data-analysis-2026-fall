/* 독해가이드 계산기와 읽음 표시. 계산은 덱의 stats.js(window.ST)를 그대로 쓴다. */
(function () {
  'use strict';
  const ST = window.ST, I = Infinity;
  const f = (x, d = 2) => (Math.abs(x) < 1e-9 ? 0 : x).toFixed(d).replace(/^-/, '−');
  const frac = x => {
    const c = [[1, '1'], [0.5, '1/2'], [0.25, '1/4'], [0.375, '3/8'], [0.125, '1/8'], [1 / 3, '1/3'], [2 / 3, '2/3'], [1 / 6, '1/6']];
    for (const [v, s] of c) { if (Math.abs(Math.abs(x) - v) < 1e-9) return (x < 0 ? '−' : '') + s; }
    return f(x, 3);
  };
  const NS = 'http://www.w3.org/2000/svg';
  function S(tag, a, p) { const e = document.createElementNS(NS, tag); for (const k in a) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } if (p) p.appendChild(e); return e; }
  function seg(label, opts, cur, on) {
    const w = document.createElement('div'); w.className = 'ctrl-seg';
    w.innerHTML = `<span class="seg-l">${label}</span><span class="seg" role="group" aria-label="${label}"></span>`;
    const g = w.querySelector('.seg');
    opts.forEach(([v, t]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.setAttribute('aria-pressed', String(v === cur)); b.onclick = () => { g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); on(v); }; g.appendChild(b); });
    return w;
  }

  // 2×2 DID를 네 평균으로 적는다: (처치집단 사후 − 사전) − (비교집단 사후 − 사전). 창과 나누는 시점은 비교 유형으로 정해진다.
  function didParts(groups, p, T) {
    const tg = groups[p.treat], cg = groups[p.ctrl], m = (y, a, b) => { let s = 0; for (let t = a; t < b; t++) s += y[t]; return s / (b - a); };
    const lo = p.type === 'LvE' ? cg.g : 0, hi = p.type === 'EvL' ? cg.g : T, k = tg.g;
    return { tPost: m(tg.y, k, hi), tPre: m(tg.y, lo, k), cPost: m(cg.y, k, hi), cPre: m(cg.y, lo, k) };
  }
  const didTxt = (q, fm) => `(${fm(q.tPost)} − ${fm(q.tPre)}) − (${fm(q.cPost)} − ${fm(q.cPre)})`;

  /* ---------- E와 L 반례 ---------- */
  function toyEL(host) {
    const st = { e2: 2, e3: 10, l3: 2 };
    host.innerHTML = `<p class="wt">계산기</p><p class="wh">E는 2기, L은 3기에 도입하는 세 시점 반례 (가상 수치)</p>
      <div class="presets"></div><div class="ctrls"></div>
      <div class="wout"><svg class="wsvg" viewBox="0 0 330 210" role="img" aria-label="E와 L의 결과 경로"></svg><div class="res"></div></div>
      <div class="tbl"><table><thead><tr><th>비교</th><th>사용 기간</th><th class="n">처치집단 변화</th><th class="n">비교집단 변화</th><th class="n">DID</th><th class="n">가중치</th></tr></thead><tbody></tbody></table></div>
      <p class="wnote">미처치 잠재결과를 모든 칸에서 0으로 설정했으므로 평행추세 가정은 정확히 성립하며 선의 높이가 곧 그 칸의 처치효과다. 계수는 stats.js의 TWFE 계산(이중 평균제거 후 OLS)으로 구한 값이다.</p>`;
    const P = host.querySelector('.presets');
    [['덱 6장 예제 (2, 10, 2)', [2, 10, 2]], ['효과가 일정 (2, 2, 2)', [2, 2, 2]], ['코호트별로 다르지만 일정 (4, 4, 2)', [4, 4, 2]], ['E의 효과가 감소 (10, 2, 2)', [10, 2, 2]]].forEach(([t, v]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = t;
      b.onclick = () => { [st.e2, st.e3, st.l3] = v; sync(); draw(); }; P.appendChild(b);
    });
    const C = host.querySelector('.ctrls'), inputs = {};
    [['e2', 'E의 2기 효과'], ['e3', 'E의 3기 효과'], ['l3', 'L의 3기 효과']].forEach(([k, t]) => {
      const d = document.createElement('div'); d.className = 'ctrl';
      d.innerHTML = `<label for="toy-${k}">${t} <output id="toy-${k}-o"></output></label><input type="range" id="toy-${k}" min="-4" max="14" step="1">`;
      C.appendChild(d); const inp = d.querySelector('input'); inputs[k] = inp;
      inp.oninput = () => { st[k] = +inp.value; draw(); };
    });
    function sync() { for (const k in inputs) inputs[k].value = st[k]; }
    const svg = host.querySelector('svg'), res = host.querySelector('.res'), tb = host.querySelector('tbody');
    function draw() {
      for (const k in inputs) host.querySelector(`#toy-${k}-o`).textContent = f(st[k], 0);
      const groups = [{ n: 1, g: 1, y: [0, st.e2, st.e3] }, { n: 1, g: 2, y: [0, 0, st.l3] }];
      const tw = ST.twfe(groups, 3), bc = ST.bacon(groups, 3);
      const d1 = st.e2, d2 = st.l3 - (st.e3 - st.e2), mean = (st.e2 + st.e3 + st.l3) / 3;
      const w = tw.cellw;
      // 그림
      svg.innerHTML = '';
      const X = t => 60 + t * 110, lo = -4, hi = 14, Y = v => 180 - (v - lo) / (hi - lo) * 160;
      [-4, 0, 4, 8, 12].forEach(v => { S('line', { x1: 40, x2: 300, y1: Y(v), y2: Y(v), class: v === 0 ? 'zero' : 'ax' }, svg); S('text', { x: 32, y: Y(v) + 4, 'text-anchor': 'end', text: String(v).replace('-', '−') }, svg); });
      [0, 1, 2].forEach(t => S('text', { x: X(t), y: 202, 'text-anchor': 'middle', text: (t + 1) + '기' }, svg));
      const line = (y, g, col, name) => {
        S('polyline', { points: y.map((v, t) => `${X(t)},${Y(v)}`).join(' '), fill: 'none', style: `stroke:${col};stroke-width:3;stroke-linejoin:round` }, svg);
        y.forEach((v, t) => S('circle', { cx: X(t), cy: Y(v), r: 5, style: t >= g ? `fill:${col};stroke:${col}` : `fill:var(--bg);stroke:${col};stroke-width:2` }, svg));
        S('text', { x: X(2) + 12, y: Y(y[2]) + 4, style: `fill:${col};font-weight:700`, text: name }, svg);
      };
      line([0, st.e2, st.e3], 1, 'var(--c1)', 'E'); line([0, 0, st.l3], 2, 'var(--c2)', 'L');
      if (st.e3 === st.l3) { /* 이름 겹침 방지 */ svg.lastChild.setAttribute('y', Y(st.l3) + 18); }
      S('line', { x1: 40, x2: 300, y1: Y(tw.delta), y2: Y(tw.delta), style: `stroke:${tw.delta < 0 ? 'var(--bad)' : 'var(--ink)'};stroke-width:1.5;stroke-dasharray:5 4` }, svg);
      S('text', { x: 44, y: Y(tw.delta) + 15, style: `fill:${tw.delta < 0 ? 'var(--bad)' : 'var(--ink)'};font-weight:600`, text: 'TWFE 계수 ' + f(tw.delta) }, svg);
      const allPos = st.e2 > 0 && st.e3 > 0 && st.l3 > 0, flip = allPos && tw.delta < 0;
      res.innerHTML = `<div class="lbl">TWFE 계수 δ</div><div class="big${tw.delta < 0 ? ' neg' : ''}">${f(tw.delta)}</div>
        <div class="eq">= ½ × ${f(d1, 0)} + ½ × (${f(d2, 0)})</div>
        <div class="lbl">처치된 세 칸의 평균효과</div><div class="big" style="font-size:1.25rem">${f(mean)}</div>
        <div class="lbl">칸별 가중치로 다시 쓰면</div>
        <div class="eq">δ = ${frac(w[0][1])} × ${f(st.e2, 0)} ${w[0][2] < 0 ? '−' : '+'} ${frac(Math.abs(w[0][2]))} × ${f(st.e3, 0)} + ${frac(w[1][2])} × ${f(st.l3, 0)}</div>
        ${flip ? '<div class="lbl" style="color:var(--bad)">세 효과가 모두 양수인데 계수는 음수다.</div>' : ''}`;
      const ord = ['EvL', 'LvE'];
      const parts = ord.map(t => bc.parts.find(p => p.type === t));
      tb.innerHTML = `<tr><td>① E 대 L <span class="tag ok">L 아직 미처치</span></td><td>1-2기</td><td class="n">${f(st.e2, 0)}</td><td class="n">0</td><td class="n">${f(parts[0].est, 0)}</td><td class="n">${frac(parts[0].w)}</td></tr>
        <tr><td>② L 대 E <span class="tag bad">E 이미 처치</span></td><td>2-3기</td><td class="n">${f(st.l3, 0)}</td><td class="n">${f(st.e3 - st.e2, 0)}</td><td class="n${parts[1].est < 0 ? ' neg' : ''}">${f(parts[1].est, 0)}</td><td class="n">${frac(parts[1].w)}</td></tr>`;
    }
    sync(); draw();
  }

  /* ---------- U, k, l 분해 ---------- */
  function baconUKL(host) {
    const st = { nU: 1, shape: 'grow' };
    const Ys = { grow: { U: [0, 0, 0, 0, 0], k: [0, 1, 3, 5, 7], l: [0, 0, 0, 1, 3] }, flat: { U: [0, 0, 0, 0, 0], k: [0, 4, 4, 4, 4], l: [0, 0, 0, 2, 2] } };
    host.innerHTML = `<p class="wt">계산기</p><p class="wh">TWFE 계수를 네 개의 2×2로 나누기 (U 미처치, k 2기 도입, l 4기 도입, 가상 수치)</p>
      <div class="ctrls"></div>
      <div class="wout"><svg class="wsvg" viewBox="0 0 340 230" role="img" aria-label="2×2 비교의 가중치와 DID"></svg><div class="res"></div></div>
      <div class="tbl"><table><thead><tr><th>2×2 비교</th><th>사용 기간</th><th class="n">가중치</th><th class="n">DID = (처치 사후 − 사전) − (비교 사후 − 사전)</th><th class="n">처치집단의 참효과</th><th class="n">가중치 × DID</th></tr></thead><tbody></tbody></table></div>
      <p class="wnote">그림의 막대 하나가 2×2 하나다. 가로 폭이 가중치, 세로 높이가 그 2×2의 DID이므로 막대 면적이 계수에 더해지는 기여분이며 면적을 부호대로 더한 값이 TWFE 계수다. "처치집단의 참효과"는 그 2×2에서 처치집단이 사후 구간에 실제로 받은 평균효과다. k와 l은 각각 1단위다.</p>`;
    const C = host.querySelector('.ctrls');
    C.appendChild(seg('U의 단위 수', [0, 1, 2, 4, 10].map(v => [v, String(v)]), st.nU, v => { st.nU = v; draw(); }));
    C.appendChild(seg('효과 형태', [['grow', '도입 후 1, 3, 5, 7로 증가 (덱 9장)'], ['flat', 'k는 4, l은 2로 일정 (덱 10장)']], st.shape, v => { st.shape = v; draw(); }));
    const svg = host.querySelector('svg'), res = host.querySelector('.res'), tb = host.querySelector('tbody');
    const name = { 0: 'U', 1: 'k', 2: 'l' };
    function draw() {
      const Y = Ys[st.shape];
      const all = [{ n: st.nU, g: I, y: Y.U }, { n: 1, g: 1, y: Y.k }, { n: 1, g: 3, y: Y.l }];
      const idx = [0, 1, 2].filter(i => all[i].n > 0), groups = idx.map(i => all[i]);
      const bc = ST.bacon(groups, 5);
      const nm = i => name[idx[i]];
      const mean = (y, a, b) => { let s = 0; for (let t = a; t < b; t++) s += y[t]; return s / (b - a); };
      const order = { TvU: 0, EvL: 1, LvE: 2 };
      const parts = bc.parts.slice().sort((a, b) => order[a.type] - order[b.type] || a.treat - b.treat).map(p => {
        const tg = groups[p.treat], post = p.type === 'EvL' ? [tg.g, groups[p.ctrl].g] : [tg.g, 5];
        return { ...p, tn: nm(p.treat), cn: nm(p.ctrl), att: mean(tg.y, post[0], post[1]) };
      });
      const vwatt = parts.reduce((a, p) => a + p.w * p.att, 0), dATT = vwatt - bc.delta;
      // 처치된 칸의 평균효과 (단위 수 가중)
      let s = 0, c = 0; [all[1], all[2]].forEach(g => { for (let t = g.g; t < 5; t++) { s += g.n * g.y[t]; c += g.n; } });
      const truth = s / c;
      // 그림: 면적 막대
      svg.innerHTML = '';
      const x0 = 40, W = 280, lo = -3, hi = 8, Yp = v => 200 - (v - lo) / (hi - lo) * 180;
      [-2, 0, 2, 4, 6, 8].forEach(v => { S('line', { x1: x0, x2: x0 + W, y1: Yp(v), y2: Yp(v), class: v === 0 ? 'zero' : 'ax' }, svg); S('text', { x: x0 - 8, y: Yp(v) + 4, 'text-anchor': 'end', text: String(v).replace('-', '−') }, svg); });
      S('text', { x: x0, y: 222, text: '가중치 0' }, svg); S('text', { x: x0 + W, y: 222, 'text-anchor': 'end', text: '1' }, svg);
      let cx = x0;
      parts.forEach(p => {
        const w = p.w * W, col = p.type === 'LvE' ? 'var(--bad)' : (p.tn === 'k' ? 'var(--c1)' : 'var(--c2)');
        const top = Math.min(Yp(0), Yp(p.est)), h = Math.abs(Yp(p.est) - Yp(0));
        S('rect', { x: cx + 1, y: top, width: Math.max(w - 2, 1), height: Math.max(h, 1), style: `fill:${col};opacity:.85` }, svg);
        if (w > 26) S('text', { x: cx + w / 2, y: p.est >= 0 ? top - 5 : top + h + 14, 'text-anchor': 'middle', style: 'fill:var(--ink);font-weight:600', text: `${p.tn} 대 ${p.cn}` }, svg);
        cx += w;
      });
      S('line', { x1: x0, x2: x0 + W, y1: Yp(bc.delta), y2: Yp(bc.delta), style: `stroke:${bc.delta < 0 ? 'var(--bad)' : 'var(--ink)'};stroke-width:1.5;stroke-dasharray:5 4` }, svg);
      S('text', { x: x0 + W, y: Yp(bc.delta) - 5, 'text-anchor': 'end', style: `fill:${bc.delta < 0 ? 'var(--bad)' : 'var(--ink)'};font-weight:600`, text: 'δ ' + f(bc.delta) }, svg);
      S('line', { x1: x0, x2: x0 + W, y1: Yp(truth), y2: Yp(truth), style: 'stroke:var(--c3);stroke-width:1.5;stroke-dasharray:2 3' }, svg);
      S('text', { x: x0 + W, y: Yp(truth) - 5, 'text-anchor': 'end', style: 'fill:var(--c3);font-weight:600', text: '참 평균 ' + f(truth) }, svg);
      res.innerHTML = `<div class="lbl">TWFE 계수 δ</div><div class="big${bc.delta < 0 ? ' neg' : ''}">${f(bc.delta)}</div>
        <div class="lbl">처치된 칸의 평균효과</div><div class="big" style="font-size:1.25rem;color:var(--c3)">${f(truth)}</div>
        <div class="lbl">분해식의 세 항</div>
        <div class="eq">δ = VWATT ${f(vwatt)} + VWCT 0 − ΔATT ${f(dATT)}</div>
        <div class="eq" style="color:var(--muted)">VWCT는 미처치 잠재결과를 모두 0으로 두어 평행추세가 성립하므로 0이다.</div>`;
      const typ = { TvU: '<span class="tag u">미처치와 비교</span>', EvL: '<span class="tag ok">아직 미처치와 비교</span>', LvE: '<span class="tag bad">이미 처치된 단위와 비교</span>' };
      const per = p => p.type === 'TvU' ? '1-5기' : p.type === 'EvL' ? `1-${groups[p.ctrl].g}기` : `${groups[p.ctrl].g + 1}-5기`;
      tb.innerHTML = parts.map(p => `<tr><td>${p.tn} 대 ${p.cn} ${typ[p.type]}</td><td>${per(p)}</td><td class="n">${frac(p.w)}</td><td class="n${p.est < 0 ? ' neg' : ''}">${f(p.est)}<span class="cx">${didTxt(didParts(groups, p, 5), x => f(x, Number.isInteger(x) ? 0 : 1))}</span></td><td class="n">${f(p.att)}</td><td class="n${p.est < 0 ? ' neg' : ''}">${f(p.w * p.est, 3)}</td></tr>`).join('')
        + `<tr><td><strong>합계</strong></td><td></td><td class="n">${f(bc.wsum, 2)}</td><td></td><td class="n">${f(vwatt)}</td><td class="n"><strong>${f(bc.sum, 3)}</strong></td></tr>`;
    }
    draw();
  }

  /* ---------- 시뮬레이션 1-6 (잡음 없는 기댓값) ---------- */
  function simW(host) {
    const st = { sim: 6 };
    const desc = {
      1: '1998년에 25개 주가 동시에 도입하고 25개 주는 끝까지 미처치다. 효과는 도입 후 0.5σ로 일정하다.',
      2: '도입 방식은 Sim 1과 같고 효과가 도입 후 매년 0.05σ씩 커진다.',
      3: '세 코호트(17, 18, 15개 주)가 1989, 1998, 2007년에 도입한다. 효과는 모두 0.5σ로 일정하다.',
      4: '도입 방식은 Sim 3과 같고 효과가 코호트별로 0.5σ, 0.3σ, 0.1σ로 다르지만 시간에 따라 변하지 않는다.',
      5: '도입 방식은 Sim 3과 같고 모든 코호트의 효과가 도입 후 매년 0.03σ씩 커진다.',
      6: '도입 방식은 Sim 3과 같고 효과가 커지는 속도가 코호트별로 매년 0.05σ, 0.03σ, 0.01σ로 다르다.'
    };
    host.innerHTML = `<p class="wt">계산기</p><p class="wh">원문 Sim 1-6을 잡음 없이 다시 계산하기 (σ 단위, 균형패널 단순화)</p>
      <div class="ctrls"></div><p class="sim-d" style="font-size:15px;margin:0 0 1rem"></p>
      <div class="wout"><svg class="wsvg" viewBox="0 0 340 220" role="img" aria-label="코호트별 처치효과 경로"></svg><div class="res"></div></div>
      <div class="tbl"><table><thead><tr><th>2×2 비교</th><th class="n">가중치</th><th class="n">DID = (처치 사후 − 사전) − (비교 사후 − 사전)</th><th class="n">처치집단의 참효과</th><th class="n">차이</th></tr></thead><tbody></tbody></table></div>
      <p class="wnote">각 코호트의 평균 경로만으로 계산한 기댓값이다. 원문은 Compustat 불균형 패널에 잡음을 넣은 모의자료 500개의 분포를 보여 주므로 원문 그림의 수치와 조금 다르다. 기업평균 ATT는 코호트별 사후 평균효과를 주 수로 가중한 값, 관측치평균 ATT는 사후 관측치 전체의 평균이다. "차이"가 0이 아닌 행이 편향의 출처다.</p>`;
    const C = host.querySelector('.ctrls');
    C.appendChild(seg('시뮬레이션', [1, 2, 3, 4, 5, 6].map(v => [v, 'Sim ' + v]), st.sim, v => { st.sim = v; draw(); }));
    const svg = host.querySelector('svg'), res = host.querySelector('.res'), tb = host.querySelector('tbody'), dd = host.querySelector('.sim-d');
    const colOf = { 1989: 'var(--c1)', 1998: 'var(--c2)', 2007: 'var(--c3)' };
    function draw() {
      const sim = st.sim, coh = ST.SIMS[sim].coh, ns = ST.NS(sim), T = ST.T, Y0 = ST.Y0, sg = ST.SIG;
      const groups = coh.map((g, i) => ({ n: ns[i], g: g === null ? I : g - Y0, y: ST.effPath(sim, g), yr: g }));
      const tw = ST.twfe(groups, T), bc = ST.bacon(groups, T), tr = ST.trueATT(sim, ns);
      dd.textContent = desc[sim];
      svg.innerHTML = '';
      const x0 = 36, W = 290, X = t => x0 + t / (T - 1) * W, hi = Math.max(0.6, ...groups.map(g => Math.max(...g.y) / sg)) * 1.08, Yp = v => 190 - v / hi * 170;
      const ticks = hi > 1.2 ? [0, 0.5, 1, 1.5] : [0, 0.25, 0.5];
      ticks.filter(v => v <= hi).forEach(v => { S('line', { x1: x0, x2: x0 + W, y1: Yp(v), y2: Yp(v), class: v === 0 ? 'zero' : 'ax' }, svg); S('text', { x: x0 - 6, y: Yp(v) + 4, 'text-anchor': 'end', text: v + 'σ' }, svg); });
      [1980, 1990, 2000, 2010].forEach(y => S('text', { x: X(y - Y0), y: 210, 'text-anchor': 'middle', text: String(y) }, svg));
      groups.forEach(g => {
        const col = g.yr === null ? 'var(--u)' : (coh.length === 2 ? 'var(--c1)' : colOf[g.yr]);
        S('polyline', { points: g.y.map((v, t) => `${X(t)},${Yp(v / sg)}`).join(' '), fill: 'none', style: `stroke:${col};stroke-width:2.5;stroke-linejoin:round` }, svg);
        const lab = g.yr === null ? '미처치' : String(g.yr);
        S('text', { x: Math.min(X(T - 1) - 2, x0 + W), y: Yp(g.y[T - 1] / sg) - 6, 'text-anchor': 'end', style: `fill:${col};font-weight:700`, text: lab }, svg);
      });
      const bias = tw.delta - tr.firm;
      res.innerHTML = `<div class="lbl">TWFE 계수 (기댓값)</div><div class="big${tw.delta < 0 ? ' neg' : ''}">${f(tw.delta / sg, 3)}σ</div>
        <div class="lbl">참 ATT</div><div class="eq">기업평균 ${f(tr.firm / sg, 3)}σ, 관측치평균 ${f(tr.obs / sg, 3)}σ</div>
        <div class="lbl">기업평균 ATT와의 차이</div><div class="eq${Math.abs(bias) > 1e-6 ? ' neg' : ''}">${f(bias / sg, 3)}σ</div>`;
      const lab = i => groups[i].yr === null ? '미처치' : groups[i].yr;
      const mean = (y, a, b) => { let s = 0; for (let t = a; t < b; t++) s += y[t]; return s / (b - a); };
      const typ = { TvU: '<span class="tag u">미처치와 비교</span>', EvL: '<span class="tag ok">아직 미처치와 비교</span>', LvE: '<span class="tag bad">이미 처치된 코호트와 비교</span>' };
      const order = { TvU: 0, EvL: 1, LvE: 2 };
      tb.innerHTML = bc.parts.slice().sort((a, b) => order[a.type] - order[b.type] || a.treat - b.treat).map(p => {
        const g = groups[p.treat], post = p.type === 'EvL' ? [g.g, groups[p.ctrl].g] : [g.g, T], att = mean(g.y, post[0], post[1]);
        const d = p.est - att;
        return `<tr><td>${lab(p.treat)} 대 ${lab(p.ctrl)} ${typ[p.type]}</td><td class="n">${f(p.w, 3)}</td><td class="n${p.est < 0 ? ' neg' : ''}">${f(p.est / sg, 3)}<span class="cx">${didTxt(didParts(groups, p, T), x => f(x / sg, 3))}</span></td><td class="n">${f(att / sg, 3)}</td><td class="n${Math.abs(d) > 1e-6 ? ' neg' : ''}">${f(d / sg, 3)}</td></tr>`;
      }).join('');
    }
    draw();
  }

  /* ---------- 4부 슬라이드 미리보기 (덱의 ?embed 모드를 iframe으로, 단계는 postMessage로 넘긴다) ---------- */
  const DECK = '../20261118-presentation.html';
  function slidePreview(host) {
    const n = +host.dataset.s;
    host.className = 'slidebox';
    host.innerHTML = `<div class="sbhead"><span class="sbt">덱 ${n}장 미리보기</span><button type="button" class="vb pri sbopen">슬라이드 불러오기</button></div>`;
    host.querySelector('.sbopen').onclick = () => {
      const head = host.querySelector('.sbhead');
      head.innerHTML = `<span class="sbt">덱 ${n}장, 단계를 넘기며 확인</span>`;
      const fr = document.createElement('div'); fr.className = 'sbframe';
      const ifr = document.createElement('iframe'); ifr.src = `${DECK}?embed#s${n}b0`; ifr.title = `덱 ${n}장`; ifr.loading = 'lazy';
      fr.appendChild(ifr); host.appendChild(fr);
      const send = k => { try { ifr.contentWindow.postMessage({ deck: 'cmd', k }, '*'); } catch (e) { } };
      const b = (t, k, pri) => { const x = document.createElement('button'); x.type = 'button'; x.className = 'vb' + (pri ? ' pri' : ''); x.textContent = t; x.onclick = () => k === 'first' ? (ifr.contentWindow.postMessage({ deck: 'go', s: n - 1, b: 0 }, '*')) : send(k); head.appendChild(x); };
      b('처음', 'first'); b('이전 단계', 'prev'); b('다음 단계', 'next', true);
      const a = document.createElement('a'); a.href = `${DECK}#s${n}b0`; a.target = '_blank'; a.rel = 'noopener'; a.className = 'deck'; a.textContent = '새 창'; head.appendChild(a);
    };
  }

  const W = { 'toy-el': toyEL, 'bacon-ukl': baconUKL, 'sim': simW, 'slide': slidePreview };
  const initW = h => { if (h.__done) return; h.__done = true; const name = h.dataset.w, fn = (window.GV && window.GV.R[name]) || W[name];
    if (!fn) { h.textContent = '도식 이름을 찾지 못했다: ' + name; return; }
    try { fn(h); } catch (e) { console.error(e); h.textContent = '도식을 불러오지 못했다: ' + e.message; } };
  const hosts = [...document.querySelectorAll('.widget[data-w]')];
  if ('IntersectionObserver' in window) {
    const wio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { wio.unobserve(e.target); initW(e.target); } }), { rootMargin: '600px 0px' });
    hosts.forEach(h => wio.observe(h));
  } else hosts.forEach(initW);
  window.__initAllWidgets = () => hosts.forEach(initW);

  /* ---------- 화면 테마: 자동(기기 설정), 밝게, 어둡게. 선택은 이 브라우저에만 기억한다 ---------- */
  const TKEY = 'sdid-guide-theme', root = document.documentElement;
  const curTheme = () => root.getAttribute('data-theme') || 'auto';
  function setTheme(t) {
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    try { if (t === 'auto') localStorage.removeItem(TKEY); else localStorage.setItem(TKEY, t); } catch (e) { }
    paintTheme(t);
  }
  // 처음에는 단추 표시만 맞춘다. 저장값을 다시 쓰지 않으므로 덱이 띄우는 도식 페이지(w.html, 항상 밝게)가 가이드의 선택을 덮어쓰지 않는다.
  function paintTheme(t) { document.querySelectorAll('.theme button[data-t]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === t))); }
  document.querySelectorAll('.theme button[data-t]').forEach(b => { b.onclick = () => setTheme(b.dataset.t); });
  paintTheme(curTheme());

  // 질문이 많은 절에는 모두 펼치기 버튼
  document.querySelectorAll('main section').forEach(sec => {
    const qs = sec.querySelectorAll(':scope>details.qa'); if (qs.length < 3) return;
    const bar = document.createElement('div'); bar.className = 'presets qa-tools';
    const mk = (t, open) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = () => qs.forEach(q => q.open = open); bar.appendChild(b); };
    mk('질문 모두 펼치기', true); mk('모두 접기', false);
    sec.insertBefore(bar, qs[0]);
  });

  // 현재 읽는 절을 목차에 표시
  const links = new Map(); document.querySelectorAll('.toc a[href^="#"]').forEach(a => links.set(a.getAttribute('href').slice(1), a));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { links.forEach(a => a.classList.remove('on')); const a = links.get(e.target.id); if (a) a.classList.add('on'); } });
    }, { rootMargin: '0px 0px -75% 0px' });
    document.querySelectorAll('main section[id]').forEach(s => io.observe(s));
  }
})();
