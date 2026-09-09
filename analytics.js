/**
 * GA4 측정 태그. build.js 와 inject_ga.js 가 같이 쓴다.
 *
 * 측정 ID 는 여기 한 곳에만 적는다. 바꾸려면 아래 한 줄만 고치면 된다.
 * 빈 문자열이면 태그를 넣지 않는다 — 로컬에서 열어볼 때 통계를 더럽히지 않기 위한 것.
 */
const ANALYTICS_ID = process.env.GA_ID || 'G-XXXXXXXXXX';

function analyticsHtml() {
  if (!ANALYTICS_ID || ANALYTICS_ID === 'G-XXXXXXXXXX') return '';
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ANALYTICS_ID}');</script>`;
}

module.exports = { ANALYTICS_ID, analyticsHtml };
