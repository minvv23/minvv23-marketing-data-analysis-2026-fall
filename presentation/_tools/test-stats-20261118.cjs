// 심층요약의 손계산 값과 stats.js를 대조한다. 실행: node _tools/test-stats-20261118.cjs
const fs = require('fs'), path = require('path'), vm = require('vm');
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../_src/20261118/stats.js'), 'utf8'));
const ST = globalThis.ST;
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;
let fail = 0; const ok = (name, cond, extra = '') => { console.log((cond ? 'OK  ' : 'FAIL') + ' ' + name + ' ' + extra); if (!cond) fail++; };
const I = Infinity;

// (a) 5절: E(0,2,10), L(0,0,2) → -2, 칸 가중치 1, -1/2, 1/2
{ const g = [{ n: 1, g: 1, y: [0, 2, 10] }, { n: 1, g: 2, y: [0, 0, 2] }], r = ST.twfe(g, 3), b = ST.bacon(g, 3);
  ok('5절 TWFE=-2', near(r.delta, -2), r.delta);
  ok('5절 칸 가중치', near(r.cellw[0][1], 1) && near(r.cellw[0][2], -0.5) && near(r.cellw[1][2], 0.5), JSON.stringify(r.cellw));
  ok('5절 Dtilde', near(r.Dt[0][2], -1 / 6) && near(r.Dt[0][1], 1 / 3));
  ok('5절 분해', b.parts.length === 2 && near(b.parts[0].est, 2) && near(b.parts[1].est, -6) && near(b.parts[0].w, .5) && near(b.sum, -2), JSON.stringify(b.parts.map(p => [p.type, p.est, p.w]))); }

// (b) 6.2절: U, k(2기), l(4기), 효과 1,3,5,7
const ex = nU => [{ n: nU, g: I, y: [0, 0, 0, 0, 0] }, { n: 1, g: 1, y: [0, 1, 3, 5, 7] }, { n: 1, g: 3, y: [0, 0, 0, 1, 3] }].filter(x => x.n > 0);
{ const g = ex(1), r = ST.twfe(g, 5), b = ST.bacon(g, 5);
  ok('6.2절 TWFE=1.5', near(r.delta, 1.5), r.delta);
  const P = Object.fromEntries(b.parts.map(p => [p.type + p.treat, p]));
  ok('6.2절 2x2', near(P.TvU1.est, 4) && near(P.TvU1.w, .25) && near(P.TvU2.est, 2) && near(P.TvU2.w, .375) && near(P.EvL1.est, 2) && near(P.EvL1.w, .125) && near(P.LvE2.est, -2) && near(P.LvE2.w, .25), JSON.stringify(b.parts.map(p => [p.type, p.treat, p.est, +p.w.toFixed(4)])));
  ok('6.2절 가중합', near(b.sum, 1.5) && near(b.wsum, 1));
  ok('6.2절 칸 가중치', near(r.cellw[1][1], .25) && near(r.cellw[1][3], -1 / 16) && near(r.cellw[2][3], 5 / 16), JSON.stringify(r.cellw[1].map(v => +v.toFixed(4))));
  const tab = [[0, -0.67, .67], [1, 1.5, .25], [2, 2.0, .15], [4, 2.35, .09], [10, 2.60, .04]];
  tab.forEach(([nU, d, fw]) => { const gg = ex(nU), bb = ST.bacon(gg, 5), f = bb.parts.find(p => p.type === 'LvE');
    ok(`U=${nU}`, near(bb.delta, d, .006) && near(f.w, fw, .006) && near(bb.sum, bb.delta), `${bb.delta.toFixed(3)} ${f.w.toFixed(3)}`); });
  // CS: 어떤 비교집단이든 1,3,5,7 / 1,3
  for (const m of ['never', 'nyt']) { const c = ST.attgt(g, 5, m).map(x => x.att); ok('CS ' + m, c.join() === '1,3,5,7,1,3', c.join()); }
  ok('CS 집계', near(ST.aggStatic(ST.attgt(g, 5, 'nyt')), 3)); }

// (c) 9.1절 사건연구
{ const all = (g2) => { const g = [{ n: 1, g: I, y: [0, 0, 0, 0, 0] }, { n: 1, g: 1, y: [0, 1, 3, 5, 7] }, { n: 1, g: 3, y: g2 }];
    const ls = [-3, -2, 0, 1, 2, 3], d = ST.eventDesign(g, 5, 6, l => ls.indexOf(l)); return d.fit(g.map(x => x.y)); };
  const a = all([0, 0, 0, 1, 3]); ok('9.1 동질 동학', a.every((v, i) => near(v, [0, 0, 1, 3, 5, 7][i], 1e-8)), a.map(v => v.toFixed(3)).join());
  const b = all([0, 0, 0, 1, 1]); ok('9.1 이질 동학', near(b[0], .62, .006) && near(b[1], .69, .006) && near(b[2], 1.15, .006) && near(b[3], 2.09, .006) && near(b[4], 4.60, .006) && near(b[5], 7.07, .006), b.map(v => v.toFixed(3)).join());
  const g = [{ n: 1, g: I, y: [0, 0, 0, 0, 0] }, { n: 1, g: 1, y: [0, 1, 3, 5, 7] }, { n: 1, g: 3, y: [0, 0, 0, 1, 3] }];
  const c = ST.eventDesign(g, 5, 3, l => l <= -2 ? 0 : l === 0 ? 1 : l >= 1 ? 2 : -1).fit(g.map(x => x.y));
  ok('9.1 구간 묶음', near(c[0], .66, .006) && near(c[1], .5, .006) && near(c[2], 3.26, .006), c.map(v => v.toFixed(3)).join()); }

// (d) 12절 stacked: U 1, k 1, l 3, 효과 k=2, l=6, 창 ±1 → 122/31
{ const g = [{ n: 1, g: I, y: [0, 0, 0, 0, 0] }, { n: 1, g: 1, y: [0, 2, 2, 2, 2] }, { n: 3, g: 3, y: [0, 0, 0, 6, 6] }];
  const s = ST.stacked(g, 5, 1, 1); ok('12절 stacked=122/31', near(s.delta, 122 / 31) && near(s.stacks[0].w, 16 / 31), `${s.delta} ${s.stacks.map(x => x.est + ':' + x.w.toFixed(3))}`); }

// (e) Simulation 5, 6 잡음 없는 균형패널 (Cheat Sheet: Sim 6 = -0.075 sigma, 기업평균 0.345 sigma, Sim 5는 참효과의 약 5%)
{ const mk = sim => ST.SIMS[sim].coh.map(g => ({ n: 1, g: g === null ? I : g - ST.Y0, y: ST.effPath(sim, g) }));
  const r6 = ST.twfe(mk(6), ST.T).delta / ST.SIG, t6 = ST.trueATT(6, [1, 1, 1]).firm / ST.SIG;
  ok('Sim6 TWFE=-0.075σ', near(r6, -0.075, .0006), r6.toFixed(4)); ok('Sim6 기업평균=0.345σ', near(t6, .345, .0006), t6.toFixed(4));
  const r5 = ST.twfe(mk(5), ST.T).delta, t5 = ST.trueATT(5, [1, 1, 1]).firm; ok('Sim5 ≈ 5%', near(r5 / t5, .05, .01), (r5 / t5).toFixed(4));
  for (const s of [1, 2, 3]) { const r = ST.twfe(mk(s), ST.T).delta, t = ST.trueATT(s, [1, 1, 1]); ok(`Sim${s} 무편향`, near(r, t.firm, 1e-9), `${(r / ST.SIG).toFixed(4)} firm ${(t.firm / ST.SIG).toFixed(4)} obs ${(t.obs / ST.SIG).toFixed(4)}`); }
  const r4 = ST.twfe(mk(4), ST.T).delta, t4 = ST.trueATT(4, [1, 1, 1]); console.log('  Sim4', (r4 / ST.SIG).toFixed(4), 'firm', (t4.firm / ST.SIG).toFixed(4), 'obs', (t4.obs / ST.SIG).toFixed(4));
  const b6 = ST.bacon(mk(6), ST.T); console.log('  Sim6 분해', b6.parts.map(p => `${p.type} ${ST.SIMS[6].coh[p.treat]}v${ST.SIMS[6].coh[p.ctrl]} est ${(p.est).toFixed(3)} w ${p.w.toFixed(3)}`).join(' | '), 'sum', b6.sum.toFixed(4));
  // 대안 추정량 (Sim 6): 사건연구 경로 복원
  const cs = ST.aggEvent(ST.attgt(mk(6), ST.T, 'nyt')).filter(x => x.l <= 5).map(x => (x.att / ST.SIG).toFixed(3)); console.log('  Sim6 CS 상대시간', cs.join(' '));
  const se = ST.stackedEvent(mk(6), ST.T, 5, 5).map(x => (x.est / ST.SIG).toFixed(3)); console.log('  Sim6 stacked 상대시간', se.join(' '));
  console.log('  Sim6 CS 정적(5년)', (ST.aggStatic(ST.attgt(mk(6), ST.T, 'nyt'), 5) / ST.SIG).toFixed(4), 'stacked', (ST.stacked(mk(6), ST.T, 5, 5).delta / ST.SIG).toFixed(4)); }
console.log(fail ? `\n${fail} FAILED` : '\nALL OK'); process.exit(fail ? 1 : 0);
