#!/usr/bin/env node
/**
 * 생성된 docs/ 에 상위 티어(트랙 마스터 4 · Full Course · Everything) 안내를 넣는다.
 *
 * 30일 팩까지는 사이트에 자리가 있었지만 그 위 6종은 아예 노출되지 않았다.
 * build.js 에도 같은 내용을 넣어 뒀다 — 빌드 원본이 돌아오면 재빌드로 같은 결과가 나온다.
 *
 *   node add_top_tier.js --dry-run
 *   node add_top_tier.js
 */
const fs = require('fs');
const path = require('path');

const STORE = 'https://sunshinework.gumroad.com';
const utm = (url, medium, campaign) =>
  `${url}${url.includes('?') ? '&' : '?'}utm_source=site&utm_medium=${medium}&utm_campaign=${campaign}`;

const MASTERS = [
  { slug: 'korean-daily-master', label: 'Daily Master', note: '90 days of everyday practice', price: 49 },
  { slug: 'korean-reading-master', label: 'Reading Master', note: '90 reading worksheets', price: 49 },
  { slug: 'korean-listening-master', label: 'Listening Master', note: '90 listening drills', price: 49 },
  { slug: 'korean-vocabulary-master', label: 'Vocabulary Master', note: '90 days of themed word lists', price: 59 },
];
const FULL = { slug: 'korean-full-course', label: 'Full Course 90 Days', price: 149, count: 360 };
const EVERY = { slug: 'korean-everything', label: 'Everything Pack', price: 199, count: 478 };

const section = () => {
  const items = MASTERS.map((t) =>
    `<li><a href="${utm(`${STORE}/l/${t.slug}`, 'home-top-tier', 'track-master')}" rel="noopener" target="_blank"><strong>${t.label}</strong></a> · 90 worksheets, $${t.price} <span class="pk-note">${t.note}</span></li>`
  ).join('');
  return `\n\n<section class="pack-strip">
  <h2>One track for 90 days &mdash; or all of it</h2>
  <p>The 30-day packs cover one level. These cover the whole way through B1.</p>
  <ul class="pk-list">${items}</ul>
  <p class="sk-cta-alt"><a href="${utm(`${STORE}/l/${FULL.slug}`, 'home-top-tier', 'full-course')}" rel="noopener" target="_blank">${FULL.label}</a> &mdash; every worksheet, all ${FULL.count} of them, $${FULL.price}. <a href="${utm(`${STORE}/l/${EVERY.slug}`, 'home-top-tier', 'everything')}" rel="noopener" target="_blank">${EVERY.label}</a> adds all 118 grammar chapters &mdash; ${EVERY.count} PDFs, $${EVERY.price}.</p>
</section>`;
};

const footerLine = () =>
  `<br>\nEverything at once: <a href="${utm(`${STORE}/l/${FULL.slug}`, 'footer-text', 'full-course')}" rel="noopener">${FULL.label}</a> (${FULL.count} worksheets, $${FULL.price}) &middot; <a href="${utm(`${STORE}/l/${EVERY.slug}`, 'footer-text', 'everything')}" rel="noopener">${EVERY.label}</a> (${EVERY.count} PDFs, $${EVERY.price})`;

const dry = process.argv.includes('--dry-run');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  return e.isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
});

// 1) 홈에 상위 티어 섹션
const HOME = 'docs/index.html';
// docs 는 CRLF 로 체크아웃된다(core.autocrlf). 줄바꿈에 기대지 않는다.
const HOME_ANCHOR = new RegExp(">Visit the store →</a>".replace(/[/]/g,"\\/") + "\\s*\\/section>");
let home = 0;
{
  const html = fs.readFileSync(HOME, 'utf8');
  if (html.includes('home-top-tier')) console.log('  홈: 이미 있음');
  else if (!HOME_ANCHOR.test(html)) console.warn('  홈: 삽입 지점을 못 찾음');
  else {
    if (!dry) fs.writeFileSync(HOME, html.replace(HOME_ANCHOR, (m) => m + section()), 'utf8');
    home = 1;
  }
}

// 2) 전 페이지 푸터에 한 줄
const FOOT_RE = /(Complete lessons with practice &amp; answer keys: <a href="[^"]*" rel="noopener">sunshinework\.gumroad\.com<\/a>)/;
let foot = 0, skip = 0;
for (const f of walk('docs')) {
  const html = fs.readFileSync(f, 'utf8');
  if (html.includes('campaign=everything')) { skip++; continue; }
  if (!FOOT_RE.test(html)) { skip++; continue; }
  if (!dry) fs.writeFileSync(f, html.replace(FOOT_RE, `$1${footerLine()}`), 'utf8');
  foot++;
}
console.log(`${dry ? '[예행] ' : ''}홈 섹션 ${home}개 · 푸터 ${foot}개 · 건너뜀 ${skip}개`);
