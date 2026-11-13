/* 덱 엔진: 화면 = f(슬라이드 S, 단계 B). 도식은 요소를 한 번 만들고, 단계마다 목표값만 정하면 트윈이 현재값에서 이어 움직인다. */
const DK = (function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const C = { ink: '#1b1b1f', body: '#33343a', muted: '#6b6b72', faint: '#a4a5ab', line: '#e4e4e8', soft: '#f4f4f6', white: '#ffffff',
    c1: '#2e6f95', c1s: '#dfeaf1', c2: '#b9822a', c2s: '#f5ead6', c3: '#5a7d4d', c3s: '#e3ecdf', u: '#8a8a92', us: '#ececef', bad: '#c8553d', bads: '#f7e3dd' };
  const E = {
    smooth: t => t * t * t * (t * (6 * t - 15) + 10),            // manim의 기본 rate function
    out: t => 1 - Math.pow(1 - t, 3),
    inout: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    lin: t => t,
    back: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  };

  /* ---------- 트윈 ---------- */
  let LIVE = true, raf = 0; const ACT = new Map();
  const TF = { tx: 1, ty: 1, sc: 1, sx: 1, sy: 1, rot: 1 };
  const r3 = v => Math.round(v * 1000) / 1000;
  function rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function interp(a, b, t) {
    if (typeof a === 'number') return a + (b - a) * t;
    if (typeof a === 'string') {
      if (a[0] === '#' && b[0] === '#' && a.length === 7 && b.length === 7) { const x = rgb(a), y = rgb(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
      return t < 1 ? a : b;
    }
    if (Array.isArray(a)) { if (a.length !== b.length) return b; return a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t]); }
    return b;
  }
  function put(el, k, v) {
    const s = el.__s;
    if (TF[k]) {
      const sc = (s.sc ?? 1), sx = sc * (s.sx ?? 1), sy = sc * (s.sy ?? 1), rot = s.rot || 0;
      el.setAttribute('transform', `translate(${r3(s.tx || 0)} ${r3(s.ty || 0)})` + (rot ? ` rotate(${r3(rot)})` : '') + ((sx !== 1 || sy !== 1) ? ` scale(${r3(sx)} ${r3(sy)})` : ''));
    } else if (k === 'pts') el.setAttribute('d', v.length ? 'M' + v.map(p => r3(p[0]) + ' ' + r3(p[1])).join('L') + (el.__close ? 'Z' : '') : '');
    else if (k === 'num') el.textContent = el.__fmt ? el.__fmt(v) : String(v);
    else if (k === 'o') { if (el instanceof SVGElement) el.setAttribute('opacity', r3(v)); else el.style.opacity = r3(v); el.style.visibility = v < .01 ? 'hidden' : ''; }
    else if (k === 'draw') { el.setAttribute('pathLength', 1); el.setAttribute('stroke-dasharray', '1 1'); el.setAttribute('stroke-dashoffset', r3(1 - v)); }
    else el.setAttribute(k, typeof v === 'number' ? r3(v) : v);
  }
  const same = (a, b) => a === b;
  function frame(now) {
    raf = 0; let alive = false;
    ACT.forEach((m, el) => {
      m.forEach((w, k) => {
        if (now < w.t0) { alive = true; return; }
        if (w.from === null) w.from = el.__s[k];
        const p = w.dur <= 0 ? 1 : clamp((now - w.t0) / w.dur);
        el.__s[k] = p >= 1 ? w.to : interp(w.from, w.to, w.ease(p)); put(el, k, el.__s[k]);
        if (p >= 1) m.delete(k); else alive = true;
      });
      if (!m.size) ACT.delete(el);
    });
    if (alive) raf = requestAnimationFrame(frame);
  }
  /* tw(요소, {속성: 목표값}, {dur, delay, ease})
     특수 속성: o(불투명도), tx, ty, sc, sx, sy, rot(변환), pts(점 배열 → path d), num(숫자 → 글자), draw(0~1 선 그리기) */
  function tw(el, props, o) {
    o = o || {}; const dur = o.dur ?? 650, delay = o.delay || 0, ease = E[o.ease || 'smooth'];
    const s = el.__s || (el.__s = {}); let m = ACT.get(el);
    for (const k in props) {
      const to = props[k];
      if (!(k in s) || !LIVE) { s[k] = to; put(el, k, to); if (m) m.delete(k); continue; }
      const cur = m && m.get(k);
      if (cur ? same(cur.to, to) : same(s[k], to)) continue;
      if (!m) { m = new Map(); ACT.set(el, m); }
      m.set(k, { to, from: null, t0: performance.now() + delay, dur, ease });
    }
    if (!raf && ACT.size) raf = requestAnimationFrame(frame);
    return el;
  }
  const show = (el, on, o) => tw(el, { o: on ? 1 : 0 }, Object.assign({ dur: 450 }, o));
  function finish() { ACT.forEach((m, el) => m.forEach((w, k) => { el.__s[k] = w.to; put(el, k, w.to); })); ACT.clear(); }
  function instant(fn) { const was = LIVE; LIVE = false; try { fn(); } finally { LIVE = was; } }

  /* ---------- SVG 도우미 ---------- */
  const SPECIAL = { o: 1, tx: 1, ty: 1, sc: 1, sx: 1, sy: 1, rot: 1, pts: 1, num: 1, draw: 1 };
  function S(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag); n.__s = {};
    if (attrs && attrs.close) n.__close = true;
    if (attrs && attrs.fmt) n.__fmt = attrs.fmt;
    for (const k in attrs) {
      const v = attrs[k];
      if (k === 'text') n.textContent = v;
      else if (k === 'cls') n.setAttribute('class', v);
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'close') n.__close = v;
      else if (k === 'fmt') n.__fmt = v;
      else if (k === 'tip') n.setAttribute('data-tip', v);
      else if (SPECIAL[k]) { n.__s[k] = v; put(n, k, v); }
      else { n.setAttribute(k, v); if (typeof v === 'number') n.__s[k] = v; }
    }
    if (parent) parent.appendChild(n); return n;
  }
  function svg(host, W, H) { return S('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, host); }
  function H(tag, cls, html, parent, style) { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; if (style) n.style.cssText = style; n.__s = {}; if (parent) parent.appendChild(n); return n; }
  function lin(d0, d1, r0, r1) { const f = v => r0 + (v - d0) / (d1 - d0) * (r1 - r0); f.inv = p => d0 + (p - r0) / (r1 - r0) * (d1 - d0); return f; }
  const fmtFrac = (v, den) => { // 분수 표기 (분모 후보에서 찾고, 없으면 소수)
    for (const d of den || [1, 2, 3, 4, 5, 6, 8, 15, 16]) { const n = v * d; if (Math.abs(n - Math.round(n)) < 1e-6) { const k = Math.round(n); if (d === 1) return String(k).replace('-', '−'); return (k < 0 ? '−' : '') + Math.abs(k) + '/' + d; } }
    return v.toFixed(2).replace('-', '−');
  };
  const fmt = (v, d = 2, plus) => { const r = Math.sign(v) * Math.round(Math.abs(v) * Math.pow(10, d) + 1e-9) / Math.pow(10, d); const s = Math.abs(r).toFixed(d); return (r < 0 ? '−' : (plus && r > 0 ? '+' : '')) + s; };
  // 단계 구간 문자열: "2", "2-4", "3-", "-2", "1,4-5"
  function inRange(spec, b) { return spec.split(',').some(p => { p = p.trim(); if (p.includes('-')) { const [a, z] = p.split('-'); return b >= (a === '' ? -1e9 : +a) && b <= (z === '' ? 1e9 : +z); } return b === +p; }); }
  // 선택 버튼 줄
  function chips(host, label, items, onSel, style) {
    const w = H('div', 'chips ov', label ? `<span class="lab">${label}</span>` : '', host, style); const bs = [];
    items.forEach((t, i) => { const b = H('button', 'chip', t, w); b.type = 'button'; b.addEventListener('click', () => { b.blur(); set(i, true); }); bs.push(b); });
    let cur = -1; function set(i, user) { if (i === cur) return; cur = i; bs.forEach((b, j) => b.classList.toggle('sel', j === i)); onSel(i, !!user); }
    return { el: w, set, get: () => cur };
  }

  /* ---------- 도식 등록 ---------- */
  const VIZ = {};
  function viz(id, fn) { VIZ[id] = fn; }

  /* ---------- 상태 기계 ---------- */
  let slides = [], builds = [], Sx = 0, B = 0;
  function renderer(sl) {
    const host = $('.viz', sl); if (!host || !host.dataset.viz || !VIZ[host.dataset.viz]) return null;
    if (!host.__r) {
      const wide = sl.classList.contains('wide'), lw = +(sl.dataset.lw || 548);
      const W = host.dataset.w ? +host.dataset.w : (wide ? 1472 : 1472 - lw - 44), Hh = +(host.dataset.h || 792);
      host.style.height = Hh + 'px';
      host.__r = VIZ[host.dataset.viz](host, W, Hh) || (() => { });
    }
    return host.__r;
  }
  function apply(enter, back, noAnim) {
    finish();
    slides.forEach((s, i) => s.classList.toggle('on', i === Sx));
    const sl = slides[Sx]; sl.dataset.b = B;
    $$('.steps li', sl).forEach((li, i) => { li.classList.toggle('on', i < B); li.classList.toggle('past', i < B - 1); });
    $$('[data-on]', sl).forEach(e => e.classList.toggle('on', inRange(e.dataset.on, B)));
    $('#bar i').style.width = (slides.length > 1 ? Sx / (slides.length - 1) * 100 : 0) + '%';
    $('#hud').textContent = `${Sx + 1} / ${slides.length}` + (builds[Sx] ? `  ·  ${B}/${builds[Sx]}` : '');
    document.body.classList.toggle('dark', sl.classList.contains('end'));
    try { history.replaceState(null, '', `#s${Sx + 1}b${B}`); } catch (e) { }
    const r = renderer(sl); if (!r) return;
    if (noAnim || (enter && back)) instant(() => r(B, { enter: true }));
    else if (enter) { instant(() => r(-1, { enter: true })); r(B, { enter: true }); }
    else r(B, {});
  }
  function next() { if (B < builds[Sx]) { B++; apply(false); } else if (Sx < slides.length - 1) { Sx++; B = 0; apply(true); } }
  function prev() { if (B > 0) { B--; apply(false); } else if (Sx > 0) { Sx--; B = builds[Sx]; apply(true, true); } }
  function go(s, b, noAnim) { Sx = clamp(s, 0, slides.length - 1); B = clamp(b || 0, 0, builds[Sx]); apply(true, false, noAnim); }

  function boot() {
    slides = $$('.slide'); builds = slides.map(s => +(s.dataset.builds || 0));
    slides.forEach(s => { if (s.dataset.lw) s.style.setProperty('--lw', s.dataset.lw + 'px'); });
    document.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (k === 'ArrowRight' || k === ' ' || k === 'PageDown' || k === 'Enter' || k === 'ArrowDown') { e.preventDefault(); e.shiftKey ? go(Sx + 1, 0) : next(); }
      else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace' || k === 'ArrowUp') { e.preventDefault(); e.shiftKey ? go(Sx - 1, 0) : prev(); }
      else if (k === 'Home') go(0, 0); else if (k === 'End') go(slides.length - 1, 0);
      else if (k === 'f' || k === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
    });
    let acc = 0, lock = 0;
    addEventListener('wheel', e => { e.preventDefault(); const now = Date.now(); if (now < lock) return; acc += e.deltaY; if (Math.abs(acc) < 40) return; acc > 0 ? next() : prev(); acc = 0; lock = now + 450; }, { passive: false });
    // 터치: 왼쪽 1/3 탭은 이전, 나머지는 다음. 가로로 밀어도 넘어간다. 버튼 위에서는 넘기지 않는다.
    let t0 = null;
    addEventListener('touchstart', e => { const t = e.changedTouches[0]; t0 = { x: t.clientX, y: t.clientY, btn: !!e.target.closest('button,a') }; }, { passive: true });
    addEventListener('touchend', e => { if (!t0 || t0.btn) return; const t = e.changedTouches[0], dx = t.clientX - t0.x, dy = t.clientY - t0.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? next() : prev(); else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) (t.clientX < innerWidth / 3) ? prev() : next(); t0 = null; }, { passive: true });
    // 툴팁 (네이티브 title 대신)
    const tb = $('#tipbox'), stage = $('#stage');
    document.addEventListener('mouseover', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (!t) return; tb.innerHTML = t.dataset.tip; const r = t.getBoundingClientRect(), st = stage.getBoundingClientRect(), k = st.width / 1600;
      let x = (r.left - st.left) / k, y = (r.bottom - st.top) / k + 8; tb.style.left = '0px'; tb.style.top = '0px'; const w = tb.offsetWidth, h = tb.offsetHeight;
      x = clamp(x, 12, 1600 - w - 12); if (y + h > 890) y = (r.top - st.top) / k - h - 8; tb.style.left = x + 'px'; tb.style.top = y + 'px'; tb.style.opacity = 1; });
    document.addEventListener('mouseout', e => { if (e.target.closest && e.target.closest('[data-tip]')) tb.style.opacity = 0; });
    const m = location.hash.match(/s(\d+)b(\d+)/);
    if (m) { Sx = clamp(+m[1] - 1, 0, slides.length - 1); B = clamp(+m[2], 0, builds[Sx]); }
    const ready = document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
    ready.then(() => { apply(true); document.body.classList.add('ready'); });
    window.DECK = { go, next, prev, finish, get n() { return slides.length; }, get builds() { return builds.slice(); }, get pos() { return [Sx, B]; }, ids: () => slides.map(s => s.id) };
  }

  return { $, $$, C, E, tw, show, finish, instant, S, svg, H, lin, fmt, fmtFrac, chips, viz, boot, clamp, get live() { return LIVE; } };
})();
