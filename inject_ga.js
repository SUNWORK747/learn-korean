#!/usr/bin/env node
/**
 * docs/ 의 모든 HTML 에 GA4 태그를 삽입한다.
 * build.js 가 이미 심어 주므로 평소에는 쓸 일이 없다.
 * 이 스크립트는 **재빌드 없이** 기존 페이지에 태그만 넣을 때를 위한 것이다.
 *   node inject_ga.js            삽입 (이미 있으면 건너뜀)
 *   node inject_ga.js --check    삽입 여부만 센다
 */
const fs = require('fs');
const path = require('path');
const { ANALYTICS_ID, analyticsHtml } = require('./analytics');

const DOCS = path.join(__dirname, 'docs');
const check = process.argv.includes('--check');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
  });
}

let done = 0, skipped = 0, missing = 0;
for (const f of walk(DOCS)) {
  const html = fs.readFileSync(f, 'utf8');
  if (html.includes('googletagmanager')) { skipped++; continue; }
  if (!html.includes('</head>')) { missing++; console.warn('  </head> 없음:', path.relative(__dirname, f)); continue; }
  if (!check) fs.writeFileSync(f, html.replace('</head>', analyticsHtml() + '\n</head>'), 'utf8');
  done++;
}
console.log(`측정 ID : ${ANALYTICS_ID || '(비어 있음 — 태그를 넣지 않는다)'}`);
console.log(`${check ? '삽입 대상' : '삽입함'} ${done}개 · 이미 있음 ${skipped}개 · </head> 없음 ${missing}개`);
