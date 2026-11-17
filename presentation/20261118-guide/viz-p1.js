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
    const W = 640, H = 330, x0 = 130, cw = 120, y0 = 44, ch = 80;
    stepper(host, {
      kind: '도식', title: '관측되는 결과와 보이지 않는 잠재결과 (가상 수치)', w: W, h: H,
      steps: [
        '단위 A는 2기에, B는 3기에 처치를 받고 C는 끝까지 받지 않는다. 칸의 숫자는 실제로 관측된 종속변수 Y다. 색칠된 칸이 처치된 칸(D = 1)이다.',
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
        // ATT 자리는 처음부터 점선 칸으로 두고 마지막 단계에서 값을 채운다(앞 단계에서 아래가 비지 않게)
        const attBox = s('rect', { x: x0 + 3, y: y0 + 3 * ch + 8, width: 4 * cw - 6, height: 36, rx: 3, css: 'fill:none;stroke:var(--faint);stroke-width:1.5;stroke-dasharray:5 4' }, svg);
        const att = s('text', { x: x0 + 2 * cw, y: y0 + 3 * ch + 32, 'text-anchor': 'middle', css: 'fill:var(--muted);font-weight:700;font-size:15px', text: 'ATT = 처치된 칸의 τ 평균 = ?' }, svg);
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
          att.textContent = st >= 4 ? 'ATT = (2 + 3 + 4 + 1 + 2) / 5 = 2.4' : 'ATT = 처치된 칸의 τ 평균 = ?';
          att.style.fill = st >= 4 ? 'var(--bad)' : 'var(--muted)'; att.style.fontWeight = st >= 4 ? '800' : '700';
          attBox.style.stroke = st >= 4 ? 'var(--bad)' : 'var(--faint)';
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
    const gx = t => 205 + t * 110, gy = u => u === 'E' ? 100 : 196;
    const sx = lin(-0.45, 0.45, 90, 600), sy = lin(-1, 13, 350, 36);
    stepper(host, {
      kind: '도식', title: 'FWL 정리로 본 TWFE 계수 (E와 L 반례, 가상 수치)', w: W, h: H, controls: true,
      steps: [
        'E는 2기에, L은 3기에 도입한다. 칸의 큰 숫자는 처치변수 D이며 오른쪽 위 작은 숫자는 종속변수 Y다(덱 6장의 효과 2, 10, 2, 미처치 결과는 0).',
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
        [0, 1, 2].forEach(t => s('text', { x: gx(t), y: 42, 'text-anchor': 'middle', css: 'font-size:13px', text: (t + 1) + '기' }, grid));
        // 뒤 단계에서 채울 평균 자리(점선 칸)를 처음부터 보여 준다
        const slot = (x, y, w, h) => s('rect', { x, y, width: w, height: h, rx: 3, css: 'fill:none;stroke:var(--faint);stroke-width:1.2;stroke-dasharray:4 4' }, grid);
        s('text', { x: 535, y: 42, 'text-anchor': 'middle', css: 'font-size:13px', text: '단위 평균' }, grid);
        ['E', 'L'].forEach(u => slot(480, gy(u) - 28, 110, 56));
        [0, 1, 2].forEach(t => slot(gx(t) - 50, 252, 100, 46));
        slot(480, 252, 110, 46);
        s('text', { x: gx(0) - 60, y: 280, 'text-anchor': 'end', css: 'font-size:13px', text: '시점 평균' }, grid);
        ['E', 'L'].forEach(u => s('text', { x: 118, y: gy(u) + 6, 'text-anchor': 'end', css: `fill:${C(u === 'E' ? 'c1' : 'c2')};font-weight:800;font-size:15px`, text: u }, grid));
        const box = {}, val = {}, yv = {};
        cells.forEach(([u, t]) => {
          const k = u + t, tr = Dm[u][t] === 1, col = u === 'E' ? 'c1' : 'c2';
          box[k] = s('rect', { x: gx(t) - 50, y: gy(u) - 38, width: 100, height: 76, rx: 3, 'stroke-width': tr ? 2 : 0, css: `fill:${tr ? C(col + '-soft') : C('soft')};stroke:${C(col)}` }, grid);
          val[k] = s('text', { x: gx(t), y: gy(u) + 8, 'text-anchor': 'middle', css: 'fill:var(--ink);font-weight:800;font-size:20px', text: String(Dm[u][t]) }, grid);
          yv[k] = s('text', { x: gx(t) + 44, y: gy(u) - 21, 'text-anchor': 'end', css: 'fill:var(--muted);font-size:11.5px', text: 'Y ' + Yof(u, t) }, grid);
        });
        const rowm = ['E', 'L'].map(u => s('text', { x: 535, y: gy(u) + 7, 'text-anchor': 'middle', css: `fill:${C(u === 'E' ? 'c1' : 'c2')};font-weight:800;font-size:17px`, text: FR(Di[u]), opacity: 0 }, grid));
        const colm = [0, 1, 2].map(t => s('text', { x: gx(t), y: 281, 'text-anchor': 'middle', css: 'fill:var(--ink);font-weight:800;font-size:16px', text: FR(Dt[t]), opacity: 0 }, grid));
        const allm = s('text', { x: 535, y: 281, 'text-anchor': 'middle', css: 'fill:var(--ink);font-weight:800;font-size:15px', text: '전체 1/2', opacity: 0 }, grid);
        const note = s('text', { x: gx(2), y: 326, 'text-anchor': 'middle', css: 'fill:var(--bad);font-weight:700;font-size:13.5px', text: '예측 7/6이 1을 초과해 잔차가 음수', opacity: 0 }, grid);
        const formula = s('text', { x: 345, y: 362, 'text-anchor': 'middle', css: 'fill:var(--muted);font-size:14px', text: 'D̃ = D − 단위 평균 − 시점 평균 + 전체 평균' }, grid);
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
          colm.forEach(e => show(e, st >= 2 && st <= 3, o)); show(allm, st >= 2 && st <= 3, o);
          formula.style.fill = st >= 2 ? 'var(--ink)' : 'var(--muted)'; formula.style.fontWeight = st >= 2 ? '700' : '400';
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
    const W = 660, H = 410, YR = ST.Y0, T = ST.T, SG = ST.SIG, coh = [1989, 1998, 2007], ns = [17, 18, 15], col = ['c1', 'c2', 'c3'];
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


  /* ---------- fwl-two-step (p1-fwl): FWL 정리의 두 단계를 가상의 매장 16곳으로 보인다 ---------- */
  GV.reg('fwl-two-step', host => {
    const W = 640, H = 436, L0 = 70, R0 = 610, T0 = 60, B0 = 376;
    const rng = sd => () => { sd |= 0; sd = sd + 0x6D2B79F5 | 0; let t = Math.imul(sd ^ sd >>> 15, 1 | sd); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const r = rng(11), n = 16, gs = () => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
    const X2 = [], U = [], V = [];
    for (let i = 0; i < n; i++) { X2.push(1 + 9 * r()); U.push(gs()); V.push(gs()); }
    const mean = a => a.reduce((q, x) => q + x, 0) / a.length;
    const slope = (x, y) => { const mx = mean(x), my = mean(y); let a = 0, b = 0; x.forEach((v, i) => { a += (v - mx) * (y[i] - my); b += (v - mx) ** 2; }); return a / b; };
    let k = 0.8, D = null, cur = 0;
    function data() {
      const X1 = X2.map((x, i) => 2 + k * x + 1.3 * U[i]), Y = X1.map((x, i) => 4 + 1.2 * x + 1.6 * X2[i] + 1.8 * V[i]);
      const c = slope(X2, X1), c0 = mean(X1) - c * mean(X2), X1h = X2.map(x => c0 + c * x), X1t = X1.map((x, i) => x - X1h[i]);
      const d = slope(X2, Y), d0 = mean(Y) - d * mean(X2), Yt = Y.map((y, i) => y - d0 - d * X2[i]);
      const b1 = X1t.reduce((q, x, i) => q + x * Y[i], 0) / X1t.reduce((q, x) => q + x * x, 0);
      return { X1, Y, c, c0, X1h, X1t, Yt, b1, simple: slope(X1, Y), my: mean(Y), mx1: mean(X1) };
    }
    const ext = (a, pad) => { const lo = Math.min(...a), hi = Math.max(...a), p = (hi - lo) * (pad || 0.08) || 1; return [lo - p, hi + p]; };
    const nice = (lo, hi, m) => { const st = [0.5, 1, 2, 5, 10, 20]; const raw = (hi - lo) / (m || 5); const s0 = st.find(x => x >= raw) || 20; const out = []; for (let v = Math.ceil(lo / s0) * s0; v <= hi + 1e-9; v += s0) out.push(+v.toFixed(6)); return out; };
    const F2 = v => GV.fmt(v, 2);
    stepper(host, {
      kind: '도식', title: 'FWL 정리의 두 단계 (가상의 매장 16곳)', w: W, h: H, controls: true,
      steps: [
        '매출 Y를 광고비 X₁ 하나에 회귀한 산점도다. 점이 진할수록 매장 규모 X₂가 크다. 큰 매장이 광고비도 많고 매출도 높으므로 이 기울기에는 매장 규모의 영향이 함께 들어 있다.',
        '1단계를 준비한다. 가로축을 매장 규모 X₂로, 세로축을 광고비 X₁로 바꾼다. 같은 16개 점이 새 위치로 옮겨 간다.',
        'X₁을 X₂에 회귀한 직선이 적합값 X̂₁이다. 각 점에서 직선까지의 세로 막대가 잔차 X̃₁이며 그 매장의 규모로 예측되는 광고비보다 얼마나 더 많이 또는 적게 지출했는지를 나타낸다.',
        '직선을 수평으로 눕히면 각 점의 높이가 잔차 X̃₁이 된다. 매장 규모로 설명되는 광고비의 부분이 제거되었고 남은 값에는 매장 규모와의 관련이 없다(X̃₁과 X₂의 상관은 0).',
        '2단계. 가로축을 잔차 X̃₁로, 세로축을 매출 Y로 둔다. 이 산점도에 맞춘 직선의 기울기가 다중회귀에서 광고비의 계수 b̂₁과 정확히 같다.',
        'Y도 X₂에 회귀한 잔차 Ỹ로 바꾸면 점들이 세로로만 움직이고 기울기는 그대로다. Y에서 X₂로 설명되는 부분은 X̃₁과 직교하므로 기울기에 영향을 주지 않는다. TWFE 공식의 분자에 Y를 그대로 사용해도 되는 이유가 이것이다.'
      ],
      init(svg, F) {
        GV.seg(F.top, 'X₁과 X₂의 관련', [[0.3, '약함'], [0.8, '보통'], [1.4, '강함']], k, v => { k = v; D = data(); render(cur, true); });
        D = data();
        const axes = s('g', {}, svg), gx = s('g', {}, axes), gy = s('g', {}, axes);
        const xt = s('text', { x: R0, y: B0 + 40, 'text-anchor': 'end', css: 'font-size:13px;fill:var(--ink);font-weight:600', text: '' }, svg);
        const yt = s('text', { x: L0 - 8, y: T0 - 14, 'text-anchor': 'start', css: 'font-size:13px;fill:var(--ink);font-weight:600', text: '' }, svg);
        const zero = s('line', { x1: L0, x2: R0, y1: B0, y2: B0, cls: 'zero', opacity: 0 }, svg);
        const sticks = D.Y.map(() => s('line', { x1: 0, x2: 0, y1: 0, y2: 0, 'stroke-width': 1.6, css: 'stroke:var(--c2)', opacity: 0 }, svg));
        const line = s('line', { x1: L0, x2: R0, y1: B0, y2: T0, 'stroke-width': 2.5, css: 'stroke:var(--ink)', opacity: 0 }, svg);
        const lmin = Math.min(...X2), lmax = Math.max(...X2);
        const dots = D.Y.map((_, i) => s('circle', { cx: L0, cy: B0, r: 6.5, 'stroke-width': 1.5, css: `fill:var(--c1);fill-opacity:${(0.18 + 0.8 * (X2[i] - lmin) / (lmax - lmin)).toFixed(2)};stroke:var(--c1)` }, svg));
        const r1 = s('text', { x: R0, y: 20, 'text-anchor': 'end', css: 'font-size:15px;font-weight:800;fill:var(--ink)', text: '' }, svg);
        const r2 = s('text', { x: R0, y: 38, 'text-anchor': 'end', css: 'font-size:13px;fill:var(--muted)', text: '' }, svg);
        const lg = s('text', { x: L0 + 4, y: B0 + 40, css: 'font-size:12px;fill:var(--muted)', text: '점이 진할수록 매장 규모 X₂가 크다' }, svg);
        function axis(xd, yd, xl, yl, anim) {
          const X = lin(xd[0], xd[1], L0, R0), Y = lin(yd[0], yd[1], B0, T0);
          [gx, gy].forEach(g => { g.innerHTML = ''; });
          nice(yd[0], yd[1]).forEach(v => { s('line', { x1: L0, x2: R0, y1: Y(v), y2: Y(v), cls: Math.abs(v) < 1e-9 ? 'zero' : 'ax' }, gy); s('text', { x: L0 - 7, y: Y(v) + 4, 'text-anchor': 'end', text: GV.fmt(v, Math.abs(v % 1) > 1e-9 ? 1 : 0) }, gy); });
          nice(xd[0], xd[1], 6).forEach(v => s('text', { x: X(v), y: B0 + 18, 'text-anchor': 'middle', text: GV.fmt(v, Math.abs(v % 1) > 1e-9 ? 1 : 0) }, gx));
          xt.textContent = xl; yt.textContent = yl;
          if (anim) { axes.setAttribute('opacity', 0); to(axes, { opacity: 1 }, { dur: 420, delay: 200 }); }
          return { X, Y };
        }
        let lastAx = '';
        function render(st, anim) {
          cur = st; const o = { dur: anim ? 900 : 0 }, oq = { dur: anim ? 450 : 0 };
          const P = [
            { x: D.X1, y: D.Y, xl: '광고비 X₁', yl: '매출 Y' },
            { x: X2, y: D.X1, xl: '매장 규모 X₂', yl: '광고비 X₁' },
            { x: X2, y: D.X1, xl: '매장 규모 X₂', yl: '광고비 X₁' },
            { x: X2, y: D.X1t, xl: '매장 규모 X₂', yl: '잔차 X̃₁' },
            { x: D.X1t, y: D.Y, xl: '잔차 X̃₁', yl: '매출 Y' },
            { x: D.X1t, y: D.Yt, xl: '잔차 X̃₁', yl: '매출의 잔차 Ỹ' }][st];
          const xd = ext(P.x), yd = st === 3 ? (m => [-m, m])(Math.max(...D.X1t.map(Math.abs)) * 1.15) : ext(P.y, 0.1);
          const key = st + ':' + k, A = axis(xd, yd, P.xl, P.yl, anim && lastAx !== key); lastAx = key;
          dots.forEach((d, i) => to(d, { cx: A.X(P.x[i]), cy: A.Y(P.y[i]) }, { dur: o.dur, delay: anim ? i * 18 : 0 }));
          show(lg, st <= 3, oq);
          // 막대
          sticks.forEach((l, i) => {
            if (st === 2) { to(l, { x1: A.X(X2[i]), x2: A.X(X2[i]), y1: A.Y(D.X1h[i]), y2: A.Y(D.X1[i]) }, { dur: 0 }); show(l, true, { dur: oq.dur, delay: anim ? 500 : 0 }); }
            else if (st === 3) { to(l, { x1: A.X(X2[i]), x2: A.X(X2[i]), y1: A.Y(0), y2: A.Y(D.X1t[i]) }, o); show(l, true, oq); }
            else show(l, false, oq);
          });
          show(zero, st === 3, oq); to(zero, { y1: A.Y(0), y2: A.Y(0) }, { dur: 0 });
          // 직선
          let b = null, x0, x1;
          if (st === 0) { b = D.simple; x0 = xd[0]; x1 = xd[1]; const yb = D.my, xb = D.mx1; to(line, { x1: A.X(x0), x2: A.X(x1), y1: A.Y(yb + b * (x0 - xb)), y2: A.Y(yb + b * (x1 - xb)) }, o); }
          else if (st === 2) { x0 = xd[0]; x1 = xd[1]; to(line, { x1: A.X(x0), x2: A.X(x1), y1: A.Y(D.c0 + D.c * x0), y2: A.Y(D.c0 + D.c * x1) }, o); }
          else if (st === 3) { to(line, { x1: A.X(xd[0]), x2: A.X(xd[1]), y1: A.Y(0), y2: A.Y(0) }, o); }
          else if (st >= 4) { b = D.b1; x0 = xd[0]; x1 = xd[1]; const yb = st === 4 ? D.my : 0; to(line, { x1: A.X(x0), x2: A.X(x1), y1: A.Y(yb + b * x0), y2: A.Y(yb + b * x1) }, o); }
          show(line, st !== 1, oq);
          line.style.stroke = st === 2 || st === 3 ? 'var(--c2)' : 'var(--ink)';
          const t1 = ['단순회귀 기울기 ', '', '보조회귀 기울기 ĉ = ', '', '기울기 ', '기울기 '][st];
          if (st === 0) { r1.textContent = t1 + F2(D.simple); r2.textContent = '다중회귀의 b̂₁은 ' + F2(D.b1); }
          else if (st === 2) { r1.textContent = t1 + F2(D.c); r2.textContent = '세로 막대 = 잔차 X̃₁'; }
          else if (st === 3) { r1.textContent = '잔차 X̃₁의 합 = 0'; r2.textContent = 'X̃₁과 X₂의 상관 = 0'; }
          else if (st >= 4) { r1.textContent = t1 + F2(D.b1) + ' = 다중회귀의 b̂₁'; r2.textContent = st === 4 ? '광고비만 넣은 단순회귀의 기울기는 ' + F2(D.simple) : 'Y를 잔차로 바꾸어도 같은 기울기'; }
          else { r1.textContent = ''; r2.textContent = ''; }
          r1.style.fill = st >= 4 ? 'var(--c1)' : 'var(--ink)';
        }
        return render;
      }
    });
  });

  /* ---------- panel-resid (p1-fwl): 넓은 형식의 표에서 D, 세 평균, 적합값, 잔차, 가중치를 차례로 본다 ---------- */
  GV.reg('panel-resid', host => {
    const FR = x => GV.frac(x);
    const SUM = xs => xs.map((x, k) => { const f = FR(x); return k === 0 ? f : (f.startsWith('−') ? ' − ' + f.slice(1) : ' + ' + f); }).join('');
    const SETS = {
      '2x2': { name: '2×2 (덱 4장)', u: ['T', 'C'], p: ['0기', '1기'], G: [1, null], Y: [[50, 60], [30, 34]] },
      'el': { name: 'E와 L (덱 6장)', u: ['E', 'L'], p: ['1기', '2기', '3기'], G: [1, 2], Y: [[0, 2, 10], [0, 0, 2]] },
      'abc': { name: 'A, B, C (1부 표)', u: ['A', 'B', 'C'], p: ['1기', '2기', '3기', '4기', '5기', '6기'], G: [1, 3, 5], Y: null },
      'ukl': { name: 'U, k, l (덱 9장)', u: ['U', 'k', 'l'], p: ['1기', '2기', '3기', '4기', '5기'], G: [null, 1, 3], Y: null }
    };
    let set = 'el', G = SETS.el.G.slice(), view = 0, M = null;
    const VIEW = ['D', 'mean', 'Dhat', 'Dtil', 'w'];
    function calc() {
      const S = SETS[set], N = S.u.length, T = S.p.length;
      const D = S.u.map((_, i) => S.p.map((_, t) => G[i] != null && t >= G[i] ? 1 : 0));
      const Di = D.map(r => r.reduce((a, b) => a + b, 0) / T), Dt = S.p.map((_, t) => D.reduce((a, r) => a + r[t], 0) / N);
      const Db = Di.reduce((a, b) => a + b, 0) / N;
      const Dh = D.map((r, i) => r.map((_, t) => Di[i] + Dt[t] - Db)), Dr = D.map((r, i) => r.map((v, t) => v - Dh[i][t]));
      const ss = Dr.flat().reduce((a, b) => a + b * b, 0);
      const w = Dr.map(r => r.map(v => ss > 1e-12 ? v / ss : NaN));
      const gs = [...new Set(G.filter(g => g != null))].sort((a, b) => a - b);
      const col = G.map(g => g == null ? 'u' : ['c1', 'c2', 'c3'][gs.indexOf(g)] || 'c3');
      let dhat = null; if (S.Y && ss > 1e-12) { dhat = 0; S.Y.forEach((r, i) => r.forEach((y, t) => { dhat += w[i][t] * y; })); }
      return { S, N, T, D, Di, Dt, Db, Dh, Dr, ss, w, col, dhat };
    }
    const st = stepper(host, {
      kind: '도식', title: '넓은 형식의 표로 본 적합값과 잔차', w: 10, h: 10, controls: true,
      steps: [
        '처치변수 D다. 행은 단위, 열은 시점이며 색칠된 칸이 도입 이후(D = 1)다. 이 단계에서 칸을 누르면 그 단위의 도입 시점이 그 칸으로 바뀐다(같은 칸을 다시 누르면 미처치).',
        '세 가지 평균을 구한다. 오른쪽 여백은 행 평균 D̄ᵢ(그 단위가 처치된 기간의 비율), 아래 여백은 열 평균 D̄ₜ(그 시점에 처치된 단위의 비율), 오른쪽 아래는 전체 평균 D̄다.',
        '적합값 D̂ = D̄ᵢ + D̄ₜ − D̄다. 어느 단위인지와 어느 시점인지만으로 예측한 처치 정도이며 1을 초과하거나 0보다 작은 칸은 점선 테두리로 표시한다.',
        '잔차 D̃ = D − D̂다. 여백이 행 합과 열 합으로 바뀌며 모두 0이다. 잔차가 모든 단위 더미, 시점 더미와 직교한다는 조건이 이것이다.',
        '가중치 w = D̃ / ΣD̃²다. 처치된 칸(굵은 숫자)의 가중치를 더하면 1이고 붉은 칸은 음의 가중치를 받는 처치 칸이다.'
      ],
      init(svg, F) {
        const wrap = GV.h('div', { cls: 'ptwrap' }); svg.replaceWith(wrap);
        GV.seg(F.top, '예제', Object.entries(SETS).map(([k, v]) => [k, v.name]), set, v => { set = v; G = SETS[v].G.slice(); draw(); });
        const info = GV.h('div', { cls: 'pinfo' }, F.out);
        let tb = null, hoverMsg = null;
        function cellTxt(i, t) {
          const v = VIEW[view];
          if (v === 'D' || v === 'mean') return String(M.D[i][t]);
          if (v === 'Dhat') return FR(M.Dh[i][t]);
          if (v === 'Dtil') return FR(M.Dr[i][t]);
          return isNaN(M.w[i][t]) ? '−' : FR(M.w[i][t]);
        }
        function summary() {
          const v = VIEW[view], S = M.S;
          if (M.ss < 1e-12 && view >= 3) return '<span class="neg">모든 칸의 처치 상태가 고정효과로 정확히 설명되어 잔차가 모두 0이다. 처치의 변동이 없으므로 TWFE 계수를 계산할 수 없다.</span>';
          if (v === 'D') return `처치된 칸 ${M.D.flat().filter(x => x).length}개, 전체 ${M.N * M.T}칸. 칸에 마우스를 올리면(휴대폰에서는 탭하면) 그 칸의 계산이 여기에 나온다.`;
          if (v === 'mean') return `전체 평균 D̄ = ${FR(M.Db)}. 행 평균들의 평균과 열 평균들의 평균이 모두 전체 평균과 같다(균형패널).`;
          if (v === 'Dhat') { const over = []; M.Dh.forEach((r, i) => r.forEach((x, t) => { if (x > 1 + 1e-9 || x < -1e-9) over.push(`${S.u[i]} ${S.p[t]} (${FR(x)})`); })); return over.length ? `0과 1 밖의 적합값: ${over.join(', ')}. 선형 예측이므로 이런 칸이 생긴다.` : '모든 적합값이 0과 1 사이에 있다.'; }
          if (v === 'Dtil') return `잔차 제곱합 ΣD̃² = ${FR(M.ss)}. 행 합과 열 합이 모두 0이다.`;
          const neg = []; let sw = 0; M.w.forEach((r, i) => r.forEach((x, t) => { if (M.D[i][t]) { sw += x; if (x < -1e-9) neg.push(`${S.u[i]} ${S.p[t]} (${FR(x)})`); } }));
          return `처치된 칸의 가중치 합 = ${FR(sw)}. ` + (neg.length ? `<span class="neg">음의 가중치: ${neg.join(', ')}</span>. ` : '음의 가중치는 없다. ') + (M.dhat != null ? `이 예제의 Y로 계산한 δ̂ = Σ w·Y = <b>${GV.fmt(M.dhat, 2)}</b>.` : '');
        }
        function explain(i, t, m) {
          const S = M.S, v = VIEW[view], u = S.u[i], p = S.p[t];
          if (m === 'row' && view === 4) return `${u}의 처치된 칸 가중치 합 = ${SUM(M.w[i].filter((x, t) => M.D[i][t])) || '0'}`;
          if (m === 'col' && view === 4) return `${p}의 처치된 칸 가중치 합 = ${SUM(M.w.filter((r, j) => M.D[j][t]).map(r => r[t])) || '0'}`;
          if (m === 'all' && view === 4) return '처치된 모든 칸의 가중치 합은 언제나 1이다(위 유도의 결론).';
          if (m === 'row') return `${u}의 행 평균 D̄ = (${M.D[i].join(' + ')}) / ${M.T} = ${FR(M.Di[i])}` + (view >= 3 ? `. 이 단계의 여백은 잔차의 행 합 ${SUM(M.Dr[i])} = 0이다.` : '');
          if (m === 'col') return `${p}의 열 평균 D̄ = (${M.D.map(r => r[t]).join(' + ')}) / ${M.N} = ${FR(M.Dt[t])}` + (view >= 3 ? `. 이 단계의 여백은 잔차의 열 합 ${SUM(M.Dr.map(r => r[t]))} = 0이다.` : '');
          if (m === 'all') return `전체 평균 D̄ = 처치된 칸 ${M.D.flat().filter(x => x).length}개 / ${M.N * M.T}칸 = ${FR(M.Db)}`;
          if (v === 'D') return `${u} ${p}: D = ${M.D[i][t]}. ${M.D[i][t] ? '도입 이후의 칸이다.' : '도입 이전이거나 미처치인 칸이다.'}`;
          if (v === 'mean') return `${u} ${p}: 이 칸의 적합값에 들어갈 평균은 행 평균 ${FR(M.Di[i])}, 열 평균 ${FR(M.Dt[t])}, 전체 평균 ${FR(M.Db)}이다.`;
          if (v === 'Dhat') return `${u} ${p}: D̂ = D̄(${u}) ${FR(M.Di[i])} + D̄(${p}) ${FR(M.Dt[t])} − D̄ ${FR(M.Db)} = <b>${FR(M.Dh[i][t])}</b>`;
          if (v === 'Dtil') return `${u} ${p}: D̃ = D ${M.D[i][t]} − D̂ ${FR(M.Dh[i][t])} = <b>${FR(M.Dr[i][t])}</b>`;
          return `${u} ${p}: w = D̃ ${FR(M.Dr[i][t])} / ΣD̃² ${FR(M.ss)} = <b>${FR(M.w[i][t])}</b>${M.D[i][t] ? '' : ' (미처치 칸이므로 효과가 0이어서 계수에 기여하지 않는다)'}`;
        }
        function setInfo(h) { info.innerHTML = h; }
        function draw() {
          M = calc(); const S = M.S, v = VIEW[view];
          const wr = M.D.map((r, i) => r.reduce((a, d, t) => a + (d ? M.w[i][t] : 0), 0)), wc = S.p.map((_, t) => M.D.reduce((a, r, i) => a + (r[t] ? M.w[i][t] : 0), 0));
          const okW = M.ss > 1e-12, mh = ['', '단위 평균', '단위 평균', '행 합', '처치 칸 합'][view], mf = ['', '시점 평균', '시점 평균', '열 합', '처치 칸 합'][view];
          const mrow = i => view === 0 ? '' : view <= 2 ? FR(M.Di[i]) : view === 3 ? '0' : (okW ? FR(wr[i]) : '');
          const mcol = t => view === 0 ? '' : view <= 2 ? FR(M.Dt[t]) : view === 3 ? '0' : (okW ? FR(wc[t]) : '');
          const mall = view === 0 ? '' : view <= 2 ? FR(M.Db) : view === 3 ? '0' : (okW ? '1' : '');
          let h = `<table class="ptab v-${v}"><thead><tr><th></th>${S.p.map(p => `<th>${p}</th>`).join('')}<th class="m">${mh}</th></tr></thead><tbody>`;
          S.u.forEach((u, i) => {
            h += `<tr><th style="color:var(--${M.col[i]})">${u}</th>`;
            S.p.forEach((p, t) => {
              const tr = M.D[i][t] === 1, c = M.col[i];
              const cl = ['c', tr ? 'tr' : '', v === 'Dhat' && (M.Dh[i][t] > 1 + 1e-9 || M.Dh[i][t] < -1e-9) ? 'out' : '', (v === 'Dtil' || v === 'w') && M.Dr[i][t] < -1e-9 ? 'negv' : '', v === 'w' && tr && M.w[i][t] < -1e-9 ? 'negw' : '', v === 'w' && !tr ? 'dim' : ''].filter(Boolean).join(' ');
              h += `<td class="${cl}" data-i="${i}" data-t="${t}" style="--cc:var(--${c});--cs:var(--${c}-soft)">${cellTxt(i, t)}</td>`;
            });
            h += `<td class="m" data-m="row" data-i="${i}">${mrow(i)}</td></tr>`;
          });
          h += `</tbody><tfoot><tr><th>${mf}</th>${S.p.map((p, t) => `<td class="m" data-m="col" data-t="${t}">${mcol(t)}</td>`).join('')}<td class="m g" data-m="all">${mall}</td></tr></tfoot></table>`;
          wrap.innerHTML = h; tb = wrap.querySelector('table');
          wrap.querySelectorAll('td').forEach(td => { td.classList.add('chg'); });
          setInfo(summary());
        }
        wrap.addEventListener('pointerover', e => {
          const td = e.target.closest('td'); if (!td || !M) return;
          wrap.querySelectorAll('.lk').forEach(x => x.classList.remove('lk'));
          const m = td.dataset.m, i = +td.dataset.i, t = +td.dataset.t;
          if (m === 'row') { if (view >= 1) { wrap.querySelectorAll(`td[data-i="${i}"]`).forEach(x => x.classList.add('lk')); setInfo(explain(i, 0, 'row')); } return; }
          if (m === 'col') { if (view >= 1) { wrap.querySelectorAll(`td[data-t="${t}"]`).forEach(x => x.classList.add('lk')); setInfo(explain(0, t, 'col')); } return; }
          if (m === 'all') { if (view >= 1) { wrap.querySelectorAll('td.c').forEach(x => x.classList.add('lk')); setInfo(explain(0, 0, 'all')); } return; }
          td.classList.add('lk');
          if (view === 1 || view === 2) { const a = wrap.querySelector(`td[data-m="row"][data-i="${i}"]`), b = wrap.querySelector(`td[data-m="col"][data-t="${t}"]`), c = wrap.querySelector('td[data-m="all"]'); [a, b, c].forEach(x => x && x.classList.add('lk')); }
          setInfo(explain(i, t));
        });
        wrap.addEventListener('pointerleave', () => { wrap.querySelectorAll('.lk').forEach(x => x.classList.remove('lk')); if (M) setInfo(summary()); });
        wrap.addEventListener('click', e => {
          const td = e.target.closest('td.c'); if (!td || view !== 0) return;
          const i = +td.dataset.i, t = +td.dataset.t; G[i] = G[i] === t ? null : t; draw();
          const n = wrap.querySelector(`td[data-i="${i}"][data-t="${t}"]`); if (n) { n.classList.add('lk'); setInfo(explain(i, t)); }
        });
        return (stp) => { view = stp; draw(); };
      }
    });
  });

  /* ---------- ortho-proj (p1-fwl): D를 고정효과 방향의 성분과 그에 수직인 성분으로 나눈다 ---------- */
  GV.reg('ortho-proj', host => {
    const W = 620, H = 360, O = [110, 300], th = -13 * Math.PI / 180, u = [Math.cos(th), Math.sin(th)];
    const F = GV.frame(host, { kind: '도식', title: '직교 분해로 본 ΣD̃D = ΣD̃²', w: W, h: H, note: '실제 D는 칸 수만큼의 차원을 갖는 벡터이고 고정효과가 만드는 공간도 여러 차원이지만 그림에서는 한 직선으로 줄여 그렸다. 내적의 값은 그림의 좌표로 계산한 것이며 단위는 임의다.' });
    const svg = F.svg; let P = [470, 92];
    const g = s('g', {}, svg);
    const ext = 560, lx = [O[0] - 70 * u[0], O[1] - 70 * u[1]], rx = [O[0] + ext * u[0], O[1] + ext * u[1]];
    s('line', { x1: lx[0], y1: lx[1], x2: rx[0], y2: rx[1], 'stroke-width': 2, css: 'stroke:var(--faint)' }, g);
    s('text', { x: O[0] - 60, y: O[1] + 48, css: 'font-size:12.5px;fill:var(--muted)', text: '회색 직선: 단위 더미와 시점 더미로 만들 수 있는 열들의 공간' }, g);
    const mk = (col, w) => ({ l: s('line', { x1: 0, y1: 0, x2: 0, y2: 0, 'stroke-width': w || 3, css: `stroke:${col};stroke-linecap:round` }, g), h: s('polygon', { points: '0,0 0,0 0,0', css: `fill:${col}` }, g) });
    const aD = mk('var(--ink)'), aH = mk('var(--c1)'), aR = mk('var(--c2)');
    aR.l.setAttribute('stroke-dasharray', '7 5');
    const ang = s('polyline', { points: '0,0', css: 'fill:none;stroke:var(--muted);stroke-width:1.5' }, g);
    const tD = s('text', { css: 'font-size:16px;font-weight:800;fill:var(--ink)', text: 'D' }, g);
    const tH = s('text', { css: 'font-size:15px;font-weight:800;fill:var(--c1)', text: 'D̂ (적합값)' }, g);
    const tR = s('text', { css: 'font-size:15px;font-weight:800;fill:var(--c2)', text: 'D̃ (잔차)' }, g);
    s('circle', { cx: O[0], cy: O[1], r: 3.5, css: 'fill:var(--ink)' }, g);
    const handle = s('circle', { cx: P[0], cy: P[1], r: 13, css: 'fill:var(--c3-soft);stroke:var(--c3);stroke-width:2;cursor:grab;touch-action:none' }, svg);
    const hint = s('text', { x: P[0] + 18, y: P[1] - 14, css: 'font-size:12px;fill:var(--c3);font-weight:600', text: '끌어서 움직인다' }, svg);
    const out = GV.h('div', { cls: 'res ortho-out' }, F.out);
    function arrow(a, x1, y1, x2, y2) {
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, hl = Math.min(13, L * 0.4);
      a.l.setAttribute('x1', x1); a.l.setAttribute('y1', y1); a.l.setAttribute('x2', x2 - ux * hl * 0.7); a.l.setAttribute('y2', y2 - uy * hl * 0.7);
      a.h.setAttribute('points', `${x2},${y2} ${x2 - ux * hl - uy * hl * 0.5},${y2 - uy * hl + ux * hl * 0.5} ${x2 - ux * hl + uy * hl * 0.5},${y2 - uy * hl - ux * hl * 0.5}`);
    }
    function upd() {
      const d = [P[0] - O[0], P[1] - O[1]], k = d[0] * u[0] + d[1] * u[1], hp = [O[0] + k * u[0], O[1] + k * u[1]], rv = [P[0] - hp[0], P[1] - hp[1]];
      arrow(aD, O[0], O[1], P[0], P[1]); arrow(aH, O[0], O[1], hp[0], hp[1]); arrow(aR, hp[0], hp[1], P[0], P[1]);
      const rl = Math.hypot(rv[0], rv[1]) || 1, q = 14, ru = [rv[0] / rl, rv[1] / rl], bu = [-u[0], -u[1]];
      ang.setAttribute('points', `${hp[0] + bu[0] * q},${hp[1] + bu[1] * q} ${hp[0] + bu[0] * q + ru[0] * q},${hp[1] + bu[1] * q + ru[1] * q} ${hp[0] + ru[0] * q},${hp[1] + ru[1] * q}`);
      tD.setAttribute('x', (O[0] + P[0]) / 2 - 26); tD.setAttribute('y', (O[1] + P[1]) / 2 - 8);
      tH.setAttribute('x', O[0] + k * u[0] * 0.5 - 30); tH.setAttribute('y', O[1] + k * u[1] * 0.5 + 26);
      tR.setAttribute('x', hp[0] + rv[0] / 2 + 12); tR.setAttribute('y', hp[1] + rv[1] / 2 + 5);
      handle.setAttribute('cx', P[0]); handle.setAttribute('cy', P[1]); hint.setAttribute('x', Math.min(P[0] + 18, W - 100)); hint.setAttribute('y', P[1] - 14);
      const sc = 1 / 100, dv = [d[0] * sc, -d[1] * sc], hv = [(hp[0] - O[0]) * sc, -(hp[1] - O[1]) * sc], rr = [rv[0] * sc, -rv[1] * sc];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1], f = x => GV.fmt(x, 2);
      out.innerHTML = `<div class="lbl">D̃와 D̂의 내적 (ΣD̃D̂)</div><div class="big">${f(dot(rr, hv))}</div>
        <div class="lbl">D̃와 D의 내적 (ΣD̃D)</div><div class="eq"><b>${f(dot(rr, dv))}</b> = D̃와 D̂의 내적 ${f(dot(rr, hv))} + D̃의 길이의 제곱 ${f(dot(rr, rr))}</div>
        <div class="lbl">D̃의 길이의 제곱 (ΣD̃²)</div><div class="eq"><b>${f(dot(rr, rr))}</b></div>
        <div class="lbl">읽는 법</div><div class="eq">D = D̂ + D̃이므로 D̃와 D의 내적은 D̃와 D̂의 내적에 D̃와 자기 자신의 내적을 더한 값이다. 앞의 것이 직각 때문에 언제나 0이므로 ΣD̃D = ΣD̃²가 된다.</div>`;
    }
    const toSvg = e => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const q = pt.matrixTransform(svg.getScreenCTM().inverse()); return [Math.max(20, Math.min(W - 20, q.x)), Math.max(20, Math.min(H - 20, q.y))]; };
    let drag = false;
    handle.addEventListener('pointerdown', e => { drag = true; handle.setPointerCapture(e.pointerId); handle.style.cursor = 'grabbing'; hint.style.display = 'none'; });
    handle.addEventListener('pointermove', e => { if (!drag) return; P = toSvg(e); upd(); });
    const end = () => { drag = false; handle.style.cursor = 'grab'; };
    handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
    upd();
  });

})();
