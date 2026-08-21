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

const SITE_CSS = `
.sk-nav{background:#141F38;padding:0;font-family:'Pretendard','Malgun Gothic','Apple SD Gothic Neo',sans-serif;}
.sk-nav .inner{max-width:800px;margin:0 auto;display:flex;align-items:center;gap:18px;padding:14px 20px;flex-wrap:wrap;}
.sk-nav a{color:#C4CEE3;text-decoration:none;font-size:13px;font-weight:600;}
.sk-nav a:hover{color:#fff;}
.sk-nav .brand{color:#fff;font-size:16px;font-weight:800;letter-spacing:0.5px;margin-right:auto;}
.sk-cta{margin:36px 44px 8px 44px;border:2px solid #DC3E4A;border-radius:10px;padding:24px 26px;background:#FFF6F6;font-family:'Pretendard','Malgun Gothic','Apple SD Gothic Neo',sans-serif;}
.sk-cta h3{margin:0 0 8px 0;font-size:17px;color:#1B2A4A;}
.sk-cta p{margin:0 0 14px 0;font-size:13.5px;line-height:1.7;color:#1F2430;}
.sk-cta ul{margin:0 0 16px 18px;padding:0;font-size:13px;line-height:1.8;color:#1F2430;}
.sk-cta .btn{display:inline-block;background:#DC3E4A;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 22px;border-radius:6px;}
.sk-cta .btn:hover{background:#c33440;}
.sk-prevnext{max-width:800px;margin:14px auto 0 auto;display:flex;justify-content:space-between;gap:12px;font-family:'Pretendard','Malgun Gothic','Apple SD Gothic Neo',sans-serif;font-size:13px;}
.sk-prevnext a{color:#1B2A4A;text-decoration:none;background:#fff;border:1px solid #D5DAE3;border-radius:6px;padding:10px 14px;max-width:48%;}
.sk-prevnext a:hover{border-color:#1B2A4A;}
.sk-footer{max-width:800px;margin:28px auto 40px auto;text-align:center;font-family:'Pretendard','Malgun Gothic','Apple SD Gothic Neo',sans-serif;font-size:12px;color:#8A94A6;line-height:1.8;}
.sk-footer a{color:#1B2A4A;}
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
:root{--navy:#1B2A4A;--red:#DC3E4A;--muted:#8A94A6;--body:#1F2430;}
*{box-sizing:border-box;}
body{margin:0;background:#EEF0F3;font-family:'Pretendard','Malgun Gothic','Apple SD Gothic Neo',sans-serif;color:var(--body);}
.wrap{max-width:800px;margin:24px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,0.08);}
.hero{background:var(--navy);color:#fff;padding:44px;}
.hero .eyebrow{font-size:11px;letter-spacing:2px;color:#9FB0D0;font-weight:600;margin-bottom:10px;}
.hero h1{font-size:30px;font-weight:800;margin:0 0 8px 0;line-height:1.3;}
.hero p{font-size:14px;color:#C4CEE3;margin:0;line-height:1.7;}
.content{padding:34px 44px 44px 44px;}
.card{display:block;border:1px solid #D5DAE3;border-radius:10px;padding:20px 22px;margin-bottom:14px;text-decoration:none;color:var(--body);}
.card:hover{border-color:var(--navy);}
.card h2{margin:0 0 4px 0;font-size:17px;color:var(--navy);}
.card p{margin:0;font-size:13px;color:var(--muted);line-height:1.6;}
.card .count{float:right;font-size:12px;color:var(--red);font-weight:700;}
.lesson{display:flex;gap:12px;padding:11px 4px;border-bottom:1px solid #EEF0F3;text-decoration:none;color:var(--body);font-size:14px;align-items:baseline;}
.lesson:hover .pt{color:var(--red);}
.lesson .id{font-size:11px;color:var(--muted);min-width:110px;font-weight:600;}
.lesson .pt{font-weight:700;color:var(--navy);}
.lesson .en{font-size:12.5px;color:var(--muted);}
h2.cat{font-size:14px;color:var(--red);letter-spacing:1px;margin:30px 0 8px 0;text-transform:uppercase;}
${SITE_CSS}
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
    const catOf = (d) => d.category.replace(/\s*\((final|last|opening)[^)]*\)\s*$/i, '').trim();
    let list = '';
    let lastCat = null;
    for (const d of lvDocs) {
      const c = catOf(d);
      if (c && c !== lastCat) { list += `<h2 class="cat">${esc(c)}</h2>\n`; lastCat = c; }
      list += `<a class="lesson" href="grammar/${slugOf(d)}.html"><span class="id">${d.id}</span><span class="pt">${esc(d.point)}</span><span class="en">${esc(d.engTitle)}</span></a>\n`;
    }
    const body = `<div class="hero"><div class="eyebrow">KOREAN GRAMMAR</div><h1>${esc(L.label)}</h1><p>${esc(L.sub)} · ${lvDocs.length} lessons, free to read.</p></div>
<div class="content">${list}</div>`;
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
  const counts = Object.fromEntries(LEVEL_ORDER.map((lv) => [lv, docs.filter((d) => d.level === lv).length]));
  const homeBody = `<div class="hero"><div class="eyebrow">LEARN KOREAN, PROPERLY</div><h1>Korean grammar from Hangul<br>to advanced — free.</h1>
<p>${docs.length} structured grammar lessons following the TOPIK curriculum, written in plain English.<br>Read everything free here; get complete PDF editions with practice &amp; answer keys on <a href="${STORE_URL}" style="color:#fff;">Gumroad</a>.</p></div>
<div class="content">
${LEVEL_ORDER.map((lv) => { const L = LEVELS[lv]; return `<a class="card" href="${L.slug}.html"><span class="count">${counts[lv]} lessons</span><h2>${esc(L.label)}</h2><p>${esc(L.sub)}</p></a>`; }).join('\n')}
<a class="card" href="vocabulary.html"><span class="count">Day 1+</span><h2>Daily Vocabulary</h2><p>Themed word sets with romanization and example sentences.</p></a>
</div>`;
  fs.writeFileSync(path.join(OUT, 'index.html'), pageShell({ title: `${SITE_NAME} — Free Korean Grammar & Vocabulary Lessons`, desc: `${docs.length} free Korean grammar lessons from Hangul to TOPIK II advanced, plus daily vocabulary. Learn Korean with clear English explanations.`, body: homeBody }));

  // favicon / robots / sitemap / 404
  fs.writeFileSync(path.join(OUT, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1B2A4A"/><text x="16" y="22" font-size="16" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="bold">한</text></svg>`);
  fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml\n`);
  const urls = ['index.html', 'vocabulary.html', ...LEVEL_ORDER.map((lv) => `${LEVELS[lv].slug}.html`), ...docs.map((d) => `grammar/${slugOf(d)}.html`), ...(day1 ? [`vocab/${day1.file}`] : [])];
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${BASE_URL}/${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(OUT, '404.html'), pageShell({ title: `Page not found | ${SITE_NAME}`, desc: 'Page not found', body: `<div class="hero"><h1>Page not found</h1><p><a href="index.html" style="color:#fff;">← Back to home</a></p></div>` }));

  console.log(`Built ${docs.length} grammar pages, ${day1 ? 1 : 0} vocab page(s), ${LEVEL_ORDER.length} level pages.`);
}

main();
