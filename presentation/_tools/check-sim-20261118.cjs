// 시뮬레이션 코어가 내는 수치를 출력한다 (슬라이드 문구와 대조용). 실행: node _tools/check-sim-20261118.cjs
const fs = require('fs'), path = require('path'), vm = require('vm');
for (const f of ['stats.js', 'simcore.js']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../_src/20261118', f), 'utf8') + (f === 'simcore.js' ? '\nglobalThis.SIM=SIM;' : ''));
const t0 = Date.now(), S = SIM.get(), f = (v, d = 3) => v.toFixed(d);
console.log('init ms', Date.now() - t0);
const mean = a => a.reduce((x, y) => x + y, 0) / a.length, sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(v => (v - m) ** 2))); };
for (const s of [1, 2, 3, 4, 5, 6]) { const e = S.est(s); console.log(`Sim${s} TWFE mean ${f(mean(e))}σ sd ${f(sd(e), 4)} | eff ${f(S.twEff[s] / S.SIG)} | firm ${f(S.truth[s].firm / S.SIG)} obs ${f(S.truth[s].obs / S.SIG)} | share<0 ${f(e.filter(v => v < 0).length / e.length, 2)}`); }
for (const s of [4, 5, 6]) { const g = S.groupsOf('B', S.effY(s)), b = ST.bacon(g, S.T); console.log(`Sim${s} bacon`, b.parts.map(p => `${p.type}${S.DES.B.coh[p.treat]}v${S.DES.B.coh[p.ctrl]} ${f(p.est / S.SIG)}σ w${f(p.w)}`).join(' | '), 'LvE wsum', f(b.parts.filter(p => p.type === 'LvE').reduce((a, p) => a + p.w, 0))); }
let t1 = Date.now(); const hs = []; for (let h = 0; h <= 0.1001; h += 0.0025) hs.push(h);
console.log('insig', hs.map(h => `${(h * 100).toFixed(2)}:${(S.insig(h) * 100).toFixed(0)}`).join(' '), 'ms', Date.now() - t1);
const ts = S.tstats(0.03); console.log('t(0.03) range', f(Math.min(...ts), 1), f(Math.max(...ts), 1), 'sd', f(sd(Array.from(ts)), 1));
const p6b = [1989, 1998, 2007].map(g => ST.effPath('6b', g)), p7 = [1989, 1998, 2007].map(g => ST.sim7Path(g));
console.log('EV 6b', S.event(p6b).map(o => `${o.l}:${f(o.mean)}[${f(o.lo)},${f(o.hi)}]`).join(' '));
console.log('TRUE 6b', S.trueEvent(p6b).map(o => `${o.l}:${f(o.v)}`).join(' '));
console.log('EV 7', S.event(p7).map(o => `${o.l}:${f(o.mean)}[${f(o.lo)},${f(o.hi)}]`).join(' '));
console.log('TRUE 7', S.trueEvent(p7).map(o => `${o.l}:${f(o.v)}`).join(' '));
const p6 = S.effY(6); console.log('EV 6', S.event(p6).map(o => `${o.l}:${f(o.mean)}`).join(' '));
console.log('TRUE 6 (89,98)', S.trueEvent(p6, [1989, 1998]).map(o => `${o.l}:${f(o.v)}`).join(' '));
t1 = Date.now(); const a = S.altDist(6); console.log('alt ms', Date.now() - t1, 'truth', f(a.truth), 'CS', f(mean(a.cs)), f(sd(a.cs), 4), 'SA', f(mean(a.sa)), f(sd(a.sa), 4), 'ST', f(mean(a.st)), f(sd(a.st), 4), 'TW', f(mean(a.tw)), f(sd(a.tw), 4));
console.log('CS ev', a.base.csE.map(o => `${o.l}:${f(o.v / S.SIG)}`).join(' ')); console.log('SA ev', a.base.saE.map(o => `${o.l}:${f(o.v / S.SIG)}`).join(' ')); console.log('ST ev', a.base.stE.map(o => `${o.l}:${f(o.v / S.SIG)}`).join(' '));
for (const s of [4, 5]) { const x = S.altDist(s); console.log(`alt Sim${s} truth ${f(x.truth)} CS ${f(mean(x.cs))} SA ${f(mean(x.sa))} ST ${f(mean(x.st))} sd ${f(sd(x.cs), 4)} ${f(sd(x.sa), 4)} ${f(sd(x.st), 4)}`); }
const w = S.evWeights(-3); console.log('weights l=-3', w.map(r => r.map(v => v.toFixed(3)).join(' ')).join('\n  '), '\n sums', w.map(r => f(r.reduce((x, y) => x + y, 0))).join(' '));
