/* 시뮬레이션 코어 (원문 3절 설정의 균형패널 단순화).
   - 50개 주, 1980-2015. Sim 1-2는 25/25(1998 도입, 미처치), Sim 3-6은 17/18/15(1989, 1998, 2007 도입). 공개 복제 코드의 배정과 같다.
   - 주-연도 평균 잡음 ~ N(0, SD_S^2). 모든 추정량이 결과에 대해 선형이므로 "효과 부분 + 잡음 부분"으로 나눠 계산한다.
   - 결과 단위는 ROA, 화면 표시는 sigma(= 0.309) 단위. */
const SIM = (function () {
  'use strict';
  const T = ST.T, Y0 = ST.Y0, SIG = ST.SIG, NSIM = 500, NST = 50, SD_S = 0.036, SD_YEAR = 0.02;
  const DES = {
    A: { coh: [1998, null], n: [25, 25] },
    B: { coh: [1989, 1998, 2007], n: [17, 18, 15] },
  };
  const desOf = sim => ST.SIMS[sim].coh.length === 2 ? 'A' : 'B';
  const gidx = g => g === null ? Infinity : g - Y0;
  const groupsOf = (des, ys) => DES[des].coh.map((g, k) => ({ n: DES[des].n[k], g: gidx(g), y: ys[k] }));
  const stateGroup = (des, s) => { let a = 0; for (let k = 0; k < DES[des].n.length; k++) { a += DES[des].n[k]; if (s < a) return k; } return 0; };
  const zeros = des => DES[des].coh.map(() => new Array(T).fill(0));
  // 사건연구 사양 (원문 Fig. 5): 묶음(-6 이전), -5..-2, 0..5, 묶음(6 이후). -1 제외. 열 12개
  const EV_COL = l => l < -5 ? 0 : l === -1 ? -1 : l <= -2 ? l + 6 : l <= 5 ? l + 5 : 11;
  const EV_L = [-5, -4, -3, -2, 0, 1, 2, 3, 4, 5];

  let cache = null;
  function get() {
    if (cache) return cache;
    const R = ST.rng(20261118);
    const year = Array.from({ length: T }, () => R.n() * SD_YEAR);
    // 잡음: noise[i][s][t]
    const noise = [];
    for (let i = 0; i < NSIM; i++) { const m = []; for (let s = 0; s < NST; s++) { const r = new Float64Array(T); for (let t = 0; t < T; t++) r[t] = R.n() * SD_S; m.push(r); } noise.push(m); }
    const z3 = Array.from({ length: NSIM }, () => [R.n(), R.n(), R.n()]);
    // 설계별 코호트 평균 잡음
    const cm = {};
    for (const des of ['A', 'B']) cm[des] = noise.map(m => { const out = zeros(des), n = DES[des].n; let s = 0;
      n.forEach((nk, k) => { for (let j = 0; j < nk; j++, s++) for (let t = 0; t < T; t++) out[k][t] += m[s][t] / nk; }); return out; });
    // 정적 TWFE
    const tw = {}, twNoise = {};
    for (const des of ['A', 'B']) { tw[des] = ST.twfe(groupsOf(des, zeros(des)), T);
      twNoise[des] = cm[des].map(y => { let s = 0; y.forEach((r, k) => { for (let t = 0; t < T; t++) s += DES[des].n[k] * tw[des].Dt[k][t] * r[t]; }); return s / tw[des].den; }); }
    const effY = sim => ST.SIMS[sim].coh.map(g => ST.effPath(sim, g));
    const twEff = {}, truth = {};
    for (const sim of [1, 2, 3, 4, 5, 6]) { const des = desOf(sim); twEff[sim] = ST.twfe(groupsOf(des, effY(sim)), T).delta; truth[sim] = ST.trueATT(sim, DES[des].n); }
    const est = sim => { const d = twNoise[desOf(sim)], e = twEff[sim]; return d.map(v => (v + e) / SIG); };

    // ---- 제1종 오류 (Sim 6'): 코호트별 기울기 tau_g ~ N(0, (h sigma)^2), 주 단위 군집 t값 ----
    const D = tw.B.Dt, den = tw.B.den, nB = DES.B.n, N = NST;
    const dC = []; for (let s = 0; s < NST; s++) { const k = stateGroup('B', s); let v = 0; for (let t = 0; t < T; t++) v += D[k][t] * D[k][t]; dC.push(v); }
    const unit = DES.B.coh.map(g => Array.from({ length: T }, (_, t) => (Y0 + t >= g) ? (Y0 + t - g + 1) : 0));   // 기울기 1인 경로
    const bC = unit.map((p, g) => { const out = []; for (let s = 0; s < NST; s++) { const k = stateGroup('B', s); let v = 0;
      for (let t = 0; t < T; t++) v += D[k][t] * ((k === g ? p[t] : 0) - nB[g] / N * p[t]); out.push(v); } return out; });
    const aC = noise.map(m => { const tm = new Float64Array(T); for (let s = 0; s < NST; s++) for (let t = 0; t < T; t++) tm[t] += m[s][t] / N;
      const out = new Float64Array(NST); for (let s = 0; s < NST; s++) { const k = stateGroup('B', s); let v = 0; for (let t = 0; t < T; t++) v += D[k][t] * (m[s][t] - tm[t]); out[s] = v; } return out; });
    function tcore(tauOf) {
      const out = new Float64Array(NSIM);
      for (let i = 0; i < NSIM; i++) { const tau = tauOf(i); let sum = 0; const A = new Float64Array(NST);
        for (let s = 0; s < NST; s++) { A[s] = aC[i][s] + tau[0] * bC[0][s] + tau[1] * bC[1][s] + tau[2] * bC[2][s]; sum += A[s]; }
        const d = sum / den; let v = 0; for (let s = 0; s < NST; s++) { const sc = A[s] - d * dC[s]; v += sc * sc; }
        out[i] = d / Math.sqrt(N / (N - 1) * v / (den * den)); }
      return out;
    }
    const tstats = h => tcore(i => z3[i].map(z => z * h * SIG));   // h: 기울기 표준편차 (sigma 대비 비율)
    const tfix = slopes => tcore(() => slopes.map(v => v * SIG));     // 코호트별 기울기가 정해진 경우 (Sim 5, 6)
    const insig = h => { const t = tstats(h); let c = 0; for (let i = 0; i < NSIM; i++) if (Math.abs(t[i]) < 1.96) c++; return c / NSIM; };

    // ---- TWFE 사건연구 (Fig. 5 사양) ----
    const evD = ST.eventDesign(groupsOf('B', zeros('B')), T, 12, EV_COL);
    const evNoise = cm.B.map(y => evD.fit(y));
    function event(paths) {     // paths: 코호트별 결과 경로(잡음 없음). 반환: 상대시간별 {l, mean, lo, hi} (sigma 단위)
      const b = evD.fit(paths);
      return EV_L.map(l => { const c = EV_COL(l), v = evNoise.map(n => (n[c] + b[c]) / SIG).sort((x, y) => x - y);
        return { l, mean: b[c] / SIG, lo: v[Math.floor(NSIM * .025)], hi: v[Math.ceil(NSIM * .975) - 1] }; });
    }
    // 상대시간별 참 평균효과 (관측치 평균: 해당 상대시간이 관측되는 코호트를 주 수로 가중)
    function trueEvent(paths, only) {
      const out = []; for (let l = -5; l <= 5; l++) { let s = 0, n = 0; DES.B.coh.forEach((g, k) => { if (only && !only.includes(g)) return; const t = g - Y0 + l; if (t < 0 || t >= T) return; s += nB[k] * paths[k][t]; n += nB[k]; }); out.push({ l, v: s / n / SIG }); }
      return out;
    }
    // 사건연구 계수가 싣는 가중치: 계수 l의 (코호트 k, 도입 후 경과 e) 효과에 대한 가중치
    function evWeights(l) {
      const c = EV_COL(l); return DES.B.coh.map((g, k) => { const out = []; for (let t = g - Y0; t < T; t++) { const Y = zeros('B'); Y[k][t] = 1; out.push(evD.fit(Y)[c]); } return out; });
    }

    // ---- 대안 추정량 (Sim 6, 공개 복제 코드의 사양) ----
    // CS: 아직 미처치 비교, 코호트별 e = 0..5 평균을 주 수로 가중. SA: 2007년 코호트를 비교집단으로 (2007년 이전 자료), 같은 집계. Stacked: 창 -5..+5
    const sub = (y, tmax) => y.map(r => r.slice(0, tmax));
    function alt(paths) {
      const g = groupsOf('B', paths);
      const cs = ST.attgt(g, T, 'nyt'), sa = ST.attgt(groupsOf('B', paths), T, 'last');
      const stat = cells => ST.aggStatic(cells.filter(c => c.l <= 5), 5);
      const evt = cells => { const m = ST.aggEvent(cells.filter(c => c.l <= 5)); return m.map(o => ({ l: o.l, v: o.att })); };
      return { cs: stat(cs), sa: stat(sa), st: ST.stacked(g, T, 5, 5).delta, csE: evt(cs), saE: evt(sa), stE: ST.stackedEvent(g, T, 5, 5).map(o => ({ l: o.l, v: o.est })) };
    }
    const sum2 = (a, b) => a.map((r, k) => r.map((v, t) => v + b[k][t]));
    function altDist(sim) {
      const e = effY(sim), base = alt(e);
      const out = { cs: [], sa: [], st: [], tw: est(sim) };
      for (let i = 0; i < NSIM; i++) { const a = alt(sum2(e, cm.B[i])); out.cs.push(a.cs / SIG); out.sa.push(a.sa / SIG); out.st.push(a.st / SIG); }
      // 기준값: 1989, 1998 코호트의 도입 후 0-5년 효과 (기업평균 = 관측치평균, 균형패널)
      let s = 0, n = 0; [0, 1].forEach(k => { const g = DES.B.coh[k] - Y0; let m = 0; for (let l = 0; l <= 5; l++) m += e[k][g + l] / 6; s += nB[k] * m; n += nB[k]; });
      out.truth = s / n / SIG; out.base = base; return out;
    }

    // 표시용 모의자료 하나 (0번): 주별 경로 = 연도 공통 충격 + 주 잡음 + 효과
    function sample(sim) {
      const des = desOf(sim), e = effY(sim);
      const st = []; for (let s = 0; s < NST; s++) { const k = stateGroup(des, s); st.push({ k, y: Array.from({ length: T }, (_, t) => year[t] + noise[0][s][t] + e[k][t]) }); }
      const mean = DES[des].coh.map((g, k) => Array.from({ length: T }, (_, t) => year[t] + cm[des][0][k][t] + e[k][t]));
      return { st, mean, des };
    }
    cache = { T, Y0, SIG, NSIM, NST, DES, desOf, est, twEff, truth, effY, tstats, tfix, insig, event, trueEvent, evWeights, alt, altDist, sample, groupsOf, zeros, EV_L, EV_COL, year };
    return cache;
  }
  return { get, T, Y0, SIG, NSIM, DES, desOf };
})();
