#!/usr/bin/env node
/**
 * Sunshine Korean blog builder.
 * Reads the full grammar/vocab HTML docs from ../한국어 학습자료 and emits a
 * condensed, free-preview static site into ./docs (GitHub Pages source).
 * The full originals are paid Gumroad products and are never copied verbatim.
 */
const fs = require('fs');
const path = require('path');

const SRC_ROOT = path.join(__dirname, '..', '한국어 학습자료');
const GRAMMAR_DIR = path.join(SRC_ROOT, '문법', '자료');
const VOCAB_DIR = path.join(SRC_ROOT, '어휘', '자료');
const PRODUCTS_JSON = path.join(SRC_ROOT, 'gumroad_products.json');
const OUT = path.join(__dirname, 'docs');

const SITE_NAME = 'Sunshine Korean';
const BASE_URL = 'https://sunwork747.github.io/learn-korean';
const STORE_URL = 'https://sunshinework.gumroad.com';

const LEVELS = {
  PRE: { slug: 'hangul-basics', label: 'Hangul & Basics', sub: 'Pre-TOPIK · the alphabet, pronunciation and sentence skeleton' },
  BEG: { slug: 'beginner', label: 'Beginner', sub: 'TOPIK I (Levels 1–2) · core particles, tenses and everyday endings' },
  INT: { slug: 'intermediate', label: 'Intermediate', sub: 'TOPIK II (Levels 3–4) · connective endings and spoken nuance' },
  ADV: { slug: 'advanced', label: 'Advanced', sub: 'TOPIK II (Levels 5–6) · formal and written-register Korean' },
};
const LEVEL_ORDER = ['PRE', 'BEG', 'INT', 'ADV'];

// ---------- helpers ----------
const read = (f) => fs.readFileSync(f, 'utf8');
const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/&mdash;/g, '—').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&middot;/g, '·').replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CAT_EN = {
  '한글 (자모·발음)': 'Hangul: Letters & Pronunciation',
  '문장의 기본 골격': 'Basic Sentence Structure',
  '조사': 'Particles',
  '종결어미 (문장 끝맺음)': 'Sentence Endings',
  '연결어미': 'Connective Endings',
  '부정·가능': 'Negation & Ability',
  '기타 필수 표현': 'Other Essential Patterns',
  '연결어미 확장': 'More Connective Endings',
  '추측·의지 표현': 'Conjecture & Intention',
  '피동·사동': 'Passive & Causative',
  '인용·간접화법': 'Quotation & Reported Speech',
  '조사·의존명사 확장': 'Particles & Bound Nouns',
  '기타 중급 표현': 'Other Intermediate Patterns',
  '문어체·격식 표현': 'Formal & Written Style',
  '양보·대조 고급 표현': 'Concession & Contrast',
  '인과·조건 고급 표현': 'Cause & Condition',
  '추측·전문(傳聞) 고급 표현': 'Conjecture & Hearsay',
  '담화·논증 표현': 'Discourse & Argumentation',
};

// Canonical ID -> category map from the official table of contents.
function loadCategoryMap() {
  const map = {};
  const md = read(path.join(SRC_ROOT, '문법', '목차.md'));
  let cat = '';
  for (const line of md.split(/\r?\n/)) {
    if (line.startsWith('## 참고')) break;
    const h = line.match(/^### \d+\.\s*(.+)$/);
    if (h) { cat = h[1].trim(); continue; }
    const g = line.match(/^- (GRAM-[A-Z]+-\d+)/);
    if (g && cat) map[g[1]] = CAT_EN[cat] ? `${CAT_EN[cat]} · ${cat}` : cat;
  }
  return map;
}

function loadGumroadMap() {
  const map = {};
  try {
    const d = JSON.parse(read(PRODUCTS_JSON));
    for (const p of d.products) if (p.track === 'grammar') map[p.id] = p.url;
  } catch (e) { /* fall back to store link */ }
  return map;
}

// Design tokens mirrored from the sunshinework.gumroad.com landing page
// (cream bg, hairline-ring surface cards, hard offset-shadow hover, Poppins/Inter).
const SITE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500;600&display=swap');
:root{
  --sk-bg:#F2ECE1;--sk-surface:#FFFFFF;--sk-ink:#1B2A4A;--sk-ink-soft:#445068;
  --sk-accent:#DC3E4A;--sk-accent-text:#FFFFFF;--sk-accent-soft:#F6D9DB;
  --sk-tip-bg:#E8F5E9;--sk-tip-line:#2E7D32;--sk-muted:#8A94A6;--sk-border:rgba(27,42,74,0.14);
  --sk-head:'Poppins','Pretendard Variable','Apple SD Gothic Neo','Malgun Gothic',sans-serif;
  --sk-body:'Inter','Pretendard Variable','Apple SD Gothic Neo','Malgun Gothic',sans-serif;
}
html,body{background:var(--sk-bg) !important;}
.sk-nav{background:var(--sk-bg);border-bottom:1px solid var(--sk-border);font-family:var(--sk-body);}
.sk-nav .inner{max-width:64rem;margin:0 auto;display:flex;align-items:center;gap:18px;padding:14px 24px;flex-wrap:wrap;}
.sk-nav a{color:var(--sk-ink-soft);text-decoration:none;font-size:13px;font-weight:600;}
.sk-nav a:hover{color:var(--sk-accent);}
.sk-nav .brand{color:var(--sk-ink);font-family:var(--sk-head);font-size:16px;font-weight:700;margin-right:auto;}
.sk-cta{margin:36px 44px 8px 44px;background:var(--sk-surface);border:1px solid var(--sk-border);border-radius:8px;padding:24px 26px;font-family:var(--sk-body);}
.sk-cta h3{margin:0 0 8px 0;font-family:var(--sk-head);font-size:16px;color:var(--sk-ink);}
.sk-cta p{margin:0 0 14px 0;font-size:13.5px;line-height:1.7;color:var(--sk-ink-soft);}
.sk-cta ul{margin:0 0 16px 18px;padding:0;font-size:13px;line-height:1.8;color:var(--sk-ink-soft);}
.sk-cta .btn{display:inline-block;background:var(--sk-accent);color:var(--sk-accent-text);text-decoration:none;font-weight:600;font-size:14px;padding:11px 22px;border-radius:8px;transition:box-shadow .15s ease,transform .15s ease;}
.sk-cta .btn:hover{box-shadow:4px 4px 0 var(--sk-ink);transform:translate(-2px,-2px);}
.sk-prevnext{max-width:800px;margin:14px auto 0 auto;padding:0 12px;display:flex;justify-content:space-between;gap:12px;font-family:var(--sk-body);font-size:13px;}
.sk-prevnext a{color:var(--sk-ink);text-decoration:none;background:var(--sk-surface);border:1px solid var(--sk-border);border-radius:8px;padding:10px 14px;max-width:48%;transition:box-shadow .15s ease,transform .15s ease;}
.sk-prevnext a:hover{box-shadow:3px 3px 0 var(--sk-accent);transform:translate(-1px,-1px);}
.sk-footer{max-width:64rem;margin:28px auto 40px auto;padding:0 24px;text-align:center;font-family:var(--sk-body);font-size:12px;color:var(--sk-muted);line-height:1.8;}
.sk-footer a{color:var(--sk-ink);}
`;

// prefers-color-scheme token swap, only for pages whose whole body uses the
// sk- tokens (home/level shells) — lesson docs keep their fixed light layout.
const DARK_CSS = `
@media (prefers-color-scheme: dark){
  :root{
    --sk-bg:#10172A;--sk-surface:#161F38;--sk-ink:#F2ECE1;--sk-ink-soft:#C9CEDB;
    --sk-accent:#FF7A82;--sk-accent-text:#2A1013;--sk-accent-soft:#3A2226;
    --sk-tip-bg:#16321B;--sk-tip-line:#7FCB8B;--sk-muted:#93A0BE;--sk-border:rgba(242,236,225,0.16);
  }
}
`;

function navHtml(depth) {
  const p = depth === 0 ? '' : '../';
  return `<nav class="sk-nav"><div class="inner">
  <a class="brand" href="${p}index.html">🌞 ${SITE_NAME}</a>
  <a href="${p}hangul-basics.html">Hangul & Basics</a>
  <a href="${p}beginner.html">Beginner</a>
  <a href="${p}intermediate.html">Intermediate</a>
  <a href="${p}advanced.html">Advanced</a>
  <a href="${p}vocabulary.html">Vocabulary</a>
</div></nav>`;
}

function footerHtml() {
  return `<div class="sk-footer">© ${SITE_NAME} · Free Korean lessons, from Hangul to advanced grammar.<br>
Complete lessons with practice &amp; answer keys: <a href="${STORE_URL}" rel="noopener">${STORE_URL.replace('https://', '')}</a></div>`;
}

function ctaHtml(url, droppedTitles) {
  const items = droppedTitles.length
    ? `<p>This free preview covers the core concept and form. The complete edition also includes:</p>
       <ul>${droppedTitles.map((t) => `<li>${esc(t)}</li>`).join('')}<li>Practice questions with a full answer key</li><li>Print-ready PDF version</li></ul>`
    : `<p>The complete edition includes the full explanation, all example sets, and practice questions with a full answer key — as a print-ready PDF.</p>`;
  return `<div class="sk-cta"><h3>📘 Want the complete lesson?</h3>${items}
  <a class="btn" href="${url}" rel="noopener" target="_blank">Get the full lesson on Gumroad →</a></div>`;
}

// ---------- grammar docs ----------
function parseGrammarDoc(file) {
  const html = read(path.join(GRAMMAR_DIR, file));
  const id = file.match(/^(GRAM-[A-Z]+-\d+)/)[1];
  const level = id.split('-')[1];
  const title = stripTags((html.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1]);
  // "GRAM-ADV-001 -(으)ㅁ — Nominalizer & ..." -> point + english
  const tail = title.replace(/^GRAM-[A-Z]+-\d+\s*/, '');
  const [point, engTitle] = tail.includes('—') ? tail.split('—').map((s) => s.trim()) : [tail, ''];
  const eyebrow = stripTags((html.match(/class="eyebrow">([\s\S]*?)<\/div>/) || [, ''])[1]);
  const category = eyebrow.includes('·') ? eyebrow.split('·').pop().trim() : '';
  return { file, id, level, title, point, engTitle, category, html };
}

function condenseGrammar(doc, gumroadMap, prev, next) {
  const { html, id } = doc;
  const marks = [...html.matchAll(/<!-- =+ \d\./g)].map((m) => m.index);
  if (marks.length !== 4) throw new Error(`${doc.file}: expected 4 section markers, got ${marks.length}`);
  const head = html.slice(0, marks[0]);
  const s1 = html.slice(marks[0], marks[1]);
  const s2 = html.slice(marks[1], marks[2]);
  const s3 = html.slice(marks[2], marks[3]);
  const tailStart = html.indexOf('<div class="doc-footer"');
  const tail = tailStart !== -1 ? html.slice(tailStart) : '</main>\n</div>\n</body>\n</html>';

  const dropped = [];
  const keepFirstH3 = (sec) => {
    const parts = sec.split(/(?=<h3)/);
    if (parts.length <= 2) return sec; // h2 intro + single h3 (or none): keep all
    for (const p of parts.slice(2)) {
      const m = p.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
      if (m) dropped.push(stripTags(m[1]));
    }
    return parts[0] + parts[1];
  };
  const s2cut = keepFirstH3(s2);
  const s3cut = keepFirstH3(s3);

  const gumroadUrl = gumroadMap[id] || STORE_URL;
  const cta = ctaHtml(gumroadUrl, dropped);

  const prevnext = `<div class="sk-prevnext">
  ${prev ? `<a href="${slugOf(prev)}.html">← ${esc(prev.point)}</a>` : '<span></span>'}
  ${next ? `<a href="${slugOf(next)}.html" style="text-align:right;">${esc(next.point)} →</a>` : '<span></span>'}
</div>`;

  let out = head + s1 + s2cut + s3cut + '\n' + cta + '\n' + tail;
  // inject site chrome
  out = out.replace('</head>', `<style>${SITE_CSS}</style>\n<meta name="description" content="${esc(`${doc.point} — free Korean grammar lesson (${LEVELS[doc.level].label}). ${doc.engTitle}`)}">\n<link rel="icon" href="../favicon.svg">\n</head>`);
  out = out.replace(/<body>/, `<body>\n${navHtml(1)}`);
  out = out.replace('</body>', `${prevnext}\n${footerHtml()}\n</body>`);
  // preview marker in title
  out = out.replace(/<title>([\s\S]*?)<\/title>/, (m, t) => `<title>${stripTags(t)} | ${SITE_NAME}</title>`);
  return out;
}

const slugOf = (doc) => doc.id.toLowerCase();

// ---------- vocab ----------
function buildVocabDay1() {
  const files = fs.existsSync(VOCAB_DIR) ? fs.readdirSync(VOCAB_DIR).filter((f) => f.endsWith('.html')) : [];
  if (!files.length) return null;
  const file = files[0];
  const html = read(path.join(VOCAB_DIR, file));
  const entries = [...html.matchAll(/<div class="entry"/g)].map((m) => m.index);
  let out = html;
  if (entries.length > 10) {
    const cut = entries[10];
    const cta = ctaHtml(STORE_URL, [`All ${entries.length} words of Day 1 with examples and romanization`]);
    out = html.slice(0, cut) + `</div>\n${cta}\n</div></body></html>`;
  }
  out = out.replace('</head>', `<style>${SITE_CSS}</style>\n<meta name="description" content="Day 1 Korean vocabulary — greetings and basic expressions. Free preview.">\n<link rel="icon" href="../favicon.svg">\n</head>`);
  out = out.replace(/<body[^>]*>/, (m) => `${m}\n${navHtml(1)}`);
  out = out.replace('</body>', `${footerHtml()}\n</body>`);
  out = out.replace(/<title>([\s\S]*?)<\/title>/, (m, t) => `<title>${stripTags(t)} | ${SITE_NAME}</title>`);
  return { file: 'day-1.html', title: 'Day 1 — Greetings & Basic Expressions', html: out };
}

// ---------- index / level pages ----------
function pageShell({ title, desc, body, depth = 0 }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="icon" href="${depth ? '../' : ''}favicon.svg">
<style>
${SITE_CSS}
${DARK_CSS}
*{box-sizing:border-box;}
body{margin:0;font-family:var(--sk-body);color:var(--sk-ink);}
.wrap{max-width:64rem;margin:0 auto;padding:3rem 1.5rem 2rem;}
.hero{margin-bottom:2.25rem;}
.hero .eyebrow{display:block;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--sk-accent);margin-bottom:8px;}
.hero h1{font-family:var(--sk-head);font-size:1.75rem;font-weight:700;margin:0 0 10px 0;line-height:1.25;text-wrap:balance;}
.hero p{font-size:15px;color:var(--sk-ink-soft);margin:0;line-height:1.7;max-width:40rem;}
.card{display:block;background:var(--sk-surface);border:1px solid var(--sk-border);border-radius:8px;padding:20px 22px;margin-bottom:14px;text-decoration:none;color:var(--sk-ink);transition:box-shadow .15s ease,transform .15s ease;}
.card:hover{box-shadow:4px 4px 0 var(--sk-accent);transform:translate(-2px,-2px);}
.card h2{margin:0 0 4px 0;font-family:var(--sk-head);font-size:16px;color:var(--sk-ink);}
.card p{margin:0;font-size:13px;color:var(--sk-muted);line-height:1.6;}
.card .count{float:right;font-size:12px;color:var(--sk-accent);font-weight:600;}
.section-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:2.25rem 0 0.9rem 0;border-bottom:1px solid var(--sk-border);padding-bottom:9px;}
.section-head h2{font-family:var(--sk-head);font-size:1.05rem;font-weight:700;margin:0;color:var(--sk-ink);}
.section-head .kr{font-family:var(--sk-body);font-weight:500;font-size:12.5px;color:var(--sk-muted);margin-left:8px;}
.lesson{display:flex;gap:14px;align-items:center;background:var(--sk-surface);border:1px solid var(--sk-border);border-radius:8px;padding:11px 16px;margin-bottom:8px;text-decoration:none;color:var(--sk-ink);font-size:14px;transition:box-shadow .15s ease,transform .15s ease;}
.lesson:hover{box-shadow:3px 3px 0 var(--sk-accent);transform:translate(-1px,-1px);}
.lesson .id{font-size:10.5px;color:var(--sk-muted);min-width:64px;font-weight:600;letter-spacing:0.04em;}
.lesson .pt{font-weight:600;color:var(--sk-ink);white-space:nowrap;}
.lesson .en{font-size:12.5px;color:var(--sk-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
@media(max-width:640px){.lesson .en{display:none;}}
</style>
</head>
<body>
${navHtml(depth)}
<div class="wrap">
${body}
</div>
${footerHtml()}
</body>
</html>`;
}

// ---------- home page ----------
const LEVEL_TAG = { PRE: 'PRE-TOPIK', BEG: 'TOPIK I · 1–2', INT: 'TOPIK II · 3–4', ADV: 'TOPIK II · 5–6' };

function buildHome(docs, day1) {
  const counts = Object.fromEntries(LEVEL_ORDER.map((lv) => [lv, docs.filter((d) => d.level === lv).length]));
  const firstOf = Object.fromEntries(LEVEL_ORDER.map((lv) => [lv, docs.find((d) => d.level === lv)]));

  const levelCards = LEVEL_ORDER.map((lv) => {
    const L = LEVELS[lv];
    const subText = L.sub.split('·').slice(1).join('·').trim() || L.sub;
    return `<a class="lv-card" href="${L.slug}.html">
  <div class="lv-top"><span class="lv-tag">${LEVEL_TAG[lv]}</span><span class="lv-count">${counts[lv]} lessons</span></div>
  <h3>${esc(L.label)}</h3>
  <p>${esc(subText)}</p>
  <span class="lv-go">Browse lessons →</span>
</a>`;
  }).join('\n');

  const tocSections = LEVEL_ORDER.map((lv, idx) => {
    const L = LEVELS[lv];
    const lvDocs = docs.filter((d) => d.level === lv);
    let inner = '';
    let lastCat = null;
    for (const d of lvDocs) {
      const c = d.category;
      if (c && c !== lastCat) {
        const [en, kr] = c.split(' · ');
        inner += `<div class="toc-cat">${esc(en)}${kr ? `<span class="kr">${esc(kr)}</span>` : ''}</div>\n`;
        lastCat = c;
      }
      inner += `<a class="toc-item" href="grammar/${slugOf(d)}.html"><span class="toc-id">${d.id.replace('GRAM-', '')}</span><span class="toc-pt">${esc(d.point)}</span><span class="toc-en">${esc(d.engTitle)}</span></a>\n`;
    }
    return `<details class="toc-level"${idx === 0 ? ' open' : ''}>
<summary><span class="toc-lv-name">${esc(L.label)}</span><span class="toc-lv-meta">${LEVEL_TAG[lv]} · ${lvDocs.length} lessons</span></summary>
<div class="toc-body">${inner}</div>
</details>`;
  }).join('\n');

  const body = `
<header class="hero">
  <span class="eyebrow">FREE KOREAN GRAMMAR &amp; VOCABULARY</span>
  <h1>Learn Korean properly,<br>from <em>Hangul</em> to advanced.</h1>
  <p class="lede">${docs.length} structured grammar lessons following the TOPIK curriculum, written in plain English — every one free to read.
  <span class="kr">한글부터 TOPIK II 고급 문법까지, 전부 무료로 읽을 수 있습니다.</span></p>
  <div class="tip">
    <div class="tip-title">Free by design</div>
    <p>Every lesson on this site is free — no sign-up, no paywall. If you want the complete editions (full explanations, practice with answer keys, print-ready PDFs), they live on <a href="${STORE_URL}" rel="noopener" target="_blank">Gumroad</a>.</p>
  </div>
  <div class="hero-actions">
    <a class="btn-primary" href="grammar/${slugOf(firstOf.PRE)}.html">Start with Hangul →</a>
    <a class="btn-ghost" href="#curriculum">See the full curriculum</a>
  </div>
  <div class="stats">
    <div class="stat"><b>${docs.length}</b><span>grammar lessons</span></div>
    <div class="stat"><b>4</b><span>levels, Pre-TOPIK → TOPIK II</span></div>
    <div class="stat"><b>100%</b><span>free to read</span></div>
  </div>
</header>

<section>
  <div class="section-head"><h2>Pick your level<span class="kr">단계별 문법</span></h2><span class="section-note">${docs.length} lessons total</span></div>
  <div class="lv-grid">${levelCards}</div>
</section>

<section class="gumroad-strip">
  <div class="gs-text">
    <h2>Want the complete editions?</h2>
    <p>Every lesson here is a free preview. The full versions — complete explanations, all example sets, practice questions with answer keys, print-ready PDFs — are on Gumroad.</p>
  </div>
  <a class="btn-primary" href="${STORE_URL}" rel="noopener" target="_blank">Visit the store →</a>
</section>

<section id="curriculum">
  <div class="section-head"><h2>Full curriculum<span class="kr">전체 목차</span></h2><span class="section-note">all ${docs.length} lessons, in order</span></div>
  ${tocSections}
</section>

<section>
  <div class="section-head"><h2>Daily vocabulary<span class="kr">일일 어휘</span></h2></div>
  <div class="lv-grid">
    <a class="lv-card" href="${day1 ? `vocab/${day1.file}` : 'vocabulary.html'}">
      <div class="lv-top"><span class="lv-tag">DAY 1</span><span class="lv-count">31 words</span></div>
      <h3>Greetings &amp; Basic Expressions</h3>
      <p>The first words every learner needs — with romanization and example sentences.</p>
      <span class="lv-go">Start Day 1 →</span>
    </a>
    <a class="lv-card" href="vocabulary.html">
      <div class="lv-top"><span class="lv-tag">SERIES</span><span class="lv-count">growing</span></div>
      <h3>All vocabulary days</h3>
      <p>Themed word sets, added day by day as the series grows.</p>
      <span class="lv-go">Browse →</span>
    </a>
  </div>
</section>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${SITE_NAME} — Free Korean Grammar &amp; Vocabulary Lessons</title>
<meta name="description" content="${docs.length} free Korean grammar lessons from Hangul to TOPIK II advanced, plus daily vocabulary. Learn Korean with clear English explanations.">
<link rel="icon" href="favicon.svg">
<style>
${SITE_CSS}
${DARK_CSS}
*{box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{margin:0;font-family:var(--sk-body);color:var(--sk-ink);}
a{color:inherit;}
main{max-width:64rem;margin:0 auto;padding:3rem 1.5rem 2rem;}

.hero .eyebrow{display:block;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--sk-accent);margin-bottom:10px;}
.hero h1{font-family:var(--sk-head);font-size:2.15rem;font-weight:700;margin:0 0 14px 0;line-height:1.22;text-wrap:balance;}
.hero h1 em{font-style:normal;color:var(--sk-accent);}
.lede{font-size:16px;color:var(--sk-ink-soft);line-height:1.7;margin:0;max-width:40rem;}
.lede .kr{display:block;font-size:13.5px;color:var(--sk-muted);margin-top:6px;}
.tip{margin:1.6rem 0 0;border-left:4px solid var(--sk-tip-line);background:var(--sk-tip-bg);border-radius:2px;padding:14px 18px;max-width:40rem;}
.tip .tip-title{font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--sk-tip-line);margin-bottom:6px;}
.tip p{margin:0;font-size:14px;color:var(--sk-ink);line-height:1.65;}
.tip a{color:var(--sk-accent);font-weight:600;}
.hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin:1.6rem 0 0;}
.btn-primary{display:inline-block;background:var(--sk-accent);color:var(--sk-accent-text);text-decoration:none;font-weight:600;font-size:14.5px;padding:12px 24px;border-radius:8px;transition:box-shadow .15s ease,transform .15s ease;}
.btn-primary:hover{box-shadow:4px 4px 0 var(--sk-ink);transform:translate(-2px,-2px);}
.btn-ghost{display:inline-block;background:var(--sk-surface);border:1px solid var(--sk-border);color:var(--sk-ink);text-decoration:none;font-weight:600;font-size:14.5px;padding:12px 24px;border-radius:8px;transition:box-shadow .15s ease,transform .15s ease;}
.btn-ghost:hover{box-shadow:4px 4px 0 var(--sk-accent);transform:translate(-2px,-2px);}
.stats{display:flex;gap:36px;flex-wrap:wrap;border-top:1px solid var(--sk-border);margin-top:2rem;padding-top:1.2rem;}
.stat b{display:block;font-family:var(--sk-head);font-size:22px;font-weight:700;color:var(--sk-ink);}
.stat span{font-size:12.5px;color:var(--sk-muted);}

section{margin-top:2.75rem;}
.section-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:1rem;border-bottom:1px solid var(--sk-border);padding-bottom:10px;}
.section-head h2{font-family:var(--sk-head);font-size:1.2rem;font-weight:700;margin:0;color:var(--sk-ink);}
.section-head .kr{font-family:var(--sk-body);font-weight:500;font-size:13px;color:var(--sk-muted);margin-left:8px;}
.section-note{font-size:12.5px;color:var(--sk-muted);white-space:nowrap;}

.lv-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
@media(max-width:680px){.lv-grid{grid-template-columns:1fr;}.hero h1{font-size:1.7rem;}}
.lv-card{display:block;background:var(--sk-surface);border:1px solid var(--sk-border);border-radius:8px;padding:1.1rem 1.25rem;color:var(--sk-ink);text-decoration:none;transition:box-shadow .15s ease,transform .15s ease;}
.lv-card:hover{box-shadow:4px 4px 0 var(--sk-accent);transform:translate(-2px,-2px);}
.lv-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.lv-tag{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--sk-accent);}
.lv-count{font-size:12px;color:var(--sk-muted);font-weight:500;}
.lv-card h3{margin:0 0 5px 0;font-family:var(--sk-head);font-size:1rem;font-weight:600;color:var(--sk-ink);}
.lv-card p{margin:0 0 12px 0;font-size:13.5px;color:var(--sk-ink-soft);line-height:1.6;}
.lv-go{font-size:13px;font-weight:600;color:var(--sk-accent);}

.gumroad-strip{background:var(--sk-accent-soft);border:1px solid var(--sk-border);border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:1.5rem 1.75rem;flex-wrap:wrap;}
.gs-text h2{font-family:var(--sk-head);margin:0 0 6px 0;font-size:1.05rem;color:var(--sk-ink);}
.gs-text p{margin:0;font-size:13.5px;color:var(--sk-ink-soft);line-height:1.65;max-width:36rem;}

.toc-level{background:var(--sk-surface);border:1px solid var(--sk-border);border-radius:8px;margin-bottom:10px;overflow:hidden;}
.toc-level summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 20px;flex-wrap:wrap;}
.toc-level summary::-webkit-details-marker{display:none;}
.toc-level summary:hover{background:var(--sk-accent-soft);}
.toc-lv-name{font-family:var(--sk-head);font-size:15px;font-weight:600;color:var(--sk-ink);}
.toc-lv-name::before{content:'▸';color:var(--sk-accent);margin-right:10px;transition:transform .15s;display:inline-block;}
.toc-level[open] .toc-lv-name::before{transform:rotate(90deg);}
.toc-lv-meta{font-size:12px;color:var(--sk-muted);font-weight:500;}
.toc-body{padding:2px 20px 16px 20px;border-top:1px solid var(--sk-border);}
.toc-cat{font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--sk-accent);margin:16px 0 6px 0;}
.toc-cat .kr{font-weight:500;text-transform:none;letter-spacing:0;color:var(--sk-muted);margin-left:8px;}
.toc-item{display:flex;gap:12px;align-items:baseline;padding:7px 2px;border-bottom:1px solid var(--sk-border);color:var(--sk-ink);font-size:14px;text-decoration:none;}
.toc-item:hover .toc-pt{color:var(--sk-accent);}
.toc-item:last-child{border-bottom:none;}
.toc-id{font-size:10.5px;color:var(--sk-muted);min-width:64px;font-weight:600;letter-spacing:0.04em;}
.toc-pt{font-weight:600;color:var(--sk-ink);white-space:nowrap;}
.toc-en{font-size:12.5px;color:var(--sk-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
@media(max-width:640px){.toc-en{display:none;}}
</style>
</head>
<body>
${navHtml(0)}
<main>
${body}
</main>
${footerHtml()}
</body>
</html>`;
}
// ---------- main ----------
function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, 'grammar'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'vocab'), { recursive: true });

  const gumroadMap = loadGumroadMap();
  const catMap = loadCategoryMap();
  const files = fs.readdirSync(GRAMMAR_DIR).filter((f) => f.endsWith('.html'));
  const docs = files.map(parseGrammarDoc);
  for (const d of docs) d.category = catMap[d.id] || '';
  docs.sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) || a.id.localeCompare(b.id));

  // grammar pages
  docs.forEach((doc, i) => {
    const prev = i > 0 && docs[i - 1].level === doc.level ? docs[i - 1] : null;
    const next = i < docs.length - 1 && docs[i + 1].level === doc.level ? docs[i + 1] : null;
    const out = condenseGrammar(doc, gumroadMap, prev, next);
    fs.writeFileSync(path.join(OUT, 'grammar', `${slugOf(doc)}.html`), out);
  });

  // level pages
  for (const lv of LEVEL_ORDER) {
    const L = LEVELS[lv];
    const lvDocs = docs.filter((d) => d.level === lv);
    let list = '';
    let lastCat = null;
    for (const d of lvDocs) {
      const c = d.category;
      if (c && c !== lastCat) {
        const [en, kr] = c.split(' · ');
        list += `<div class="section-head"><h2>${esc(en)}${kr ? `<span class="kr">${esc(kr)}</span>` : ''}</h2></div>\n`;
        lastCat = c;
      }
      list += `<a class="lesson" href="grammar/${slugOf(d)}.html"><span class="id">${d.id.replace('GRAM-', '')}</span><span class="pt">${esc(d.point)}</span><span class="en">${esc(d.engTitle)}</span></a>\n`;
    }
    const body = `<div class="hero"><span class="eyebrow">KOREAN GRAMMAR</span><h1>${esc(L.label)}</h1><p>${esc(L.sub)} · ${lvDocs.length} lessons, free to read.</p></div>
${list}`;
    fs.writeFileSync(path.join(OUT, `${L.slug}.html`), pageShell({ title: `${L.label} Korean Grammar | ${SITE_NAME}`, desc: `${L.sub}. ${lvDocs.length} free Korean grammar lessons.`, body }));
  }

  // vocab
  const day1 = buildVocabDay1();
  if (day1) fs.writeFileSync(path.join(OUT, 'vocab', day1.file), day1.html);
  const vocabBody = `<div class="hero"><div class="eyebrow">KOREAN VOCABULARY</div><h1>Daily Vocabulary</h1><p>Themed word sets with romanization and example sentences. New days are added as they are produced.</p></div>
<div class="content">
${day1 ? `<a class="card" href="vocab/${day1.file}"><span class="count">31 words</span><h2>${esc(day1.title)}</h2><p>Greetings, thanks, apologies — the first words every learner needs.</p></a>` : ''}
<p style="font-size:13px;color:#8A94A6;">More vocabulary days are coming soon. Full printable packs are available on <a href="${STORE_URL}">Gumroad</a>.</p>
</div>`;
  fs.writeFileSync(path.join(OUT, 'vocabulary.html'), pageShell({ title: `Korean Vocabulary | ${SITE_NAME}`, desc: 'Free Korean vocabulary lessons by day — greetings, numbers, daily life.', body: vocabBody }));

  // home
  fs.writeFileSync(path.join(OUT, 'index.html'), buildHome(docs, day1));

  // favicon / robots / sitemap / 404
  fs.writeFileSync(path.join(OUT, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1B2A4A"/><text x="16" y="22" font-size="16" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="bold">한</text></svg>`);
  fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml\n`);
  const urls = ['index.html', 'vocabulary.html', 'privacy.html', ...LEVEL_ORDER.map((lv) => `${LEVELS[lv].slug}.html`), ...docs.map((d) => `grammar/${slugOf(d)}.html`), ...(day1 ? [`vocab/${day1.file}`] : [])];
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${BASE_URL}/${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(OUT, '404.html'), pageShell({ title: `Page not found | ${SITE_NAME}`, desc: 'Page not found', body: `<div class="hero"><h1>Page not found</h1><p><a href="index.html" style="color:#fff;">← Back to home</a></p></div>` }));
  fs.writeFileSync(path.join(OUT, 'privacy.html'), buildPrivacy());

  console.log(`Built ${docs.length} grammar pages, ${day1 ? 1 : 0} vocab page(s), ${LEVEL_ORDER.length} level pages.`);
}


// ---------- privacy policy ----------
// Required by Meta for the Instagram publishing app (App Dashboard -> Privacy Policy URL).
// Must stay publicly reachable without login, so it is generated here rather than
// hand-placed in docs/ (main() wipes docs/ on every build).
function buildPrivacy() {
  const body = `<style>
.legal{max-width:44rem;}
.legal h2{font-family:var(--sk-head);font-size:1.05rem;font-weight:700;margin:2.1rem 0 .6rem;padding-bottom:7px;border-bottom:1px solid var(--sk-border);}
.legal p,.legal li{font-size:14px;line-height:1.75;color:var(--sk-ink-soft);}
.legal ul{margin:.5rem 0 .5rem 1.1rem;padding:0;}
.legal a{color:var(--sk-accent);font-weight:600;}
.legal .updated{font-size:12.5px;color:var(--sk-muted);}
</style>
<div class="hero"><div class="eyebrow">LEGAL</div><h1>Privacy Policy</h1>
<p class="updated">Last updated: 24 August 2026</p></div>
<div class="legal">

<h2>1. Who we are</h2>
<p>${SITE_NAME} is a small, independent Korean-language learning project run by one person. It publishes free lessons on this website, sells printable study materials on <a href="${STORE_URL}" rel="noopener">Gumroad</a>, and posts lesson graphics to the Instagram account <a href="https://www.instagram.com/dailykorean_with_tutor/" rel="noopener">@dailykorean_with_tutor</a>.</p>
<p>Contact: <a href="mailto:niceworkforsun@gmail.com">niceworkforsun@gmail.com</a></p>

<h2>2. What this policy covers</h2>
<p>This policy covers two things:</p>
<ul>
<li>This website, <a href="${BASE_URL}">${BASE_URL.replace('https://','')}</a>.</li>
<li>Our private publishing tool, which uses the Instagram API to post our own lesson graphics to our own Instagram account. The tool is not a product, is not offered to anyone else, and has no users other than the operator.</li>
</ul>

<h2>3. Information we collect</h2>
<p><strong>On this website:</strong> nothing. There are no accounts, no sign-in, no comment forms, no advertising, and no analytics or tracking cookies. The site is static and hosted on GitHub Pages, which — like any web host — records standard server request information such as IP address and browser type. That data is handled by GitHub under its own privacy policy and is not accessible to us in an identifiable form.</p>
<p><strong>In the publishing tool:</strong> we hold only data about our own Instagram account, obtained through Instagram Login:</p>
<ul>
<li>The account's Instagram user ID and username.</li>
<li>An access token issued by Meta, used to publish posts.</li>
<li>The images and captions we ourselves publish, and the media IDs Instagram returns.</li>
</ul>
<p>We do not collect, request, store, or process data belonging to other Instagram users. We do not read followers, direct messages, comments, or profile information of anyone else.</p>

<h2>4. How we use it</h2>
<p>Solely to publish our own posts to our own account, and to confirm afterwards that a post was created. We do not sell, rent, or trade any data. We do not use it for advertising, profiling, or automated decision-making, and we do not combine it with data from other sources.</p>

<h2>5. Third parties</h2>
<ul>
<li><strong>Meta / Instagram.</strong> Posts are created through the Instagram API. Meta's handling of that data is governed by Meta's own privacy policy.</li>
<li><strong>catbox.moe.</strong> The Instagram API only accepts images that are already reachable at a public URL, so each lesson graphic is uploaded to the file host catbox.moe immediately before posting, and the resulting link is handed to Instagram. These are our own lesson graphics, created for public posting; they contain no personal data.</li>
<li><strong>Gumroad.</strong> If you buy a study pack, Gumroad is the seller of record and handles your payment and contact details under its own privacy policy. We only see the order information Gumroad shows sellers.</li>
</ul>
<p>Apart from these, we share nothing with anyone. We disclose information only where the law requires it.</p>

<h2>6. How long we keep it</h2>
<p>The access token is stored in a local environment file on the operator's own computer. It is never committed to a public repository and is regenerated or revoked when needed. Published posts stay on Instagram until we delete them.</p>

<h2 id="data-deletion">7. Deleting your data</h2>
<p>Because we do not collect other people's personal data, there is normally nothing of yours for us to delete. If you believe we hold something relating to you, email <a href="mailto:niceworkforsun@gmail.com">niceworkforsun@gmail.com</a> with the details and we will delete it and confirm within 30 days.</p>
<p>To remove our app's access to an Instagram account you control, open the Instagram app and go to <em>Settings and privacy → Website permissions → Apps and websites</em>, then remove the app. Revoking access immediately invalidates the token, and any copy we hold stops working and is deleted.</p>

<h2>8. Children</h2>
<p>This site and its materials are not directed at children under 13, and we do not knowingly collect information from them.</p>

<h2>9. Changes to this policy</h2>
<p>If this policy changes, the revised version will be posted on this page with a new "last updated" date.</p>

<h2>10. Contact</h2>
<p>Questions about this policy: <a href="mailto:niceworkforsun@gmail.com">niceworkforsun@gmail.com</a></p>

</div>`;
  return pageShell({
    title: `Privacy Policy | ${SITE_NAME}`,
    desc: 'How Sunshine Korean handles data on this website and in its Instagram publishing tool.',
    body,
  });
}

main();
