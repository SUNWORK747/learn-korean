#!/usr/bin/env node
/**
 * 생성된 docs/ 의 팩 링크를 바로잡는다.
 *
 * 원래는 build.js 를 고치고 재빌드하면 되지만, 빌드 원본
 * (`../한국어 학습자료/문법/자료`)이 이 컴퓨터에 없어 재빌드가 불가능하다.
 * 그래서 생성물만 직접 고친다. build.js 도 같이 고쳐 뒀으므로
 * 원본이 돌아와 재빌드하면 같은 결과가 나온다.
 *
 * 고치는 것
 *  1) 문법 페이지 CTA — 전부 Foundation($49, 1~61편)을 걸고 있었다.
 *     96편을 읽는 사람에게 그 편이 없는 팩을 권하고 있었다는 뜻이다.
 *     INT 는 Intermediate, ADV 는 Advanced 로 바꾸고 Grammar Master 를 덧붙인다.
 *  2) 어휘 Day 1 CTA — 스토어 첫 화면 대신 단어장 팩으로 보낸다.
 *
 *   node fix_pack_links.js --dry-run
 *   node fix_pack_links.js
 */
const fs = require('fs');
const path = require('path');

const STORE = 'https://sunshinework.gumroad.com';
const PACKS = {
  pre: { slug: 'korean-grammar-foundation', label: 'Grammar Foundation pack', range: 'chapters 1&ndash;61', price: 49 },
  beg: { slug: 'korean-grammar-foundation', label: 'Grammar Foundation pack', range: 'chapters 1&ndash;61', price: 49 },
  int: { slug: 'korean-grammar-intermediate', label: 'Grammar Intermediate pack', range: 'chapters 62&ndash;95', price: 39 },
  adv: { slug: 'korean-grammar-advanced', label: 'Grammar Advanced pack', range: 'chapters 96&ndash;118', price: 35 },
};
const utm = (url, medium, campaign) =>
  `${url}${url.includes('?') ? '&' : '?'}utm_source=site&utm_medium=${medium}&utm_campaign=${campaign}`;

const altHtml = (pk) => {
  const url = utm(`${STORE}/l/${pk.slug}`, 'lesson-alt', 'grammar-pack');
  const master = utm(`${STORE}/l/korean-grammar-master`, 'lesson-alt', 'grammar-master');
  return `<p class="sk-cta-alt">Learning the whole thing? <a href="${url}" rel="noopener" target="_blank">${pk.label}</a> — ${pk.range} in one download ($${pk.price}), far cheaper than one at a time. All four levels: <a href="${master}" rel="noopener" target="_blank">Grammar Master</a>, all 118 chapters ($99).</p>`;
};

const dry = process.argv.includes('--dry-run');
const ALT_RE = /<p class="sk-cta-alt">Learning the whole thing\?[\s\S]*?<\/p>/;
let changed = 0, same = 0, miss = 0;

for (const f of fs.readdirSync('docs/grammar')) {
  const lvl = (f.match(/^gram-([a-z]+)-/) || [])[1];
  const pk = PACKS[lvl];
  if (!pk) { miss++; console.warn('  단계 판별 실패:', f); continue; }
  const p = path.join('docs/grammar', f);
  const html = fs.readFileSync(p, 'utf8');
  if (!ALT_RE.test(html)) { miss++; console.warn('  CTA 없음:', f); continue; }
  const out = html.replace(ALT_RE, altHtml(pk));
  if (out === html) { same++; continue; }
  if (!dry) fs.writeFileSync(p, out, 'utf8');
  changed++;
}

// 어휘 Day 1 — 스토어 첫 화면 → 단어장 A1 팩
const vp = 'docs/vocab/day-1.html';
let vocab = 0;
if (fs.existsSync(vp)) {
  const html = fs.readFileSync(vp, 'utf8');
  const from = `${STORE}?utm_source=site&utm_medium=lesson-cta&utm_campaign=single`;
  const to = utm(`${STORE}/l/korean-vocabulary-a1`, 'lesson-cta', 'single');
  if (html.includes(from)) {
    if (!dry) fs.writeFileSync(vp, html.split(from).join(to), 'utf8');
    vocab = 1;
  }
}

console.log(`${dry ? '[예행]' : ''} 문법 CTA 교체 ${changed}개 · 그대로 ${same}개 · 건너뜀 ${miss}개 · 어휘 Day1 ${vocab}개`);
