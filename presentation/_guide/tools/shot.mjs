// 페이지 캡처 도구. 사용: [VW=390] node presentation/_guide/tools/shot.mjs <url> <outDir> <script.json>
// 명령 목록: [{sel, click:n}, {shot:'name', sel?, full?}, {wait:ms}, {hover: sel}, {eval: 'js'}]
import { createRequire } from 'node:module';
const require = createRequire('/home/hunnae/.npm/_npx/e41f203b7505f1fb/node_modules/');
const { chromium } = require('playwright');
const [url, out, cmds, theme] = process.argv.slice(2);
const C = JSON.parse(cmds);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: +(process.env.VW || 1280), height: +(process.env.VH || 900) }, deviceScaleFactor: 1, colorScheme: theme === 'dark' ? 'dark' : 'light' });
const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(600);
for (const c of C) {
  if (c.wait) await p.waitForTimeout(c.wait);
  if (c.scroll) { await p.locator(c.scroll).first().scrollIntoViewIfNeeded(); await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'start' }), c.scroll); await p.waitForTimeout(500); }
  if (c.click) { const l = p.locator(c.click).nth(c.n || 0); await l.scrollIntoViewIfNeeded(); for (let i = 0; i < (c.times || 1); i++) { await l.click(); await p.waitForTimeout(c.gap || 120); } }
  if (c.hover) { const l = p.locator(c.hover).nth(c.n || 0); await l.scrollIntoViewIfNeeded(); await l.hover(); await p.waitForTimeout(300); }
  if (c.eval) console.log('EVAL', JSON.stringify(await p.evaluate(c.eval)));
  if (c.shot) { if (c.sel) { const l = p.locator(c.sel).nth(c.n || 0); await l.scrollIntoViewIfNeeded(); await p.waitForTimeout(250); await l.screenshot({ path: `${out}/${c.shot}.png` }); } else await p.screenshot({ path: `${out}/${c.shot}.png`, fullPage: !!c.full }); }
}
console.log('ERRS', JSON.stringify(errs));
await b.close();
