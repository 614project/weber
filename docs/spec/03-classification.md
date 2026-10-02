# 3. 판별

[← 2. 기본 문법](02-syntax.md) · [목차](../README.md) · 다음: [4. 요소와 내용 →](04-content.md)

weber 의 키 문장은 쓰는 사람이 종류를 밝히지 않습니다. 이 장은 weber 가 각 문장을 무엇으로 볼지 정하는 규칙, 곧 **판별** 규칙을 정합니다.

## 3.1 판별이 하는 일

> 상태: 구현됨

키 문장은 다음 중 하나가 됩니다.

| 판별 결과 | 출력 |
| --- | --- |
| 요소 | `<태그>` 요소 |
| 속성 | 감싸는 요소의 HTML 속성 |
| CSS | 감싸는 요소의 스타일 (인라인 스타일 또는 요소 범위 규칙) |
| JS | 감싸는 요소의 이벤트 처리기, 또는 `<script>` |
| 변환 시점 | 지시문, 변수, 컴포넌트. 그 자체로 출력되지 않고 변환 방식을 바꿉니다 (예정) |

판별은 문장의 **키**, **값의 모양**, **블록이 있는지**, 그리고 **문맥**으로 정해집니다.

## 3.2 문맥

> 상태: 구현됨

| 문맥 | 뜻 |
| --- | --- |
| 부모 요소 | 문장을 감싸는 요소. 판별의 가장 중요한 단서입니다 |
| 이름공간 | HTML, SVG(`svg` 안), MathML(`math` 안). `foreignObject` 안은 다시 HTML 입니다 |
| head 문맥 | `head` 블록 안 |
| 문서 최상위 | 전체 문서를 만들 때의 최상위. `html` 요소 안으로 보고, head 문맥의 규칙을 함께 씁니다 ([8.3](08-document.md#83-최상위-문장의-자리)) |
| 조각 최상위 | 조각을 만들 때의 최상위. 부모가 없으므로 속성과 CSS 는 쓸 수 없습니다 (오류) |

## 3.3 블록이 붙은 문장

> 상태: 구현됨 (표의 일부는 예정)

**블록이 붙은 키는 요소입니다.** 속성이나 CSS 속성은 블록을 가질 수 없기 때문입니다. 단, 다음 키는 블록의 내용을 다르게 읽습니다.

| 키 | 블록의 내용 | 결과 | 상태 |
| --- | --- | --- | --- |
| `script` | 자바스크립트 | `<script>` | 구현됨 |
| `on…` (`onclick` 등) | 자바스크립트 | 이벤트 처리기 | 구현됨 |
| `style` | CSS | `<style>` | 구현됨 |
| `:…`, `&…`, `@media` 등 | CSS | 요소 범위 규칙 | 구현됨 |
| `@` + 이벤트 이름 (`@click`) | 자바스크립트 | 이벤트 처리기 | 예정 |
| `module` | 자바스크립트 | `<script type="module">` | 예정 |
| `css` | CSS | 요소 범위 CSS | 예정 |
| `raw` | 문자열 | 원본 HTML | 예정 |
| `md` | 문자열 | 마크다운 | 예정 |
| `-` 로 끝나는 이름 (`font-`, `data-`) | 문장 | 접두사 묶음 | 예정 |
| 상태 이름 (`hover`, `focus` …) | CSS | 상태 규칙 | 예정 |
| 정의한 컴포넌트 이름 | 문장 | 컴포넌트 | 예정 |

그 밖의 키는 요소입니다. 알려진 요소가 아니면 경고합니다. 다만 이름에 `-` 가 있으면 사용자 정의 요소로 보고 경고하지 않습니다.

```weber
div {
    title { "블록을 붙이면 title 도 요소입니다" }
    my-card { "사용자 정의 요소" }
}
```

```html
<div>
  <title>블록을 붙이면 title 도 요소입니다</title>
  <my-card>사용자 정의 요소</my-card>
</div>
```

## 3.4 지시문과 at-문장

> 상태: 표의 각 줄에 적혀 있습니다

`@` 로 시작하는 문장은 다음 순서로 봅니다.

| 모양 | 뜻 | 상태 |
| --- | --- | --- |
| `@include`, `@use`, `@component`, `@slot`, `@each`, `@if`, `@else`, `@set` | 지시문 | 예정 |
| `@` + DOM 이벤트 이름 (`@click`, `@submit` …) | 이벤트 처리기 ([7.2](07-javascript.md#72-이벤트-줄임)) | 예정 |
| `@mobile`, `@dark` 같은 반응형 별칭 | 미디어 규칙 ([6.9](06-css.md#69-반응형-별칭)) | 예정 |
| 그 밖의 `@이름 … { }` | CSS at-규칙 (`@media`, `@supports`, `@container` …) | 구현됨 |

## 3.5 블록이 없는 문장의 판별 순서

> 상태: 구현됨 (단계 1, 3 과 단계 2, 5, 11 의 일부는 예정)

블록이 없는 문장은 아래 순서대로 보고, 처음 들어맞는 단계에서 정합니다.

| 단계 | 조건 | 결과 | 상태 |
| --- | --- | --- | --- |
| 1 | `$이름` / 정의한 컴포넌트 이름 | 변수 선언 / 컴포넌트 | 예정 |
| 2 | `on` + 영문자 (`onclick`) / `@` + 이벤트 이름 | JS 이벤트 | 구현됨 / 예정 |
| 3 | `키=값` 표기 | 속성 | 예정 |
| 4 | `--`, `-webkit-` 같은 접두사 / `data-`, `aria-` | CSS / 속성 | 구현됨 |
| 5 | 특수 키: `script`, `style` / `module`, `raw`, `md`, `layout` | 각 장의 규칙 | 구현됨 / 예정 |
| 6 | head 문맥과 문서 최상위의 head 이름 | head 요소, `<meta>`, `<link>` | 구현됨 |
| 7 | SVG·MathML 문맥 | 그 이름공간의 속성 → 요소 → CSS | 구현됨 |
| 8 | 부모 요소 전용 속성 (값의 모양 조건 포함) | 속성 | 구현됨 |
| 9 | 요소 안의 `title`, `slot` | 속성 | 구현됨 |
| 10 | HTML 요소 이름 | 요소 | 구현됨 |
| 11 | CSS 속성 이름 / CSS 별칭 (`bg`, `size` …) | CSS | 구현됨 / 예정 |
| 12 | HTML 속성 이름 | 속성 | 구현됨 |
| 13 | 그 밖의 이름 | 속성 (경고) | 구현됨 |

### 단계별 설명

**단계 4 · 접두사.** `--` 로 시작하는 이름은 CSS 사용자 정의 속성, `-webkit-`·`-moz-`·`-ms-`·`-o-` 로 시작하는 이름은 벤더 접두사 CSS 입니다. `data-`·`aria-` 로 시작하는 이름은 속성입니다.

**단계 6 · head 이름.** head 문맥과 문서 최상위에서는 다음 이름을 먼저 봅니다. 자세한 것은 [8.6](08-document.md#86-head-설탕)에 있습니다.

- head 요소 이름(`title`, `meta`, `link`, `base`, `style`, `script` …) → 요소
- `charset 값` → `<meta charset>`
- 메타 이름(`viewport`, `description`, `keywords`, `author`, `theme-color` …) → `<meta name content>`
- `icon 값` → `<link rel="icon">`
- `head` 블록 안의 모르는 이름 → `<meta name content>` (메타 이름은 종류가 끝없이 많으므로)

**단계 8 · 부모 요소 전용 속성.** 감싸는 요소에만 있는 속성이 가장 먼저입니다. `meta` 안의 `content`, `option` 안의 `label`, `col` 안의 `span`, `input` 안의 `size` 가 그렇습니다.
이름이 CSS 와 겹치는 일부 속성은 **값의 모양**이 맞을 때만 속성입니다.

| 속성 | 요소 | 속성이 되는 값 |
| --- | --- | --- |
| `width`, `height` | `img`, `canvas`, `video`, `iframe`, `embed`, `object`, `input`, `source` | 단위 없는 정수 (`120`) |
| `border` | `table` | 단위 없는 정수 |
| `cite` | `blockquote`, `q`, `del`, `ins` | URL 모양 |

**단계 9 · title 과 slot.** 둘 다 요소 이름이면서 전역 속성입니다. 요소 안에서는 속성이고, head 문맥과 조각 최상위에서는 요소입니다. SVG 안의 `title` 은 SVG 요소입니다.

**단계 11 · CSS.** `translate` 는 값이 `yes`·`no` 이면 HTML 속성, 그 밖에는 CSS 입니다. [CSS 별칭](06-css.md#65-별칭)(예정)도 이 단계에서 정합니다. 부모 요소 전용 속성(단계 8)이 먼저이므로 `input { size 20 }` 은 별칭이 아니라 input 의 속성입니다.

**단계 12 · HTML 속성.** 전역 속성(`class`, `id`, `hidden` …)은 어디서든 속성입니다. 다른 요소 전용 속성(`div` 안의 `href`)도 속성으로 출력하되 경고합니다.

**단계 13 · 모르는 이름.** 속성으로 출력하고 경고합니다. 비슷한 이름이 있으면 함께 알려 줍니다("혹시 'font-size'인가요?").
이름에 `-` 가 있고 비슷한 이름이 없으면 라이브러리용 속성(`hx-get`, `x-data`)으로 보고 경고하지 않습니다.

### 예

```weber
img {
    src cat.png          // 단계 8: img 전용 속성
    width 120            // 단계 8: 정수이므로 속성
    height 50%           // 단계 11: 단위가 있으므로 CSS
    title 고양이          // 단계 9: 요소 안의 title
    data-id 7            // 단계 4: data- 접두사
    --ratio 1.5          // 단계 4: -- 접두사
}
```

```html
<img src="cat.png" width="120" style="height: 50%; --ratio: 1.5" title="고양이" data-id="7">
```

```weber
head {
    title: "제목"
    charset utf-8
    viewport "width=device-width"
    theme-color "#6c4cf1"
    rating general
}
```

```html
<!DOCTYPE html>
<html>
  <head>
    <title>제목</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <meta name="theme-color" content="#6c4cf1">
    <meta name="rating" content="general">
  </head>
  <body></body>
</html>
```

```weber
svg {
    viewbox "0 0 24 24"
    circle { cx 12; cy 12; r 10; fill tomato }
    path: "M7 12h10"
}
```

```html
<svg viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" fill="tomato" />
  <path d="M7 12h10" />
</svg>
```

## 3.6 이름이 겹칠 때

> 상태: 구현됨 (표의 일부는 예정)

| 이름 | 요소/CSS 가 되는 경우 | 속성이 되는 경우 |
| --- | --- | --- |
| `title` | head 안, 문서·조각 최상위 → `<title>` | 그 밖의 요소 안 |
| `width`, `height` | 단위가 있는 값 → CSS | `img` 등에 단위 없는 정수 |
| `content` | → CSS | `meta` 안 |
| `label`, `form`, `span` | → 요소 | `option`·`input`·`col` 등 안 |
| `cite` | URL 이 아닌 값 → `<cite>` | `blockquote`·`q` 안의 URL |
| `translate` | → CSS | `yes` / `no` |
| `border` | → CSS | `table` 에 단위 없는 정수 |
| `color` | → CSS | `link` 안 |
| `size` | → 크기 별칭 ([6.5](06-css.md#65-별칭), 예정) | `input`, `select` 안 |
| `disabled`, `checked` 등 상태 이름 | 블록이 붙으면 → 상태 규칙 (예정) | 블록이 없으면 |
| `data` | 블록이 붙으면 → `<data>` 요소 | — (`data- { }` 는 접두사 묶음, 예정) |

## 3.7 명시하는 법

> 상태: 표의 각 줄에 적혀 있습니다

추측이 원하는 것과 다르면, 아래 표기로 결과를 정할 수 있습니다. 명시한 표기는 언제나 판별 순서보다 우선합니다.

| 원하는 결과 | 쓰는 법 | 상태 |
| --- | --- | --- |
| 요소 | 블록을 붙인다: `title { "제목" }` | 구현됨 |
| 요소 | 선택자 축약을 붙인다: `label.name: "이름"` | 구현됨 |
| 속성 | 선택자 축약 괄호: `div[title=설명]` | 구현됨 |
| 속성 | 등호로 쓴다: `title="설명"` | 예정 |
| CSS | 단위를 쓴다: `width 100px` | 구현됨 |
| CSS | 인라인 스타일 문자열: `style: "width: 100px"` | 구현됨 |
| CSS | `css { width 100 }` | 예정 |
| JS | `on…` 또는 `@…` | 구현됨 / 예정 |
| 원본 HTML | `raw`, `<` 로 시작하는 줄 | 예정 |

## 3.8 판별 결과 보기

> 상태: 구현됨 (`--explain` 은 예정)

- 컴파일러 API 의 `compile()` 결과에는 `classifications` 가 들어 있습니다. 각 키를 무엇(`element`, `attribute`, `css`, `js`)으로 판별했는지가 소스 위치와 함께 담깁니다.
- [플레이그라운드](https://614project.github.io/weber/playground.html)는 이 정보로 키에 색을 칠합니다.
- 명령줄의 `--explain` 은 판별과 그 밖의 추측(단위, 태그 생략, 끌어올리기 …)을 모두 출력합니다. [11.3](11-diagnostics-output.md#113-설명)을 보세요.
