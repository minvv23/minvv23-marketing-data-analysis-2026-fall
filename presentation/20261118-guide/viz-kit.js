/* 독해가이드 도식 공용 도구 (window.GV)
   원칙: 요소는 한 번 만들고 단계마다 목표값만 정한다(화면 = f(단계)). 무대(축, 격자) 다음 데이터 표시, 그다음 값 라벨, 마지막에 주석.
   값 라벨은 표시보다 먼저 나오지 않는다. 반사실은 점선 윤곽. 색은 CSS 변수(--c1 먼저 도입, --c2 나중, --c3 세 번째/참값, --u 미처치, --bad 문제).
   등록: GV.reg('이름', host => { ... })  /  조각: <div class="widget" data-w="이름"></div> */
(function () {
  'use strict';
  const R = {};
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.GV_INSTANT || (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  const smooth = t => t * t * t * (t * (6 * t - 15) + 10);          // manim의 smooth
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lin = (d0, d1, r0, r1) => { const f = v => r0 + (v - d0) / (d1 - d0) * (r1 - r0); f.inv = y => d0 + (y - r0) / (r1 - r0) * (d1 - d0); return f; };
  const C = n => `var(--${n})`;
  const fmt = (x, d = 2) => (Math.abs(x) < 5e-10 ? 0 : x).toFixed(d).replace(/^-/, '−');

  /* ---------- 요소 ---------- */
  const NUM = ['x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'opacity', 'tx', 'ty', 'sc', 'rot', 'stroke-width', 'stroke-dashoffset', 'font-size'];
  function apply(e, a) {
    for (const k in a) {
      const v = a[k];
      if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'cls') e.setAttribute('class', v);
      else if (k === 'css') e.setAttribute('style', v);
      else if (k === 'pts') { e.__v.pts = v.map(p => p.slice()); writePts(e); }
      else if (k === 'tx' || k === 'ty' || k === 'sc' || k === 'rot') { e.__v[k] = v; writeTf(e); }
      else if (k === 'opacity') { e.__v.opacity = v; e.setAttribute('opacity', v); e.style.visibility = v <= 0.001 ? 'hidden' : ''; }
      else { if (NUM.includes(k) && typeof v === 'number') e.__v[k] = v; e.setAttribute(k, v); }
    }
  }
  function writePts(e) { const p = e.__v.pts; if (!p) return; if (e.tagName === 'path') e.setAttribute('d', p.length ? 'M' + p.map(q => q[0].toFixed(2) + ',' + q[1].toFixed(2)).join('L') + (e.__closed ? 'Z' : '') : ''); else e.setAttribute('points', p.map(q => q[0].toFixed(2) + ',' + q[1].toFixed(2)).join(' ')); }
  function writeTf(e) { const v = e.__v; e.setAttribute('transform', `translate(${v.tx || 0},${v.ty || 0})${v.rot ? ` rotate(${v.rot})` : ''}${v.sc != null && v.sc !== 1 ? ` scale(${v.sc})` : ''}`); }
  function s(tag, a, p) { const e = document.createElementNS(NS, tag); e.__v = {}; if (a && a.closed) { e.__closed = true; delete a.closed; } apply(e, a || {}); if (p) p.appendChild(e); return e; }
  function h(tag, a, p) { const e = document.createElement(tag); for (const k in (a || {})) { if (k === 'text') e.textContent = a[k]; else if (k === 'html') e.innerHTML = a[k]; else if (k === 'cls') e.className = a[k]; else if (k === 'css') e.setAttribute('style', a[k]); else if (k.startsWith('on')) e[k] = a[k]; else e.setAttribute(k, a[k]); } if (p) p.appendChild(e); return e; }

  /* ---------- 트윈 ---------- */
  const live = new Set(); let raf = 0;
  function loop(now) {
    raf = 0;
    for (const t of [...live]) {
      const u = clamp((now - t.t0) / t.dur, 0, 1); if (u <= 0) { continue; }
      const k = smooth(u), e = t.e;
      for (const key in t.to) {
        if (key === 'pts') { e.__v.pts = t.to.pts.map((q, i) => { const f = t.from.pts[i] || q; return [f[0] + (q[0] - f[0]) * k, f[1] + (q[1] - f[1]) * k]; }); writePts(e); }
        else { const v = t.from[key] + (t.to[key] - t.from[key]) * k; if (key === 'opacity') { e.__v.opacity = v; e.setAttribute('opacity', v.toFixed(3)); e.style.visibility = v <= 0.001 ? 'hidden' : ''; } else if (key === 'tx' || key === 'ty' || key === 'sc' || key === 'rot') { e.__v[key] = v; writeTf(e); } else { e.__v[key] = v; e.setAttribute(key, v.toFixed(2)); } }
      }
      if (u >= 1) { live.delete(t); if (t.done) t.done(); }
    }
    if (live.size) raf = requestAnimationFrame(loop);
  }
  /* ---------- 재생 속도: 모든 도식이 공유한다. 단계 간격과 전환 시간을 같은 비율로 줄인다. 브라우저에 기억한다. ---------- */
  const SPEEDS = [0.5, 1, 1.5, 2, 3], SKEY = 'sdid-guide-speed';
  let speed = 1; try { const v = parseFloat(localStorage.getItem(SKEY)); if (SPEEDS.includes(v)) speed = v; } catch (e) { }
  const speedSubs = new Set();
  function setSpeed(v) { speed = v; try { localStorage.setItem(SKEY, String(v)); } catch (e) { } speedSubs.forEach(f => f(v)); }

  /* to(e, {attr: 목표}, {dur, delay, done}) : 숫자 속성, opacity, pts(점 배열, 같은 길이), tx/ty/sc/rot를 보간한다. 나머지는 즉시 바꾼다. */
  function to(e, a, o) {
    o = o || {}; const dur = reduce || o.dur === 0 ? 0 : (o.dur || 650) / speed, delay = reduce ? 0 : (o.delay || 0) / speed;
    for (const t of [...live]) if (t.e === e) { for (const k in a) delete t.to[k]; }
    const tw = { e, to: {}, from: {}, t0: performance.now() + delay, dur: Math.max(dur, 1), done: o.done }, inst = {};
    for (const k in a) {
      const v = a[k];
      if (k === 'pts' && dur) { const cur = e.__v.pts; if (cur && cur.length === v.length) { tw.from.pts = cur.map(q => q.slice()); tw.to.pts = v; } else inst.pts = v; }
      else if ((NUM.includes(k) || k === 'opacity') && typeof v === 'number' && dur) { let cur = e.__v[k]; if (cur == null) cur = k === 'opacity' ? 1 : (k === 'sc' ? 1 : 0); tw.from[k] = cur; tw.to[k] = v; }
      else inst[k] = v;
    }
    if (Object.keys(inst).length) { if (delay) setTimeout(() => apply(e, inst), delay); else apply(e, inst); }
    if (Object.keys(tw.to).length) { live.add(tw); if (!raf) raf = requestAnimationFrame(loop); } else if (o.done) setTimeout(o.done, delay + dur);
    return e;
  }
  /* show(e, on, opts): opacity 0과 1 사이 */
  const show = (e, on, o) => to(e, { opacity: on ? 1 : 0 }, Object.assign({ dur: 380 }, o || {}));
  /* 숫자 라벨이 값을 따라 세며 바뀐다 */
  function count(e, v, d, o) { o = o || {}; const from = e.__num == null ? v : e.__num; e.__num = v; const pre = o.pre || '', post = o.post || '';
    if (reduce || from === v) { e.textContent = pre + fmt(v, d) + post; return; }
    const t0 = performance.now() + (o.delay || 0) / speed, dur = (o.dur || 600) / speed; const step = now => { const u = clamp((now - t0) / dur, 0, 1); e.textContent = pre + fmt(from + (v - from) * smooth(u), d) + post; if (u < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }

  /* ---------- 축 ---------- */
  function yAxis(g, y, ticks, x0, x1, f) { ticks.forEach(v => { s('line', { x1: x0, x2: x1, y1: y(v), y2: y(v), cls: v === 0 ? 'zero' : 'ax' }, g); s('text', { x: x0 - 7, y: y(v) + 4, 'text-anchor': 'end', text: f ? f(v) : String(v).replace('-', '−') }, g); }); }
  function xTicks(g, x, ticks, yb, f) { ticks.forEach(v => s('text', { x: x(v), y: yb, 'text-anchor': 'middle', text: f ? f(v) : String(v).replace('-', '−') }, g)); }

  /* ---------- 틀과 조작 ---------- */
  /* frame(host, {kind, title, w, h, note}) : 머리말, svg, 설명줄, 조작줄, 각주를 만든다 */
  function frame(host, o) {
    host.classList.add('viz');
    host.innerHTML = '';
    h('p', { cls: 'wt', text: o.kind || '도식' }, host);
    if (o.title) h('p', { cls: 'wh', text: o.title }, host);
    const top = h('div', { cls: 'ctrls' }, host);
    const svg = s('svg', { viewBox: `0 0 ${o.w} ${o.h}`, cls: 'wsvg', role: 'img', 'aria-label': o.title || '' }, host);
    const cap = h('div', { cls: 'vcap', 'aria-live': 'polite' }, host);
    const bar = h('div', { cls: 'vbar' }, host);
    const out = h('div', { cls: 'vout' }, host);
    if (o.note) h('p', { cls: 'wnote', text: o.note }, host);
    if (!o.controls) top.remove();
    return { svg, cap, bar, top, out, host };
  }
  /* stepper(host, {title, w, h, steps:[설명 문장...], init(svg, api) -> render(step, anim)})
     단계 버튼(처음, 이전, n / N, 다음, 자동 재생)과 설명줄을 만든다. 화면에 들어오면 0단계를 그린다. */
  function stepper(host, o) {
    const F = frame(host, o), N = o.steps.length; let cur = 0, timer = 0;
    const render = o.init(F.svg, F);
    const b = (t, fn, cls) => h('button', { type: 'button', cls: 'vb' + (cls ? ' ' + cls : ''), text: t, onclick: fn }, F.bar);
    const first = b('처음', () => { stop(); go(0); }), prev = b('이전', () => { stop(); go(cur - 1); });
    const pos = h('span', { cls: 'vpos' }, F.bar);
    const dots = h('span', { cls: 'vdots' }, F.bar); const ds = o.steps.map((_, i) => h('i', { onclick: () => { stop(); go(i); } }, dots));
    const next = b('다음', () => { stop(); go(cur + 1); }, 'pri'), play = b('자동 재생', () => { if (timer) stop(); else { if (cur >= N - 1) go(0); play.textContent = '멈춤'; tick(); } });
    // 다음 단계까지의 간격은 그때의 속도로 정한다. 재생 중에 속도를 바꾸면 남은 간격을 새 속도로 다시 잡는다.
    function tick() { clearTimeout(timer); timer = setTimeout(() => { go(cur + 1); if (cur < N - 1) tick(); else stop(); }, (o.interval || 2800) / speed); }
    function stop() { if (timer) clearTimeout(timer); timer = 0; play.textContent = '자동 재생'; }
    const spw = h('span', { cls: 'vspeed' }, F.bar); h('span', { cls: 'seg-l', text: '속도' }, spw);
    const spg = h('span', { cls: 'seg', role: 'group', 'aria-label': '자동 재생 속도' }, spw);
    const spb = SPEEDS.map(v => h('button', { type: 'button', text: v + '×', onclick: () => setSpeed(v) }, spg));
    const paintSpeed = v => spb.forEach((x, i) => x.setAttribute('aria-pressed', String(SPEEDS[i] === v)));
    paintSpeed(speed); speedSubs.add(v => { paintSpeed(v); if (timer) tick(); });
    function go(i, anim = true) {
      cur = clamp(i, 0, N - 1); render(cur, anim);
      F.cap.innerHTML = `<span class="vn">${cur + 1}</span><span class="vt">${o.steps[cur]}</span>`;
      pos.textContent = `${cur + 1} / ${N}`; ds.forEach((d, k) => d.classList.toggle('on', k <= cur));
      first.disabled = prev.disabled = cur === 0; next.disabled = cur === N - 1;
    }
    host.tabIndex = -1;
    host.addEventListener('keydown', e => { if (e.target.closest('input,select,textarea')) return; if (e.key === 'ArrowRight') { e.preventDefault(); stop(); go(cur + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); stop(); go(cur - 1); } });
    go(o.start || 0, false);
    return { go, get step() { return cur; }, F };
  }
  /* 분절 버튼, 슬라이더 */
  function seg(parent, label, opts, cur, on) {
    const w = h('div', { cls: 'ctrl-seg' }, parent); h('span', { cls: 'seg-l', text: label }, w);
    const g = h('span', { cls: 'seg', role: 'group', 'aria-label': label }, w);
    const bs = opts.map(([v, t]) => { const bt = h('button', { type: 'button', text: t }, g); bt.setAttribute('aria-pressed', String(v === cur)); bt.onclick = () => { bs.forEach(x => x.setAttribute('aria-pressed', 'false')); bt.setAttribute('aria-pressed', 'true'); on(v); }; return bt; });
    return w;
  }
  let sid = 0;
  function slider(parent, label, o, on) {
    const id = 'gv-sl-' + (++sid), d = h('div', { cls: 'ctrl' }, parent);
    d.innerHTML = `<label for="${id}">${label} <output></output></label><input type="range" id="${id}" min="${o.min}" max="${o.max}" step="${o.step || 1}" value="${o.value}">`;
    const inp = d.querySelector('input'), out = d.querySelector('output'), f = o.fmt || (v => String(v));
    const upd = () => { out.textContent = f(+inp.value); on(+inp.value); }; inp.oninput = upd; out.textContent = f(+inp.value);
    return { input: inp, set(v) { inp.value = v; upd(); } };
  }

  window.GV = { reg: (n, fn) => { R[n] = fn; }, R, get speed() { return speed; }, setSpeed, s, h, to, show, count, lin, C, fmt, clamp, smooth, reduce, yAxis, xTicks, frame, stepper, seg, slider };
})();
