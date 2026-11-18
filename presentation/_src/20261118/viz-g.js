/* 가이드 도식 장 (2026-11-18): 독해가이드의 그림 도식을 그대로 띄운다.
   <div class="viz" data-viz="gw" data-g="도식 이름" data-nw="자연폭" data-states='[[조작...], ...]'>
   단계 B마다 data-states[B]의 조작(['step', i] 단계 점 누르기, ['seg', 묶음, 단추] 분절 단추 누르기)을 가이드 페이지(20261118-guide/w.html)가 재현한다.
   iframe은 덱을 열 때 미리 만들어 두고, 페이지가 준비되면 {gw:'ready'}를 보내 온다. iframe 안의 키보드와 휠은 그 페이지가 덱으로 넘긴다. */
(function () {
  'use strict';
  const { viz } = DK, SRC = '20261118-guide/w.html';
  if (new URLSearchParams(location.search).has('presenter')) return;   // 발표자 화면은 미리보기 iframe(?embed)이 따로 불러온다
  const hosts = [...document.querySelectorAll('.viz[data-viz="gw"]')];
  function mk(h) {
    if (h.__f) return h.__f;
    const f = document.createElement('iframe');
    f.className = 'gwf'; f.title = h.dataset.title || '독해가이드 도식';
    f.src = `${SRC}?w=${encodeURIComponent(h.dataset.g)}&nw=${h.dataset.nw || 660}`;
    h.appendChild(f); h.__f = f; h.__b = 0; h.__ready = false;
    return f;
  }
  hosts.forEach(mk);
  const send = (h, m) => { try { h.__f.contentWindow.postMessage(m, '*'); } catch (e) { } };
  addEventListener('message', e => {
    const m = e.data; if (!m || m.gw !== 'ready') return;
    const h = hosts.find(x => x.__f && x.__f.contentWindow === e.source); if (!h) return;
    h.__ready = true; send(h, { gw: 'states', states: JSON.parse(h.dataset.states || '[[]]') }); send(h, { gw: 'set', b: h.__b });
  });
  viz('gw', host => { mk(host); return b => { if (b < 0) return; host.__b = b; if (host.__ready) send(host, { gw: 'set', b }); }; });
})();
