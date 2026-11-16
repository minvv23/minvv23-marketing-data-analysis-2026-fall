/* 2부 도식. GV(viz-kit.js), ST(stats.js), SIM(simcore.js) 사용. 수치는 모두 덱과 같은 코어로 계산한다. */
(function () {
  'use strict';
  const { s, to, show, lin, C, stepper, count } = GV;
  const fmt = GV.fmt, sg = (v, d = 3) => fmt(v, d) + 'σ';
  const COH = [{ g: 1989, c: 'c1', n: 17 }, { g: 1998, c: 'c2', n: 18 }, { g: 2007, c: 'c3', n: 15 }];
  // 점 히스토그램: 값을 가로 위치로 옮기고 같은 칸의 점을 위로 쌓는다 (덱 VZ.dotStack과 같은 방식)
  function dotStack(vals, x, bin, y0, dy, xmin, xmax) {
    const cnt = new Map(), out = new Array(vals.length);
    for (let i = 0; i < vals.length; i++) { const px = Math.max(xmin, Math.min(xmax, x(vals[i]))), b = Math.round(px / bin), n = cnt.get(b) || 0; cnt.set(b, n + 1); out[i] = [b * bin, y0 - n * dy]; }
    return out;
  }
  const maxBin = (vals, x, bin) => { const c = new Map(); let m = 1; vals.forEach(v => { const b = Math.round(x(v) / bin); c.set(b, (c.get(b) || 0) + 1); m = Math.max(m, c.get(b)); }); return m; };
  const meanOf = a => { let t = 0; for (let i = 0; i < a.length; i++) t += a[i]; return t / a.length; };
  const T_ = (x, y, text, css, anchor) => ({ x, y, text, css: css || '', 'text-anchor': anchor || 'start' });

  /* ---------- 1. sim-flow (p2-design): 모의자료를 만드는 절차 (덱 10장 도식을 줄인 것) ---------- */
  GV.reg('sim-flow', host => {
    const W = 640, H = 372, T = 36, CW = 13, X0 = 92, Y0 = 50, PH = 19, CH = 15;
    // 기업 14개: [주(0-6), 첫 관측 연도 인덱스, 마지막 인덱스]. 주 0-2는 1989년, 3-4는 1998년, 5-6은 2007년에 도입한다 (덱과 같은 배치)
    const F = [[3, 0, 35], [0, 2, 30], [5, 0, 31], [1, 6, 35], [6, 10, 35], [2, 0, 17], [4, 4, 35], [1, 0, 35], [5, 12, 35], [0, 0, 14], [4, 0, 28], [3, 15, 35], [6, 0, 35], [2, 8, 33]];
    const cohOf = st => st <= 2 ? 0 : st <= 4 ? 1 : 2, ORD = F.map((f, i) => i).sort((a, b) => F[a][0] - F[b][0] || a - b);
    stepper(host, {
      kind: '도식', title: '모의자료를 만드는 절차 (원문 3.1.1절, 기업 14개로 줄인 도식)', w: W, h: H,
      steps: [
        'Compustat에서 1980-2015년 미국 비금융 기업 가운데 관측치가 5개 이상인 기업을 모은다. 기업-연도 관측치는 176,670개이고 막대 길이처럼 기업마다 관측 기간이 다른 불균형 패널이다.',
        '각 칸의 ROA를 세 성분으로 나눈다. 행 전체에 같은 농도로 칠해지는 기업 고정효과 α, 열 전체에 같은 농도로 칠해지는 연도 고정효과 λ, 칸마다 다른 잔차 ε다.',
        '세 성분의 실제 분포에서 값을 다시 추출해 새 패널을 만든다(Bertrand, Duflo &amp; Mullainathan 2004의 방식). 농도가 바뀐 것은 재추출의 결과이며 이 패널에는 아직 처치효과가 없다.',
        '<span>기업마다 50개 주 가운데 하나를 무작위로 배정하고 주마다 도입 시점(1989, 1998, 2007년)을 무작위로 배정한다. 배정이 결과와 무관하므로 <strong>평행추세 가정이 설계상 성립</strong>한다. 그림은 주 7개로 줄였다.</span>',
        '도입 후 관측치(색칠된 칸)에만 처치효과를 더한다. 효과의 크기와 형태는 Sim 1-6에서 서로 다르게 정한다.',
        '이 과정을 500번 반복해 모의자료 500개를 만들고 각각에 TWFE를 추정한다. 저자들이 주입한 효과가 정답이므로 추정치 500개가 표본평균 ATT 주위에 모이는지 확인한다.'
      ],
      init(svg) {
        const R = ST.rng(642), op = z => Math.max(0, Math.min(.42, .16 + .13 * z));
        const back = [12, 6].map(d => s('rect', { x: X0 + d, y: Y0 + d, width: T * CW, height: 14 * PH + 4, css: 'fill:var(--bg);stroke:var(--faint);stroke-width:1.2', opacity: 0 }, svg));
        s('rect', { x: X0 - 3, y: Y0 - 3, width: T * CW + 6, height: 14 * PH + 6, css: 'fill:var(--bg)' }, svg);
        const lam = [0, 1].map(() => Array.from({ length: T }, () => op(R.n())));
        const firms = F.map(([st, a, b], i) => {
          const g = s('g', { ty: Y0 + i * PH }, svg), x = X0 + a * CW, w = (b - a + 1) * CW, k = cohOf(st), gy = COH[k].g - 1980;
          s('rect', { x, y: 0, width: w, height: CH, css: 'fill:var(--line)' }, g);
          const al = [op(R.n()), op(R.n())], aB = s('rect', { x, y: 0, width: w, height: CH, css: 'fill:var(--ink)', opacity: 0 }, g);
          const mkL = val => { const gg = s('g', { opacity: 0 }, g); for (let t = a; t <= b; t++) s('rect', { x: X0 + t * CW, y: 0, width: CW, height: CH, css: 'fill:var(--ink)', opacity: val(t) }, gg); return gg; };
          const L = [mkL(t => lam[0][t]), mkL(t => lam[1][t])], E = [mkL(() => op(R.n())), mkL(() => op(R.n()))];
          const s0 = Math.max(a, gy), tr = s('rect', { x: X0 + s0 * CW, y: 0, width: Math.max(0, (b - s0 + 1) * CW), height: CH, css: `fill:var(--${COH[k].c})`, opacity: 0 }, g);
          let d = ''; for (let t = a + 1; t <= b; t++) d += `M${X0 + t * CW} 0V${CH}`; s('path', { d, css: 'stroke:var(--bg);stroke-width:1.2;fill:none', 'shape-rendering': 'crispEdges' }, g);
          const lab = s('text', T_(X0 - 8, CH / 2 + 4.5, '주 ' + (st + 1), 'font-size:11.5px', 'end'), g); lab.__v.opacity = 1; to(lab, { opacity: 0 }, { dur: 0 });
          return { g, al, aB, L, E, tr, lab, k, i, pos: ORD.indexOf(i) };
        });
        const sortedY = f => Y0 + f.pos * PH + f.k * 7;
        [1980, 1989, 1998, 2007, 2015].forEach(n => s('text', T_(X0 + (n - 1980) * CW + CW / 2, Y0 + 14 * PH + 34, String(n), '', 'middle'), svg));
        const leg = s('g', { opacity: 0 }, svg);
        s('text', T_(X0, 30, '기업 고정효과 α (행)  +  연도 고정효과 λ (열)  +  잔차 ε (칸)', 'font-size:13px;fill:var(--ink);font-weight:600'), leg);
        const cl = COH.map((c, k) => { const fs = firms.filter(f => f.k === k), y = (Math.min(...fs.map(sortedY)) + Math.max(...fs.map(sortedY)) + CH) / 2, g = s('g', { opacity: 0 }, svg);
          s('text', T_(X0 + T * CW + 20, y, c.g + '년', `font-size:13px;font-weight:700;fill:var(--${c.c})`), g); s('text', T_(X0 + T * CW + 20, y + 15, '도입', 'font-size:11.5px'), g); return g; });
        const rep = s('g', { opacity: 0 }, svg);
        s('text', T_(X0 + 24, Y0 - 16, '모의자료 500개, 각각에 TWFE 추정', 'font-size:13px;font-weight:700;fill:var(--ink)'), rep);
        const ttl = s('text', T_(X0, 30, '기업-연도 관측치 (막대 하나가 기업 하나)', 'font-size:13px;fill:var(--ink);font-weight:600'), svg);
        return (st, anim) => {
          const o = { dur: anim ? 600 : 0 }, ver = st >= 2 ? 1 : 0;
          show(ttl, st === 0 || (st >= 3 && st <= 4), o); ttl.textContent = st >= 3 ? (st >= 4 ? '색칠된 칸이 도입 이후 관측치' : '주별로 정렬한 기업 (주 7개, 도입 시점 3개)') : '기업-연도 관측치 (막대 하나가 기업 하나)';
          show(leg, st === 1 || st === 2, o);
          firms.forEach(f => {
            to(f.aB, { opacity: st >= 1 ? f.al[ver] : 0 }, o);
            f.L.forEach((l, j) => to(l, { opacity: st >= 1 && j === ver ? 1 : 0 }, { dur: o.dur, delay: anim && st === 1 ? 400 : 0 }));
            f.E.forEach((e, j) => to(e, { opacity: st >= 1 && j === ver ? 1 : 0 }, { dur: o.dur, delay: anim && st === 1 ? 800 : 0 }));
            to(f.g, { ty: st >= 3 ? sortedY(f) : Y0 + f.i * PH }, { dur: anim ? 900 : 0, delay: anim && st === 3 ? f.pos * 25 : 0 });
            show(f.lab, st >= 3, { dur: o.dur, delay: anim && st === 3 ? 600 : 0 });
            to(f.tr, { opacity: st >= 4 ? .7 : 0 }, { dur: o.dur, delay: anim && st === 4 ? f.pos * 35 : 0 });
          });
          cl.forEach(g => show(g, st >= 3, { dur: o.dur, delay: anim && st === 3 ? 800 : 0 }));
          back.forEach((r, i) => show(r, st >= 5, { dur: o.dur, delay: anim && st === 5 ? i * 150 : 0 }));
          show(rep, st >= 5, { dur: o.dur, delay: anim && st === 5 ? 300 : 0 });
        };
      }
    });
  });

  /* ---------- 2. sim-cloud (p2-six): Sim 1-6의 TWFE 추정치 500개 (덱 11장) ---------- */
  GV.reg('sim-cloud', host => {
    const W = 640, H = 300, M = SIM.get(), N = M.NSIM;
    const F = GV.frame(host, { kind: '도식', title: '모의자료 500개의 TWFE 추정치와 참 ATT (덱 계산, 균형패널 단순화)', w: W, h: H, controls: true,
      note: '점 하나가 모의자료 하나의 TWFE 추정치다. 굵은 점선은 기업평균 ATT, 가는 점선은 관측치평균 ATT이고 두 값이 같으면 하나만 보인다. 덱이 원문 설정을 균형패널로 단순화해 다시 계산한 값이어서 원문 Fig. 2와 조금 다르다.' });
    F.bar.remove();
    const NAME = { 1: '1998년 일괄 도입, 효과 0.5σ로 일정', 2: '1998년 일괄 도입, 효과가 매년 0.05σ씩 증가', 3: '세 코호트 시차 도입, 효과 모두 0.5σ로 일정', 4: '시차 도입, 코호트별 효과 0.5σ, 0.3σ, 0.1σ로 일정', 5: '시차 도입, 모든 코호트의 효과가 매년 0.03σ씩 증가', 6: '시차 도입, 증가 속도가 코호트별로 0.05σ, 0.03σ, 0.01σ' };
    const READ = { 1: '도입 시점이 하나이고 효과가 일정하다. 점들이 참값 주위에 모인다.', 2: '효과가 변하지만 도입 시점이 하나다. 이미 처치된 비교집단이 없으므로 편향이 없다.', 3: '도입 시점이 여럿이지만 효과가 같고 일정하다. 이미 처치된 코호트와 비교해도 차감되는 변화가 0이어서 편향이 없다.', 4: '각 2×2는 정확하지만 TWFE가 코호트를 분산으로 가중해 평균하므로 관측치평균 ATT와 다른 값에 모인다.', 5: '이미 처치된 코호트의 효과 증가분이 차감되어 추정치가 0 근처에 모인다.', 6: '참효과는 모두 양수인데 추정치 500개가 모두 0보다 작다.' };
    const bx = lin(-.14, .58, 40, W - 30), by0 = 250, svg = F.svg;
    s('line', { x1: 40, x2: W - 30, y1: by0 + 6, y2: by0 + 6, css: 'stroke:var(--faint);stroke-width:1' }, svg);
    [-.1, 0, .1, .2, .3, .4, .5].forEach(n => { s('line', { x1: bx(n), x2: bx(n), y1: by0 + 6, y2: by0 + 11, css: 'stroke:var(--faint)' }, svg); s('text', T_(bx(n), by0 + 27, n === 0 ? '0' : fmt(n, 1) + 'σ', '', 'middle'), svg); });
    s('line', { x1: bx(0), x2: bx(0), y1: 40, y2: by0 + 6, css: 'stroke:var(--faint);stroke-width:1' }, svg);
    s('text', T_(W - 30, H - 7, 'TWFE 추정치 (σ 단위)', 'font-size:12px', 'end'), svg);
    const tF = s('g', { tx: bx(.5) }, svg); s('line', { x1: 0, x2: 0, y1: 56, y2: by0 + 6, css: 'stroke:var(--ink);stroke-width:2;stroke-dasharray:7 5' }, tF); const tFt = s('text', T_(-6, 50, '', 'font-size:12.5px;font-weight:700;fill:var(--ink)', 'end'), tF);
    const tO = s('g', { tx: bx(.5) }, svg); s('line', { x1: 0, x2: 0, y1: 34, y2: by0 + 6, css: 'stroke:var(--muted);stroke-width:1.6;stroke-dasharray:3 4' }, tO); const tOt = s('text', T_(6, 30, '', 'font-size:12px'), tO);
    const dots = []; for (let i = 0; i < N; i++) dots.push(s('circle', { cx: bx(0), cy: by0, r: 2.2, css: 'fill:var(--muted)', opacity: .75 }, svg));
    const mLab = s('text', T_(0, 0, '', 'font-size:13px;font-weight:700;fill:var(--ink)'), svg);
    let cur = 0;
    function draw(sim, anim) {
      const est = M.est(sim), tr = M.truth[sim], m = meanOf(est), same = Math.abs(tr.firm - tr.obs) < 1e-9, o = { dur: anim ? 900 : 0 };
      const mx = maxBin(est, bx, 5), pos = dotStack(est, bx, 5, by0, Math.min(2.4, 150 / mx), 40, W - 30);
      dots.forEach((d, i) => { d.style.fill = m < 0 ? 'var(--bad)' : 'var(--muted)'; to(d, { cx: pos[i][0], cy: pos[i][1] }, { dur: o.dur, delay: anim ? (i % 25) * 8 : 0 }); });
      to(tF, { tx: bx(tr.firm / M.SIG) }, o); to(tO, { tx: bx(tr.obs / M.SIG), opacity: same ? 0 : 1 }, o);
      tFt.textContent = (same ? '참 ATT ' : '기업평균 ') + sg(tr.firm / M.SIG); tOt.textContent = '관측치평균 ' + sg(tr.obs / M.SIG);
      const top = Math.min(...pos.map(p => p[1])), right = bx(m) > W - 200;
      mLab.setAttribute('text-anchor', right ? 'end' : 'start'); to(mLab, { x: bx(m) + (right ? -10 : 10), y: Math.max(top - 8, 74) }, o);
      mLab.textContent = 'TWFE 평균 ' + sg(m); mLab.style.fill = m < 0 ? 'var(--bad)' : 'var(--ink)';
      F.cap.innerHTML = `<span class="vn">${sim}</span><span><strong>Sim ${sim}</strong> ${NAME[sim]}. ${READ[sim]}</span>`;
      F.out.innerHTML = `TWFE 추정치 평균 <strong${m < 0 ? ' class="neg"' : ''}>${sg(m)}</strong>, 기업평균 ATT ${sg(tr.firm / M.SIG)}, 관측치평균 ATT ${sg(tr.obs / M.SIG)}. 차이(평균 − 기업평균) ${sg(m - tr.firm / M.SIG)}.`;
      cur = sim;
    }
    GV.seg(F.top, '설정', [1, 2, 3, 4, 5, 6].map(v => [v, 'Sim ' + v]), 1, v => draw(v, true));
    draw(1, false);
  });

  /* ---------- 3. t-band (p2-type1): 코호트 간 차이가 커질수록 t값이 띠 밖으로 퍼진다 (원문 Fig. 4, 덱 14장) ---------- */
  function tStrip(svg, W, x, y0, ticks, label) {
    const band = s('rect', { x: x(-1.96), y: y0 - 150, width: x(1.96) - x(-1.96), height: 156, css: 'fill:var(--soft)' }, svg);
    s('line', { x1: x.x0, x2: x.x1, y1: y0 + 6, y2: y0 + 6, css: 'stroke:var(--faint)' }, svg);
    ticks.forEach(n => { s('line', { x1: x(n), x2: x(n), y1: y0 + 6, y2: y0 + 11, css: 'stroke:var(--faint)' }, svg); s('text', T_(x(n), y0 + 26, String(n).replace('-', '−'), '', 'middle'), svg); });
    s('text', T_(x(1.96) + 6, y0 - 138, '띠 안이 |t| < 1.96', 'font-size:12px'), svg);
    s('text', T_(x.x1, y0 + 44, label, 'font-size:12px', 'end'), svg);
    return band;
  }
  GV.reg('t-band', host => {
    const W = 640, H = 420, M = SIM.get(), N = M.NSIM;
    const F = GV.frame(host, { kind: '도식', title: '기대 ATT가 0인 자료에서 t값 500개 (원문 Fig. 4의 재계산)', w: W, h: H, controls: true,
      note: '코호트별 효과 증가 속도를 평균 0, 표준편차 hσ인 정규분포에서 추출하므로 모든 모의자료의 기대 ATT는 0이다. 위는 t값 500개(주 단위 군집강건 표준오차, ±22를 넘는 값은 양 끝에 표시), 아래는 h에 따른 유의하지 않은 비율이다. 덱이 균형패널로 다시 계산한 값이다.' });
    F.bar.remove(); F.cap.remove();
    const svg = F.svg, x = lin(-22, 22, 40, W - 30); x.x0 = 40; x.x1 = W - 30; const y0 = 190;
    tStrip(svg, W, x, y0, [-20, -10, 0, 10, 20], 't값');
    const big = s('text', T_(40, 22, '', 'font-size:17px;font-weight:800;fill:var(--ink)'), svg), sub = s('text', T_(40, 42, '', 'font-size:12.5px'), svg);
    const dots = []; for (let i = 0; i < N; i++) dots.push(s('circle', { cx: x(0), cy: y0, r: 2.6, css: 'fill:var(--ink)', opacity: .55 }, svg));
    // 아래 곡선
    const HS = []; for (let i = 0; i <= 40; i++) HS.push(i * .0025); const ins = HS.map(h => M.insig(h));
    const cx = lin(0, .1, 70, W - 40), cy = lin(0, 1, 392, 262);
    [0, .5, 1].forEach(n => { s('line', { x1: 70, x2: W - 40, y1: cy(n), y2: cy(n), css: 'stroke:var(--line)' }, svg); s('text', T_(62, cy(n) + 4, Math.round(n * 100) + '%', '', 'end'), svg); });
    [0, .025, .05, .075, .1].forEach(n => s('text', T_(cx(n), 410, (n * 100).toFixed(1).replace('.0', '') + '%', '', 'middle'), svg));
    s('line', { x1: 70, x2: W - 40, y1: cy(.95), y2: cy(.95), css: 'stroke:var(--bad);stroke-width:1.4;stroke-dasharray:6 5' }, svg);
    s('text', T_(W - 40, cy(.95) - 5, '설계대로라면 95%', 'font-size:12px;fill:var(--bad)', 'end'), svg);
    s('text', T_(70, 250, '유의하지 않은 모의자료의 비율 (가로축은 증가 속도의 표준편차 h, σ 대비)', 'font-size:12.5px;font-weight:600;fill:var(--ink)'), svg);
    s('path', { pts: HS.map((h, i) => [cx(h), cy(ins[i])]), css: 'fill:none;stroke:var(--ink);stroke-width:2.5;stroke-linejoin:round' }, svg);
    const mk = s('circle', { cx: cx(0), cy: cy(ins[0]), r: 6.5, css: 'fill:var(--ink);stroke:var(--bg);stroke-width:2' }, svg);
    function draw(h, anim) {
      const idx = Math.round(h / .0025), t = M.tstats(h), tc = Array.from(t, z => Math.max(-22, Math.min(22, z))), o = { dur: anim ? 600 : 0 };
      const mx = maxBin(tc, x, 6), pos = dotStack(tc, x, 6, y0, Math.min(5.5, 140 / mx), 40, W - 30);
      dots.forEach((d, i) => { const sig = Math.abs(t[i]) >= 1.96; d.style.fill = sig ? 'var(--bad)' : 'var(--ink)'; to(d, { cx: pos[i][0], cy: pos[i][1], opacity: sig ? .8 : .5 }, o); });
      const p = ins[idx]; big.textContent = `유의하지 않은 모의자료 ${Math.round(p * 100)}%`;
      sub.textContent = h === 0 ? '코호트 간 차이가 없으면 검정이 설계대로 작동한다' : `기대 ATT는 0인데 ${Math.round((1 - p) * 100)}%가 5% 수준에서 유의하다`;
      sub.style.fill = p < .9 ? 'var(--bad)' : 'var(--muted)';
      to(mk, { cx: cx(h), cy: cy(p) }, o);
    }
    GV.slider(F.top, '증가 속도의 표준편차 h', { min: 0, max: 0.1, step: 0.0025, value: 0.03, fmt: v => 'σ의 ' + (v * 100).toFixed(2).replace(/\.?0+$/, '') + '%' }, v => draw(v, true));
    draw(0.03, false);
  });

  /* ---------- 3b. t-fix (p2-type2): Sim 5와 Sim 6의 t값 (덱 13장) ---------- */
  GV.reg('t-fix', host => {
    const W = 640, H = 250, M = SIM.get(), N = M.NSIM;
    const F = GV.frame(host, { kind: '도식', title: 'Sim 5와 Sim 6에서 TWFE 계수의 t값 500개 (덱 계산)', w: W, h: H, controls: true,
      note: 't값은 주 단위 군집강건 표준오차로 계산했다. 원문은 추정치의 분포까지만 제시했고 t값과 비율은 덱이 같은 모의자료에서 계산한 값이다.' });
    F.bar.remove(); F.cap.remove();
    const svg = F.svg, x = lin(-9, 6, 40, W - 30); x.x0 = 40; x.x1 = W - 30; const y0 = 200;
    tStrip(svg, W, x, y0, [-8, -6, -4, -2, 0, 2, 4, 6], 't값');
    const big = s('text', T_(40, 22, '', 'font-size:17px;font-weight:800;fill:var(--ink)'), svg), sub = s('text', T_(40, 42, '', 'font-size:12.5px'), svg);
    const dots = []; for (let i = 0; i < N; i++) dots.push(s('circle', { cx: x(0), cy: y0, r: 2.6, css: 'fill:var(--ink)', opacity: .6 }, svg));
    const TS = { 5: M.tfix([.03, .03, .03]), 6: M.tfix([.05, .03, .01]) };
    function draw(sim, anim) {
      const t = TS[sim], tr = M.truth[sim], est = M.est(sim), o = { dur: anim ? 800 : 0 };
      const mx = maxBin(Array.from(t), x, 6), pos = dotStack(Array.from(t), x, 6, y0, Math.min(5.5, 140 / mx), 40, W - 30);
      let ins = 0, neg = 0;
      dots.forEach((d, i) => { const sig = Math.abs(t[i]) >= 1.96; if (!sig) ins++; if (t[i] <= -1.96) neg++; d.style.fill = (sim === 6 || !sig) ? 'var(--bad)' : 'var(--ink)'; to(d, { cx: pos[i][0], cy: pos[i][1] }, { dur: o.dur, delay: anim ? (i % 20) * 8 : 0 }); });
      if (sim === 5) { big.textContent = `유의하지 않은 모의자료 ${Math.round(ins / N * 100)}%`; sub.textContent = `기업평균 ATT는 ${sg(tr.firm / M.SIG)}인데 TWFE 평균은 ${sg(meanOf(est))}다. 붉은 점이 효과가 없다는 결론이 나오는 모의자료다.`; }
      else { big.textContent = `유의한 음수 ${Math.round(neg / N * 100)}%`; sub.textContent = `세 코호트의 참효과는 모두 양수(기업평균 ATT ${sg(tr.firm / M.SIG)})인데 모든 모의자료에서 정책이 해롭다는 결론이 나온다.`; }
      sub.style.fill = 'var(--bad)';
    }
    GV.seg(F.top, '설정', [[5, 'Sim 5 (같은 속도로 증가)'], [6, 'Sim 6 (다른 속도로 증가)']], 5, v => draw(v, true));
    draw(5, false);
  });

  /* ---------- 4. es-grid (p2-es): 상대시점 더미가 달력 연도 격자에서 무엇을 가리키는가 ---------- */
  GV.reg('es-grid', host => {
    const W = 640, H = 300, T = 36, CW = 15, X0 = 78, RY = [64, 120, 176], RH = 42, xOf = t => X0 + t * CW;
    const relOf = (k, t) => 1980 + t - COH[k].g;
    stepper(host, {
      kind: '도식', title: '사건연구의 더미가 가리키는 칸 (덱 15장 사양, 코호트 셋)', w: W, h: H,
      steps: [
        '행은 코호트, 열은 달력 연도다. 진한 칸이 도입 이후이고 정적 TWFE는 이 칸 전체를 더미 하나로 요약했다.',
        '칸마다 상대시점 ℓ = t − G(달력 연도 − 도입 연도)를 적는다. 같은 2010년이라도 1989년 코호트는 +21, 1998년 코호트는 +12, 2007년 코호트는 +3이다. 그림에는 −5부터 +5까지만 숫자로 적었다.',
        '기준기간 ℓ = −1(도입 직전 해)의 칸은 더미에서 제외한다. 사건연구의 모든 계수는 이 해와 비교한 차이로 읽는다.',
        '양 끝은 구간으로 묶는다. ℓ ≤ −6인 칸은 모두 더미 하나, ℓ ≥ 6인 칸도 모두 더미 하나다(덱 15장과 원문 Fig. 5의 사양). 묶인 칸들의 효과가 같다고 가정한 것이다.',
        '같은 상대시점의 칸은 코호트와 달력 연도가 달라도 한 더미로 들어간다. ℓ = +3 더미는 1992년, 2001년, 2010년 칸을 함께 가리키고 그 계수는 세 코호트의 +3기 효과를 대표하도록 의도된 값이다.',
        '그런데 회귀가 이 계수를 계산할 때는 표시한 칸만 사용하지 않는다. 연도 고정효과를 통해 같은 해의 이미 처치된 코호트 칸도 비교에 들어간다. 이 문제가 아래 Fig. 5와 Sun-Abraham 분해의 주제다.'
      ],
      init(svg) {
        COH.forEach((c, k) => s('text', T_(X0 - 10, RY[k] + RH / 2 + 5, c.g + '년', `font-size:13px;font-weight:700;fill:var(--${c.c})`, 'end'), svg));
        [1980, 1989, 1998, 2007, 2015].forEach(n => s('text', T_(xOf(n - 1980) + CW / 2, RY[2] + RH + 20, String(n), '', 'middle'), svg));
        const cells = COH.map((c, k) => Array.from({ length: T }, (_, t) => {
          const l = relOf(k, t), post = l >= 0;
          const r = s('rect', { x: xOf(t) + .5, y: RY[k], width: CW - 1, height: RH, css: `fill:var(--${post ? c.c : 'soft'})`, opacity: post ? .85 : 1 }, svg);
          const tx = (l >= -5 && l <= 5) ? s('text', T_(xOf(t) + CW / 2, RY[k] + RH / 2 + 4, String(l).replace('-', '−'), `font-size:10.5px;font-weight:600;fill:var(${post ? '--bg' : '--ink'})`, 'middle'), svg) : null;
          if (tx) to(tx, { opacity: 0 }, { dur: 0 });
          return { r, tx, l, post, k, t };
        }));
        const flat = cells.flat();
        const refs = flat.filter(c => c.l === -1).map(c => s('rect', { x: xOf(c.t) + 1.5, y: RY[c.k] + 1, width: CW - 3, height: RH - 2, css: 'fill:none;stroke:var(--ink);stroke-width:2;stroke-dasharray:3 2', opacity: 0 }, svg));
        const refLab = s('text', T_(xOf(1988 - 1980) + CW / 2, RY[0] - 10, '기준 (−1)', 'font-size:12px;font-weight:700;fill:var(--ink)', 'middle'), svg); to(refLab, { opacity: 0 }, { dur: 0 });
        // 구간 묶음 표시: 코호트별 연속 구간에 윤곽선
        const binBox = (k, a, b, col) => s('rect', { x: xOf(a) - .5, y: RY[k] - 3, width: (b - a + 1) * CW + 1, height: RH + 6, css: `fill:none;stroke:var(--${col});stroke-width:2.2`, opacity: 0 }, svg);
        const bins = [];
        COH.forEach((c, k) => {
          const pre = cells[k].filter(z => z.l <= -6).map(z => z.t), post = cells[k].filter(z => z.l >= 6).map(z => z.t);
          if (pre.length) bins.push(binBox(k, Math.min(...pre), Math.max(...pre), 'muted'));
          if (post.length) bins.push(binBox(k, Math.min(...post), Math.max(...post), 'bad'));
        });
        const binLab = [s('text', T_(X0, RY[0] - 10, 'ℓ ≤ −6 묶음 (회색 윤곽)', 'font-size:12px;fill:var(--muted)'), svg), s('text', T_(xOf(35) + CW, RY[0] - 10, 'ℓ ≥ 6 묶음 (붉은 윤곽)', 'font-size:12px;fill:var(--bad)', 'end'), svg)];
        binLab.forEach(e => to(e, { opacity: 0 }, { dur: 0 }));
        const p3 = flat.filter(c => c.l === 3).map(c => s('rect', { x: xOf(c.t) - 1, y: RY[c.k] - 4, width: CW + 2, height: RH + 8, css: 'fill:none;stroke:var(--ink);stroke-width:3', opacity: 0 }, svg));
        const p3Lab = s('text', T_(X0, H - 30, 'ℓ = +3 더미: 1992년, 2001년, 2010년 칸', 'font-size:13px;font-weight:700;fill:var(--ink)'), svg); to(p3Lab, { opacity: 0 }, { dur: 0 });
        // 6단계: 2010년 열에서 이미 처치된 코호트 칸
        const col2010 = [0, 1].map(k => s('rect', { x: xOf(30) - 1, y: RY[k] - 4, width: CW + 2, height: RH + 8, css: 'fill:none;stroke:var(--bad);stroke-width:3;stroke-dasharray:4 3', opacity: 0 }, svg));
        const lab6 = s('text', T_(xOf(30) - 8, RY[0] - 10, '같은 2010년의 이미 처치된 코호트 칸', 'font-size:12px;font-weight:600;fill:var(--bad)', 'end'), svg); to(lab6, { opacity: 0 }, { dur: 0 });
        const ttl = s('text', T_(X0, 24, '', 'font-size:13px;font-weight:600;fill:var(--ink)'), svg);
        const TT = ['도입 이후 칸 (정적 TWFE의 D = 1)', '상대시점 ℓ = 달력 연도 − 도입 연도', '기준기간 ℓ = −1은 제외', '양 끝 구간 묶음', '같은 상대시점은 같은 더미', '연도 고정효과가 끌어들이는 칸'];
        return (st, anim) => {
          const o = { dur: anim ? 500 : 0 };
          ttl.textContent = TT[st];
          flat.forEach(c => {
            let op = c.post ? .85 : 1;
            if (st >= 3 && (c.l <= -6 || c.l >= 6)) op = c.post ? .35 : .45;
            if (st === 4 && c.l !== 3) op = c.post ? .3 : .5;
            if (st === 5) op = (c.l === 3 || (c.t === 30 && c.k < 2)) ? .9 : (c.post ? .3 : .5);
            to(c.r, { opacity: op }, o);
            if (c.tx) show(c.tx, st >= 1 && (st !== 4 || c.l === 3) && (st !== 5 || c.l === 3), o);
          });
          refs.forEach(r => show(r, st >= 2 && st <= 3, o)); show(refLab, st === 2, o);
          bins.forEach(b => show(b, st === 3, o)); binLab.forEach(b => show(b, st === 3, o));
          p3.forEach(r => show(r, st >= 4, { dur: o.dur, delay: anim && st === 4 ? 200 : 0 })); show(p3Lab, st >= 4, o);
          col2010.forEach(r => show(r, st === 5, o)); show(lab6, st === 5, o);
        };
      }
    });
  });

  /* ---------- 5. es-plot (p2-fig5): TWFE 사건연구 계수의 기댓값과 참 경로 (원문 Fig. 5, 덱 15장) ---------- */
  GV.reg('es-plot', host => {
    const W = 640, H = 338, M = SIM.get();
    const F = GV.frame(host, { kind: '도식', title: 'TWFE 사건연구 계수와 참 경로 (덱 계산, 균형패널 단순화)', w: W, h: H, controls: true,
      note: '점은 TWFE 사건연구 계수의 기댓값, 세로선은 모의자료 500개의 2.5-97.5 백분위수 범위, 굵은 점선은 상대시점별 참 경로다. 사양은 원문 Fig. 5와 같다(−5부터 +5까지 더미, 양 끝 구간 묶음, −1 제외). 원문 그림은 불균형 패널이라 수치가 조금 다르다.' });
    F.bar.remove();
    const svg = F.svg, x = lin(-5, 5, 80, W - 40), y = lin(-.3, .4, 290, 40);
    GV.yAxis(svg, y, [-.2, -.1, 0, .1, .2, .3, .4], 72, W - 30, v => v === 0 ? '0' : fmt(v, 1) + 'σ');
    for (let l = -5; l <= 5; l++) s('text', T_(x(l), 312, String(l).replace('-', '−'), '', 'middle'), svg);
    s('text', T_(W - 30, 328, '상대시점 ℓ (년)', 'font-size:12px', 'end'), svg);
    s('line', { x1: x(-.5), x2: x(-.5), y1: 40, y2: 296, css: 'stroke:var(--faint);stroke-width:1.2;stroke-dasharray:5 5' }, svg);
    const P = { a: [1989, 1998, 2007].map(g => ST.effPath('6b', g)), b: [1989, 1998, 2007].map(g => ST.sim7Path(g)) };
    const D = {}; for (const k of ['a', 'b']) { const ev = M.event(P[k]), m = new Map(ev.map(o => [o.l, o])); m.set(-1, { l: -1, mean: 0, lo: 0, hi: 0 }); D[k] = { ev: [...m.values()].sort((p, q) => p.l - q.l), tr: M.trueEvent(P[k]) }; }
    const truth = s('path', { pts: D.a.tr.map(o => [x(o.l), y(o.v)]), css: 'fill:none;stroke:var(--ink);stroke-width:3;stroke-dasharray:9 6' }, svg);
    const marks = D.a.ev.map(o => ({ w: s('line', { x1: x(o.l), x2: x(o.l), y1: y(o.lo), y2: y(o.hi), css: 'stroke:var(--bad)', 'stroke-width': 2.2 }, svg), p: s('circle', { cx: x(o.l), cy: y(o.mean), r: 6, css: o.l === -1 ? 'fill:var(--bg);stroke:var(--bad);stroke-width:2' : 'fill:var(--bad)' }, svg) }));
    s('text', T_(x(-1), y(0) + 22, '기준', 'font-size:11.5px', 'middle'), svg);
    const lg = s('g', {}, svg); s('line', { x1: 380, x2: 414, y1: 18, y2: 18, css: 'stroke:var(--ink);stroke-width:3;stroke-dasharray:9 6' }, lg); const lgT = s('text', T_(420, 22, '참 평균효과', 'font-size:12.5px'), lg);
    s('circle', { cx: 530, cy: 18, r: 5.5, css: 'fill:var(--bad)' }, lg); s('text', T_(540, 22, 'TWFE 계수', 'font-size:12.5px'), lg);
    const ring = s('circle', { cx: x(-3), cy: y(D.a.ev[2].mean), r: 13, css: 'fill:none;stroke:var(--ink);stroke-width:2.2' }, svg);
    const DESC = {
      a: d => `<span class="vn">1</span><span><strong>사전추세 없는 자료</strong> (효과가 코호트별로 매년 0.10σ, 0.05σ, 0.01σ씩 커진다). 도입 전 참효과는 0인데 −3기 계수가 ${sg(d.ev[2].mean)}로 0에서 벗어나고(원), 4-5년 뒤 계수는 ${sg(d.ev[9].mean)}, ${sg(d.ev[10].mean)}로 음수다. 참값은 ${sg(d.tr[9].v)}, ${sg(d.tr[10].v)}다. 연구자는 이를 평행추세 위반으로 읽고 실제 효과를 폐기하게 된다.</span>`,
      b: d => `<span class="vn">2</span><span><strong>사전추세 있는 자료</strong> (Sim 7, 효과는 0이고 도입 전 기울기가 코호트마다 다르다). 참 경로는 −5기 ${sg(d.tr[0].v)}에서 도입 시점의 0으로 상승하는데 TWFE 계수는 −5기 ${sg(d.ev[0].mean)}, −3기 ${sg(d.ev[2].mean)}로 사전추세를 뚜렷하게 보여 주지 않는다.</span>`
    };
    function draw(k, anim) {
      const d = D[k], o = { dur: anim ? 800 : 0 };
      to(truth, { pts: d.tr.map(p => [x(p.l), y(p.v)]) }, o);
      marks.forEach((m, i) => { const e = d.ev[i]; to(m.p, { cy: y(e.mean) }, o); to(m.w, { y1: y(e.lo), y2: y(e.hi) }, o); });
      lgT.textContent = k === 'a' ? '참 평균효과' : '참 경로';
      to(ring, { cy: y(d.ev[2].mean), opacity: k === 'a' ? 1 : 0 }, o);
      F.cap.innerHTML = DESC[k](d);
    }
    GV.seg(F.top, '자료', [['a', '사전추세 없음, 효과가 커짐'], ['b', '사전추세 있음, 효과 0 (Sim 7)']], 'a', v => draw(v, true));
    draw('a', false);
  });

  /* ---------- 6. sa-heat (p2-sa): 사건연구 계수 하나가 (코호트, 경과연수) 칸에 주는 가중치 (덱 16장) ---------- */
  GV.reg('sa-heat', host => {
    const W = 640, H = 300, M = SIM.get(), SIG = M.SIG, NL = COH.map(c => 2016 - c.g);
    const F = GV.frame(host, { kind: '도식', title: '사건연구 계수 하나가 각 CATT 칸에 주는 가중치 (덱 16장, 덱 계산)', w: W, h: H, controls: true,
      note: '칸 하나가 (코호트, 도입 후 경과연수)의 효과 CATT다. 칸의 농도가 가중치의 크기이고, 무채색은 양, 붉은색은 음이다. 계수 = Σ 가중치 × CATT이고, 효과 값은 15장(위 Fig. 5 도식)의 사전추세 없는 자료다. 가중치는 덱과 같은 사건연구 사양에서 칸 하나만 1인 결과를 넣어 계산했다.' });
    F.bar.remove();
    const svg = F.svg, CW = 19, X0 = 86, RY = [46, 104, 162], RH = 34, cxOf = e => X0 + e * CW + CW / 2;
    const P = COH.map(c => ST.effPath('6b', c.g)), eff = (k, e) => P[k][COH[k].g - 1980 + e] / SIG, tr = M.trueEvent(P);
    COH.forEach((c, k) => s('text', T_(X0 - 10, RY[k] + RH / 2 + 5, c.g + '년', `font-size:13px;font-weight:700;fill:var(--${c.c})`, 'end'), svg));
    const cells = COH.map((c, k) => Array.from({ length: NL[k] }, (_, e) => { s('rect', { x: X0 + e * CW + .5, y: RY[k], width: CW - 1, height: RH, css: 'fill:var(--soft)' }, svg); return s('rect', { x: X0 + e * CW + .5, y: RY[k], width: CW - 1, height: RH, css: 'fill:var(--ink)', opacity: 0 }, svg); }));
    [0, 5, 10, 15, 20].forEach(e => s('text', T_(cxOf(e), RY[2] + RH + 16, String(e), '', 'middle'), svg));
    s('text', T_(X0 + 27 * CW, RY[2] + RH + 16, '도입 후 경과연수 e', 'font-size:12px', 'end'), svg);
    const bk = (a, b, txt) => { const xa = X0 + a * CW + 2, xb = X0 + (b + 1) * CW - 2, yy = RY[2] + RH + 24; s('path', { d: `M${xa},${yy}V${yy + 5}H${xb}V${yy}`, css: 'fill:none;stroke:var(--muted);stroke-width:1.3' }, svg); s('text', T_((xa + xb) / 2, yy + 20, txt, 'font-size:12px', 'middle'), svg); };
    bk(0, 5, '0-5기는 더미 하나씩'); bk(6, 26, '6기 이후는 한 구간으로 묶음');
    const box = s('rect', { x: 0, y: RY[0] - 4, width: CW + 4, height: RY[2] + RH - RY[0] + 8, css: 'fill:none;stroke:var(--ink);stroke-width:2.4', tx: X0 + 3 * CW - 2 }, svg);
    const vals = Array.from({ length: 16 }, () => s('text', T_(0, 0, '', 'font-size:11.5px;font-weight:700', 'middle'), svg));
    const row = [['원하는 칸의 기여', 86], ['+ 다른 칸의 기여', 236], ['= TWFE 계수', 386], ['참 평균효과', 516]].map(([t, xx]) => { s('text', T_(xx, 262, t, 'font-size:12px'), svg); return s('text', T_(xx, 288, '', 'font-size:19px;font-weight:800;fill:var(--ink)'), svg); });
    const lt = l => (l > 0 ? '+' : l < 0 ? '−' : '') + Math.abs(l) + '기';
    function draw(l, anim) {
      const w = M.evWeights(l), o = { dur: anim ? 500 : 0 };
      let own = 0, oth = 0; const big = [];
      w.forEach((r, k) => r.forEach((val, e) => { if (e === l) own += val * eff(k, e); else oth += val * eff(k, e); if (Math.abs(val) >= .1) big.push({ k, e, w: val }); }));
      cells.forEach((rw, k) => rw.forEach((c, e) => { const val = w[k][e]; c.style.fill = val < 0 ? 'var(--bad)' : 'var(--ink)'; to(c, { opacity: Math.pow(Math.min(1, Math.abs(val) / .34), .55) }, { dur: o.dur, delay: anim ? e * 12 : 0 }); }));
      to(box, { tx: X0 + Math.max(l, 0) * CW - 2, opacity: l >= 0 ? 1 : 0 }, o);
      vals.forEach((t, i) => { const b = big[i]; if (!b) { to(t, { opacity: 0 }, { dur: 0 }); return; } const inside = b.e === l; t.textContent = fmt(b.w, 2); t.style.fill = inside ? 'var(--bg)' : (b.w < 0 ? 'var(--bad)' : 'var(--ink)'); t.style.fontSize = inside ? '10px' : '11.5px'; to(t, { x: cxOf(b.e), y: inside ? RY[b.k] + RH / 2 + 4 : RY[b.k] - 5, opacity: 1 }, { dur: 0 }); });
      const tru = tr.find(q => q.l === l).v, coef = own + oth;
      row[0].textContent = sg(own, 2); row[1].textContent = sg(oth, 2); row[1].style.fill = Math.abs(oth) > .005 ? 'var(--bad)' : 'var(--ink)';
      row[2].textContent = sg(coef, 2); row[2].style.fill = Math.abs(coef - tru) > .02 ? 'var(--bad)' : 'var(--ink)'; row[3].textContent = sg(tru, 2);
      F.cap.innerHTML = `<span class="vn">ℓ</span><span><strong>${lt(l)} 계수</strong>. ${l >= 0 ? `추정하려는 것은 테두리 친 ${lt(l)} 칸 세 개의 효과이고 이 칸들의 가중치 합은 1이다.` : `추정하려는 효과는 도입 전이라 0인데, 도입 후 칸들의 가중치 때문에 계수가 0이 되지 않는다.`} 다른 칸의 가중치는 구간마다 합이 0이어서 그 구간 안의 효과가 같을 때만 상쇄된다. 이 자료는 효과가 계속 커지므로 상쇄되지 않는다.</span>`;
    }
    GV.seg(F.top, '계수', [-5, -4, -3, -2, 0, 1, 2, 3, 4, 5].map(l => [l, lt(l)]), 3, v => draw(v, true));
    draw(3, false);
  });
})();
