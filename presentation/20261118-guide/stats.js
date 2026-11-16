/* 통계 코어: 균형패널을 "집단(도입 코호트) × 시점" 평균으로 다룬다.
   설명변수가 코호트와 시점으로만 정해지므로 단위 고정효과가 있는 OLS 계수는 코호트-시점 평균만으로 계산된다.
   groups = [{n: 단위 수(가중치), g: 도입 시점 인덱스(미처치는 Infinity), y: 길이 T 배열}] */
(function (root) {
  'use strict';
  const ST = {};

  /* ---------- 난수 (시드 고정) ---------- */
  ST.rng = function (seed) {
    let a = seed >>> 0, spare = null;
    const u = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const n = () => { if (spare !== null) { const s = spare; spare = null; return s; }
      let x, y, r; do { x = u() * 2 - 1; y = u() * 2 - 1; r = x * x + y * y; } while (r >= 1 || r === 0);
      const m = Math.sqrt(-2 * Math.log(r) / r); spare = y * m; return x * m; };
    return { u, n };
  };

  /* ---------- 가중 이중 평균제거 ---------- */
  function demean(X, w, T) {           // X[k][t], w[k]
    const K = X.length, W = w.reduce((a, b) => a + b, 0);
    const rm = X.map(r => r.reduce((a, b) => a + b, 0) / T);
    const cm = new Array(T).fill(0); let gm = 0;
    for (let k = 0; k < K; k++) for (let t = 0; t < T; t++) cm[t] += w[k] * X[k][t] / W;
    for (let t = 0; t < T; t++) gm += cm[t] / T;
    return X.map((r, k) => r.map((v, t) => v - rm[k] - cm[t] + gm));
  }
  ST.demean = demean;
  const treated = (g, t) => t >= g.g ? 1 : 0;

  /* ---------- 정적 TWFE ---------- */
  ST.twfe = function (groups, T) {
    const w = groups.map(g => g.n);
    const D = groups.map(g => Array.from({ length: T }, (_, t) => treated(g, t)));
    const Dt = demean(D, w, T);
    let num = 0, den = 0;
    groups.forEach((g, k) => { for (let t = 0; t < T; t++) { num += w[k] * Dt[k][t] * g.y[t]; den += w[k] * Dt[k][t] * Dt[k][t]; } });
    // 칸별 가중치: delta = sum_k sum_t cellw[k][t] * (집단 k의 t기 평균효과), 처치된 칸의 합은 1
    const cellw = Dt.map((r, k) => r.map(v => w[k] * v / den));
    return { delta: num / den, D, Dt, den, cellw };
  };

  /* ---------- Goodman-Bacon 분해 ---------- */
  ST.bacon = function (groups, T) {
    const N = groups.reduce((a, g) => a + g.n, 0);
    const tw = ST.twfe(groups, T), VD = tw.den / (N * T);
    const mean = (y, a, b) => { let s = 0; for (let t = a; t < b; t++) s += y[t]; return s / (b - a); };
    const out = [];
    const tr = groups.map((g, i) => ({ ...g, i })).filter(g => isFinite(g.g)).sort((a, b) => a.g - b.g);
    const un = groups.map((g, i) => ({ ...g, i })).filter(g => !isFinite(g.g));
    const Db = g => (T - g.g) / T;
    for (const k of tr) for (const U of un) {
      const nk = k.n / N, nu = U.n / N, nkU = nk / (nk + nu);
      const s = (nk + nu) ** 2 * nkU * (1 - nkU) * Db(k) * (1 - Db(k)) / VD;
      const est = (mean(k.y, k.g, T) - mean(k.y, 0, k.g)) - (mean(U.y, k.g, T) - mean(U.y, 0, k.g));
      out.push({ type: 'TvU', treat: k.i, ctrl: U.i, w: s, est, win: [0, T], split: k.g });
    }
    for (let a = 0; a < tr.length; a++) for (let b = a + 1; b < tr.length; b++) {
      const k = tr[a], l = tr[b]; if (k.g === l.g) continue;
      const nk = k.n / N, nl = l.n / N, nkl = nk / (nk + nl), Dk = Db(k), Dl = Db(l);
      // 먼저 처치된 k 대 아직 미처치인 l (l 도입 전까지)
      const s1 = ((nk + nl) * (1 - Dl)) ** 2 * nkl * (1 - nkl) * ((Dk - Dl) / (1 - Dl)) * ((1 - Dk) / (1 - Dl)) / VD;
      const e1 = (mean(k.y, k.g, l.g) - mean(k.y, 0, k.g)) - (mean(l.y, k.g, l.g) - mean(l.y, 0, k.g));
      out.push({ type: 'EvL', treat: k.i, ctrl: l.i, w: s1, est: e1, win: [0, l.g], split: k.g });
      // 나중에 처치된 l 대 이미 처치된 k (k 도입 이후)
      const s2 = ((nk + nl) * Dk) ** 2 * nkl * (1 - nkl) * (Dl / Dk) * ((Dk - Dl) / Dk) / VD;
      const e2 = (mean(l.y, l.g, T) - mean(l.y, k.g, l.g)) - (mean(k.y, l.g, T) - mean(k.y, k.g, l.g));
      out.push({ type: 'LvE', treat: l.i, ctrl: k.i, w: s2, est: e2, win: [k.g, T], split: l.g });
    }
    return { parts: out, delta: tw.delta, sum: out.reduce((a, p) => a + p.w * p.est, 0), wsum: out.reduce((a, p) => a + p.w, 0) };
  };

  /* ---------- 선형방정식 ---------- */
  function solve(A, b) {
    const n = b.length, M = A.map((r, i) => r.concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-10) return null;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; if (f) for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j]; }
    }
    return M.map((r, i) => r[n] / r[i]);
  }
  ST.solve = solve;

  /* ---------- TWFE 사건연구 ----------
     col(l): 상대시간 l이 들어갈 열 번호, 제외(기준)면 -1.
     반환 fit(Y[k][t]) -> 계수 배열. 같은 설계로 여러 결과를 빠르게 추정한다. */
  ST.eventDesign = function (groups, T, ncol, col) {
    const w = groups.map(g => g.n);
    const X = [];
    for (let c = 0; c < ncol; c++) X.push(demean(groups.map(g => Array.from({ length: T }, (_, t) => (isFinite(g.g) && col(t - g.g) === c) ? 1 : 0)), w, T));
    const A = Array.from({ length: ncol }, () => new Array(ncol).fill(0));
    for (let a = 0; a < ncol; a++) for (let b = a; b < ncol; b++) {
      let s = 0; for (let k = 0; k < groups.length; k++) for (let t = 0; t < T; t++) s += w[k] * X[a][k][t] * X[b][k][t];
      A[a][b] = A[b][a] = s;
    }
    return {
      ok: solve(A, new Array(ncol).fill(0)) !== null,
      fit(Y) {
        const b = new Array(ncol).fill(0);
        for (let c = 0; c < ncol; c++) for (let k = 0; k < groups.length; k++) for (let t = 0; t < T; t++) b[c] += w[k] * X[c][k][t] * Y[k][t];
        return solve(A, b);
      }
    };
  };

  /* ---------- Callaway-Sant'Anna 식 2x2 (공변량 없음) ----------
     mode: 'nyt' 아직 미처치(미처치 포함), 'never' 미처치만, 'last' 마지막 처치 코호트 */
  ST.attgt = function (groups, T, mode) {
    const res = [], lastG = Math.max(...groups.filter(g => isFinite(g.g)).map(g => g.g));
    groups.forEach((g, k) => {
      if (!isFinite(g.g) || g.g === 0) return;
      for (let t = g.g; t < T; t++) {
        const C = groups.filter(c => mode === 'never' ? !isFinite(c.g) : mode === 'last' ? (c.g === lastG && c.g > t && c !== g) : (c.g > t));
        if (!C.length) continue;
        const nC = C.reduce((a, c) => a + c.n, 0);
        const dC = C.reduce((a, c) => a + c.n * (c.y[t] - c.y[g.g - 1]), 0) / nC;
        res.push({ k, g: g.g, t, l: t - g.g, n: g.n, att: (g.y[t] - g.y[g.g - 1]) - dC });
      }
    });
    return res;
  };
  // 상대시간별 집계 (코호트 표본비중 가중)
  ST.aggEvent = function (cells) {
    const m = new Map();
    cells.forEach(c => { const o = m.get(c.l) || { l: c.l, s: 0, n: 0 }; o.s += c.n * c.att; o.n += c.n; m.set(c.l, o); });
    return [...m.values()].sort((a, b) => a.l - b.l).map(o => ({ l: o.l, att: o.s / o.n, n: o.n }));
  };
  // 정적 집계: 코호트별 사후 평균을 구한 뒤 코호트 표본비중으로 평균 (lmax까지만)
  ST.aggStatic = function (cells, lmax) {
    const m = new Map();
    cells.filter(c => lmax == null || c.l <= lmax).forEach(c => { const o = m.get(c.k) || { s: 0, c: 0, n: c.n }; o.s += c.att; o.c++; m.set(c.k, o); });
    let s = 0, n = 0; m.forEach(o => { s += o.n * o.s / o.c; n += o.n; });
    return n ? s / n : NaN;
  };

  /* ---------- Stacked regression ----------
     사건(코호트)마다 [g-pre, g+post] 창과 깨끗한 비교집단(창이 끝날 때까지 미처치)으로 자료를 만들고,
     자료별 단위, 시점 고정효과를 둔 TWFE를 쌓아 추정한다. */
  ST.stacked = function (groups, T, pre, post) {
    let num = 0, den = 0; const stacks = [];
    groups.forEach((g, k) => {
      if (!isFinite(g.g)) return;
      const a = g.g - pre, b = g.g + post; if (a < 0 || b > T - 1) return;
      const C = groups.filter(c => c.g > b); if (!C.length) return;
      const sub = [g].concat(C).map((x, i) => ({ n: x.n, g: i === 0 ? pre : Infinity, y: x.y.slice(a, b + 1) }));
      const tw = ST.twfe(sub, b - a + 1);
      let nm = 0; sub.forEach((x, i) => { for (let t = 0; t < b - a + 1; t++) nm += x.n * tw.Dt[i][t] * x.y[t]; });
      num += nm; den += tw.den; stacks.push({ k, g: g.g, est: nm / tw.den, den: tw.den, nT: g.n, nC: C.reduce((s, c) => s + c.n, 0) });
    });
    return { delta: num / den, stacks: stacks.map(s => ({ ...s, w: s.den / den })) };
  };
  // 쌓은 자료의 사건연구 (상대시간 -pre..post, -1 기준)
  ST.stackedEvent = function (groups, T, pre, post) {
    const L = pre + post + 1, col = l => (l === -1 ? -1 : l < -1 ? l + pre : l + pre - 1), nc = L - 1;
    const A = Array.from({ length: nc }, () => new Array(nc).fill(0)), bb = new Array(nc).fill(0);
    groups.forEach(g => {
      if (!isFinite(g.g)) return; const a = g.g - pre, b = g.g + post; if (a < 0 || b > T - 1) return;
      const C = groups.filter(c => c.g > b); if (!C.length) return;
      const sub = [g].concat(C).map((x, i) => ({ n: x.n, g: i === 0 ? pre : Infinity, y: x.y.slice(a, b + 1) })), w = sub.map(x => x.n);
      const X = []; for (let c = 0; c < nc; c++) X.push(demean(sub.map((x, i) => Array.from({ length: L }, (_, t) => (i === 0 && col(t - pre) === c) ? 1 : 0)), w, L));
      for (let p = 0; p < nc; p++) { for (let q = 0; q < nc; q++) { let s = 0; for (let i = 0; i < sub.length; i++) for (let t = 0; t < L; t++) s += w[i] * X[p][i][t] * X[q][i][t]; A[p][q] += s; }
        for (let i = 0; i < sub.length; i++) for (let t = 0; t < L; t++) bb[p] += w[i] * X[p][i][t] * sub[i].y[t]; }
    });
    const beta = solve(A, bb); const out = [];
    for (let l = -pre; l <= post; l++) out.push({ l, est: l === -1 ? 0 : beta[col(l)] });
    return out;
  };

  /* ---------- 논문 3절 시뮬레이션의 균형패널 단순화 ----------
     결과 단위는 ROA. sigma = 0.309 (원문 표본 표준편차). 연도 1980-2015 (T = 36). */
  ST.SIG = 0.309; ST.Y0 = 1980; ST.T = 36;
  const SIG = ST.SIG;
  ST.SIMS = {
    1: { coh: [1998, null], eff: (g, t) => 0.5 * SIG },
    2: { coh: [1998, null], eff: (g, t) => 0.05 * SIG * (t - g + 1) },
    3: { coh: [1989, 1998, 2007], eff: (g, t) => 0.5 * SIG },
    4: { coh: [1989, 1998, 2007], eff: (g, t) => ({ 1989: 0.5, 1998: 0.3, 2007: 0.1 })[g] * SIG },
    5: { coh: [1989, 1998, 2007], eff: (g, t) => 0.03 * SIG * (t - g + 1) },
    6: { coh: [1989, 1998, 2007], eff: (g, t) => ({ 1989: 0.05, 1998: 0.03, 2007: 0.01 })[g] * SIG * (t - g + 1) },
    // Fig. 5 왼쪽: Simulation 6의 변형 (기울기 0.10, 0.05, 0.01)
    '6b': { coh: [1989, 1998, 2007], eff: (g, t) => ({ 1989: 0.10, 1998: 0.05, 2007: 0.01 })[g] * SIG * (t - g + 1) },
  };
  // 효과 경로 (잡음 없음): 코호트별 길이 T 배열
  ST.effPath = function (sim, g) {
    const S = ST.SIMS[sim];
    return Array.from({ length: ST.T }, (_, i) => { const t = ST.Y0 + i; return (g !== null && t >= g) ? S.eff(g, t) : 0; });
  };
  // Simulation 7 (식 15, 공개 복제 코드 기준): 처치효과는 0, 도입 전 기울기가 코호트마다 다르다
  ST.sim7Path = function (g) {
    const s = ({ 1989: 0.01, 1998: 0.035, 2007: 0.035 })[g] * SIG;
    return Array.from({ length: ST.T }, (_, i) => { const t = ST.Y0 + i; return t < g ? -s * (g - t) : 0; });
  };
  // 주(state) 수: 공개 복제 코드의 배정 (Sim 1-2는 25/25, Sim 3-6은 17/18/15)
  ST.NS = sim => ST.SIMS[sim].coh.length === 2 ? [25, 25] : [17, 18, 15];
  // 참 ATT: 기업평균(코호트별 사후 평균을 단위 수로 가중), 관측치평균(모든 사후 칸을 동일 가중)
  ST.trueATT = function (sim, ns) {
    const S = ST.SIMS[sim]; let fa = 0, fn = 0, oa = 0, on = 0;
    S.coh.forEach((g, i) => { if (g === null) return; const e = ST.effPath(sim, g).slice(g - ST.Y0);
      const m = e.reduce((a, b) => a + b, 0) / e.length; fa += ns[i] * m; fn += ns[i]; oa += ns[i] * e.reduce((a, b) => a + b, 0); on += ns[i] * e.length; });
    return { firm: fa / fn, obs: oa / on };
  };

  root.ST = ST;
})(typeof window !== 'undefined' ? window : globalThis);
