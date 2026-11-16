/* 3부 도식. GV(viz-kit.js)와 덱 계산 코어 ST(stats.js) 사용. */
(function () {
  'use strict';
  const { s, to, show, lin, C, stepper, count } = GV;
  const I = Infinity;
  const F = GV.fmt;
  const txt = (p, x, y, t, css, anchor) => s('text', { x, y, 'text-anchor': anchor || 'start', css: css || '', text: t }, p);
  const LAB = 'fill:var(--ink);font-weight:700;font-size:14px';
  const SUB = 'fill:var(--muted);font-size:12.5px';
  const VF = "font-family:KaTeX_Math,'Times New Roman',serif;font-style:italic;font-weight:400";
  const V = (n) => n.replace(/^([Ukl])(\d?)$/, (m, a, d) => `<tspan style="${VF}">${a}</tspan>${d ? `<tspan dy="4" font-size="0.75em">${d}</tspan>` : ''}`);
  const mtxt = (p, x, y, html, css, anchor) => s('text', { x, y, 'text-anchor': anchor || 'start', css: css || '', html }, p);

  /* ---------- cs-build (p3-cs): ATT(g,t)를 칸 하나씩 2×2로 구한다 ----------
     자료는 3부 본문의 손계산 표와 같다(가이드의 가상 수치: 수준 U 10, k 20, l 5와 공통 연도효과 0, 2, 3, 5, 6, 참효과 k 1, 3, 5, 7, l 1, 3). */
  GV.reg('cs-build', host => {
    const W = 660, H = 330, yr = [0, 2, 3, 5, 6];
    const G = {
      U: { g: I, lev: 10, eff: [0, 0, 0, 0, 0], col: 'u', sub: '미처치' },
      k: { g: 1, lev: 20, eff: [0, 1, 3, 5, 7], col: 'c1', sub: '2기 도입' },
      l: { g: 3, lev: 5, eff: [0, 0, 0, 1, 3], col: 'c2', sub: '4기 도입' }
    };
    const NM = ['U', 'k', 'l'];
    NM.forEach(n => { G[n].y = yr.map((v, t) => G[n].lev + v + G[n].eff[t]); });
    const groups = NM.map(n => ({ n: 1, g: G[n].g, y: G[n].y }));
    const x0 = 140, cw = 84, cwI = 76, chI = 50, rowY = { U: 52, k: 118, l: 184 };
    const cx = t => x0 + t * cw;
    let mode = 'nyt', api = null;
    const compOf = (gn, t) => {
      if (mode === 'never') return ['U'];
      if (mode === 'last') return (gn !== 'l' && t < G.l.g) ? ['l'] : [];
      return NM.filter(n => n !== gn && G[n].g > t);
    };
    const attOf = (gn, t, comp) => {
      const g = G[gn], b = g.g - 1, dT = g.y[t] - g.y[b];
      const dC = comp.reduce((a, c) => a + G[c].y[t] - G[c].y[b], 0) / comp.length;
      return { dT, dC, att: dT - dC, b };
    };
    // 단계: [주 칸, 함께 배지가 켜지는 칸]
    const PLAN = [null, [['k', 1]], [['k', 2]], [['k', 3], ['k', 4]], [['l', 3], ['l', 4]], 'forbid', 'agg'];
    const doneBy = st => { const out = []; for (let i = 1; i <= Math.min(st, 4); i++) PLAN[i].forEach(c => out.push(c)); if (st >= 5) out.push(...PLAN[4]); return out; };
    const NOTE = {
      nyt: '비교집단은 <strong>아직 미처치</strong>다. 그 시점까지 처치받지 않은 모든 단위(U 포함)를 사용한다.',
      never: '비교집단은 <strong>미처치</strong>다. 끝까지 처치받지 않는 U만 사용한다. 이 예제에서는 추정치가 같고 비교 단위만 줄어든다.',
      last: '비교집단은 <strong>마지막 처치 코호트 l</strong>이다. l이 도입하는 4기부터는 비교집단이 없어서 k의 4, 5기와 l의 칸은 추정하지 않는다.'
    };
    api = stepper(host, {
      kind: '도식', title: "Callaway-Sant'Anna의 ATT(g,t)를 칸 하나씩 구하기 (가상 수치, 덱 19장 예제)", w: W, h: H, controls: true,
      steps: [
        '세 집단을 다섯 시점 관측한 자료다. 색칠된 칸이 도입 후 칸이다. 3부 손계산과 같이 집단마다 다른 수준과 공통 연도효과를 더했으므로 칸의 값을 그대로 비교하면 효과를 알 수 없다.',
        'k의 2기 효과는 k의 1기와 2기(굵은 테두리)를 비교집단의 같은 두 칸(점선)과 비교한 2×2로 구한다. 기준은 도입 직전인 1기다. 아직 미처치 기준이면 2기까지 처치받지 않은 U와 l이 비교집단이다.',
        'k의 3기 효과도 기준은 그대로 1기이고 비교 시점만 3기로 옮긴다. 비교집단은 여전히 U와 l이다.',
        'k의 4기부터는 l이 처치를 받으므로 l이 비교집단에서 제외되고 U만 남는다. 같은 방식으로 5기의 7도 구한다.',
        'l의 칸은 도입 직전인 3기를 기준으로 구한다. 이미 처치된 k는 비교집단에서 제외하므로 U만 사용하고 추정치 1과 3은 참효과와 같다.',
        '만약 l의 4기를 이미 처치된 k와 비교했다면 k의 변화 4에 k의 효과 증가분 2가 섞여 추정치가 −1이 된다. TWFE가 포함하는 문제 소지 비교가 이 칸이다.',
        '칸을 모두 구한 다음에 평균하는 방식을 정한다. 같은 칸으로도 무엇을 평균하느냐에 따라 3.33, 3, 상대시점별 1, 3, 5, 7이 나온다. 아래에 계산을 적었다.'
      ],
      init(svg, Fr) {
        GV.seg(Fr.top, '비교집단', [['nyt', '아직 미처치'], ['never', '미처치'], ['last', '마지막 처치']], mode, v => { mode = v; if (api) api.go(api.step, true); });
        // 열 머리와 행 이름
        for (let t = 0; t < 5; t++) txt(svg, cx(t) + cwI / 2, 36, (t + 1) + '기', SUB + ';font-weight:600', 'middle');
        NM.forEach(n => { mtxt(svg, 20, rowY[n] + 24, V(n), `fill:var(--${G[n].col});font-size:20px`); txt(svg, 20, rowY[n] + 42, G[n].sub, SUB); });
        // 칸
        const cell = {}, badge = {};
        NM.forEach(n => { cell[n] = []; badge[n] = []; for (let t = 0; t < 5; t++) {
          const post = t >= G[n].g;
          s('rect', { x: cx(t), y: rowY[n], width: cwI, height: chI, rx: 3, css: `fill:${post ? `var(--${G[n].col}-soft)` : 'var(--bg)'};stroke:var(--line);stroke-width:1` }, svg);
          cell[n].push(txt(svg, cx(t) + cwI / 2, rowY[n] + 22, String(G[n].y[t]), 'fill:var(--ink);font-size:16px;font-weight:600', 'middle'));
          badge[n].push(s('text', { x: cx(t) + cwI / 2, y: rowY[n] + 41, 'text-anchor': 'middle', css: 'fill:var(--ink);font-size:12px;font-weight:700', text: '', opacity: 0 }, svg));
        } });
        // 테두리 (처치 코호트 2개, 비교집단 최대 4개)
        const fr = (dash) => s('rect', { x: cx(0), y: rowY.k, width: cwI, height: chI, rx: 3, 'stroke-width': 3, css: `fill:none;stroke:var(--ink)${dash ? ';stroke-dasharray:6 4' : ''}`, opacity: 0 }, svg);
        const trF = [fr(false), fr(false)], cmF = [fr(true), fr(true), fr(true), fr(true)];
        const ex = { U: null, k: null, l: null };
        NM.forEach(n => { ex[n] = s('g', { opacity: 0 }, svg); txt(ex[n], cx(5) - 2, rowY[n] + 22, '제외', 'fill:var(--bad);font-weight:700;font-size:13px'); ex[n].__t = txt(ex[n], cx(5) - 2, rowY[n] + 39, '이미 처치', 'fill:var(--bad);font-size:11.5px'); });
        const f1 = txt(svg, 20, 266, '', 'fill:var(--ink);font-size:15px;font-weight:700');
        const f2 = txt(svg, 20, 292, '', SUB);
        const moveFrame = (e, n, t, col, o) => { to(e, { x: cx(t), y: rowY[n] }, o); e.style.stroke = `var(--${col})`; show(e, true, o); };
        return (st, anim) => {
          const o = { dur: anim ? 550 : 0 };
          // 배지
          const est = new Map(ST.attgt(groups, 5, mode).map(c => [NM[c.k] + c.t, c.att]));
          const on = new Set(doneBy(st).map(([n, t]) => n + t));
          NM.forEach(n => badge[n].forEach((b, t) => {
            const key = n + t, has = est.has(key) && (on.has(key) || st >= 6);
            if (st === 5 && key === 'l3') { b.textContent = 'ATT −1'; b.style.fill = 'var(--bad)'; show(b, true, o); return; }
            b.style.fill = 'var(--ink)';
            if (has) b.textContent = 'ATT ' + F(est.get(key), 0);
            show(b, has, { dur: anim ? 400 : 0, delay: anim && PLAN[st] && PLAN[st] !== 'agg' && PLAN[st] !== 'forbid' && PLAN[st].some(([pn, pt]) => pn + pt === key) ? 450 : 0 });
          }));
          // 테두리와 식
          let cur = null, comp = [], forbid = st === 5;
          if (st >= 1 && st <= 4) { cur = PLAN[st][0]; comp = compOf(cur[0], cur[1]); }
          if (forbid) { cur = ['l', 3]; comp = ['k']; }
          if (cur) {
            const [gn, t] = cur, b = G[gn].g - 1;
            moveFrame(trF[0], gn, b, G[gn].col, o); moveFrame(trF[1], gn, t, G[gn].col, o);
            cmF.forEach((e, i) => { const c = comp[i >> 1]; if (!c) { show(e, false, o); return; } moveFrame(e, c, (i & 1) ? t : b, forbid ? 'bad' : 'ink', o); });
            NM.forEach(n => { const used = n === gn || comp.includes(n); const show_ = !used && n !== 'U'; ex[n].__t.textContent = G[n].g <= t ? '이미 처치' : '사용 안 함'; show(ex[n], show_ && !forbid, o); });
            if (!comp.length) { f1.innerHTML = `ATT(${V(gn)}, ${t + 1}기): 비교집단이 없어 추정하지 않는다`; f1.style.fill = 'var(--muted)'; f2.textContent = '현재 선택한 비교집단에는 이 시점에 처치받지 않은 단위가 없다.'; }
            else {
              const a = attOf(gn, t, comp), Yg = G[gn].y;
              const parts = comp.map(c => `(${G[c].y[t]} − ${G[c].y[b]})`);
              const cTxt = parts.length > 1 ? `평균[${parts.join(', ')}]` : parts[0];
              f1.innerHTML = `ATT(${V(gn)}, ${t + 1}기) = (${Yg[t]} − ${Yg[b]}) − ${cTxt} = ${F(a.dT, 0)} − ${F(a.dC, 0)} = ${F(a.att, 0)}`;
              f1.style.fill = forbid ? 'var(--bad)' : 'var(--ink)';
              f2.innerHTML = forbid ? `차감한 4 = 공통 연도효과 2 + ${V('k')}의 효과 증가분 2 (5 − 3). 처치 없이 일어난 변화로 볼 수 없다.`
                : `비교집단: ${comp.map(V).join(', ')}. 기준은 ${V(gn)}의 도입 직전인 ${b + 1}기.`;
            }
          } else {
            [...trF, ...cmF].forEach(e => show(e, false, o)); NM.forEach(n => show(ex[n], false, o));
            f1.style.fill = 'var(--ink)';
            f1.textContent = st === 0 ? '칸의 값 = 집단 수준 + 공통 연도효과 + 처치효과' : '추정한 칸을 평균하는 방식은 연구 질문에 따라 정한다';
            f2.textContent = st === 0 ? '예: k의 3기 26 = 20 + 3 + 3' : '';
          }
          // 결과 영역
          let html = NOTE[mode];
          if (st === 6) {
            const cells = ST.attgt(groups, 5, mode);
            if (cells.length) {
              const cellAvg = cells.reduce((a, c) => a + c.att, 0) / cells.length;
              const byC = new Map(); cells.forEach(c => { const o2 = byC.get(c.k) || { s: 0, n: 0 }; o2.s += c.att; o2.n++; byC.set(c.k, o2); });
              const cohAvg = [...byC.values()].reduce((a, o2) => a + o2.s / o2.n, 0) / byC.size;
              const ev = ST.aggEvent(cells).map(o2 => `ℓ = ${o2.l}: ${F(o2.att, 0)}`).join(', ');
              html += `<div class="tbl" style="margin:.6rem 0 0"><table><tbody><tr><td>칸 평균</td><td class="n">${F(cellAvg, 2)}</td><td>추정한 칸 ${cells.length}개의 단순평균</td></tr><tr><td>코호트 평균</td><td class="n">${F(cohAvg, 2)}</td><td>코호트별 사후 평균을 같은 비중으로 평균</td></tr><tr><td>상대시점별</td><td class="n">${ev}</td><td>도입 후 경과기간마다 평균</td></tr></tbody></table></div>`;
            }
          }
          Fr.out.innerHTML = html;
        };
      }
    });
  });

  /* ---------- stack-build (p3-stacked): 사건별 자료를 잘라 쌓는다 (덱 20장 예제) ---------- */
  GV.reg('stack-build', host => {
    const W = 660, H = 470;
    const UN = [
      { id: 'U', lab: 'U', col: 'u', g: I, eff: 0 }, { id: 'k', lab: 'k', col: 'c1', g: 1, eff: 2 },
      { id: 'l1', lab: 'l1', col: 'c2', g: 3, eff: 6 }, { id: 'l2', lab: 'l2', col: 'c2', g: 3, eff: 6 }, { id: 'l3', lab: 'l3', col: 'c2', g: 3, eff: 6 }];
    const Y = u => Array.from({ length: 5 }, (_, t) => t >= u.g ? u.eff : 0);
    const res = ST.stacked([{ n: 1, g: I, y: Y(UN[0]) }, { n: 1, g: 1, y: Y(UN[1]) }, { n: 3, g: 3, y: Y(UN[2]) }], 5, 1, 1);
    const wK = res.stacks[0].w, wL = res.stacks[1].w;
    // 왼쪽 원자료
    const lx = t => 64 + t * 46, ly = r => 62 + r * 34, CW = 42, CH = 28;
    // 오른쪽 쌓은 자료
    const rx = j => 406 + j * 42, CW2 = 38, CH2 = 24;
    const D1 = { rows: ['k', 'U', 'l1', 'l2', 'l3'], t0: 0, y0: 70 }, D2 = { rows: ['l1', 'l2', 'l3', 'U'], t0: 2, y0: 242 };
    const ry = (D, r) => D.y0 + r * 28;
    stepper(host, {
      kind: '도식', title: 'Stacked regression이 자료를 만드는 순서 (가상 수치, 덱 20장)', w: W, h: H,
      steps: [
        '원자료다. U 1단위, k 1단위, l 3단위이고 k는 2기에, l은 4기에 도입한다. 효과는 k가 항상 2, l이 항상 6이고 미처치 잠재결과는 0이다.',
        'k의 사건 자료를 분리한다. 사건창은 도입 1기 전부터 1기 후까지인 1-3기다. 이 기간에 처치받지 않은 U와 l 세 단위, 모두 네 단위가 비교집단이며 이 자료의 DID는 2다.',
        'l의 사건 자료는 3-5기다. k는 이미 처치되었으므로 비교집단에서 제외하고 U만 비교집단으로 둔다. 이 자료의 DID는 6이다. 두 자료 모두 문제 소지 비교가 없다.',
        '두 자료를 쌓고 자료마다 단위와 시점 고정효과를 따로 둔다. 시점은 도입 시점 기준 상대시점(−1, 0, +1)으로 맞춘다. 이 쌓은 자료에 TWFE를 추정한다.',
        `그런데 계수는 ${F(res.delta, 2)}로 처치 단위 평균 5와 다르다. OLS가 자료별 DID를 처치변수의 분산으로 가중해 k의 자료가 16/31, l의 자료가 15/31을 받기 때문이다. 처치 단위 비중은 1/4 대 3/4이다.`
      ],
      init(svg) {
        // 왼쪽 격자
        const L = s('g', {}, svg);
        txt(L, 20, 30, '원자료', LAB);
        for (let t = 0; t < 5; t++) txt(L, lx(t) + CW / 2, 52, (t + 1) + '기', SUB, 'middle');
        UN.forEach((u, r) => { mtxt(L, 20, ly(r) + 19, V(u.lab), `fill:var(--${u.col});font-size:16px`);
          for (let t = 0; t < 5; t++) { const post = t >= u.g; s('rect', { x: lx(t), y: ly(r), width: CW, height: CH, rx: 2, css: `fill:${post ? `var(--${u.col}-soft)` : 'var(--bg)'};stroke:var(--line)` }, L); txt(L, lx(t) + CW / 2, ly(r) + 19, String(Y(u)[t]), 'fill:var(--ink);font-size:13.5px', 'middle'); } });
        const win = s('rect', { x: lx(0) - 4, y: ly(0) - 4, width: 3 * 46 + 4, height: 5 * 34 + 2, rx: 4, 'stroke-width': 2.5, css: 'fill:none;stroke:var(--ink);stroke-dasharray:6 4', opacity: 0 }, svg);
        const kx = s('g', { opacity: 0 }, svg); s('rect', { x: lx(2) - 3, y: ly(1) - 3, width: 3 * 46 + 2, height: CH + 6, rx: 3, 'stroke-width': 2, css: 'fill:none;stroke:var(--bad)' }, kx); mtxt(kx, lx(2) + 3 * 46 + 6, ly(1) + 13, `${V('k')} 제외`, 'fill:var(--bad);font-weight:700;font-size:12.5px'); txt(kx, lx(2) + 3 * 46 + 6, ly(1) + 28, '이미 처치', 'fill:var(--bad);font-size:11.5px');
        // 날아가는 칸
        const fly = (D) => D.rows.map((id, r) => { const u = UN.find(q => q.id === id), rr = UN.indexOf(u);
          return [0, 1, 2].map(j => { const t = D.t0 + j, post = t >= u.g;
            const g = s('g', { tx: lx(t), ty: ly(rr), sc: 1, opacity: 0 }, svg);
            s('rect', { x: 0, y: 0, width: CW, height: CH, rx: 2, css: `fill:${post ? `var(--${u.col}-soft)` : 'var(--bg)'};stroke:var(--${u.col});stroke-width:1.2` }, g);
            txt(g, CW / 2, 19, String(Y(u)[t]), 'fill:var(--ink);font-size:13.5px', 'middle');
            return { g, from: [lx(t), ly(rr)], toP: [rx(j), ry(D, r)] }; }); }).flat();
        const F1 = fly(D1), F2 = fly(D2);
        const rowLab = (D) => D.rows.map((id, r) => { const u = UN.find(q => q.id === id); return mtxt(svg, 380, ry(D, r) + 17, V(u.lab), `fill:var(--${u.col});font-size:14px`, 'end'); });
        const RL1 = rowLab(D1), RL2 = rowLab(D2);
        RL1.concat(RL2).forEach(e => to(e, { opacity: 0 }, { dur: 0 }));
        const hdr = s('g', { opacity: 0 }, svg); ['−1', '0', '+1'].forEach((t, j) => txt(hdr, rx(j) + CW2 / 2, 62, t, SUB + ';font-weight:600', 'middle')); txt(hdr, rx(0), 44, '상대시점', SUB);
        const info = (D, title, sub, did) => { const g = s('g', { opacity: 0 }, svg), y0 = D.y0, h = D.rows.length * 28 - 4;
          s('path', { d: `M${rx(3) - 2},${y0}h6v${h}h-6`, css: 'fill:none;stroke:var(--muted);stroke-width:1.5' }, g);
          txt(g, rx(3) + 10, y0 + 14, title, LAB); mtxt(g, rx(3) + 10, y0 + 32, sub, SUB); const d = txt(g, rx(3) + 10, y0 + 54, did, 'fill:var(--ink);font-weight:800;font-size:14px'); return { g, d }; };
        const I1 = info(D1, '자료 1', `${V('k')}의 사건, 1-3기`, 'DID 2'), I2 = info(D2, '자료 2', `${V('l')}의 사건, 3-5기`, 'DID 6');
        const fe = s('g', { opacity: 0 }, svg); txt(fe, rx(3) + 10, D1.y0 + 76, '자료 1 고정효과', SUB); txt(fe, rx(3) + 10, D2.y0 + 76, '자료 2 고정효과', SUB);
        // 아래 막대
        const B = s('g', { opacity: 0 }, svg), bx = lin(0, 1, 170, 470);
        txt(B, 20, 394, 'OLS 가중치', LAB); txt(B, 20, 410, '(stacked)', SUB); txt(B, 20, 444, '처치 단위 비중', LAB);
        const seg2 = (y, a, la, lb) => { const r1 = s('rect', { x: bx(0), y, width: 0, height: 24, css: 'fill:var(--c1)' }, B), r2 = s('rect', { x: bx(0), y, width: 0, height: 24, css: 'fill:var(--c2)' }, B);
          const t1 = txt(B, bx(0) + 6, y + 17, la, 'fill:var(--bg);font-weight:700;font-size:12.5px'), t2 = txt(B, bx(1) - 6, y + 17, lb, 'fill:var(--bg);font-weight:700;font-size:12.5px', 'end'); return { r1, r2, a, t1, t2 }; };
        const S1 = seg2(380, wK, '16/31', '15/31'), S2 = seg2(426, 0.25, '1/4', '3/4');
        const rt = s('g', { opacity: 0 }, svg); txt(rt, 490, 397, `계수 ${F(res.delta, 2)}`, 'fill:var(--bad);font-weight:800;font-size:15px'); txt(rt, 490, 443, '평균 ATT 5', 'fill:var(--ink);font-weight:800;font-size:15px');
        return (st, anim) => {
          const o = { dur: anim ? 900 : 0 };
          show(win, st === 1 || st === 2, o);
          if (st >= 1) to(win, st === 1 ? { x: lx(0) - 4, y: ly(0) - 4, height: 5 * 34 + 2 } : { x: lx(2) - 4, y: ly(0) - 4, height: 5 * 34 + 2 }, o);
          show(kx, st === 2, o);
          const land = (Fs, on, delay) => Fs.forEach((c, i) => {
            if (on) { show(c.g, true, { dur: anim ? 200 : 0, delay: anim ? delay : 0 }); to(c.g, { tx: c.toP[0], ty: c.toP[1], sc: CW2 / CW }, { dur: anim ? 1000 : 0, delay: anim ? delay + 150 + i * 25 : 0 }); }
            else { to(c.g, { tx: c.from[0], ty: c.from[1], sc: 1 }, { dur: anim ? 500 : 0 }); show(c.g, false, { dur: anim ? 300 : 0 }); }
          });
          land(F1, st >= 1, st === 1 ? 300 : 0); land(F2, st >= 2, st === 2 ? 300 : 0);
          RL1.forEach(e => show(e, st >= 1, { dur: anim ? 300 : 0, delay: anim && st === 1 ? 1300 : 0 }));
          RL2.forEach(e => show(e, st >= 2, { dur: anim ? 300 : 0, delay: anim && st === 2 ? 1300 : 0 }));
          show(I1.g, st >= 1, { dur: anim ? 400 : 0, delay: anim && st === 1 ? 1500 : 0 }); show(I2.g, st >= 2, { dur: anim ? 400 : 0, delay: anim && st === 2 ? 1500 : 0 });
          show(hdr, st >= 3, o); show(fe, st >= 3, o);
          show(B, st >= 4, o); show(rt, st >= 4, { dur: anim ? 400 : 0, delay: anim && st === 4 ? 900 : 0 });
          [S1, S2].forEach(q => { const on = st >= 4, d = { dur: anim ? 900 : 0, delay: anim && st === 4 ? 200 : 0 };
            to(q.r1, { width: on ? bx(q.a) - bx(0) : 0 }, d); to(q.r2, { x: on ? bx(q.a) : bx(0), width: on ? bx(1) - bx(q.a) : 0 }, d); });
        };
      }
    });
  });

  /* ---------- est-compare (p3-compare): Sim 6에서 네 추정량의 상대시점별 경로 (잡음 없는 기댓값, 덱 21장 사양) ---------- */
  GV.reg('est-compare', host => {
    const W = 640, H = 356, T = ST.T, Y0 = ST.Y0, SIG = ST.SIG;
    const coh = [1989, 1998, 2007], nst = [17, 18, 15];
    const P = coh.map(g => ST.effPath(6, g));
    const GR = y => coh.map((g, k) => ({ n: nst[k], g: g - Y0, y: y[k] }));
    const EV_COL = l => l < -5 ? 0 : l === -1 ? -1 : l <= -2 ? l + 6 : l <= 5 ? l + 5 : 11;
    const b = ST.eventDesign(GR(coh.map(() => new Array(T).fill(0))), T, 12, EV_COL).fit(P);
    const L = []; for (let l = -5; l <= 5; l++) L.push(l);
    const tw = L.map(l => l === -1 ? 0 : b[EV_COL(l)] / SIG);
    const tr = L.map(l => { let s0 = 0, n = 0; [0, 1].forEach(k => { const t = coh[k] - Y0 + l; s0 += nst[k] * P[k][t]; n += nst[k]; }); return s0 / n / SIG; });
    const ev = mode => ST.aggEvent(ST.attgt(GR(P), T, mode).filter(c => c.l <= 5)).map(o => [o.l, o.att / SIG]);
    const cs = ev('nyt'), sa = ev('last');
    const stE = ST.stackedEvent(GR(P), T, 5, 5).map(o => [o.l, o.est / SIG]);
    const x = lin(-5, 5, 80, 600), y = lin(-0.1, 0.28, 300, 52);
    stepper(host, {
      kind: '그래프', title: 'Sim 6에서 네 추정량의 사건연구 경로 (σ 단위, 잡음 없는 기댓값)', w: W, h: H,
      steps: [
        '점선은 1989년과 1998년 코호트의 상대시점별 참 평균효과다. Sim 6은 효과가 코호트별로 매년 0.05σ, 0.03σ, 0.01σ씩 커지는 설정이고 2007년 코호트는 비교할 미처치 단위가 없어 기준에서 빠진다.',
        'TWFE 사건연구(붉은 선)는 참 경로와 어긋나고 도입 4-5년 뒤에는 음수가 된다. 도입 전 계수도 0에서 벗어난다. 이미 처치된 코호트가 비교집단에 포함되기 때문이다.',
        "Callaway-Sant'Anna(채운 원)는 아직 미처치인 코호트와만 비교하므로 참 경로와 겹친다.",
        'Sun-Abraham(빈 원)은 2007년 코호트를 비교집단으로 두고 2007년 이전 자료만 사용한다. 이 예제에서는 CS와 같은 값이다.',
        'Stacked(마름모)는 도입 전후 5년 창으로 추정했다. 경로를 복원하지만 상대시점마다 조금 크다. 표본비중 대신 OLS의 분산 가중을 사용하기 때문이다.'
      ],
      init(svg) {
        const g0 = s('g', {}, svg);
        GV.yAxis(g0, y, [-0.1, 0, 0.1, 0.2], 80, 600, v => (v === 0 ? '0' : F(v, 1)) + 'σ');
        GV.xTicks(g0, x, L, 322);
        txt(g0, 600, 350, '도입 시점 기준 상대시점 (년)', SUB, 'end');
        s('line', { x1: x(-0.5), x2: x(-0.5), y1: 46, y2: 304, 'stroke-width': 1.2, css: 'stroke:var(--faint);stroke-dasharray:4 4' }, g0);
        const truth = s('polyline', { pts: L.map((l, i) => [x(l), y(tr[i])]), 'stroke-width': 3, css: 'fill:none;stroke:var(--ink);stroke-dasharray:9 6' }, svg);
        const series = (pts, col, mk) => { const g = s('g', { opacity: 0 }, svg);
          s('polyline', { pts: pts.map(([l, v]) => [x(l), y(v)]), 'stroke-width': 2, css: `fill:none;stroke:${col}` }, g);
          pts.forEach(([l, v]) => { const X = x(l), Y = y(v);
            if (mk === 'dot') s('circle', { cx: X, cy: Y, r: 5.5, css: `fill:${col}` }, g);
            else if (mk === 'ring') s('circle', { cx: X, cy: Y, r: 9, css: `fill:none;stroke:${col};stroke-width:2` }, g);
            else s('rect', { x: X - 5, y: Y - 5, width: 10, height: 10, css: `fill:${col}`, transform: `rotate(45 ${X} ${Y})` }, g); });
          return g; };
        const S = [series(L.map((l, i) => [l, tw[i]]), C('bad'), 'dot'), series(cs, C('ink'), 'dot'), series(sa, C('ink'), 'ring'), series(stE, C('c1'), 'dia')];
        // 범례
        const lg = [];
        const leg = (xx, label, draw) => { const g = s('g', { opacity: 0 }, svg); draw(g, xx); txt(g, xx + 22, 22, label, SUB + ';font-weight:600'); lg.push(g); return g; };
        const LT = leg(80, '참 경로', (g, xx) => s('line', { x1: xx, x2: xx + 16, y1: 18, y2: 18, 'stroke-width': 3, css: 'stroke:var(--ink);stroke-dasharray:6 4' }, g));
        const L1 = leg(160, 'TWFE', (g, xx) => s('circle', { cx: xx + 8, cy: 18, r: 5, css: 'fill:var(--bad)' }, g));
        const L2 = leg(230, 'CS', (g, xx) => s('circle', { cx: xx + 8, cy: 18, r: 5, css: 'fill:var(--ink)' }, g));
        const L3 = leg(285, 'SA', (g, xx) => s('circle', { cx: xx + 8, cy: 18, r: 7, css: 'fill:none;stroke:var(--ink);stroke-width:2' }, g));
        const L4 = leg(340, 'Stacked', (g, xx) => s('rect', { x: xx + 4, y: 14, width: 8, height: 8, css: 'fill:var(--c1)', transform: `rotate(45 ${xx + 8} 18)` }, g));
        const LG = [L1, L2, L3, L4];
        const endT = s('text', { x: x(5), y: y(tw[10]) + 22, 'text-anchor': 'middle', css: 'fill:var(--bad);font-size:12.5px;font-weight:700', text: F(tw[10], 3), opacity: 0 }, svg);
        return (st, anim) => {
          const o = { dur: anim ? 600 : 0 };
          show(LT, true, o);
          S.forEach((g, i) => { const on = st >= i + 1; to(g, { opacity: on ? (st >= 2 && i === 0 ? 0.35 : 1) : 0 }, { dur: anim ? 600 : 0, delay: anim && st === i + 1 ? 200 : 0 }); show(LG[i], on, o); });
          to(S[0], { opacity: st === 1 ? 1 : st >= 2 ? 0.3 : 0 }, o);
          show(endT, st === 1, o);
          to(truth, { 'stroke-width': st === 0 ? 3.5 : 3 }, o);
        };
      },
      note: 'TWFE 사건연구는 덱 17장과 같은 사양(−6 이전과 +6 이후 묶음, −1 제외)이고 CS와 SA는 도입 후 0-5년 칸만 그렸다. 덱 21장은 CS와 SA의 도입 전 칸을 0으로 표시한다. 균형패널 단순화이므로 원문 Fig. 7과 수치가 조금 다르다.'
    });
  });

  /* ---------- forest-bll (p3-bll): 원문 Table 2의 계수와 95% 신뢰구간 ---------- */
  GV.reg('forest-bll', host => {
    const W = 640, H = 280;
    const R = [
      { n: 'TWFE (통제 없음)', b: -0.022, se: 0.008, y: 70, col: 'bad', sig: '***' },
      { n: 'TWFE (통제 포함)', b: -0.018, se: 0.006, y: 108, col: 'bad', sig: '***' },
      { n: "Callaway-Sant'Anna", b: 0.001, se: 0.007, y: 164, col: 'ink', sig: '' },
      { n: 'Stacked regression', b: 0.000, se: 0.005, y: 202, col: 'ink', sig: '' }];
    const x = lin(-0.045, 0.03, 220, 600);
    stepper(host, {
      kind: '그래프', title: '은행 규제완화와 로그 Gini (원문 Table 2, 95% 신뢰구간)', w: W, h: H,
      steps: [
        '원 논문의 TWFE 계수는 통제변수가 없을 때 −0.022, 있을 때 −0.018이다. 가로선은 계수 ± 1.96 × 표준오차로 계산한 95% 신뢰구간이고 두 구간 모두 0을 포함하지 않는다.',
        "Callaway-Sant'Anna로 다시 추정하면 계수가 −0.022 자리에서 0.001로 이동한다. 구간 [−0.013, 0.015]는 0을 포함한다.",
        'Stacked regression도 0.000이고 구간은 약 [−0.010, 0.010]이다.',
        '원래 점추정치 −0.022(붉은 점선)는 두 대안의 구간 밖에 있다. 대안 추정은 원래 결과를 지지하지 않는다.',
        '그러나 두 구간 모두 대략 ±1%(음영) 크기의 효과를 배제하지 못하므로 효과가 정확히 0이라고 결론지을 수는 없다.'
      ],
      init(svg) {
        const g0 = s('g', {}, svg);
        const band = s('g', { opacity: 0 }, g0);
        s('rect', { x: x(-0.01), y: 140, width: x(0.01) - x(-0.01), height: 84, css: 'fill:var(--c3-soft)' }, band);
        txt(band, x(0), 238, '±1% 범위', 'fill:var(--c3);font-size:12px;font-weight:700', 'middle');
        [-0.04, -0.02, 0, 0.02].forEach(v => { s('line', { x1: x(v), x2: x(v), y1: 44, y2: 224, css: v === 0 ? 'stroke:var(--faint);stroke-width:1.2' : 'stroke:var(--line)' }, g0); txt(g0, x(v), 258, v === 0 ? '0' : F(v, 2), SUB, 'middle'); });
        txt(g0, 600, 276, '로그 Gini에 대한 계수', SUB, 'end');
        txt(g0, 20, 40, '원 논문의 TWFE (Panel A)', SUB + ';font-weight:700'); txt(g0, 20, 142, '대안 추정량 (Panel B)', SUB + ';font-weight:700');
        const ref = s('line', { x1: x(-0.022), x2: x(-0.022), y1: 60, y2: 224, 'stroke-width': 1.5, css: 'stroke:var(--bad);stroke-dasharray:5 4', opacity: 0 }, svg);
        const rows = R.map((r, i) => { const g = s('g', { opacity: i < 2 ? 1 : 0 }, svg);
          txt(g, 20, r.y + 5, r.n, `fill:var(--ink);font-size:13.5px;font-weight:600`);
          const lo = r.b - 1.96 * r.se, hi = r.b + 1.96 * r.se;
          const ci = s('line', { x1: x(i < 2 ? lo : -0.022), x2: x(i < 2 ? hi : -0.022), y1: r.y, y2: r.y, 'stroke-width': 3, css: `stroke:var(--${r.col});stroke-linecap:round` }, g);
          const pt = s('circle', { cx: x(i < 2 ? r.b : -0.022), cy: r.y, r: 6.5, css: `fill:var(--${r.col})` }, g);
          const vt = s('text', { x: 636, y: r.y + 5, 'text-anchor': 'end', css: 'fill:var(--ink);font-size:13px;font-weight:700', text: `${F(r.b, 3)}${r.sig}`, opacity: i < 2 ? 1 : 0 }, g);
          return { g, ci, pt, vt, lo, hi, r }; });
        return (st, anim) => {
          const o = { dur: anim ? 900 : 0 };
          rows.forEach((q, i) => { if (i < 2) return; const on = st >= i - 1;
            show(q.g, on, { dur: anim ? 250 : 0 });
            to(q.pt, { cx: x(on ? q.r.b : -0.022) }, o); to(q.ci, { x1: x(on ? q.lo : -0.022), x2: x(on ? q.hi : -0.022) }, o);
            show(q.vt, on, { dur: anim ? 300 : 0, delay: anim && st === i - 1 ? 900 : 0 }); });
          show(ref, st >= 3, o); show(band, st >= 4, o);
        };
      },
      note: '계수와 표준오차는 원문 Table 2(주 단위 군집 표준오차)이고 구간은 이 가이드에서 계수 ± 1.96 × 표준오차로 계산했다. ***는 1% 수준에서 유의.'
    });
  });

  /* ---------- bll-split (p3-bll): Goodman-Bacon 분해의 두 종류 (원문 Fig. 8 ii, iii) ---------- */
  GV.reg('bll-split', host => {
    const W = 640, H = 300;
    const x = lin(0, 1, 90, 600), y = lin(-0.032, 0.012, 250, 60);
    const A = { w: 0.143, d: 0.005 }, B = { w: 0.857, d: -0.027 }, tot = A.w * A.d + B.w * B.d;
    stepper(host, {
      kind: '도식', title: 'BLL의 TWFE 계수를 두 종류의 2×2로 나누기 (원문 Fig. 8)', w: W, h: H,
      steps: [
        '미처치 주가 없으므로 2×2는 두 종류뿐이다. 가로 폭이 TWFE가 각 종류에 준 가중치의 합이다. 깨끗한 비교(먼저 완화한 주 대 아직 완화하지 않은 주)는 14.3%, 문제 소지 비교(나중 완화한 주 대 이미 완화한 주)는 85.7%다.',
        '깨끗한 비교들의 가중평균 DID는 +0.005로 0에 가깝다.',
        '이미 완화한 주를 비교집단으로 삼은 비교들의 가중평균 DID는 −0.027이다.',
        '두 직사각형의 면적을 부호대로 더하면 0.143 × 0.005 + 0.857 × (−0.027) ≈ −0.022, 곧 원래 TWFE 계수다. 음의 결과는 대부분 문제 소지 비교에서 나왔다.'
      ],
      init(svg) {
        const g0 = s('g', {}, svg);
        GV.yAxis(g0, y, [-0.03, -0.02, -0.01, 0, 0.01], 90, 600, v => v === 0 ? '0' : F(v, 2));
        const legend = (xx, col, t) => { s('rect', { x: xx, y: 18, width: 12, height: 12, css: `fill:var(--${col})` }, g0); txt(g0, xx + 18, 29, t, SUB + ';font-weight:600'); };
        legend(90, 'c1', '먼저 완화한 주 대 아직 완화하지 않은 주'); legend(372, 'bad', '나중 완화한 주 대 이미 완화한 주');
        const rA = s('rect', { x: x(0), y: y(0), width: x(A.w) - x(0), height: 0, css: 'fill:var(--c1);opacity:.85' }, svg);
        const rB = s('rect', { x: x(A.w), y: y(0), width: x(1) - x(A.w), height: 0, css: 'fill:var(--bad);opacity:.85' }, svg);
        const base = s('g', {}, svg);
        s('line', { x1: x(0) + 1, x2: x(A.w) - 1, y1: y(0), y2: y(0), 'stroke-width': 5, css: 'stroke:var(--c1)' }, base);
        s('line', { x1: x(A.w) + 1, x2: x(1) - 1, y1: y(0), y2: y(0), 'stroke-width': 5, css: 'stroke:var(--bad)' }, base);
        txt(base, (x(0) + x(A.w)) / 2, 274, '14.3%', 'fill:var(--c1);font-weight:700;font-size:13px', 'middle');
        txt(base, (x(A.w) + x(1)) / 2, 274, '85.7%', 'fill:var(--bad);font-weight:700;font-size:13px', 'middle');
        txt(base, 600, 294, '가중치 (폭)', SUB, 'end');
        const tA = s('text', { x: x(A.w) + 8, y: y(A.d) + 4, css: 'fill:var(--c1);font-weight:800;font-size:14px', text: '+0.005', opacity: 0 }, svg);
        const tB = s('text', { x: (x(A.w) + x(1)) / 2, y: y(B.d) + 22, 'text-anchor': 'middle', css: 'fill:var(--bad);font-weight:800;font-size:14px', text: '평균 DID −0.027', opacity: 0 }, svg);
        const ln = s('line', { x1: x(0), x2: x(1), y1: y(tot), y2: y(tot), 'stroke-width': 2, css: 'stroke:var(--ink);stroke-dasharray:6 4', opacity: 0 }, svg);
        const tT = s('text', { x: x(1), y: y(0) - 14, 'text-anchor': 'end', css: 'fill:var(--ink);font-weight:800;font-size:14px', text: '', opacity: 0 }, svg);
        return (st, anim) => {
          const o = { dur: anim ? 800 : 0 };
          to(rA, { y: st >= 1 ? y(A.d) : y(0), height: st >= 1 ? y(0) - y(A.d) : 0 }, o);
          to(rB, { height: st >= 2 ? y(B.d) - y(0) : 0 }, o);
          show(tA, st >= 1, { dur: anim ? 300 : 0, delay: anim && st === 1 ? 700 : 0 }); show(tB, st >= 2, { dur: anim ? 300 : 0, delay: anim && st === 2 ? 700 : 0 });
          show(ln, st >= 3, o); show(tT, st >= 3, o);
          if (st >= 3) count(tT, tot, 3, { pre: 'TWFE 계수 ', post: ' (점선)', dur: anim ? 900 : 0 }); else tT.__num = null;
        };
      },
      note: '가중치와 가중평균 DID는 원문 Fig. 8 (iii)의 분해표 값(심층요약 13절)이다. 개별 2×2 점들의 분포는 위의 원문 그림에서 확인할 수 있다.'
    });
  });

  /* ---------- forest-fhlt (p3-fhlt): 원문 Table 3의 계수와 신뢰구간 ---------- */
  GV.reg('forest-fhlt', host => {
    const W = 640, H = 370;
    const x = lin(-0.25, 0.4, 230, 600);
    const PAN = [
      { name: '주요 개혁', y0: 54, tw: 0.110, rows: [{ n: "Callaway-Sant'Anna", b: 0.062, se: 0.135, sig: '' }, { n: 'Stacked', b: 0.063, se: 0.051, sig: '' }] },
      { name: '최초 개혁', y0: 196, tw: 0.136, rows: [{ n: "Callaway-Sant'Anna", b: 0.116, se: 0.094, sig: '' }, { n: 'Stacked', b: 0.166, se: 0.055, sig: '***' }] }];
    stepper(host, {
      kind: '그래프', title: "이사회 개혁과 Tobin's Q (원문 Table 3)", w: W, h: H,
      steps: [
        '통제변수가 없는 TWFE 계수는 주요 개혁 0.110, 최초 개혁 0.136이고 둘 다 5% 수준에서 유의하다(**). 원문이 TWFE 표준오차를 소수 둘째 자리까지만 보고해 구간은 그리지 않았다.',
        "Callaway-Sant'Anna는 0.062와 0.116으로 낮아지고 표준오차가 커져 구간이 넓다. 둘 다 유의하지 않다.",
        'Stacked는 주요 개혁 0.063으로 유의하지 않고 최초 개혁에서만 0.166으로 1% 수준에서 유의하다. 이 값에는 사전추세가 섞여 있다(덱 26장).',
        '주요 개혁의 CS 구간 [−0.20, 0.33]은 0(회색 선)도, 원래 TWFE 0.110(붉은 선)도 포함한다. 원래 결과를 뒷받침하지도 부정하지도 못하는, 정밀도가 크게 낮아진 추정이다.'
      ],
      init(svg) {
        const g0 = s('g', {}, svg);
        [-0.2, -0.1, 0, 0.1, 0.2, 0.3].forEach(v => { s('line', { x1: x(v), x2: x(v), y1: 36, y2: 334, css: v === 0 ? 'stroke:var(--faint);stroke-width:1.2' : 'stroke:var(--line)' }, g0); txt(g0, x(v), 350, v === 0 ? '0' : F(v, 1), SUB, 'middle'); });
        txt(g0, 600, 368, "Tobin's Q에 대한 계수", SUB, 'end');
        const ref = s('line', { x1: x(0.110), x2: x(0.110), y1: 40, y2: 170, 'stroke-width': 1.5, css: 'stroke:var(--bad);stroke-dasharray:5 4', opacity: 0 }, svg);
        const zero = s('line', { x1: x(0), x2: x(0), y1: 40, y2: 170, 'stroke-width': 2.5, css: 'stroke:var(--muted)', opacity: 0 }, svg);
        const P = PAN.map(p => { txt(g0, 20, p.y0, p.name, LAB);
          const yT = p.y0 + 28; txt(g0, 20, yT + 5, 'TWFE (통제 없음)', 'fill:var(--ink);font-size:13.5px;font-weight:600');
          s('circle', { cx: x(p.tw), cy: yT, r: 6.5, css: 'fill:var(--bad)' }, svg);
          txt(svg, x(p.tw) + 12, yT + 5, F(p.tw, 3) + '**', 'fill:var(--ink);font-size:13px;font-weight:700');
          const rows = p.rows.map((r, j) => { const yy = yT + 36 * (j + 1), g = s('g', { opacity: 0 }, svg);
            txt(g, 20, yy + 5, r.n, 'fill:var(--ink);font-size:13.5px;font-weight:600');
            const lo = r.b - 1.96 * r.se, hi = r.b + 1.96 * r.se;
            const ci = s('line', { x1: x(p.tw), x2: x(p.tw), y1: yy, y2: yy, 'stroke-width': 3, css: 'stroke:var(--ink);stroke-linecap:round' }, g);
            const pt = s('circle', { cx: x(p.tw), cy: yy, r: 6.5, css: r.sig ? 'fill:var(--ink)' : 'fill:var(--bg);stroke:var(--ink);stroke-width:2.5' }, g);
            const vt = s('text', { x: x(hi) + 10, y: yy + 5, css: 'fill:var(--ink);font-size:13px;font-weight:700', text: F(r.b, 3) + r.sig, opacity: 0 }, g);
            return { g, ci, pt, vt, lo, hi, r, tw: p.tw }; });
          return rows; });
        const tag = s('g', { opacity: 0 }, svg); const sy = 196 + 28 + 72;
        txt(tag, x(0.166), sy + 22, '사전추세 있음', 'fill:var(--bad);font-size:12px;font-weight:700', 'middle');
        const ciTxt = s('text', { x: x(0.062 - 1.96 * 0.135), y: 54 + 28 + 36 - 11, 'text-anchor': 'start', css: 'fill:var(--ink);font-size:12.5px;font-weight:700', text: '[−0.20, 0.33]', opacity: 0 }, svg);
        return (st, anim) => {
          const o = { dur: anim ? 900 : 0 };
          P.forEach(rows => rows.forEach((q, j) => { const on = st >= j + 1;
            show(q.g, on, { dur: anim ? 250 : 0 });
            to(q.pt, { cx: x(on ? q.r.b : q.tw) }, o); to(q.ci, { x1: x(on ? q.lo : q.tw), x2: x(on ? q.hi : q.tw) }, o);
            show(q.vt, on, { dur: anim ? 300 : 0, delay: anim && st === j + 1 ? 900 : 0 }); }));
          show(tag, st >= 2, o); show(ref, st >= 3, o); show(zero, st >= 3, o); show(ciTxt, st >= 3, o);
        };
      },
      note: '계수와 괄호 안 표준오차는 원문 Table 3(국가 단위 군집 표준오차). CS와 stacked의 구간은 이 가이드에서 계수 ± 1.96 × 표준오차로 계산했다. 채운 점은 유의, 빈 점은 유의하지 않음. ***는 1%, **는 5% 수준.'
    });
  });

  /* ---------- after-bars (p3-after): 논문 이후 재분석의 부호 반전 비율 ---------- */
  GV.reg('after-bars', host => {
    const W = 640, H = 330;
    const x = lin(0, 30, 230, 600);
    const GR = [
      { name: '경제학', src: 'Hull (2026)', n: '116편, 회귀식 1,430개', tag: '심사 전 원고', y0: 54, v: [14.9, 12.0], sg: [3.9, 2.8] },
      { name: '정치학', src: 'Chiu 등 (2026, APSR)', n: '49편', tag: '', y0: 134, v: [], sg: [] },
      { name: '경영, 마케팅', src: 'Proserpio (2026)', n: '40편, 회귀식 355개', tag: '심사 전 원고', y0: 214, v: [25.1, 18.0], sg: [10.2, 7.2] }];
    stepper(host, {
      kind: '그래프', title: 'TWFE와 새 추정량의 부호가 반대인 비교의 비율', w: W, h: H,
      steps: [
        '경제학 종합저널 116편의 회귀식 1,430개를 다시 추정한 결과, TWFE와 부호가 반대인 비교는 CS 계열과 비교하면 14.9%, imputation 계열과 비교하면 12.0%였다(Hull 2026).',
        '정치학 49편에서는 부호가 모두 유지됐다. 다만 5% 수준에서 유의하지 않은 연구가 1편에서 12편으로 늘었다(Chiu 등 2026).',
        'Management Science와 Marketing Science 40편의 회귀식 355개에서는 부호가 반대인 비교가 25.1%, 18.0%로 경제학보다 많았다(Proserpio 2026).',
        '부호가 반대이면서 그 차이까지 유의한 비교(붉은 부분)는 경제학 3.9%, 2.8%, 경영과 마케팅 10.2%, 7.2%다. Proserpio는 불일치가 불균형 패널과 미처치 집단이 없는 설계에 집중된다고 보고했다.'
      ],
      init(svg) {
        const g0 = s('g', {}, svg);
        [0, 10, 20, 30].forEach(v => { s('line', { x1: x(v), x2: x(v), y1: 40, y2: 282, css: v === 0 ? 'stroke:var(--faint);stroke-width:1.2' : 'stroke:var(--line)' }, g0); txt(g0, x(v), 300, v + '%', SUB, 'middle'); });
        const lg = (xx, col, t) => { s('rect', { x: xx, y: 12, width: 12, height: 12, css: `fill:var(--${col})` }, g0); txt(g0, xx + 18, 23, t, SUB + ';font-weight:600'); };
        lg(230, 'ink', 'CS 계열과 비교'); lg(360, 'u', 'imputation 계열과 비교'); lg(520, 'bad', '차이도 유의');
        const B = GR.map(gp => { const g = s('g', { opacity: 1 }, svg);
          txt(g, 20, gp.y0 + 14, gp.name, LAB); txt(g, 20, gp.y0 + 33, gp.src, SUB + ';font-weight:600'); txt(g, 20, gp.y0 + 50, gp.n, SUB);
          if (gp.tag) txt(g, 20, gp.y0 + 67, gp.tag, 'fill:var(--c2);font-size:11.5px;font-weight:700');
          const bars = gp.v.map((v, j) => { const yy = gp.y0 + j * 32;
            const r = s('rect', { x: x(0), y: yy, width: 0, height: 26, css: `fill:var(--${j === 0 ? 'ink' : 'u'})` }, g);
            const rs = s('rect', { x: x(0), y: yy + 6, width: 0, height: 14, css: 'fill:var(--bad)' }, g);
            const t = s('text', { x: x(0) + 8, y: yy + 18, css: 'fill:var(--ink);font-size:13px;font-weight:700', text: F(v, 1) + '%', opacity: 0 }, g);
            return { r, rs, t, v, sv: gp.sg[j] }; });
          let extra = null;
          if (!gp.v.length) { extra = s('g', { opacity: 0 }, g); txt(extra, x(0) + 10, gp.y0 + 18, '부호가 반대인 연구 0편 (49편 중)', 'fill:var(--ink);font-size:13.5px;font-weight:700'); txt(extra, x(0) + 10, gp.y0 + 40, '5% 수준에서 유의하지 않은 연구 1편에서 12편으로', SUB); }
          return { bars, extra, g }; });
        return (st, anim) => {
          const at = [0, 1, 2];
          B.forEach((b, i) => { const on = st >= at[i];
            b.bars.forEach((q, j) => { const d = { dur: anim ? 900 : 0, delay: anim && st === at[i] ? 150 + j * 200 : 0 };
              to(q.r, { width: on ? x(q.v) - x(0) : 0 }, d);
              to(q.t, { x: (on ? x(q.v) : x(0)) + 8 }, d); show(q.t, on, d);
              to(q.rs, { width: st >= 3 ? x(q.sv) - x(0) : 0 }, { dur: anim ? 800 : 0, delay: anim && st === 3 ? 150 + j * 150 : 0 }); });
            if (b.extra) show(b.extra, on, { dur: anim ? 400 : 0 }); });
        };
      },
      note: '수치는 후속논의 문서(2026-11-13 조사)와 덱 28장. Hull과 Proserpio는 수정 중인 working paper라 값이 바뀔 수 있다. Chiu 등은 American Political Science Review 120(1)에 출판되었다.'
    });
  });
})();
