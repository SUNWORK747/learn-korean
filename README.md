# Sunshine Korean — 문법·어휘 블로그

`한국어 학습자료`의 문법(117편)·어휘 문서를 **무료 미리보기 블로그**로 변환해 GitHub Pages에 배포하는 프로젝트.

- 라이브: https://sunwork747.github.io/learn-korean/
- 판매(전체판 PDF): https://sunshinework.gumroad.com

## 구조

- `build.js` — 빌드 스크립트 (Node, 의존성 없음). `../한국어 학습자료`의 원본 HTML을 읽어 `docs/`에 간략화 페이지를 생성한다.
- `docs/` — GitHub Pages 소스 (커밋됨). 원본 전체판은 절대 커밋하지 않는다 — 유료 상품이다.

## 간략화 규칙 (문법)

원본의 4개 섹션 중:

| 섹션 | 처리 |
|---|---|
| 1 Concept Introduction | 전체 유지 |
| 2 Concept Explanation | 첫 소단원(2.1 형태 규칙)만 유지, 나머지는 CTA에 목록으로 표시 |
| 3 Examples | 첫 소단원(3.1)만 유지 |
| 4 Practice + Answer Key | 전체 삭제 |

잘린 자리에 Gumroad CTA 박스 삽입. 개별 상품이 있는 편(`gumroad_products.json`의 grammar 트랙)은 해당 상품으로, 없으면 스토어로 연결.

어휘는 앞 10단어만 남기고 CTA. 카테고리 분류는 `문법/목차.md`가 기준.

## 갱신 방법

원본 문서가 추가/수정되면:

```
node build.js
git add -A && git commit -m "rebuild" && git push
```

푸시하면 1~2분 내에 사이트에 반영된다.
