# weber

HTML 파일로 컴파일되는, 간결한 문법의 웹 언어입니다.
`key { ... }` 와 `key: value` 를 쌓아 올리기만 하면, 그것이 HTML 요소인지, CSS 인지, 자바스크립트인지는 weber 가 알아서 판별합니다.

**[소개 사이트](https://614project.github.io/weber/)** · **[플레이그라운드](https://614project.github.io/weber/playground.html)** — 설치 없이 브라우저에서 바로 써 볼 수 있습니다.

```weber
head {
    title: "weber"
}
body {
    h1: "hello world!"
}
```

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>weber</title>
  </head>
  <body>
    <h1>hello world!</h1>
  </body>
</html>
```

## 목차

- [목적과 특징](#목적과-특징)
- [설치와 사용법](#설치와-사용법)
- [문법](#문법)
- [자동 판별 규칙](#자동-판별-규칙)
- [CSS](#css)
- [자바스크립트](#자바스크립트)
- [문서 구조 자동 완성](#문서-구조-자동-완성)
- [SVG 와 MathML](#svg-와-mathml)
- [출력 형식](#출력-형식)
- [오류와 경고](#오류와-경고)
- [개발](#개발)

## 목적과 특징

HTML 보다 더 간결한 문법으로 웹사이트를 구성하기 위한 언어입니다.

weber 에서는 HTML 태그의 속성, 스타일, 자바스크립트, 콘텐츠를 구분해서 쓰지 않습니다.
예를 들어 HTML 에서는 이렇게 작성하는 코드를

```html
<div class="weber" style="font-size: 1rem">
  <p>614project</p>
  <button onclick="alert('hello')">click me!</button>
  <script>
    console.log("hello world!")
  </script>
</div>
```

weber 에서는 다음과 같이 작성합니다.

```weber
div {
    class weber
    font-size 1rem
    p: "614project"
    button {
        "click me!"
        onclick {
            alert('hello')
        }
    }
    script {
        console.log("hello world!")
    }
}
```

`class` 는 HTML 속성, `font-size` 는 CSS, `p` 와 `button` 은 요소, `onclick` 은 이벤트, `script` 는 자바스크립트입니다.
weber 컴파일러가 각 줄이 무엇인지 판단해서 알맞은 곳에 넣어 주기 때문에 이렇게 쓸 수 있습니다.

## 설치와 사용법

Node.js 20 이상이 필요합니다.

```sh
git clone https://github.com/614project/weber.git
cd weber
npm install        # 설치하면서 자동으로 빌드됩니다
npm link           # (선택) weber 명령을 어디서나 쓰기
```

### 명령줄

```sh
weber index.weber                # index.html 을 만듭니다
weber index.weber -o out.html    # 출력 파일 지정
weber src -o dist                # 폴더 안의 모든 .weber 파일을 dist 로 (폴더 구조 유지)
weber index.weber --stdout       # 결과를 화면으로
cat index.weber | weber -        # 표준 입력 → 표준 출력
weber src -o dist --watch        # 저장할 때마다 다시 변환
```

| 옵션 | 설명 |
| --- | --- |
| `-o`, `--out <경로>` | 출력 파일 또는 폴더 |
| `--stdout` | 결과를 표준 출력으로 내보냄 |
| `-w`, `--watch` | 파일이 바뀔 때마다 다시 변환 |
| `-m`, `--minify` | 줄바꿈과 들여쓰기 없이 압축 |
| `--indent <n>` | 들여쓰기 칸 수 (기본값 2, `tab` 가능) |
| `--document` | 항상 `<!DOCTYPE html>` 로 시작하는 전체 문서로 출력 |
| `--fragment` | 쓴 내용만 출력 (doctype, head, body 를 만들지 않음) |
| `-q`, `--quiet` | 경고 숨기기 |

`npm link` 를 하지 않았다면 `node dist/src/cli.js` 또는 `npx weber` 로 실행할 수 있습니다.

### 자바스크립트 API

```js
import { compile } from 'weber';

const { html, warnings } = compile('body {\n  h1: "안녕"\n}', {
  filename: 'index.weber', // 오류 메시지에 표시할 이름
  mode: 'auto',            // 'auto' | 'document' | 'fragment'
  minify: false,
  indent: 2,
});
```

문법 오류가 있으면 `WeberError` 를 던집니다. `line`, `column`, `frame`(오류 위치를 표시한 코드 조각) 속성이 있습니다.
`classifications` 에는 각 키를 무엇(`element`, `attribute`, `css`, `js`)으로 판별했는지가 소스 위치와 함께 들어 있어, 편집기에서 색을 칠하는 데 쓸 수 있습니다.
컴파일러 본체는 Node.js 전용 기능을 쓰지 않으므로 브라우저에서도 동작합니다.

## 문법

weber 파일(`.weber`)은 **문장**을 한 줄에 하나씩 쌓아 올린 것입니다. 문장은 네 가지 모양 중 하나입니다.

| 모양 | 예 | 뜻 |
| --- | --- | --- |
| `키 { ... }` | `div { ... }` | 블록. 안에 문장을 더 쌓습니다 |
| `키: 값` 또는 `키 값` | `p: "안녕"`, `color red` | 키와 값 (두 표기는 완전히 같습니다) |
| `키` | `hr`, `required` | 값이 없는 키 |
| `"텍스트"` | `"click me!"` | 텍스트 |

한 줄에 여러 문장을 쓰려면 `;` 로 구분합니다. 값과 블록을 함께 쓸 수도 있습니다.

```weber
p { "안녕, "; b: "세상"; "!" }
a: "홈" { href / }
```

```html
<p>안녕, <b>세상</b>!</p>
<a href="/">홈</a>
```

### 값

값은 줄 끝(또는 괄호 밖의 `;`, `}`)까지입니다. 따옴표로 감싸면 따옴표가 벗겨집니다.
CSS 값은 예외로, `font-family "Noto Sans KR", sans-serif` 처럼 따옴표를 그대로 둡니다.

```weber
div {
    title 따옴표 없이도 됩니다
    data-note "따옴표로 감싸도 됩니다"
    font-family "Noto Sans KR", sans-serif
}
```

```html
<div title="따옴표 없이도 됩니다" data-note="따옴표로 감싸도 됩니다" style='font-family: "Noto Sans KR", sans-serif'></div>
```

`;`, `{`, `}` 같은 특수문자나 `//` 로 시작하는 값은 따옴표로 감싸세요.

### 텍스트

텍스트는 `"큰따옴표"` 나 `'작은따옴표'` 로 감쌉니다. `\n`, `\t`, `\"`, `\u{1F600}` 같은 이스케이프를 쓸 수 있고,
여러 줄 텍스트는 `` `백틱` `` 으로 감쌉니다. 텍스트 안의 `<`, `>`, `&` 는 자동으로 이스케이프됩니다.

여는 백틱 바로 뒤에서 줄을 바꾸면 **블록 문자열**이 되어, 첫 줄바꿈과 마지막 빈 줄, 공통 들여쓰기가 제거됩니다.
코드 예제를 들여쓰기를 망가뜨리지 않고 담을 때 편리합니다.

```weber
pre {
    `
    첫 줄
        들여쓴 줄
    `
}
```

```html
<pre>첫 줄
    들여쓴 줄</pre>
```

### 주석

```weber
// 한 줄 주석
/* 여러 줄
   주석 */
p: "안녕" // 줄 끝 주석
```

값 안에서는 공백 뒤의 `//` 만 주석으로 봅니다. 그래서 `href https://example.com` 은 주석이 아닙니다.

### 선택자 축약

CSS 선택자처럼 키에 `.클래스`, `#아이디`, `[속성=값]` 을 붙일 수 있습니다. 태그를 생략하면 `div` 입니다.

```weber
a.btn.primary#go[href="/next"][target=_blank]: "다음"
.card { "카드" }
input[type=checkbox][checked]
```

```html
<a id="go" class="btn primary" href="/next" target="_blank">다음</a>
<div class="card">카드</div>
<input type="checkbox" checked>
```

## 자동 판별 규칙

**블록 `{ }` 이 붙은 키는 언제나 요소입니다.** (`script`, `style`, `on...` 은 예외로, 블록 안을 각각 JS/CSS 로 읽습니다.)
블록이 없는 문장은 다음 순서로 판별합니다.

1. `on` 으로 시작하는 키 (`onclick`, `oninput` …) → **JS 이벤트**
2. `--` 나 벤더 접두사(`-webkit-` …)로 시작하는 키 → **CSS**, `data-` / `aria-` 로 시작하는 키 → **HTML 속성**
3. 감싸는 요소의 **전용 속성** → **HTML 속성** (`meta` 의 `content`, `option` 의 `label`, `col` 의 `span` …)
4. HTML 요소 이름 → **요소** (`p`, `h1`, `li`, `img` …)
5. CSS 속성 이름 → **CSS** (`color`, `display`, `grid-template-columns` …)
6. HTML 속성 이름 → **HTML 속성** (`class`, `id`, `href`, `hidden` …)
7. 그 밖의 모르는 이름 → **HTML 속성** (`hx-get`, `x-show` 같은 라이브러리용 속성을 쓸 수 있도록)

이름이 겹치는 경우는 위치와 값의 모양을 봅니다.

| 키 | 요소/CSS 가 되는 경우 | 속성이 되는 경우 |
| --- | --- | --- |
| `title` | `head` 안 (또는 문서 최상위) → `<title>` | 그 밖의 요소 안 → `title=""` |
| `width`, `height` | 단위가 있는 값 (`100px`, `50%`) → CSS | `img`, `canvas`, `video` 등에 정수 → 속성 |
| `content` | → CSS | `meta` 안 → 속성 |
| `label`, `form`, `span` | → 요소 | `option`, `input`, `col` 등 안 → 속성 |
| `cite` | URL 이 아닌 값 → `<cite>` | `blockquote`, `q` 안의 URL → 속성 |
| `translate` | → CSS | `yes` / `no` → 속성 |

```weber
img {
    src cat.png
    width 100
    border-radius 8px
}
blockquote {
    cite https://example.com
    "인용문"
    cite: "누군가"
}
```

```html
<img src="cat.png" width="100" style="border-radius: 8px">
<blockquote cite="https://example.com">인용문<cite>누군가</cite></blockquote>
```

원하는 대로 판별되지 않으면 이렇게 강제할 수 있습니다.

- 요소로: 블록을 붙입니다 → `title { "제목" }`, `label { "이름" }`
- 속성으로: 선택자 축약을 씁니다 → `div[title="설명"]`
- 인라인 스타일로: `style: "width: 100px"`

### 값이 없을 때, 값이 특별할 때

- 값이 없는 요소 이름은 빈 요소 (`hr` → `<hr>`), 속성 이름은 불리언 속성 (`required` → `required`) 입니다.
- 불리언 속성(`checked`, `disabled`, `hidden` …)에 `false` 를 주면 속성이 빠지고, `true` 를 주면 이름만 남습니다.
- 내용을 가질 수 없는 요소에 값을 주면 알맞은 속성으로 들어갑니다.

```weber
img: cat.png
input: email
video: intro.mp4
option { "B"; selected false; disabled true }
```

```html
<img src="cat.png"><input type="email"><video src="intro.mp4"></video>
<option disabled>B</option>
```

`img`, `iframe`, `embed`, `source`, `track` → `src`, `link`, `base` → `href`, `object` → `data`,
`input` → `type`, `audio`, `video` → 값이 파일이나 URL 처럼 보이면 `src`, 아니면 대체 텍스트입니다.

## CSS

### 인라인 스타일

요소 안에 쓴 CSS 속성은 그 요소의 `style` 속성이 됩니다.

### style 블록

`style { }` 안에는 CSS 를 그대로 써도 되고, 쌍점과 세미콜론을 생략한 weber 식으로 써도 됩니다.
Sass 처럼 규칙을 중첩할 수 있으며, 결과는 평범한 CSS 로 펼쳐집니다.

```weber
style {
    .card, .box {
        padding 1rem
        h3 { margin 0 }
        &.active { color red }
        :hover { color blue }
        @media (max-width: 600px) {
            padding .5rem
        }
    }
}
```

```html
<style>
  .card, .box {
    padding: 1rem;
  }
  .card h3, .box h3 {
    margin: 0;
  }
  .card.active, .box.active {
    color: red;
  }
  .card:hover, .box:hover {
    color: blue;
  }
  @media (max-width: 600px) {
    .card, .box {
      padding: .5rem;
    }
  }
</style>
```

- `&` 는 바깥 선택자로 바뀝니다. `:` 로 시작하는 선택자(`:hover`, `::before`)는 바깥 선택자에 바로 붙고, 그 밖의 선택자는 자손 선택자가 됩니다.
- `@media`, `@supports`, `@container`, `@layer` 는 규칙 안에 중첩할 수 있고, `@keyframes`, `@font-face`, `@import` 도 쓸 수 있습니다. `@import` 는 자동으로 맨 앞으로 옮겨집니다.
- `style: theme.css` 처럼 CSS 파일이나 URL 을 값으로 주면 `<link rel="stylesheet">` 가 됩니다.

### 요소 안의 :hover, @media

요소 안에 `:`, `&`, `@` 로 시작하는 블록을 쓰면 **그 요소에만** 적용되는 규칙이 됩니다.
weber 가 요소에 클래스(아이디가 있으면 아이디)를 붙이고 규칙을 스타일시트로 옮깁니다.
이때 요소에 직접 쓴 스타일도 함께 옮겨서, `:hover` 와 `@media` 가 제대로 덮어쓸 수 있게 합니다.

```weber
button {
    "확인"
    background white
    :hover { background yellow }
    @media (max-width: 600px) { width 100% }
}
```

```html
<style>
  .weber-1 {
    background: white;
  }
  .weber-1:hover {
    background: yellow;
  }
  @media (max-width: 600px) {
    .weber-1 {
      width: 100%;
    }
  }
</style>
<button class="weber-1">확인</button>
```

전체 문서를 만들 때는 이 스타일시트가 `<head>` 끝에 들어갑니다.

## 자바스크립트

### 이벤트

`on` 으로 시작하는 키는 이벤트입니다. 한 줄로 쓰면 줄 끝까지(세미콜론 포함)가 코드이고, 블록으로 쓰면 블록 전체가 코드입니다.

```weber
button {
    "+1"
    onclick: count++; render()
    onmouseenter {
        this.classList.add('hover')
    }
}
```

```html
<button onclick="count++; render()" onmouseenter="this.classList.add('hover')">+1</button>
```

### script

`script { }` 블록 안의 코드는 손대지 않고 그대로 출력합니다. (들여쓰기만 정리합니다.)
문자열, 템플릿 리터럴, 정규식, 주석 안의 중괄호도 정확히 구분합니다.

```weber
script: app.js
script[type=module]: ./main.mjs
script: https://unpkg.com/htmx.org@2
script {
    document.title = "안녕"
}
```

```html
<script src="app.js"></script>
<script type="module" src="./main.mjs"></script>
<script src="https://unpkg.com/htmx.org@2"></script>
<script>
  document.title = "안녕"
</script>
```

값이 `.js` 파일이나 URL 이면 `src` 가 되고, 아니면 코드가 됩니다. 다른 속성은 선택자 축약(`script[type=module]`)으로 줍니다.

## 문서 구조 자동 완성

최상위에 `html`, `head`, `body`, `title`, `meta`, `link`, `charset`, `viewport`, `icon` 중 하나라도 있으면
`<!DOCTYPE html>` 로 시작하는 전체 문서를 만듭니다. (없으면 쓴 내용만 출력합니다. `--document`, `--fragment` 로 정할 수도 있습니다.)

전체 문서에서는 `head` 와 `body` 를 생략해도 됩니다. 최상위 문장은 HTML 처럼 알맞은 곳으로 들어갑니다.

- `title`, `meta`, `link`, `style`, `base` → `<head>`
- `charset 값` → `<meta charset>`, `viewport`, `description`, `keywords`, `author`, `theme-color` 등 → `<meta name content>`, `icon 값` → `<link rel="icon">`
- `script` → 본문이 시작되기 전이면 `<head>`, 아니면 `<body>`
- `lang`, `class` 같은 속성과 CSS → `<html>`
- 그 밖의 요소와 텍스트 → `<body>`
- `<meta charset>` 이 없으면 `<meta charset="utf-8">` 을 넣습니다.

```weber
lang ko
title: "내 페이지"
viewport "width=device-width, initial-scale=1"
style: style.css

h1: "안녕하세요"
script: app.js
```

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <title>내 페이지</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <h1>안녕하세요</h1>
    <script src="app.js"></script>
  </body>
</html>
```

`head { }` 안에서는 모르는 이름도 `<meta name content>` 로 처리합니다.
Open Graph 처럼 `property` 를 쓰는 메타 태그는 `meta[property="og:title"][content="제목"]` 으로 씁니다.

## SVG 와 MathML

`svg` 와 `math` 안에서는 SVG/MathML 요소와 속성을 기준으로 판별합니다.
`path`, `polygon`, `polyline`, `use`, `image` 에 값을 주면 각각 `d`, `points`, `href` 가 됩니다.

```weber
svg {
    width 24
    height 24
    viewBox "0 0 24 24"
    circle { cx 12; cy 12; r 10; fill tomato }
    path: "M7 12h10"
}
```

```html
<svg width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" fill="tomato" />
  <path d="M7 12h10" />
</svg>
```

## 출력 형식

weber 는 **화면에 보이는 결과가 바뀌지 않는 곳에만** 줄바꿈과 들여쓰기를 넣습니다.
`div`, `p`, `li` 같은 블록 요소 주변에서는 줄을 바꾸지만, 텍스트와 `a`, `span`, `b` 같은 인라인 요소 사이에는 공백을 넣지 않습니다.
그래서 줄을 나눠 써도 서로 붙어서 출력됩니다. 띄어 쓰려면 따옴표 안에 공백을 넣으세요.

```weber
nav {
    a: "홈"
    " | "
    a: "소개"
}
```

```html
<nav><a>홈</a> | <a>소개</a></nav>
```

`--minify` 를 주면 줄바꿈과 들여쓰기 없이 출력합니다.

## 오류와 경고

문법 오류는 위치와 함께 알려 줍니다.

```text
weber 오류: 문자열이 닫히지 않았습니다. 여러 줄 텍스트는 백틱(`)으로 감싸세요. (index.weber:2:8)
 1 | body {
 2 |     p: "안녕
   |        ^
```

변환은 되지만 실수로 보이는 곳은 경고합니다. 오타에는 비슷한 이름을 제안합니다.

```text
경고: 알 수 없는 이름 'font-szie'을(를) HTML 속성으로 처리했습니다. 혹시 'font-size'인가요? (index.weber:3:5)
경고: 'href'은(는) <div> 요소에서 쓰이지 않는 속성입니다. (index.weber:4:5)
```

## 예제

[`examples`](examples) 폴더에 소개 페이지와 할 일 목록 예제가 있습니다. `npm run examples` 로 변환해 볼 수 있습니다.

## 소개 사이트와 플레이그라운드

[`introduce`](introduce) 폴더는 weber 로 만든 weber 소개 사이트입니다. 페이지는 `.weber` 로 쓰여 있고,
플레이그라운드는 브라우저에서 weber 컴파일러를 그대로 불러와 입력할 때마다 변환합니다.
편집기의 키 색깔은 컴파일러가 각 키를 무엇으로 판별했는지(`classifications`)를 그대로 보여 줍니다.

```sh
npm run site         # _site/ 로 빌드
npm run site:serve   # 빌드 후 http://localhost:8080 에서 보기
```

`main` 브랜치에 올라오면 GitHub Actions(`.github/workflows/pages.yml`)가 테스트, 빌드 후 GitHub Pages 에 배포합니다.
처음 한 번은 저장소의 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 바꿔야 합니다.

## 개발

```sh
npm install
npm run build   # src → dist
npm test        # 테스트 (README 의 weber → html 예제도 실제로 변환해서 비교합니다)
```

| 파일 | 역할 |
| --- | --- |
| `src/parser.ts` | 소스 코드 → 구문 트리 |
| `src/classify.ts` | 각 문장이 요소/속성/CSS/JS 중 무엇인지 판별 |
| `src/transform.ts` | 구문 트리 → HTML 요소 트리 (문서 구조 완성, 요소 범위 CSS) |
| `src/css.ts` | 중첩 CSS 펼치기와 출력 |
| `src/printer.ts` | HTML 요소 트리 → 문자열 |
| `src/js-scanner.ts` | 자바스크립트 블록의 끝 찾기 |
| `src/data/` | HTML 요소·속성, CSS 속성 목록 |
| `src/cli.ts` | 명령줄 도구 |
| `introduce/` | weber 로 만든 소개 사이트와 플레이그라운드 |
| `scripts/build-site.mjs` | 소개 사이트 빌드 (`_site/`) |

## 앞으로 할 일

- 다른 `.weber` 파일 불러오기 (머리글·바닥글 재사용)
- 반복되는 구조를 위한 컴포넌트
- 편집기 문법 강조
