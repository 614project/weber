# 4. 요소와 내용

[← 3. 판별](03-classification.md) · [목차](../README.md) · 다음: [5. 속성 →](05-attributes.md)

이 장은 요소가 어떤 내용을 갖는지, 그리고 요소를 짧게 만드는 설탕들을 정합니다.

## 4.1 요소의 내용

> 상태: 구현됨

- 요소 문장의 값은 그 요소의 첫 텍스트가 됩니다: `p: "안녕"`.
- 블록 안의 텍스트 문장(`"..."`)과 요소 문장이 차례로 내용이 됩니다.
- **텍스트와 요소 사이에 공백을 넣지 않습니다.** 줄을 나눠 써도 붙어서 출력되므로, 띄어 써야 하면 따옴표 안에 공백을 넣습니다. (JSX 와 같은 규칙입니다. 이유는 [11.4](11-diagnostics-output.md#114-출력-형식)에 있습니다.)

```weber
p { "안녕, "; b: "세상"; "!" }
nav {
    a: "홈"
    " | "
    a: "소개"
}
```

```html
<p>안녕, <b>세상</b>!</p>
<nav><a>홈</a> | <a>소개</a></nav>
```

## 4.2 내용을 가질 수 없는 요소

> 상태: 구현됨

`img` 처럼 내용을 가질 수 없는 요소에 값을 주면, 그 요소의 주요 속성으로 들어갑니다.

| 요소 | 값이 들어가는 곳 |
| --- | --- |
| `img`, `iframe`, `embed`, `source`, `track` | `src` |
| `link`, `base` | `href` |
| `object` | `data` |
| `input` | `type` (input 의 type 이름일 때) |
| `audio`, `video` | 값이 파일이나 URL 모양이면 `src`, 아니면 대체 텍스트 |

`br`, `hr`, `wbr`, `col`, `area`, `meta` 에 값을 주거나, 내용을 가질 수 없는 요소의 블록에 텍스트나 요소를 넣으면 오류입니다. (속성과 CSS 는 넣을 수 있습니다.)

```weber
img: cat.png
input: email
video: intro.mp4
video: "이 브라우저는 동영상을 재생할 수 없습니다"
```

```html
<img src="cat.png"><input type="email"><video src="intro.mp4"></video><video>이 브라우저는 동영상을 재생할 수 없습니다</video>
```

## 4.3 요소 값의 인자

> 상태: 예정

요소의 값에 낱말을 여러 개 쓰면, 각 낱말을 모양에 따라 알맞은 곳에 넣습니다. HTML 여는 태그를 쓰듯 한 줄에 필요한 것을 모두 적을 수 있습니다.

| weber | HTML |
| --- | --- |
| `a "홈" /` | `<a href="/">홈</a>` |
| `a "메일 보내기" hello@weber.dev` | `<a href="mailto:hello@weber.dev">메일 보내기</a>` |
| `a https://weber.dev` | `<a href="https://weber.dev">https://weber.dev</a>` |
| `img cat.png "웃는 고양이" width=320` | `<img src="cat.png" alt="웃는 고양이" width="320">` |
| `input email name=email required "이메일 주소"` | `<input type="email" name="email" required placeholder="이메일 주소">` |
| `label email "이메일"` | `<label for="email">이메일</label>` |
| `option kr "한국"` | `<option value="kr">한국</option>` |
| `button submit "보내기"` | `<button type="submit">보내기</button>` |
| `script app.js defer` | `<script src="app.js" defer></script>` |
| `link style.css` | `<link rel="stylesheet" href="style.css">` |
| `time 2026-10-02 "10월 2일"` | `<time datetime="2026-10-02">10월 2일</time>` |
| `progress 70 100` | `<progress value="70" max="100"></progress>` |

**규칙**

1. 값이 따옴표 문자열 하나뿐이면 [4.1](#41-요소의-내용)·[4.2](#42-내용을-가질-수-없는-요소) 규칙을 씁니다.
2. 그렇지 않으면 값을 **낱말**로 나눕니다. 공백으로 나누되, 따옴표 문자열은 공백이 있어도 한 낱말입니다.
3. 모든 낱말이 아래 중 하나로 풀리면, 각 낱말을 그 자리에 넣습니다. 속성은 낱말의 순서대로 붙습니다.
   - **따옴표 문자열** → 내용. 내용을 가질 수 없는 요소는 **설명 속성**으로 (`img`·`area` → `alt`, `input` → `placeholder`, `iframe` → `title`, `track` → `label`).
   - **`이름=값`** → 속성. 그 요소에 쓸 수 있는 속성, 전역 속성, `data-`·`aria-` 속성일 때만입니다.
   - **불리언 속성 이름** (`required`, `disabled`, `checked`, `defer`, `async` …) → 불리언 속성.
   - **주요 인자** → 요소마다 정해진 주요 속성 (아래 표).
4. 풀리지 않는 낱말이 하나라도 있으면, 값 전체를 하나로 보고 1 의 규칙을 씁니다. 그래서 `p: 안녕하세요 반가워요` 는 지금처럼 텍스트입니다.

**주요 인자**

| 요소 | 받는 낱말 | 들어가는 속성 |
| --- | --- | --- |
| `a`, `area` | URL 모양, 메일 주소 모양 | `href` (메일 주소는 `mailto:` 를 붙임) |
| `img`, `iframe`, `embed`, `audio`, `video`, `track`, `script` | 파일·URL 모양 | `src` |
| `source` | 파일·URL 모양 | `src` (`picture` 안에서는 `srcset`) |
| `link`, `base` | 파일·URL 모양 | `href` (`link` 는 `rel` 도 추측, 아래) |
| `form` | URL 모양 | `action` |
| `object` | 파일·URL 모양 | `data` |
| `input` | input 의 type 이름 | `type` |
| `button` | `submit`, `reset`, `button` | `type` |
| `label`, `output` | 아무 낱말 | `for` |
| `option`, `data` | 아무 낱말 | `value` |
| `time` | 날짜·시간 모양 | `datetime` |
| `meter`, `progress` | 숫자 (두 개면 두 번째는 `max`) | `value` |

- **URL 모양**: `/`, `./`, `../`, `#`, `?` 로 시작하거나, `https:` 같은 스킴이 있거나, `파일.확장자`·`도메인.최상위/경로` 꼴인 낱말.
- **`a` 에 내용이 없으면** 주소를 그대로 내용으로 씁니다(`mailto:` 는 떼고).
- **`link` 의 `rel` 추측**: `.css` 나 글꼴 서비스 URL → `stylesheet`, `.ico`·`.png`·`.svg` → `icon`, `.webmanifest`·`manifest.json` → `manifest`. 추측할 수 없으면 경고합니다.

## 4.4 링크 화살표

> 상태: 예정

`무엇 -> 주소` 는 "무엇"을 링크로 만듭니다. `→` 를 써도 됩니다.

```weber 예정
nav {
    "홈" -> /
    "소개" -> /about
    "GitHub" -> https://github.com/614project/weber
}
```

```html
<nav><a href="/">홈</a><a href="/about">소개</a><a href="https://github.com/614project/weber">GitHub</a></nav>
```

| weber | HTML |
| --- | --- |
| `"문서" -> /docs { class active }` | `<a href="/docs" class="active">문서</a>` |
| `img logo.png "weber" -> /` | `<a href="/"><img src="logo.png" alt="weber"></a>` |
| `.card -> /posts/1 { h3: "첫 글" }` | `<a href="/posts/1"><div class="card"><h3>첫 글</h3></div></a>` |
| `a "소개" -> /about` | `<a href="/about">소개</a>` |

(표 안의 HTML 은 줄바꿈과 들여쓰기를 생략했습니다.)

**규칙**

- 화살표 앞이 텍스트면, 그 텍스트를 내용으로 하는 `a` 를 만듭니다. 블록은 그 `a` 의 것입니다.
- 화살표 앞이 요소 문장이면, 그 요소를 `a` 로 감쌉니다. 블록은 그 요소의 것입니다. 요소가 `a` 자체면 `href` 만 붙입니다.
- 화살표 뒤의 주소는 따옴표 없이 써도 됩니다(공백 전까지). 메일 주소는 `mailto:` 가 붙습니다.

## 4.5 텍스트 줄

> 상태: 예정

`|` 로 시작하는 줄은 따옴표 없는 텍스트입니다. 따옴표, `;`, `{` 같은 글자를 그대로 쓸 수 있습니다.

```weber 예정
p {
    | 그는 "안녕; {반가워}" 라고 말했다.
    | 이어지는 줄은 줄바꿈으로 이어집니다.
}
```

```html
<p>그는 "안녕; {반가워}" 라고 말했다.
이어지는 줄은 줄바꿈으로 이어집니다.</p>
```

- `|` 바로 뒤의 공백 하나는 지웁니다. 나머지는 줄 끝까지 그대로입니다.
- 이스케이프는 없지만 `$이름` 끼워넣기는 됩니다([9.2](09-reuse.md#92-끼워넣기)).
- 이어진 `|` 줄은 줄바꿈으로 이어진 하나의 텍스트입니다.
- 표 안에서는 `|` 줄이 표의 행입니다([4.7](#47-표-설탕)).

## 4.6 목록 설탕

> 상태: 예정

마크다운처럼 목록을 쓸 수 있습니다.

```weber 예정
- 사과
- "바나나" { class yellow }
- 과일 바구니
    - 귤
    - 배
3. 셋째
4. 넷째
```

```html
<ul>
  <li>사과</li>
  <li class="yellow">바나나</li>
  <li>
    과일 바구니
    <ul>
      <li>귤</li>
      <li>배</li>
    </ul>
  </li>
</ul>
<ol start="3">
  <li>셋째</li>
  <li>넷째</li>
</ol>
```

**규칙**

- `- `, `* ` 로 시작하는 문장은 `li` 입니다. `1. `, `1) ` 처럼 번호로 시작하면 번호 목록의 `li` 입니다.
- 부모가 `ul`·`ol`·`menu` 면 그 안의 `li` 가 됩니다. 그 밖에서는 이어진 항목들을 `ul`(번호면 `ol`)로 감쌉니다. 번호 목록이 1 이 아닌 수로 시작하면 `start` 를 붙입니다.
- 표시가 다른 항목(`-` 다음에 `1.`)은 새 목록을 시작합니다.
- 항목의 값은 요소의 값과 같습니다. 따옴표 텍스트, 따옴표 없는 텍스트, [인자](#43-요소-값의-인자), 블록을 쓸 수 있습니다: `- { b: "굵게"; " 설명" }`.
- 바로 위 항목보다 깊게 들여쓴 항목들은 그 항목 안의 목록이 됩니다.

## 4.7 표 설탕

> 상태: 예정

`table`(그리고 `thead`, `tbody`, `tfoot`) 안에서는 `|` 로 행을 씁니다.

```weber 예정
table {
    | 이름 | 나이 |
    |------|-----:|
    | 철수 | 20   |
    | 영희 | 22   |
}
```

```html
<table>
  <thead>
    <tr>
      <th>이름</th>
      <th style="text-align: right">나이</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>철수</td>
      <td style="text-align: right">20</td>
    </tr>
    <tr>
      <td>영희</td>
      <td style="text-align: right">22</td>
    </tr>
  </tbody>
</table>
```

- `|` 와 `|` 사이가 칸입니다. 칸의 앞뒤 공백은 지웁니다. 칸 안의 `|` 는 `\|` 로 씁니다.
- `|---|` 같은 구분 줄이 있으면 그 위의 행은 `thead` 의 `th`, 아래 행은 `tbody` 의 `td` 입니다. 구분 줄이 없으면 모든 행이 `td` 입니다.
- 구분 줄의 `:---` 는 왼쪽, `:---:` 는 가운데, `---:` 는 오른쪽 정렬입니다.
- 행 사이에 보통 문장(`caption: "…"`, CSS 등)을 섞어 쓸 수 있습니다.

## 4.8 문맥에 따른 태그 생략

> 상태: 예정 (1.0 에서는 언제나 `div`)

선택자 축약에서 태그를 생략하면(`.item`), 부모에 따라 알맞은 태그를 씁니다. Emmet 과 같은 규칙입니다.

| 부모 | 생략한 태그 |
| --- | --- |
| `ul`, `ol`, `menu` | `li` |
| `table`, `thead`, `tbody`, `tfoot` | `tr` |
| `tr` | `td` (`thead` 안의 `tr` 이면 `th`) |
| `select`, `datalist`, `optgroup` | `option` |
| `picture`, `audio`, `video` | `source` |
| 글자 수준 요소 (`p`, `span`, `a`, `button`, `label`, `h1`~`h6`, `strong`, `em` …) | `span` |
| SVG 의 컨테이너 | `g` |
| 그 밖 | `div` |

```weber 예정
ul.menu {
    .item: "커피"
    .item.hot: "핫초코"
}
p { "가격 "; .price: "5,000원" }
```

```html
<ul class="menu">
  <li class="item">커피</li>
  <li class="item hot">핫초코</li>
</ul>
<p>가격 <span class="price">5,000원</span></p>
```

## 4.9 자동으로 감싸기

> 상태: 예정

있어야 할 부모 없이 쓴 요소는 알맞은 부모로 감쌉니다. 이어진 형제들은 하나의 부모로 감쌉니다.

| 흩어진 요소 | 감싸는 요소 |
| --- | --- |
| `li` | `ul` |
| `tr` | `table` |
| `td`, `th` | `tr` (그 바깥이 표가 아니면 `table` 까지) |
| `option`, `optgroup` | `select` |
| `dt`, `dd` | `dl` |

```weber 예정
section {
    h2: "할 일"
    li: "장보기"
    li: "운동"
}
```

```html
<section>
  <h2>할 일</h2>
  <ul>
    <li>장보기</li>
    <li>운동</li>
  </ul>
</section>
```

- 부모가 이미 알맞으면 감싸지 않습니다.
- **조각의 최상위에서는 감싸지 않습니다.** 자바스크립트로 기존 목록에 끼워 넣을 조각일 수 있기 때문입니다.
- `@set wrap off` 로 끌 수 있습니다.

## 4.10 원본 HTML

> 상태: 예정

weber 로 옮기기 번거로운 HTML(동영상 삽입 코드 등)은 그대로 쓸 수 있습니다.

- `<` 로 시작하는 줄은 줄 끝까지 원본 HTML 입니다. 이어진 `<` 줄들은 하나로 묶습니다.
- 여러 줄 HTML 은 `raw` 에 문자열로 줍니다: `raw: "…"`, 또는 들여쓰기 블록 `raw:`.
- 원본 HTML 은 판별, 이스케이프, 끼워넣기를 하지 않습니다. 출력할 때는 블록 요소처럼 앞뒤에서 줄을 바꿉니다.

```weber 예정
div.video {
    <iframe src="https://www.youtube.com/embed/xyz" allowfullscreen></iframe>
    p: "영상 설명"
}
```

```html
<div class="video">
  <iframe src="https://www.youtube.com/embed/xyz" allowfullscreen></iframe>
  <p>영상 설명</p>
</div>
```

## 4.11 마크다운

> 상태: 예정

글이 많은 부분은 마크다운으로 쓸 수 있습니다.

- `md: "…"` — 한 줄. 부모가 글자를 담는 요소(`p`, `li`, `td`, `h1` …)면 `<p>` 없이 인라인으로 넣습니다.
- `md:` 들여쓰기 블록, 또는 블록 문자열 — 여러 줄. 블록 수준 마크다운입니다. 들여쓰기 블록은 내용을 그대로 읽으므로 `` ` `` 를 이스케이프하지 않아도 됩니다.
- `@include "글.md"` — 파일([9.6](09-reuse.md#96-파일-나누기)).

```weber 예정
article {
    md:
        # 설치
        weber 는 **Node.js 20** 이상에서 동작합니다.

        - 저장소를 받습니다
        - `npm install` 을 실행합니다
}
p { md: "이 글은 [weber](https://weber.dev) 로 만들었습니다." }
```

```html
<article>
  <h1 id="설치">설치</h1>
  <p>weber 는 <strong>Node.js 20</strong> 이상에서 동작합니다.</p>
  <ul>
    <li>저장소를 받습니다</li>
    <li><code>npm install</code> 을 실행합니다</li>
  </ul>
</article>
<p>이 글은 <a href="https://weber.dev">weber</a> 로 만들었습니다.</p>
```

- 지원 범위: CommonMark 의 기본 문법(제목, 문단, 강조, 코드, 링크, 그림, 목록, 인용, 구분선)과 GFM 의 표.
- 제목에는 글자로 만든 `id` 를 붙입니다(같은 id 가 있으면 `-2`, `-3` …).
- 마크다운 안의 HTML 은 그대로 출력합니다.
