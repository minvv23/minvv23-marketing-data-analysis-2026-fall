/* 독해가이드 수식 도구: 기호 풀이 툴팁, 연동 강조, 유도 단계 애니메이션.
   - 기호 풀이: 수식 안의 \gl{키}{식}(빌드에서 <span class="tk k-키">)에 마우스를 올리거나 탭하면 #gloss의 [data-k=키] 설명을 띄운다.
     같은 상자(유도, 도식, 절) 안에서 같은 키의 기호와 표의 칸([data-k])을 함께 강조한다.
     키에 붙임표 꼬리를 달면(\gl{Dbi-a}{…}) 설명과 강조는 앞부분(Dbi)으로, 유도 단계의 항 대응은 전체 키로 한다.
     z와 대문자 또는 숫자로 시작하는 키(zA, z1)는 설명 없이 유도 단계의 항 대응에만 쓴다.
   - 유도 단계: <div class="deriv" data-title="제목"><div class="ds"><tex class="d">…</tex><p class="dc">설명</p></div>…</div>
     단계를 넘기면 같은 키의 항이 이전 자리에서 새 자리로 옮겨 간다(View Transitions API, 없으면 FLIP과 Web Animations).
     새로 생긴 항은 잠깐 색이 바뀐다. 아래에 지금 단계의 기호 설명 단추 줄을 둔다(KaTeX의 HTML은 aria-hidden이라 수식 안에 초점을 두지 않는다).
   - 기호 단추 줄만 필요한 별행 수식은 <div class="sym"><tex class="d">…</tex></div>로 감싼다.
   GV(viz-kit.js) 다음, widgets.js 앞에 불러온다. */
(function () {
  'use strict';
  const GV = window.GV || (window.GV = {});
  const reduce = window.GV_INSTANT || (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  const speed = () => (GV.speed || 1);
  const fullKey = el => { if (el.__fk !== undefined) return el.__fk; let k = null; for (const c of el.classList) if (c.startsWith('k-') && (k === null || c.length > k.length)) k = c.slice(2); el.__fk = k; return k; };
  const baseKey = el => { const k = el.dataset && el.dataset.k ? el.dataset.k : fullKey(el); return k ? k.split('-')[0] : null; };

  /* ---------- 분수 표기: 분모 72 이하의 유리수는 a/b로 쓴다 ---------- */
  function frac(x, maxQ = 72) {
    if (Math.abs(x) < 1e-10) return '0';
    const sg = x < 0 ? '−' : '', a = Math.abs(x);
    for (let q = 1; q <= maxQ; q++) { const p = Math.round(a * q); if (Math.abs(a * q - p) < 1e-8) return sg + (q === 1 ? String(p) : `${p}/${q}`); }
    return sg + a.toFixed(3);
  }
  GV.frac = frac;

  /* ---------- 기호 풀이 ---------- */
  const G = {};
  document.querySelectorAll('#gloss > [data-k]').forEach(el => { G[el.dataset.k] = el.innerHTML; });
  GV.gloss = G;
  const tip = document.createElement('div');
  tip.className = 'gtip'; tip.id = 'gtip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
  document.body.appendChild(tip);
  function prep(root) {
    (root || document).querySelectorAll('.tk').forEach(el => {
      const f = fullKey(el); if (!f) return; const b = f.split('-')[0];
      if (b !== f) el.classList.add('k-' + b);
      if (G[b]) el.classList.add('has-g');
    });
  }
  prep();
  GV.markGloss = prep;

  let curEl = null, pinned = false, hideT = 0, curHL = [];
  const scopeOf = el => (el.__scope) || el.closest('.deriv, .viz, .widget, .sym, section.sub, section.part') || document.body;
  function hl(el, on) {
    if (!on) { curHL.forEach(x => x.classList.remove('hl')); curHL = []; return; }
    const k = baseKey(el); if (!k) return;
    curHL = [...scopeOf(el).querySelectorAll(`.k-${k}, [data-k="${k}"]`)];
    curHL.forEach(x => x.classList.add('hl'));
  }
  function place(el) {
    const r = el.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight;
    tip.style.left = '0px'; tip.style.top = '0px';
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = r.left + r.width / 2 - tw / 2; x = Math.max(8, Math.min(vw - tw - 8, x));
    let y = r.top - th - 11, below = false;
    if (y < 8) { y = r.bottom + 11; below = true; }
    if (below && y + th > vh - 8) y = Math.max(8, vh - th - 8);
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
    tip.style.setProperty('--ax', Math.max(12, Math.min(tw - 12, r.left + r.width / 2 - x)) + 'px');
    tip.classList.toggle('below', below);
  }
  function open(el, scopeEl) {
    clearTimeout(hideT);
    if (curEl && curEl !== el) close(true);
    if (scopeEl) el.__scope = scopeEl;
    const k = baseKey(el);
    curEl = el; hl(el, true);
    if (!G[k]) { tip.hidden = true; return; }
    tip.innerHTML = G[k]; tip.hidden = false; place(el);
    if (el.tagName === 'BUTTON') el.setAttribute('aria-describedby', 'gtip');
  }
  function close(now) {
    const done = () => { hl(null, false); if (curEl && curEl.tagName === 'BUTTON') curEl.removeAttribute('aria-describedby'); curEl = null; pinned = false; tip.hidden = true; };
    clearTimeout(hideT); if (now) done(); else hideT = setTimeout(done, 140);
  }
  GV.tipOpen = open; GV.tipClose = close;
  // 툴팁은 수식 기호(.tk)와 기호 단추(.sym-b)에 띄우고, 표나 도식의 [data-k] 요소는 올리면 같은 키의 기호와 칸을 함께 강조만 한다.
  const pick = (e, sel) => (e.target && e.target.closest) ? e.target.closest(sel) : null;
  let curDk = null;
  document.addEventListener('pointerover', e => {
    if (e.pointerType === 'touch') return;
    if (pick(e, '.gtip')) { clearTimeout(hideT); return; }
    const t = pick(e, '.tk, .sym-b'); if (t) { if (!pinned) open(t, t.__scope); return; }
    const d = pick(e, '[data-k]'); if (d && d !== curDk && !d.closest('#gloss') && !pinned) { curDk = d; hl(d, true); }
  });
  document.addEventListener('pointerout', e => {
    if (e.pointerType === 'touch') return;
    const rt = e.relatedTarget;
    const t = pick(e, '.tk, .sym-b, .gtip'); if (t && !pinned && (!rt || (!t.contains(rt) && !(rt.closest && rt.closest('.gtip'))))) close();
    const d = pick(e, '[data-k]'); if (d && d === curDk && (!rt || !d.contains(rt))) { if (!curEl) hl(null, false); curDk = null; }
  });
  document.addEventListener('click', e => {
    const t = pick(e, '.tk, .sym-b');
    if (t) { if (pinned && curEl === t) close(true); else { open(t, t.__scope); pinned = true; } return; }
    if (!tip.contains(e.target)) close(true);
  });
  document.addEventListener('focusin', e => { const t = pick(e, '.sym-b'); if (t && !pinned) open(t, t.__scope); });
  document.addEventListener('focusout', e => { const t = pick(e, '.sym-b'); if (t && !pinned) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && curEl) { close(true); } });
  window.addEventListener('scroll', () => { if (curEl && !tip.hidden) { if (pinned) place(curEl); else close(true); } }, { passive: true });

  /* ---------- 기호 단추 줄 ---------- */
  function chips(bar, scopeEl, from) {
    bar.innerHTML = '';
    const seen = new Set();
    (from || scopeEl).querySelectorAll('.tk.has-g').forEach(el => { const k = baseKey(el); if (k && !seen.has(k)) seen.add(k); });
    if (!seen.size) { bar.hidden = true; return; }
    bar.hidden = false;
    const lab = document.createElement('span'); lab.className = 'sym-l'; lab.textContent = '기호'; bar.appendChild(lab);
    seen.forEach(k => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'sym-b'; b.dataset.k = k; b.__scope = scopeEl;
      const g = document.createElement('div'); g.innerHTML = G[k]; const kx = g.querySelector('.gh .katex');
      b.innerHTML = kx ? kx.outerHTML : k; b.setAttribute('aria-label', (g.querySelector('.gh') || g).textContent.trim());
      bar.appendChild(b);
    });
  }
  document.querySelectorAll('.sym').forEach(w => { const bar = document.createElement('div'); bar.className = 'symbar'; w.appendChild(bar); chips(bar, w); });

  /* ---------- 유도 단계 ---------- */
  let uid = 0;
  const hasVT = typeof document.startViewTransition === 'function';
  function deriv(host) {
    const steps = [...host.querySelectorAll(':scope > .ds')]; if (!steps.length) return;
    const id = ++uid, N = steps.length; let cur = 0, timer = 0, busy = false;
    host.classList.add('on'); host.tabIndex = -1;
    const H = (tag, cls, txt, p) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; if (p) p.appendChild(e); return e; };
    const head = H('div', 'dhead'); host.prepend(head);
    H('p', 'wt', host.dataset.kind || '유도', head);
    if (host.dataset.title) H('p', 'wh', host.dataset.title, head);
    const stage = H('div', 'dstage'); head.after(stage); steps.forEach(s => stage.appendChild(s));
    const cap = H('div', 'vcap'); cap.setAttribute('aria-live', 'polite'); stage.after(cap);
    const bar = H('div', 'vbar'); cap.after(bar);
    const sb = H('div', 'symbar'); bar.after(sb);
    const btn = (t, fn, cls) => { const b = H('button', 'vb' + (cls ? ' ' + cls : ''), t, bar); b.type = 'button'; b.onclick = fn; return b; };
    const first = btn('처음', () => { stop(); go(0); }), prev = btn('이전', () => { stop(); go(cur - 1); });
    const pos = H('span', 'vpos', '', bar), dots = H('span', 'vdots', null, bar);
    const ds = steps.map((_, i) => { const d = H('i', null, null, dots); d.onclick = () => { stop(); go(i); }; return d; });
    const next = btn('다음', () => { stop(); go(cur + 1); }, 'pri');
    const play = btn('자동 재생', () => { if (timer) stop(); else { if (cur >= N - 1) go(0, false); play.textContent = '멈춤'; tick(); } });
    const all = btn('모든 단계 펼치기', () => { const on = !host.classList.contains('all'); host.classList.toggle('all', on); all.textContent = on ? '한 단계씩 보기' : '모든 단계 펼치기'; stop(); chips(sb, host, on ? stage : steps[cur]); });
    all.classList.add('dall');
    function tick() { clearTimeout(timer); timer = setTimeout(() => { go(cur + 1); if (cur < N - 1) tick(); else stop(); }, 3600 / speed()); }
    function stop() { clearTimeout(timer); timer = 0; play.textContent = '자동 재생'; }
    host.addEventListener('keydown', e => { if (e.target.closest('.sym-b')) return; if (e.key === 'ArrowRight') { e.preventDefault(); stop(); go(cur + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); stop(); go(cur - 1); } });
    // 단계마다 맨 바깥 항(다른 항 안에 들어 있지 않은 항)을 키별로 모은다. 같은 키가 여러 번 나오면 나온 순서대로 대응시킨다.
    const terms = s => { const m = new Map(); s.querySelectorAll('.tk').forEach(el => { if (el.parentElement.closest('.tk')) return; const k = fullKey(el); if (!k) return; if (!m.has(k)) m.set(k, []); m.get(k).push(el); }); return m; };
    const T = steps.map(terms);
    function pairs(a, b) { const P = []; T[a].forEach((xs, k) => { const ys = T[b].get(k); if (!ys) return; for (let i = 0; i < Math.min(xs.length, ys.length); i++) P.push([xs[i], ys[i], `dv${id}-${k.replace(/[^A-Za-z0-9-]/g, '')}-${i}`]); }); return P; }
    function fresh(a, b) { const out = []; T[b].forEach((ys, k) => { const xs = T[a].get(k) || []; ys.slice(xs.length).forEach(y => out.push(y)); }); return out; }
    function paint(i) {
      steps.forEach((s, k) => s.classList.toggle('cur', k === i));
      const c = steps[i].querySelector('.dc');
      cap.innerHTML = `<span class="vn">${i + 1}</span><span class="vt">${c ? c.innerHTML : ''}</span>`;
      pos.textContent = `${i + 1} / ${N}`; ds.forEach((d, k) => d.classList.toggle('on', k <= i));
      first.disabled = prev.disabled = i === 0; next.disabled = i === N - 1;
      if (!host.classList.contains('all')) chips(sb, host, steps[i]);
    }
    function flash(els) { els.forEach(el => { el.classList.remove('fresh'); void el.offsetWidth; el.classList.add('fresh'); setTimeout(() => el.classList.remove('fresh'), 1800 / speed()); }); }
    function go(j, anim = true) {
      j = Math.max(0, Math.min(N - 1, j)); if (j === cur && anim) return;
      const a = cur; cur = j; close(true);
      const r = stage.getBoundingClientRect(), visible = r.bottom > 0 && r.top < innerHeight;
      if (!anim || reduce || host.classList.contains('all') || !visible || busy) { paint(j); return; }
      const P = pairs(a, j), F = fresh(a, j), dur = Math.round(750 / speed());
      document.documentElement.style.setProperty('--dv-dur', dur + 'ms');
      if (hasVT) {
        busy = true;
        const root = document.documentElement, sn = `dvs${id}`;
        root.classList.add('dv-run'); stage.style.viewTransitionName = sn;
        P.forEach(([x, , n]) => { x.style.viewTransitionName = n; x.classList.add('vtn'); });
        let vt;
        const clean = () => { P.forEach(([x, y]) => { x.style.viewTransitionName = ''; y.style.viewTransitionName = ''; x.classList.remove('vtn'); y.classList.remove('vtn'); }); stage.style.viewTransitionName = ''; root.classList.remove('dv-run'); busy = false; };
        try {
          vt = document.startViewTransition(() => { P.forEach(([x, y, n]) => { x.style.viewTransitionName = ''; x.classList.remove('vtn'); y.style.viewTransitionName = n; y.classList.add('vtn'); }); paint(j); });
        } catch (e) { clean(); paint(j); return; }
        vt.finished.then(() => { clean(); flash(F); }, () => { clean(); });
      } else {
        const R0 = P.map(([x]) => x.getBoundingClientRect());
        paint(j);
        P.forEach(([, y], i) => {
          const r1 = y.getBoundingClientRect(), r0 = R0[i]; if (!r1.width) return;
          const dx = r0.left - r1.left, dy = r0.top - r1.top, sx = r0.width / r1.width, sy = r0.height / r1.height;
          if (Math.abs(dx) + Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01) return;
          y.animate([{ transformOrigin: '0 0', transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})` }, { transformOrigin: '0 0', transform: 'none' }], { duration: dur, easing: 'cubic-bezier(.65,0,.35,1)' });
        });
        F.forEach(y => y.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur * 0.6, delay: dur * 0.4, fill: 'backwards' }));
        setTimeout(() => flash(F), dur);
      }
    }
    paint(0);
    host.__deriv = { go, get step() { return cur; }, N };
    return host.__deriv;
  }
  GV.deriv = deriv;
  document.querySelectorAll('.deriv').forEach(h => { try { deriv(h); } catch (e) { console.error(e); } });
})();
