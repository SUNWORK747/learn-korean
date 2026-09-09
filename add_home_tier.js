#!/usr/bin/env node
/**
 * 홈(docs/index.html)에 상위 티어 섹션을 넣는다.
 * 푸터 쪽은 add_top_tier.js 가 이미 126페이지에 넣었다.
 *
 * docs 는 CRLF 로 체크아웃되므로(core.autocrlf) 줄바꿈에 기대지 않는다.
 *
 *   node add_home_tier.js --dry-run
 *   node add_home_tier.js
 */
const fs = require('fs');

const HOME = 'docs/index.html';
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

const items = MASTERS.map((t) =>
  `<li><a href="${utm(`${STORE}/l/${t.slug}`, 'home-top-tier', 'track-master')}" rel="noopener" target="_blank"><strong>${t.label}</strong></a> · 90 worksheets, $${t.price} <span class="pk-note">${t.note}</span></li>`
).join('');

const section = `

<section class="pack-strip">
  <h2>One track for 90 days &mdash; or all of it</h2>
  <p>The 30-day packs cover one level. These cover the whole way through B1.</p>
  <ul class="pk-list">${items}</ul>
  <p class="sk-cta-alt"><a href="${utm(`${STORE}/l/${FULL.slug}`, 'home-top-tier', 'full-course')}" rel="noopener" target="_blank">${FULL.label}</a> &mdash; every worksheet, all ${FULL.count} of them, $${FULL.price}. <a href="${utm(`${STORE}/l/${EVERY.slug}`, 'home-top-tier', 'everything')}" rel="noopener" target="_blank">${EVERY.label}</a> adds all 118 grammar chapters &mdash; ${EVERY.count} PDFs, $${EVERY.price}.</p>
</section>`;

const dry = process.argv.includes('--dry-run');
const html = fs.readFileSync(HOME, 'utf8');

if (html.includes('home-top-tier')) {
  console.log('이미 있음 — 아무것도 하지 않는다');
  process.exit(0);
}

// "Visit the store" 버튼이 든 섹션이 끝나는 자리 바로 뒤에 넣는다.
const btn = html.indexOf('>Visit the store');
if (btn === -1) { console.error('삽입 지점을 못 찾음: Visit the store 버튼이 없다'); process.exit(1); }
const end = html.indexOf('</section>', btn);
if (end === -1) { console.error('삽입 지점을 못 찾음: 섹션 끝이 없다'); process.exit(1); }
const at = end + '</section>'.length;

const out = html.slice(0, at) + section + html.slice(at);
if (!dry) fs.writeFileSync(HOME, out, 'utf8');
console.log(`${dry ? '[예행] ' : ''}홈에 상위 티어 섹션 삽입 (${at}번째 글자 뒤)`);
