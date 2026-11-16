/* 1부 도식. GV(viz-kit.js) 사용. */
(function () {
  'use strict';
  const { s, to, show, lin, C, stepper, count } = GV;

  /* ---------- did-copy (p1-did): 비교집단의 변화를 처치집단 출발점으로 옮겨 반사실을 만든다 (덱 4장 수치) ---------- */
  GV.reg('did-copy', host => {
    const W = 620, H = 330, x = lin(0, 1, 150, 430), y = lin(25, 65, 290, 40);
    stepper(host, {
      kind: '도식', title: '2×2 DID가 차감하는 것 (가상 수치, 덱 4장)', w: W, h: H,
      steps: [
        '처치집단 T(파랑)는 50에서 60으로, 비교집단 C(회색)는 30에서 34로 변했다. T의 변화 10에는 정책효과와 정책이 없었어도 일어났을 변화가 함께 들어 있다.',
        'C는 두 시점 모두 처치를 받지 않았으므로 C의 변화 +4는 정책 없이 일어난 변화다.',
        '평행추세 가정은 T도 정책이 없었다면 똑같이 4만큼 변했을 것이라는 가정이다. C의 변화 선분을 T의 출발점으로 옮기면 반사실적 결과 54(점선)가 된다.',
        '관측값 60과 반사실적 결과 54의 차이 6이 ATT다.',
        '같은 계산을 식으로 쓰면 (60 − 50) − (34 − 30) = 6이다. 이 계산은 차감한 +4가 처치 없이 일어난 변화일 때만 성립한다. 시차 도입에서는 이 조건이 깨진다.'
      ],
      init(svg) {
        const g0 = s('g', {}, svg);
        GV.yAxis(g0, y, [30, 40, 50, 60], 70, 560);
        s('text', { x: x(0), y: 316, 'text-anchor': 'middle', text: '도입 전' }, g0); s('text', { x: x(1), y: 316, 'text-anchor': 'middle', text: '도입 후' }, g0);
        const line = (a, b, col, dash) => s('line', { x1: x(0), y1: y(a), x2: x(1), y2: y(b), 'stroke-width': 4, css: `stroke:${col};stroke-linecap:round${dash ? ';stroke-dasharray:7 7' : ''}` }, svg);
        const dot = (t, v, col, hollow) => s('circle', { cx: x(t), cy: y(v), r: 6, css: hollow ? `fill:var(--bg);stroke:${col};stroke-width:2.5` : `fill:${col}` }, svg);
        const lab = (t, v, txt, col, dx = 14, anchor = 'start') => s('text', { x: x(t) + dx, y: y(v) + 5, 'text-anchor': anchor, css: `fill:${col};font-weight:700;font-size:14px`, text: txt }, svg);
        const T = line(50, 60, C('c1')), Cl = line(30, 34, C('u'));
        const lT = [dot(0, 50, C('c1')), dot(1, 60, C('c1')), lab(0, 50, '50', C('c1'), -14, 'end'), lab(1, 60, '60  T', C('c1'))];
        const lC = [dot(0, 30, C('u')), dot(1, 34, C('u')), lab(0, 30, '30', C('u'), -14, 'end'), lab(1, 34, '34  C', C('u'))];
        // C의 변화 강조 (오른쪽 세로 괄호)
        const brC = s('path', { d: `M${x(1) + 100},${y(30)}h8v${y(34) - y(30)}h-8`, css: 'fill:none;stroke:var(--u);stroke-width:2', opacity: 0 }, svg);
        const tC = s('text', { x: x(1) + 116, y: (y(30) + y(34)) / 2 + 5, css: 'fill:var(--u);font-weight:700;font-size:14px', text: '+4', opacity: 0 }, svg);
        // 복사본 선분: C 위치에서 출발해 T 출발점으로 이동
        const copy = s('line', { x1: x(0), y1: y(30), x2: x(1), y2: y(34), 'stroke-width': 4, css: 'stroke:var(--u);stroke-linecap:round;stroke-dasharray:7 7', opacity: 0 }, svg);
        const cf = [dot(1, 54, C('c1'), true), lab(1, 54, '54  반사실', C('c1'))];
        // ATT 괄호
        const brA = s('path', { d: `M${x(1) + 100},${y(54)}h8v${y(60) - y(54)}h-8`, css: 'fill:none;stroke:var(--bad);stroke-width:2.5', opacity: 0 }, svg);
        const tA = s('text', { x: x(1) + 116, y: (y(54) + y(60)) / 2 + 5, css: 'fill:var(--bad);font-weight:800;font-size:15px', text: 'ATT = 6', opacity: 0 }, svg);
        const eq = s('text', { x: 310, y: 22, 'text-anchor': 'middle', css: 'fill:var(--ink);font-weight:700;font-size:16px', text: 'DID = (60 − 50) − (34 − 30) = 10 − 4 = 6', opacity: 0 }, svg);
        cf.forEach(e => to(e, { opacity: 0 }, { dur: 0 }));
        return (st, anim) => {
          const o = { dur: anim ? 700 : 0 };
          show(brC, st >= 1, o); show(tC, st >= 1, o);
          to(Cl, { 'stroke-width': st === 1 ? 6 : 4 }, o);
          // 복사본: 1단계 이하에서는 C 위에 숨어 있고, 2단계에서 T 출발점으로 이동
          if (st >= 2) { show(copy, true, { dur: anim ? 200 : 0 }); to(copy, { y1: y(50), y2: y(54) }, { dur: anim ? 1100 : 0, delay: anim ? 150 : 0 }); }
          else { to(copy, { y1: y(30), y2: y(34) }, o); show(copy, false, o); }
          cf.forEach(e => show(e, st >= 2, { dur: anim ? 400 : 0, delay: anim && st === 2 ? 1200 : 0 }));
          show(brA, st >= 3, o); show(tA, st >= 3, o);
          show(eq, st >= 4, o);
          [T, ...lT].forEach(e => to(e, { opacity: st === 1 ? 0.35 : 1 }, o));
        };
      }
    });
  });
  const I = Infinity;
  const FR = v => {
    const c = [[0, '0'], [1 / 6, '1/6'], [1 / 3, '1/3'], [1 / 2, '1/2'], [2 / 3, '2/3'], [5 / 6, '5/6'], [1, '1'], [7 / 6, '7/6']];
    for (const [x, t] of c) if (Math.abs(Math.abs(v) - x) < 1e-9) return (v < 0 ? '−' : '') + t;
    return GV.fmt(v, 2);
  };
  let UID = 0;

  /* ---------- po-grid (p1-po): 관측되는 결과와 보이지 않는 Y(0) ---------- */
  GV.reg('po-grid', host => {
    const units = [
      { id: 'A', lab: 'A (2기 도입)', g: 1, y0: [10, 11, 12, 13], tau: [0, 2, 3, 4], col: 'c1' },
      { id: 'B', lab: 'B (3기 도입)', g: 2, y0: [6, 7, 8, 9], tau: [0, 0, 1, 2], col: 'c2' },
      { id: 'C', lab: 'C (미처치)', g: 9, y0: [3, 4, 5, 6], tau: [0, 0, 0, 0], col: 'u' }];
    const W = 640, H = 340, x0 = 130, cw = 120, y0 = 44, ch = 80;
    stepper(host, {
      kind: '도식', title: '관측되는 결과와 보이지 않는 잠재결과 (가상 수치)', w: W, h: H,
      steps: [
        '단위 A는 2기에, B는 3기에 처치를 받고 C는 끝까지 받지 않는다. 칸의 숫자는 실제로 관측된 결과 Y다. 색칠된 칸이 처치된 칸(D = 1)이다.',
        '처치된 칸에서 관측된 값은 처치를 받았을 때의 결과 Y(1)이며 처치되지 않은 칸의 값은 Y(0)이다. 한 칸에서는 두 잠재결과 가운데 하나만 보인다.',
        '처치된 칸의 Y(0), 곧 처치를 받지 않았다면 나왔을 결과는 어디에도 기록되어 있지 않다(점선 칸). 이것이 인과추론의 근본적인 결측 문제다.',
        '이 가상 예에서는 정답을 알고 있으므로 Y(0)를 채워 넣을 수 있다. 그러면 칸마다 처치효과 τ = Y(1) − Y(0)를 계산할 수 있다. 효과는 칸마다 다르며 A에서는 도입 후 시간이 지나며 커진다.',
        'ATT는 처치된 다섯 칸의 τ를 평균한 값 (2 + 3 + 4 + 1 + 2) / 5 = 2.4다. 실제 자료에서는 점선 칸을 볼 수 없으므로 DID는 비교집단의 변화로 그 칸을 채워 이 평균을 추정한다.'
      ],
      init(svg) {
        const st0 = s('g', {}, svg);
        [0, 1, 2, 3].forEach(t => s('text', { x: x0 + t * cw + cw / 2, y: y0 - 14, 'text-anchor': 'middle', css: 'font-size:13px', text: (t + 1) + '기' }, st0));
        const cells = [];
        units.forEach((u, r) => {
          s('text', { x: x0 - 12, y: y0 + r * ch + ch / 2 + 5, 'text-anchor': 'end', css: `fill:${C(u.col)};font-weight:700;font-size:13.5px`, text: u.lab }, st0);
          [0, 1, 2, 3].forEach(t => {
            const tr = t >= u.g, X = x0 + t * cw, Y = y0 + r * ch;
            s('rect', { x: X + 3, y: Y + 3, width: cw - 6, height: ch - 6, rx: 3, css: `fill:${tr ? C(u.col + '-soft') : C('soft')};stroke:${tr ? C(u.col) : 'none'};stroke-width:1.5` }, svg);
            const obs = u.y0[t] + u.tau[t];
            const c = { tr, u, t };
            c.val = s('text', { x: tr ? X + 34 : X + cw / 2, y: Y + 46, 'text-anchor': 'middle', css: 'fill:var(--ink);font-weight:800;font-size:21px', text: String(obs) }, svg);
            c.tag = s('text', { x: tr ? X + 34 : X + cw / 2, y: Y + 22, 'text-anchor': 'middle', css: `fill:${C(tr ? u.col : 'muted')};font-weight:700;font-size:12px`, text: tr ? 'Y(1)' : 'Y(0)', opacity: 0 }, svg);
            if (tr) {
              c.box = s('rect', { x: X + 64, y: Y + 26, width: 46, height: 28, rx: 2, css: `fill:var(--bg);stroke:${C(u.col)};stroke-width:1.5;stroke-dasharray:4 3`, opacity: 0 }, svg);
              c.btag = s('text', { x: X + 87, y: Y + 22, 'text-anchor': 'middle', css: `fill:${C(u.col)};font-weight:700;font-size:12px`, text: 'Y(0)', opacity: 0 }, svg);
              c.bval = s('text', { x: X + 87, y: Y + 46, 'text-anchor': 'middle', css: 'fill:var(--muted);font-weight:700;font-size:16px', text: '?', opacity: 0 }, svg);
              c.tau = s('text', { x: X + cw / 2, y: Y + 71, 'text-anchor': 'middle', css: 'fill:var(--ink);font-weight:700;font-size:12.5px', text: `τ = ${obs} − ${u.y0[t]} = ${u.tau[t]}`, opacity: 0 }, svg);
            }
            cells.push(c);
          });
        });
        const att = s('text', { x: x0 + 2 * cw, y: y0 + 3 * ch + 32, 'text-anchor': 'middle', css: 'fill:var(--bad);font-weight:800;font-size:16px', text: 'ATT = (2 + 3 + 4 + 1 + 2) / 5 = 2.4', opacity: 0 }, svg);
        return (st, anim) => {
          const o = { dur: anim ? 500 : 0 };
          cells.forEach((c, i) => {
            show(c.tag, st >= 1, o);
            if (c.tr) {
              show(c.box, st >= 2, o); show(c.btag, st >= 2, o); show(c.bval, st >= 2, o);
              c.bval.textContent = st >= 3 ? String(c.u.y0[c.t]) : '?';
              show(c.tau, st >= 3, { dur: o.dur, delay: anim && st === 3 ? 120 * (i % 4) : 0 });
            }
          });
          show(att, st >= 4, o);
        };
      }
    });
  });

  /* ---------- fwl-scatter (p1-fwl): 잔차 D̃를 만들고, 산점도의 기울기가 TWFE 계수임을 보인다 ---------- */
  GV.reg('fwl-scatter', host => {
    const W = 640, H = 390;
    let tauE3 = 10, cur = 0, sl = null, drawLine = null;
    // 칸: [단위, 시점]. E는 2기(인덱스 1), L은 3기(인덱스 2)에 도입
    const cells = [['E', 0], ['E', 1], ['E', 2], ['L', 0], ['L', 1], ['L', 2]];
    const Dm = { E: [0, 1, 1], L: [0, 0, 1] }, Di = { E: 2 / 3, L: 1 / 3 }, Dt = [0, 1 / 2, 1], Dbar = 1 / 2;
    const step1 = (u, t) => Dm[u][t] - Di[u], resid = (u, t) => Dm[u][t] - Di[u] - Dt[t] + Dbar;
    const Yof = (u, t) => u === 'E' ? [0, 2, tauE3][t] : [0, 0, 2][t];
    const gx = t => 190 + t * 104, gy = u => u === 'E' ? 78 : 160;
    const sx = lin(-0.45, 0.45, 90, 600), sy = lin(-1, 13, 350, 36);
    stepper(host, {
      kind: '도식', title: 'FWL 정리로 본 TWFE 계수 (E와 L 반례, 가상 수치)', w: W, h: H, controls: true,
      steps: [
        'E는 2기에, L은 3기에 도입한다. 칸의 큰 숫자는 처치변수 D이며 오른쪽 위 작은 숫자는 결과 Y다(덱 6장의 효과 2, 10, 2, 미처치 결과는 0).',
        '단위 평균을 제거한다. E는 세 기 가운데 두 기 처치되어 단위 평균이 2/3, L은 1/3이다. 칸의 값은 D에서 단위 평균을 차감한 값이 된다.',
        '시점 평균을 제거하고 전체 평균 1/2을 더한다. 시점별 처치 비율은 0, 1/2, 1이다. 남은 값이 잔차 D̃이며 행의 합과 열의 합이 모두 0이다.',
        'E의 3기는 실제로 처치된 칸인데 D̃가 −1/6로 음수다. 고정효과만으로 예측한 처치 정도가 2/3 + 1 − 1/2 = 7/6로 1을 초과하기 때문이다.',
        '여섯 칸을 점으로 옮겨 가로축에 D̃, 세로축에 Y를 둔다. FWL 정리에 따르면 TWFE 계수는 이 산점도에 맞춘 직선의 기울기 ΣD̃Y / ΣD̃²다.',
        '직선의 기울기는 −2다. 효과가 가장 큰 E 3기(Y = 10)가 D̃ &lt; 0 쪽에 놓여 직선의 왼쪽을 끌어올리므로 처치효과가 모두 양수인데도 기울기가 음수가 된다.',
        '위 슬라이더로 E 3기의 효과를 바꿀 수 있다. 효과가 2이면 기울기는 2, 6이면 0, 10이면 −2다. 계수는 3 − (E 3기 효과)/2로 움직인다.'
      ],
      init(svg, F) {
        sl = GV.slider(F.top, 'E 3기의 효과', { min: 0, max: 14, step: 1, value: 10, fmt: v => String(v) }, v => { tauE3 = v; if (drawLine) drawLine(true); });
        sl.input.disabled = true;
        // 격자
        const grid = s('g', {}, svg);
        [0, 1, 2].forEach(t => s('text', { x: gx(t), y: 34, 'text-anchor': 'middle', css: 'font-size:13px', text: (t + 1) + '기' }, grid));
        ['E', 'L'].forEach(u => s('text', { x: 118, y: gy(u) + 6, 'text-anchor': 'end', css: `fill:${C(u === 'E' ? 'c1' : 'c2')};font-weight:800;font-size:15px`, text: u }, grid));
        const box = {}, val = {}, yv = {};
        cells.forEach(([u, t]) => {
          const k = u + t, tr = Dm[u][t] === 1, col = u === 'E' ? 'c1' : 'c2';
          box[k] = s('rect', { x: gx(t) - 46, y: gy(u) - 32, width: 92, height: 64, rx: 3, 'stroke-width': tr ? 2 : 0, css: `fill:${tr ? C(col + '-soft') : C('soft')};stroke:${C(col)}` }, grid);
          val[k] = s('text', { x: gx(t), y: gy(u) + 8, 'text-anchor': 'middle', css: 'fill:var(--ink);font-weight:800;font-size:20px', text: String(Dm[u][t]) }, grid);
          yv[k] = s('text', { x: gx(t) + 40, y: gy(u) - 17, 'text-anchor': 'end', css: 'fill:var(--muted);font-size:11.5px', text: 'Y ' + Yof(u, t) }, grid);
        });
        const rowm = ['E', 'L'].map(u => s('text', { x: 462, y: gy(u) + 6, css: `fill:${C(u === 'E' ? 'c1' : 'c2')};font-weight:700;font-size:13px`, text: `단위 평균 ${FR(Di[u])}`, opacity: 0 }, grid));
        const colm = [0, 1, 2].map(t => s('text', { x: gx(t), y: 220, 'text-anchor': 'middle', css: 'fill:var(--muted);font-weight:700;font-size:13px', text: `시점 평균 ${FR(Dt[t])}`, opacity: 0 }, grid));
        const allm = s('text', { x: 462, y: 220, css: 'fill:var(--muted);font-weight:700;font-size:13px', text: '전체 평균 1/2', opacity: 0 }, grid);
        const note = s('text', { x: gx(2), y: 262, 'text-anchor': 'middle', css: 'fill:var(--bad);font-weight:700;font-size:13.5px', text: '예측 7/6이 1을 초과해 잔차가 음수', opacity: 0 }, grid);
        const formula = s('text', { x: 320, y: 300, 'text-anchor': 'middle', css: 'fill:var(--ink);font-size:14px', text: 'D̃ = D − 단위 평균 − 시점 평균 + 전체 평균', opacity: 0 }, grid);
        // 산점도
        const sc = s('g', { opacity: 0 }, svg);
        GV.yAxis(sc, sy, [0, 4, 8, 12], 90, 600);
        [-1 / 3, -1 / 6, 0, 1 / 6, 1 / 3].forEach(v => { s('line', { x1: sx(v), x2: sx(v), y1: 36, y2: 350, cls: v === 0 ? 'zero' : 'ax' }, sc); s('text', { x: sx(v), y: 368, 'text-anchor': 'middle', text: FR(v) }, sc); });
        s('text', { x: 600, y: 386, 'text-anchor': 'end', css: 'font-size:12px', text: '가로축 D̃ (잔차), 세로축 Y' }, sc);
        const line = s('line', { x1: sx(-0.42), x2: sx(0.42), y1: sy(2), y2: sy(2), 'stroke-width': 2.5, css: 'stroke:var(--ink);stroke-dasharray:7 5', opacity: 0 }, svg);
        const slope = s('text', { x: 600, y: 52, 'text-anchor': 'end', css: 'fill:var(--ink);font-weight:800;font-size:17px', text: '기울기 = TWFE 계수 −2.00', opacity: 0 }, svg);
        const dots = {}, dl = {};
        cells.forEach(([u, t]) => {
          const k = u + t, tr = Dm[u][t] === 1, col = C(u === 'E' ? 'c1' : 'c2');
          dots[k] = s('circle', { cx: gx(t), cy: gy(u), r: 8, 'stroke-width': 2.5, css: tr ? `fill:${col};stroke:${col}` : `fill:var(--bg);stroke:${col}`, opacity: 0 }, svg);
          dl[k] = s('text', { x: gx(t), y: gy(u), css: `fill:${col};font-weight:700;font-size:12.5px`, text: `${u} ${t + 1}기`, opacity: 0 }, svg);
        });
        const ring = s('circle', { cx: sx(-1 / 6), cy: sy(10), r: 15, 'stroke-width': 2.5, css: 'fill:none;stroke:var(--bad)', opacity: 0 }, svg);
        drawLine = anim => {
          const o = { dur: anim ? 450 : 0 };
          const tw = ST.twfe([{ n: 1, g: 1, y: [0, 2, tauE3] }, { n: 1, g: 2, y: [0, 0, 2] }], 3), d = tw.delta;
          const ybar = (4 + tauE3) / 6;
          to(line, { y1: sy(ybar + d * -0.42), y2: sy(ybar + d * 0.42) }, o);
          to(dots.E2, { cy: sy(tauE3) }, o); to(dl.E2, { y: sy(tauE3) - 13 }, o); to(ring, { cy: sy(tauE3) }, o);
          count(slope, d, 2, { pre: '기울기 = TWFE 계수 ' });
          slope.style.fill = d < 0 ? 'var(--bad)' : 'var(--ink)';
        };
        return (st, anim) => {
          cur = st; const o = { dur: anim ? 600 : 0 };
          sl.input.disabled = st !== 6;
          if (st !== 6 && tauE3 !== 10) { tauE3 = 10; sl.set(10); }
          cells.forEach(([u, t]) => { const k = u + t; val[k].textContent = st === 0 ? String(Dm[u][t]) : st === 1 ? FR(step1(u, t)) : FR(resid(u, t)); });
          rowm.forEach(e => show(e, st >= 1 && st <= 3, o));
          colm.forEach(e => show(e, st >= 2 && st <= 3, o)); show(allm, st >= 2 && st <= 3, o); show(formula, st >= 2 && st <= 3, o);
          show(note, st === 3, o);
          to(box.E2, { 'stroke-width': st === 3 ? 4 : 2 }, o); box.E2.style.stroke = st === 3 ? 'var(--bad)' : 'var(--c1)';
          val.E2.style.fill = st >= 3 ? 'var(--bad)' : 'var(--ink)';
          show(grid, st <= 3, o);
          show(sc, st >= 4, o);
          cells.forEach(([u, t], i) => {
            const k = u + t;
            if (st >= 4) { show(dots[k], true, { dur: anim ? 200 : 0 }); to(dots[k], { cx: sx(resid(u, t)), cy: sy(Yof(u, t)) }, { dur: anim ? 900 : 0, delay: anim && st === 4 ? 100 + i * 70 : 0 }); show(dl[k], true, { dur: o.dur, delay: anim && st === 4 ? 900 : 0 }); to(dl[k], { x: sx(resid(u, t)) + 12, y: sy(Yof(u, t)) - 13 }, { dur: 0 }); }
            else { to(dots[k], { cx: gx(t), cy: gy(u) }, o); show(dots[k], false, o); show(dl[k], false, { dur: 0 }); }
          });
          show(line, st >= 5, o); show(slope, st >= 5, o); show(ring, st >= 5, o);
          if (st >= 5) drawLine(anim);
        };
      }
    });
  });

  /* ---------- bad-compare (p1-bad): 여섯 2×2 가운데 하나를 골라 비교 기간과 결과 경로를 본다 ---------- */
  GV.reg('bad-compare', host => {
    const W = 660, H = 430, YR = ST.Y0, T = ST.T, SG = ST.SIG, coh = [1989, 1998, 2007], ns = [17, 18, 15], col = ['c1', 'c2', 'c3'];
    const x = lin(0, T, 112, 640), cwid = (640 - 112) / T, rowY = [30, 56, 82], rh = 22;
    const st = { sel: 'LvE-2-0', sim: 6 };
    const F = GV.frame(host, { kind: '도식', title: '여섯 개의 2×2 비교를 하나씩 살펴보기 (원문 시뮬레이션 설정)', w: W, h: H, controls: true,
      note: '결과는 미처치 잠재결과를 0으로 설정한 효과 경로(σ 단위, 잡음 없음)다. 위 격자에서 실선 테두리가 처치집단, 점선 테두리가 비교집단과 사용 기간이며 세로 점선이 그 2×2의 처치 시점이다. 아래 그림의 가는 가로선은 처치 시점 전후의 평균이다.' });
    const opts = [['EvL-0-1', '1989 대 1998'], ['EvL-0-2', '1989 대 2007'], ['EvL-1-2', '1998 대 2007'], ['LvE-1-0', '1998 대 1989'], ['LvE-2-0', '2007 대 1989'], ['LvE-2-1', '2007 대 1998']];
    GV.seg(F.top, '비교 (처치 대 비교집단)', opts, st.sel, v => { st.sel = v; draw(true); });
    GV.seg(F.top, '효과 형태', [[6, 'Sim 6 (효과가 커짐)'], [4, 'Sim 4 (효과 일정)']], st.sim, v => { st.sim = v; draw(true); });
    const svg = F.svg, id = 'bc' + (++UID);
    // 격자
    const rows = coh.map((g, k) => {
      s('text', { x: 104, y: rowY[k] + 15, 'text-anchor': 'end', css: `fill:${C(col[k])};font-weight:700;font-size:12.5px`, text: `${g}년 (${ns[k]}개 주)` }, svg);
      const gg = s('g', {}, svg);
      for (let t = 0; t < T; t++) s('rect', { x: x(t) + 0.5, y: rowY[k], width: cwid - 1, height: rh, css: `fill:${YR + t >= g ? C(col[k]) : C('soft')}` }, gg);
      return gg;
    });
    [1980, 1990, 2000, 2010].forEach(y => s('text', { x: x(y - YR), y: 122, 'text-anchor': 'start', css: 'font-size:12px', text: String(y) }, svg));
    const frT = s('rect', { x: 112, y: 30, width: 10, height: rh, 'stroke-width': 2.5, css: 'fill:none;stroke:var(--ink)' }, svg);
    const frC = s('rect', { x: 112, y: 30, width: 10, height: rh, 'stroke-width': 2.5, css: 'fill:none;stroke:var(--ink);stroke-dasharray:5 3' }, svg);
    // 아래 그림
    const yb = lin(0, 1.45, 395, 150);
    const band = s('rect', { x: 112, y: 140, width: 10, height: 260, css: 'fill:var(--soft)' }, svg);
    const ax = s('g', {}, svg); GV.yAxis(ax, yb, [0, 0.5, 1], 112, 640, v => v + 'σ');
    const split = s('line', { x1: 200, x2: 200, y1: 24, y2: 400, 'stroke-width': 1.5, css: 'stroke:var(--ink);stroke-dasharray:5 4' }, svg);
    const cp = s('clipPath', { id }, svg), cr = s('rect', { x: 112, y: 130, width: 10, height: 280 }, cp);
    const paths = coh.map((g, k) => s('polyline', { pts: Array.from({ length: T }, (_, t) => [x(t + 0.5), yb(0)]), fill: 'none', 'stroke-width': 3, css: `stroke:${C(col[k])};stroke-linejoin:round`, 'clip-path': `url(#${id})` }, svg));
    const ghost = coh.map((g, k) => s('polyline', { pts: Array.from({ length: T }, (_, t) => [x(t + 0.5), yb(0)]), fill: 'none', 'stroke-width': 1.5, css: `stroke:${C(col[k])}`, opacity: 0.18 }, svg));
    const mseg = [0, 1, 2, 3].map(() => s('line', { x1: 0, x2: 0, y1: 0, y2: 0, 'stroke-width': 1.5, css: 'stroke:var(--ink)' }, svg));
    const dT = s('text', { x: 0, y: 0, css: 'font-weight:700;font-size:12.5px', text: '' }, svg), dC = s('text', { x: 0, y: 0, css: 'font-weight:700;font-size:12.5px', text: '' }, svg);
    function draw(anim) {
      const o = { dur: anim ? 650 : 0 };
      const groups = coh.map((g, k) => ({ n: ns[k], g: g - YR, y: ST.effPath(st.sim, g) }));
      const bc = ST.bacon(groups, T);
      const [type, a, b] = st.sel.split('-'); const tk = +a, ck = +b;
      const p = bc.parts.find(q => q.type === type && q.treat === tk && q.ctrl === ck);
      const [w0, w1] = p.win, sp = p.split;
      const mean = (y, i, j) => { let v = 0; for (let t = i; t < j; t++) v += y[t]; return v / (j - i); };
      const yT = groups[tk].y, yC = groups[ck].y;
      const tPre = mean(yT, w0, sp), tPost = mean(yT, sp, w1), cPre = mean(yC, w0, sp), cPost = mean(yC, sp, w1);
      // 격자 강조
      rows.forEach((r, k) => to(r, { opacity: k === tk || k === ck ? 1 : 0.22 }, o));
      to(frT, { x: x(w0), y: rowY[tk] - 2, width: x(w1) - x(w0), height: rh + 4 }, o);
      to(frC, { x: x(w0), y: rowY[ck] - 2, width: x(w1) - x(w0), height: rh + 4 }, o);
      frC.style.stroke = type === 'LvE' ? 'var(--bad)' : 'var(--ink)';
      to(split, { x1: x(sp), x2: x(sp) }, o);
      to(band, { x: x(w0), width: x(w1) - x(w0) }, o); to(cr, { x: x(w0), width: x(w1) - x(w0) }, o);
      groups.forEach((g, k) => { const pts = g.y.map((v, t) => [x(t + 0.5), yb(v / SG)]); to(paths[k], { pts, opacity: k === tk || k === ck ? 1 : 0 }, o); to(ghost[k], { pts, opacity: k === tk || k === ck ? 0.18 : 0 }, o); });
      const seg = (e, i, j, v) => to(e, { x1: x(i), x2: x(j), y1: yb(v / SG), y2: yb(v / SG) }, o);
      seg(mseg[0], w0, sp, tPre); seg(mseg[1], sp, w1, tPost); seg(mseg[2], w0, sp, cPre); seg(mseg[3], sp, w1, cPost);
      [0, 1].forEach(i => mseg[i].style.stroke = C(col[tk])); [2, 3].forEach(i => mseg[i].style.stroke = type === 'LvE' ? 'var(--bad)' : C(col[ck]));
      const lx = Math.min(x(w1) + 6, 560);
      dT.textContent = `처치 변화 ${GV.fmt((tPost - tPre) / SG, 3)}σ`; dT.style.fill = C(col[tk]);
      dC.textContent = `비교 변화 ${GV.fmt((cPost - cPre) / SG, 3)}σ`; dC.style.fill = type === 'LvE' && cPost - cPre > 1e-9 ? 'var(--bad)' : C(col[ck]);
      let yT1 = yb(tPost / SG) + 4, yC1 = yb(cPost / SG) + 4; if (Math.abs(yT1 - yC1) < 16) { if (yT1 < yC1) yC1 = yT1 + 16; else yT1 = yC1 + 16; }
      if (x(w1) + 6 <= 548) { to(dT, { x: lx, y: Math.min(yT1, 392) }, o); to(dC, { x: lx, y: Math.min(yC1, 392) }, o); }
      else { to(dT, { x: x(w0) + 8, y: 158 }, o); to(dC, { x: x(w0) + 8, y: 176 }, o); }
      const truth = tPost; // 미처치 결과가 0이므로 처치집단의 사후 평균이 곧 참효과
      const bad = type === 'LvE' && cPost - cPre > 1e-9;
      F.out.innerHTML = `<div><strong>${coh[tk]}년 코호트 대 ${coh[ck]}년 코호트</strong> <span class="tag ${type === 'LvE' ? 'bad' : 'ok'}">${type === 'LvE' ? '이미 처치된 코호트와 비교' : '아직 미처치인 코호트와 비교'}</span>, 사용 기간 ${YR + w0}-${YR + w1 - 1}년, TWFE 가중치 ${GV.fmt(p.w, 3)}</div>
        <div>DID = 처치집단 변화 ${GV.fmt((tPost - tPre) / SG, 3)}σ − 비교집단 변화 ${GV.fmt((cPost - cPre) / SG, 3)}σ = <strong class="${p.est < 0 ? 'neg' : ''}">${GV.fmt(p.est / SG, 3)}σ</strong>. 같은 구간에서 처치집단이 실제로 받은 평균효과는 ${GV.fmt(truth / SG, 3)}σ다.</div>
        ${bad ? `<div class="neg">비교집단은 이 구간 내내 이미 처치된 상태이며 그 효과가 커진 만큼(${GV.fmt((cPost - cPre) / SG, 3)}σ)이 정책 없이 일어난 변화로 취급되어 차감된다.</div>` : type === 'LvE' ? '<div>비교집단은 이미 처치된 상태지만 효과가 일정해 이 구간의 변화가 0이므로 DID가 처치집단의 효과를 그대로 복원한다.</div>' : '<div>비교집단이 이 구간 동안 아직 처치받지 않았으므로 DID가 처치집단의 효과를 그대로 복원한다.</div>'}`;
    }
    draw(false);
  });

  /* ---------- weights-curve (p1-weights): 관측 기간만 바꾸면 가중치와 계수가 달라진다 (덱 10장) ---------- */
  GV.reg('weights-curve', host => {
    const W = 660, H = 400, cfg = { base: [5, 1, 3], post: [10, 1, 3], pre: [10, 6, 8] };
    const st = { k: 'base' };
    const F = GV.frame(host, { kind: '도식', title: '관측 기간만 바꾸는 실험 (U, k, l 각 1단위, 효과 k = 4, l = 2로 일정, 가상 수치)', w: W, h: H, controls: true,
      note: '네 2×2의 DID는 세 경우 모두 4, 4, 2, 2로 같다. 달라지는 것은 처치 비율 D̄와 그에 따른 가중치뿐이다. 계수는 덱의 계산 코어(stats.js)의 Goodman-Bacon 분해로 계산한 값이다.' });
    GV.seg(F.top, '관측 기간', [['base', '처음 5기'], ['post', '이후 5기 추가'], ['pre', '이전 5기 추가']], st.k, v => { st.k = v; draw(true); });
    const svg = F.svg;
    // 위: 관측 기간 띠
    const strip = s('g', {}, svg);
    const rowsLab = [['U', 'u'], ['k', 'c1'], ['l', 'c2']];
    rowsLab.forEach(([n, c], r) => s('text', { x: 82, y: 32 + r * 24 + 13, 'text-anchor': 'end', css: `fill:${C(c)};font-weight:800;font-size:14px`, text: n }, svg));
    // 포물선
    const px = lin(0, 1, 70, 320), py = lin(0, 0.25, 370, 150);
    const pg = s('g', {}, svg);
    GV.yAxis(pg, py, [0, 0.1, 0.2], 70, 320, v => v === 0 ? '0' : v.toFixed(1));
    [0, 0.5, 1].forEach(v => s('text', { x: px(v), y: 390, 'text-anchor': 'middle', text: String(v) }, pg));
    s('text', { x: 320, y: 140, 'text-anchor': 'end', css: 'font-size:12.5px', text: '처치변수의 분산 D̄(1 − D̄)' }, pg);
    s('text', { x: px(0.76), y: 390, 'text-anchor': 'middle', css: 'font-size:12px', text: '처치 비율 D̄' }, pg);
    s('path', { pts: Array.from({ length: 41 }, (_, i) => { const d = i / 40; return [px(d), py(d * (1 - d))]; }), 'stroke-width': 2, css: 'fill:none;stroke:var(--faint)' }, svg);
    const pt = { k: s('circle', { cx: px(0.8), cy: py(0.16), r: 8, css: 'fill:var(--c1)' }, svg), l: s('circle', { cx: px(0.4), cy: py(0.24), r: 8, css: 'fill:var(--c2)' }, svg) };
    const pl = { k: s('text', { x: 0, y: 0, css: 'fill:var(--c1);font-weight:700;font-size:12.5px', text: '' }, svg), l: s('text', { x: 0, y: 0, css: 'fill:var(--c2);font-weight:700;font-size:12.5px', text: '' }, svg) };
    const Dv = { k: 0.8, l: 0.4 };
    function slide(name, target, anim) {
      const from = Dv[name]; Dv[name] = target;
      const place = d => { pt[name].setAttribute('cx', px(d)); pt[name].setAttribute('cy', py(d * (1 - d))); pl[name].setAttribute('x', px(d) + (name === 'k' ? 12 : -12)); pl[name].setAttribute('text-anchor', name === 'k' ? 'start' : 'end'); pl[name].setAttribute('y', py(d * (1 - d)) - 10); pl[name].textContent = `${name}  D̄ = ${d.toFixed(2).replace(/0$/, '')}`; };
      if (!anim || GV.reduce) { place(target); return; }
      const t0 = performance.now(), dur = 900; const step = now => { const u = Math.min(1, (now - t0) / dur), d = from + (target - from) * GV.smooth(u); place(d); if (u < 1) requestAnimationFrame(step); else place(target); }; requestAnimationFrame(step);
    }
    // 오른쪽: 가중치 막대
    const bx0 = 498, bw = lin(0, 0.5, 0, 118);
    const labs = [['TvU', 1, 'k 대 U (DID 4)', 'c1'], ['EvL', 1, 'k 대 l (DID 4)', 'c1'], ['TvU', 2, 'l 대 U (DID 2)', 'c2'], ['LvE', 2, 'l 대 k (DID 2)', 'c2']];
    s('text', { x: 380, y: 140, css: 'fill:var(--ink);font-weight:700;font-size:13px', text: '2×2별 가중치' }, svg);
    const bars = labs.map((l, i) => {
      const y = 158 + i * 32;
      s('text', { x: bx0 - 8, y: y + 13, 'text-anchor': 'end', css: `fill:${C(l[3])};font-weight:600;font-size:12.5px`, text: l[2] }, svg);
      const r = s('rect', { x: bx0, y, width: 1, height: 18, css: `fill:${l[0] === 'LvE' ? C('bad') : C(l[3])}` }, svg);
      const t = s('text', { x: bx0 + 6, y: y + 13, css: 'fill:var(--ink);font-weight:700;font-size:12.5px', text: '' }, svg);
      return { r, t };
    });
    // 계수 수직선
    const nx = lin(2, 4, 400, 630);
    const ng = s('g', {}, svg);
    s('line', { x1: nx(2), x2: nx(4), y1: 330, y2: 330, 'stroke-width': 1.5, css: 'stroke:var(--faint)' }, ng);
    [2, 2.5, 3, 3.5, 4].forEach(v => { s('line', { x1: nx(v), x2: nx(v), y1: 326, y2: 334, css: 'stroke:var(--faint)' }, ng); s('text', { x: nx(v), y: 350, 'text-anchor': 'middle', text: String(v) }, ng); });
    s('line', { x1: nx(3), x2: nx(3), y1: 320, y2: 336, 'stroke-width': 1.5, css: 'stroke:var(--c3);stroke-dasharray:3 3' }, ng);
    s('text', { x: nx(3), y: 372, 'text-anchor': 'middle', css: 'fill:var(--c3);font-weight:600;font-size:12px', text: '단위 평균 ATT 3' }, ng);
    const mk = s('circle', { cx: nx(2.75), cy: 330, r: 7, css: 'fill:var(--ink)' }, svg);
    const ml = s('text', { x: nx(2.75), y: 312, 'text-anchor': 'middle', css: 'fill:var(--ink);font-weight:800;font-size:15px', text: '' }, svg);
    function draw(anim) {
      const o = { dur: anim ? 700 : 0 };
      const [T, gk, gl] = cfg[st.k];
      const k = Array.from({ length: T }, (_, t) => t >= gk ? 4 : 0), l = Array.from({ length: T }, (_, t) => t >= gl ? 2 : 0);
      const bc = ST.bacon([{ n: 1, g: I, y: new Array(T).fill(0) }, { n: 1, g: gk, y: k }, { n: 1, g: gl, y: l }], T);
      // 띠
      strip.innerHTML = ''; const sw = (640 - 92) / T;
      [[I, 'u'], [gk, 'c1'], [gl, 'c2']].forEach(([g, c], r) => { for (let t = 0; t < T; t++) s('rect', { x: 92 + t * sw + 1, y: 32 + r * 24, width: sw - 2, height: 18, css: `fill:${t >= g ? C(c) : C('soft')}` }, strip); });
      s('text', { x: 92, y: 118, css: 'font-size:12px', text: `${T}기 관측. 색칠된 칸이 처치된 기간` }, strip);
      slide('k', (T - gk) / T, anim); slide('l', (T - gl) / T, anim);
      labs.forEach((lb, i) => { const p = bc.parts.find(q => q.type === lb[0] && q.treat === lb[1]); to(bars[i].r, { width: Math.max(1, bw(p.w)) }, o); to(bars[i].t, { x: bx0 + bw(p.w) + 6 }, o); GV.count(bars[i].t, p.w, 3, { dur: anim ? 700 : 0 }); });
      to(mk, { cx: nx(bc.delta) }, o); to(ml, { x: nx(bc.delta) }, o); GV.count(ml, bc.delta, 2, { pre: 'TWFE 계수 ', dur: anim ? 700 : 0 });
    }
    draw(false);
  });

  /* ---------- bias-matrix (p1-when): 도입 시점의 수 × 효과의 형태 ---------- */
  GV.reg('bias-matrix', host => {
    const W = 660, H = 420, SG = ST.SIG;
    const calc = sim => { const c = ST.SIMS[sim].coh, n = ST.NS(sim); const g = c.map((y, i) => ({ n: n[i], g: y === null ? I : y - ST.Y0, y: ST.effPath(sim, y) })); return { d: ST.twfe(g, ST.T).delta / SG, t: ST.trueATT(sim, n).firm / SG }; };
    const cellR = { a: [140, 50, 250, 92], b: [400, 50, 250, 92], c: [140, 152, 250, 92], d: [400, 152, 250, 240] };
    const place = { 1: ['a', 0], 2: ['b', 0], 3: ['c', 0], 4: ['d', 0], 5: ['d', 1], 6: ['d', 2] };
    const xs = (cell) => lin(-0.1, 0.55, cell[0] + 64, cell[0] + cell[2] - 46);
    stepper(host, {
      kind: '도식', title: '편향이 생기는 칸 (원문 Sim 1-6, 잡음 없이 다시 계산, σ 단위)', w: W, h: H,
      steps: [
        '도입 시점의 수(행)와 효과의 형태(열)로 2×2 표를 만든다. 칸마다 원문 시뮬레이션을 넣고, TWFE 계수의 기댓값(검은 막대)과 기업평균 ATT(초록 막대)를 비교한다.',
        'Sim 1. 1998년 한 해에 절반의 주가 도입하고 효과가 0.5σ로 일정하다. 두 막대가 같다.',
        'Sim 2. 도입 시점은 하나인데 효과가 매년 0.05σ씩 커진다. 이미 처치된 비교집단이 없으므로 두 막대가 여전히 같다.',
        'Sim 3. 세 코호트가 시차를 두고 도입하지만 효과가 모두 0.5σ로 일정하다. 이미 처치된 코호트와 비교해도 차감되는 효과 변화가 0이므로 두 막대가 같다.',
        'Sim 4-6. 도입 시점이 여럿이면서 효과가 코호트마다 다르거나(Sim 4) 시간에 따라 커지면(Sim 5, 6) 두 막대가 달라진다. Sim 5는 0 근처, Sim 6은 음수다.',
        '편향은 두 조건이 함께 깨진 오른쪽 아래 칸에서만 생긴다. Sim 4의 차이는 가중 방식에서 생기며(관측치평균 ATT는 0.371σ) Sim 5와 6의 차이는 이미 처치된 코호트의 효과 증가분이 차감된 결과다.'
      ],
      init(svg) {
        s('text', { x: 265, y: 36, 'text-anchor': 'middle', css: 'fill:var(--ink);font-weight:700;font-size:13.5px', text: '효과가 같고 일정' }, svg);
        s('text', { x: 525, y: 36, 'text-anchor': 'middle', css: 'fill:var(--ink);font-weight:700;font-size:13.5px', text: '효과가 다르거나 변함' }, svg);
        s('text', { x: 128, y: 100, 'text-anchor': 'end', css: 'fill:var(--ink);font-weight:700;font-size:13.5px', text: '도입 시점 하나' }, svg);
        s('text', { x: 128, y: 202, 'text-anchor': 'end', css: 'fill:var(--ink);font-weight:700;font-size:13.5px', text: '도입 시점 여럿' }, svg);
        const box = {};
        for (const k in cellR) { const [x0, y0, w, h] = cellR[k]; box[k] = s('rect', { x: x0, y: y0, width: w, height: h, rx: 4, 'stroke-width': 1, css: 'fill:var(--soft);stroke:var(--line)' }, svg); }
        const blocks = {};
        for (const sim of [1, 2, 3, 4, 5, 6]) {
          const [ck, i] = place[sim], cell = cellR[ck], X = xs(cell), y0 = cell[1] + 14 + i * 76, v = calc(sim);
          const g = s('g', { opacity: 0 }, svg);
          s('text', { x: cell[0] + 12, y: y0 + 4, css: 'fill:var(--ink);font-weight:800;font-size:13px', text: 'Sim ' + sim }, g);
          s('line', { x1: X(0), x2: X(0), y1: y0 + 6, y2: y0 + 54, css: 'stroke:var(--faint)' }, g);
          const bar = (val, yy, colr) => { const r = s('rect', { x: Math.min(X(0), X(val)), y: yy, width: Math.max(1, Math.abs(X(val) - X(0))), height: 14, css: `fill:${colr}` }, g); s('text', { x: val >= 0 ? X(val) + 5 : X(val) - 5, y: yy + 11.5, 'text-anchor': val >= 0 ? 'start' : 'end', css: `fill:${colr};font-weight:700;font-size:12px`, text: GV.fmt(val, 3) }, g); return r; };
          bar(v.d, y0 + 10, v.d < 0 ? 'var(--bad)' : 'var(--ink)'); bar(v.t, y0 + 30, 'var(--c3)');
          blocks[sim] = g;
        }
        s('text', { x: 140, y: 412, css: 'font-size:12px', text: '검은 막대 TWFE 계수 기댓값, 초록 막대 기업평균 ATT (균형패널 단순화)' }, svg);
        return (st, anim) => {
          const o = { dur: anim ? 550 : 0 };
          show(blocks[1], st >= 1, o); show(blocks[2], st >= 2, o); show(blocks[3], st >= 3, o);
          [4, 5, 6].forEach((sm, i) => show(blocks[sm], st >= 4, { dur: o.dur, delay: anim && st === 4 ? i * 250 : 0 }));
          box.d.style.fill = st >= 5 ? 'var(--bad-soft)' : 'var(--soft)'; box.d.style.stroke = st >= 5 ? 'var(--bad)' : 'var(--line)';
          to(box.d, { 'stroke-width': st >= 5 ? 2 : 1 }, o);
          ['a', 'b', 'c'].forEach(k => { box[k].style.fill = st >= 5 ? 'var(--c1-soft)' : 'var(--soft)'; });
        };
      }
    });
  });

})();
