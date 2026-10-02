# 6. 스타일

[← 5. 속성](05-attributes.md) · [목차](../README.md) · 다음: [7. 스크립트 →](07-javascript.md)

이 장은 CSS 로 판별된 문장과 CSS 블록을 다룹니다. weber 의 CSS 는 평범한 CSS 를 그대로 받아들이면서, 단위·별칭·상태·반응형을 짧게 쓰는 설탕을 더합니다.

## 6.1 CSS 가 들어가는 곳

> 상태: 구현됨 (`css { }` 와 `:root` 는 예정)

| 쓰는 곳 | 출력 |
| --- | --- |
| 요소 안의 CSS 문장 (`color red`) | 그 요소의 인라인 `style` |
| 요소 안의 `:hover { }`, `@media … { }` 등 | 스타일시트의 규칙 (요소에 클래스를 붙임, [6.10](#610-요소-안의-css-규칙)) |
| `style { }` | `<style>` 요소 ([6.12](#612-style-블록)) |
| `css { }` | 그 요소 범위의 규칙 ([6.11](#611-css-블록), 예정) |
| 문서 최상위의 CSS 문장 | `<html>` 의 인라인 스타일. 사용자 정의 속성(`--*`)은 `:root` 규칙 ([6.4](#64-css-변수), 예정) |

어느 곳이든 CSS 는 `속성 값`, `속성: 값`, `속성: 값;` 어느 표기로 써도 됩니다.

## 6.2 단위 추론

> 상태: 예정 (1.0 은 숫자를 그대로 출력합니다)

**CSS 값 안의 단위 없는 숫자에는, 그 속성이 기대하는 단위를 붙입니다.**

| weber | CSS |
| --- | --- |
| `font-size 16` | `font-size: 16px` |
| `padding 8 16` | `padding: 8px 16px` |
| `margin 0 auto` | `margin: 0 auto` |
| `border 1 solid #ddd` | `border: 1px solid #ddd` |
| `line-height 1.6` | `line-height: 1.6` |
| `opacity .5`, `z-index 10`, `flex 1` | 그대로 |
| `transition opacity .3` | `transition: opacity .3s` |
| `transition-duration 200` | `transition-duration: 200ms` |
| `rotate 45` | `rotate: 45deg` |
| `transform translate(10, 20) rotate(45) scale(1.2)` | `transform: translate(10px, 20px) rotate(45deg) scale(1.2)` |
| `box-shadow 0 4 12 rgb(0 0 0 / 15%)` | `box-shadow: 0 4px 12px rgb(0 0 0 / 15%)` |
| `grid-template-columns 240 1fr` | `grid-template-columns: 240px 1fr` |
| `grid-template-columns repeat(3, 1fr)` | 그대로 |
| `width calc(100% - 32)` | `width: calc(100% - 32px)` |
| `font 600 15/1.5 sans-serif` | `font: 600 15px/1.5 sans-serif` |
| `filter blur(4) brightness(1.1)` | `filter: blur(4px) brightness(1.1)` |
| `background linear-gradient(135, #6c4cf1, #a29bfe)` | `background: linear-gradient(135deg, #6c4cf1, #a29bfe)` |

### 6.2.1 속성의 갈래

속성마다 단위 없는 숫자를 어떻게 볼지가 정해져 있습니다. 전체 표는 [부록 B.1](appendix-b-reference.md#b1-단위-추론-표)에 있습니다.

| 갈래 | 붙이는 단위 | 속성 (일부) |
| --- | --- | --- |
| 길이 | `px` (`@set unit` 으로 바꿀 수 있음) | `width`, `height`, `margin*`, `padding*`, `top`/`left` 등, `gap`, `font-size`, `letter-spacing`, `border-radius`, `flex-basis`, `grid-template-*`, `translate`, `background-position` … |
| 선 굵기·그림자 | 언제나 `px` | `border*`, `outline*`, `box-shadow`, `text-shadow`, `column-rule*`, `text-decoration-thickness` |
| 시간 | `s` 또는 `ms` ([6.2.3](#623-시간-값)) | `transition*`, `animation-duration`, `animation-delay`, `animation` |
| 각도 | `deg` | `rotate` |
| 단위 없음 | 붙이지 않음 | `line-height`, `opacity`, `z-index`, `flex`, `flex-grow`, `flex-shrink`, `order`, `font-weight`, `scale`, `zoom`, `aspect-ratio`, `column-count`, `tab-size`, `animation-iteration-count`, `grid-row`·`grid-column`(줄 번호), 사용자 정의 속성(`--*`) … |

`line-height` 처럼 단위 없는 숫자에 따로 뜻이 있는 속성은 손대지 않습니다. 모르는 속성도 손대지 않습니다.

### 6.2.2 값 안에서의 규칙

1. **단독 숫자**에만 붙입니다. `10px`, `50%`, `1fr`, `#123` 처럼 이미 단위나 다른 글자가 붙은 것은 그대로입니다.
2. **`0` 에는 붙이지 않습니다.** 단, 시간의 `0` 은 `0s` 가 됩니다(시간은 `0` 도 단위가 있어야 합니다).
3. 따옴표 안과 `url()` 안은 그대로입니다.
4. 색 함수(`rgb`, `hsl`, `hwb`, `lab`, `lch`, `oklab`, `oklch`, `color`, `color-mix`) 안은 그대로입니다.
5. 함수 안은 함수마다 정한 규칙을 씁니다.

   | 함수 | 숫자의 단위 |
   | --- | --- |
   | `translate()`, `translateX/Y/Z()`, `translate3d()`, `perspective()`, `blur()`, `drop-shadow()`, `minmax()`, `fit-content()` | 길이 (`px`) |
   | `rotate()`, `rotateX/Y/Z()`, `skew()`, `skewX/Y()`, `hue-rotate()` | 각도 (`deg`) |
   | `repeat(개수, 크기)` | 첫 인자는 그대로, 나머지는 길이 |
   | `linear-gradient()`, `repeating-linear-gradient()` | 첫 인자가 숫자 하나면 각도 |
   | `conic-gradient(from 숫자, …)` | `from` 뒤의 숫자는 각도 |
   | `calc()`, `min()`, `max()`, `clamp()` | 속성의 갈래를 따르되, `*` 와 `/` 의 피연산자는 그대로 |
   | `var(--이름, 기본값)` | 기본값에 속성의 규칙 |
   | 그 밖의 함수 (`scale()`, `brightness()`, `cubic-bezier()`, `steps()` …) | 그대로 |

6. 단축 속성 중 몇몇은 자리마다 뜻이 달라서 따로 정합니다.

   | 단축 속성 | 규칙 |
   | --- | --- |
   | `font` | `/` 앞의 숫자(없으면 마지막 숫자)가 글자 크기 → 길이. `/` 뒤의 줄 높이와 굵기는 그대로 |
   | `flex` | 세 번째 숫자(기준 크기)만 길이 |
   | `animation` | 처음 두 숫자는 시간(지속, 지연), 그 뒤의 숫자(반복 횟수)는 그대로 |
   | `transition` | 모든 숫자가 시간 |

7. 단위 추론은 **CSS 로 판별된 값**에만 합니다. `img { width 120 }` 은 HTML 속성으로 판별되므로 그대로 `width="120"` 입니다. 단위를 붙여 CSS 로 쓰고 싶으면 `width 120px` 이라고 씁니다.
8. `style: "…"` 문자열처럼 원본 그대로 쓰는 CSS 에는 하지 않습니다.

### 6.2.3 시간 값

시간을 받는 자리의 단위 없는 숫자는 크기로 초와 밀리초를 가립니다.

| 숫자 | 단위 | 예 |
| --- | --- | --- |
| 소수점이 있거나 10 보다 작은 수 | `s` | `.3` → `.3s`, `2` → `2s` |
| 10 이상의 정수 | `ms` | `150` → `150ms` |
| `0` | `s` | `0` → `0s` |

### 6.2.4 기본 단위 바꾸기

`@set unit rem` 이라고 쓰면 **길이** 갈래의 기본 단위가 `rem` 이 됩니다. 선 굵기·그림자 갈래는 계속 `px` 입니다.

```weber 예정
@set unit rem
.card {
    font-size 1.25
    padding 1 1.5
    border 1 solid #ddd
}
```

```html
<div class="card" style="font-size: 1.25rem; padding: 1rem 1.5rem; border: 1px solid #ddd"></div>
```

`@set unit none` 은 단위 추론을 끕니다.

## 6.3 !important 줄임

> 상태: 예정

값 끝의 `!` 는 `!important` 입니다.

| weber | CSS |
| --- | --- |
| `color red!` | `color: red !important` |
| `color red !` | `color: red !important` |

## 6.4 CSS 변수

> 상태: 예정

- 값 안에 단독으로 쓴 `--이름` 은 `var(--이름)` 이 됩니다. `var()` 를 직접 써도 됩니다.
- 최상위에 쓴 사용자 정의 속성, 그리고 사용자 정의 속성만 담은 최상위 규칙(`@dark { … }` 등)은 `:root` 규칙이 됩니다. 문서든 조각이든 같습니다. (조각의 최상위에 다른 CSS 를 쓰는 것은 여전히 오류입니다.)

```weber 예정
--accent #6c4cf1
@dark { --accent #a28cff }

a {
    color --accent
    border-bottom 2 solid --accent
}
```

```html
<style>
  :root {
    --accent: #6c4cf1;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --accent: #a28cff;
    }
  }
</style>
<a style="color: var(--accent); border-bottom: 2px solid var(--accent)"></a>
```

> 1.0 과의 차이: 문서 최상위의 `--accent` 는 지금까지 `<html>` 의 인라인 스타일이었습니다. 인라인 스타일은 다크 모드 같은 규칙으로 덮어쓸 수 없어서 `:root` 규칙으로 바꿉니다.

## 6.5 별칭

> 상태: 예정

자주 쓰는 속성을 짧게 쓰는 별칭입니다. 출력은 원래 속성 이름으로 합니다.

| 별칭 | 뜻 | 예 → 결과 |
| --- | --- | --- |
| `bg` | `background` | `bg #fff` → `background: #fff` |
| `radius` | `border-radius` | `radius 8` → `border-radius: 8px` |
| `size` | `width` 와 `height` | `size 48` → `width: 48px; height: 48px`, `size 320 180` → `width: 320px; height: 180px` |
| `padding-x`, `padding-y` | 좌우, 위아래 `padding` | `padding-x 16` → `padding-left: 16px; padding-right: 16px` |
| `margin-x`, `margin-y` | 좌우, 위아래 `margin` | `margin-y 24` → `margin-top: 24px; margin-bottom: 24px` |
| `inset-x`, `inset-y` | `left`·`right`, `top`·`bottom` | `inset-x 0` → `left: 0; right: 0` |

별칭은 [판별 순서](03-classification.md#35-블록이-없는-문장의-판별-순서)의 단계 11 에서 CSS 속성과 함께 정해집니다. 부모 요소 전용 속성(단계 8)이 먼저이므로 `input { size 20 }` 은 여전히 input 의 `size` 속성입니다.

## 6.6 layout

> 상태: 예정

`layout` 은 배치를 낱말 몇 개로 쓰는 설탕입니다.

| weber | CSS |
| --- | --- |
| `layout row` | `display: flex` |
| `layout column` | `display: flex; flex-direction: column` |
| `layout center` | `display: grid; place-items: center` |
| `layout row center` | `display: flex; justify-content: center; align-items: center` |
| `layout row between middle` | `display: flex; justify-content: space-between; align-items: center` |
| `layout column gap 12` | `display: flex; flex-direction: column; gap: 12px` |
| `layout row wrap gap 8 16` | `display: flex; flex-wrap: wrap; gap: 8px 16px` |
| `layout grid 3` | `display: grid; grid-template-columns: repeat(3, minmax(0, 1fr))` |
| `layout grid min 240 gap 16` | `display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px` |

**낱말**

| 낱말 | 뜻 |
| --- | --- |
| `row` / `column` | 가로 / 세로 flex 배치 |
| `grid N` | N 칸짜리 grid |
| `grid min 크기` | 칸이 `크기`보다 작아지지 않게 채우는 grid |
| `inline` | `inline-flex` / `inline-grid` 로 |
| `center` | 가운데 정렬. 다른 배치 낱말이 없으면 `display: grid; place-items: center` |
| `middle` | 교차축 가운데 (`align-items: center`) |
| `start`, `end`, `between`, `around`, `evenly` | 주축 정렬 (`justify-content`) |
| `wrap` | 줄 바꿈 (`flex-wrap: wrap`) |
| `gap 값 [값]` | 간격. 단위 추론을 따릅니다 |

모르는 낱말은 경고합니다. `layout` 으로 만든 선언은 같은 요소에 따로 쓴 CSS 문장으로 덮어쓸 수 있습니다(나중에 쓴 것이 이깁니다).

## 6.7 CSS 접두사 묶음

> 상태: 예정

[5.7](05-attributes.md#57-접두사-묶음)의 접두사 묶음은 CSS 에도 쓰입니다. `style { }` 블록 안에서도 됩니다.

```weber 예정
style {
    .card {
        border- { width 1; style solid; color #ddd }
        font- { size 15; weight 500 }
    }
}
```

```html
<style>
  .card {
    border-width: 1px;
    border-style: solid;
    border-color: #ddd;
    font-size: 15px;
    font-weight: 500;
  }
</style>
```

CSS 블록 안에서 `-` 로 끝나는 맨 이름(`font-`)만 묶음입니다. `.btn-` 처럼 선택자 모양이면 선택자입니다.

## 6.8 상태 블록

> 상태: `:hover { }` 표기는 구현됨, 이름만 쓰는 표기는 예정

요소 안에 `:상태 { }` 를 쓰면 그 요소의 상태 규칙입니다. 콜론 없이 상태 이름만 써도 됩니다(예정).

```weber 예정
button {
    "확인"
    bg white
    hover { bg #f1f0ff }
    disabled { opacity .5 }
    before { content "✓ " }
}
```

```html
<style>
  .weber-1 {
    background: white;
  }
  .weber-1:hover {
    background: #f1f0ff;
  }
  .weber-1:disabled {
    opacity: .5;
  }
  .weber-1::before {
    content: "✓ ";
  }
</style>
<button class="weber-1">확인</button>
```

| 이름 | 선택자 |
| --- | --- |
| `hover`, `focus`, `focus-visible`, `focus-within`, `active`, `visited`, `target`, `checked`, `disabled`, `enabled`, `required`, `optional`, `valid`, `invalid`, `empty`, `placeholder-shown` | `:이름` |
| `first`, `last`, `only` | `:first-child`, `:last-child`, `:only-child` |
| `odd`, `even` | `:nth-child(odd)`, `:nth-child(even)` |
| `open` | `[open]` |
| `before`, `after`, `placeholder`, `selection`, `marker`, `backdrop` | `::이름` |

- 상태 이름은 **블록이 붙을 때만** 상태입니다. `disabled` 처럼 속성 이름이기도 한 것은 블록이 없으면 속성입니다.
- `style { }` 블록 안에서는 규칙 **안에 중첩된** 상태 이름만 상태입니다: `.btn { hover { … } }` → `.btn:hover`.
- `link` 는 요소 이름이므로 상태 이름에 넣지 않습니다. `:link` 는 콜론을 붙여 씁니다.

## 6.9 반응형 별칭

> 상태: `@media` 는 구현됨, 별칭은 예정

요소 안이나 CSS 블록 안에서 `@media` 대신 짧은 별칭을 씁니다.

```weber 예정
.grid {
    layout grid 3 gap 16
    @tablet { grid-template-columns repeat(2, 1fr) }
    @mobile { grid-template-columns 1fr }
    @dark { bg #111 }
}
```

```html
<style>
  .weber-1 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
  @media (max-width: 1024px) {
    .weber-1 {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 640px) {
    .weber-1 {
      grid-template-columns: 1fr;
    }
  }
  @media (prefers-color-scheme: dark) {
    .weber-1 {
      background: #111;
    }
  }
</style>
<div class="grid weber-1"></div>
```

| 별칭 | 미디어 쿼리 |
| --- | --- |
| `@mobile` | `(max-width: 640px)` |
| `@tablet` | `(max-width: 1024px)` |
| `@desktop` | `(min-width: 1025px)` |
| `@wide` | `(min-width: 1440px)` |
| `@min 값`, `@max 값` | `(min-width: 값)`, `(max-width: 값)` (단위 추론) |
| `@dark`, `@light` | `(prefers-color-scheme: dark)`, `(… light)` |
| `@print`, `@screen` | `print`, `screen` |
| `@landscape`, `@portrait` | `(orientation: …)` |
| `@reduce-motion` | `(prefers-reduced-motion: reduce)` |

- 별칭을 공백으로 이어 쓰면 모두 만족할 때입니다: `@mobile @dark { }` → `@media (max-width: 640px) and (prefers-color-scheme: dark)`.
- 경계값은 `@set` 으로 바꿀 수 있습니다: `@set mobile 600`. [10.2](10-settings.md#102-설정-목록)를 보세요.
- `@media` 의 괄호 안 숫자에도 단위 추론을 합니다: `@media (max-width: 600)` → `(max-width: 600px)`.

## 6.10 요소 안의 CSS 규칙

> 상태: 구현됨

요소 안에 `:`, `&`, `@` 로 시작하는 블록을 쓰면, 그 요소에만 적용되는 규칙이 됩니다.

```weber
button {
    "확인"
    background white
    :hover { background gold }
    @media (max-width: 600px) { width 100% }
}
```

```html
<style>
  .weber-1 {
    background: white;
  }
  .weber-1:hover {
    background: gold;
  }
  @media (max-width: 600px) {
    .weber-1 {
      width: 100%;
    }
  }
</style>
<button class="weber-1">확인</button>
```

- 요소에 `weber-번호` 클래스를 붙이고, 규칙을 스타일시트로 옮깁니다. 요소에 아이디가 있으면 `#아이디` 를, `html`·`body` 면 태그 이름을 선택자로 씁니다.
- 인라인 스타일은 스타일시트보다 우선하므로, 그대로 두면 `:hover` 나 `@media` 가 덮어쓰지 못합니다. 그래서 이런 요소는 **직접 쓴 스타일도 같은 선택자의 규칙으로 옮깁니다.**
- 스타일시트는 전체 문서에서는 `<head>` 끝에 들어갑니다. head 가 속성 없는 `<style>` 로 끝나면 그 안에 이어 씁니다. 조각에서는 맨 앞에 들어갑니다.
- `:` 로 시작하는 선택자는 요소에 바로 붙습니다(`:hover` → `.weber-1:hover`). `&` 는 요소의 선택자로 바뀝니다.

## 6.11 css 블록

> 상태: 예정

`css { }` 는 그 요소 범위의 CSS 입니다. 선언은 그 요소에, 중첩한 선택자는 그 요소 안쪽에 적용됩니다. 요소 블록 안에서는 `h2 { }` 가 요소이므로, 자손 선택자를 쓰려면 `css { }` 를 씁니다.

```weber 예정
article.post {
    css {
        padding 24
        h2 { margin 0 0 8 }
        a { color --accent; hover { text-decoration underline } }
    }
    h2: "제목"
    p { "본문과 "; a: "링크" { href # } }
}
```

```html
<style>
  .weber-1 {
    padding: 24px;
  }
  .weber-1 h2 {
    margin: 0 0 8px;
  }
  .weber-1 a {
    color: var(--accent);
  }
  .weber-1 a:hover {
    text-decoration: underline;
  }
</style>
<article class="post weber-1">
  <h2>제목</h2>
  <p>본문과 <a href="#">링크</a></p>
</article>
```

- 한 요소에 `css { }` 를 여러 번 써도 됩니다. 차례로 합쳐집니다.
- [컴포넌트](09-reuse.md#95-컴포넌트의-스타일) 안의 `css { }` 는 컴포넌트를 몇 번 쓰든 한 번만 출력합니다.

## 6.12 style 블록

> 상태: 구현됨

`style { }` 은 `<style>` 요소가 됩니다. 안에는 평범한 CSS 를 써도 되고, 쌍점과 세미콜론을 생략한 weber 식으로 써도 됩니다.

```weber
style {
    body { margin 0; font-family system-ui, sans-serif }
    .card {
        padding: 16px;
        h3 { margin 0 }
        &:hover { box-shadow 0 4px 12px rgb(0 0 0 / 10%) }
    }
}
```

```html
<style>
  body {
    margin: 0;
    font-family: system-ui, sans-serif;
  }
  .card {
    padding: 16px;
  }
  .card h3 {
    margin: 0;
  }
  .card:hover {
    box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
  }
</style>
```

- `style: 파일.css` 나 `style: https://…` 처럼 CSS 파일이나 URL 을 값으로 주면 `<link rel="stylesheet">` 가 됩니다.
- 그 밖의 문자열 값은 head 와 최상위에서는 `<style>` 의 내용, 요소 안에서는 인라인 스타일입니다.
- 모르는 CSS 속성은 경고합니다(오타 제안 포함). `@font-face` 같은 서술자 블록 안은 검사하지 않습니다.

## 6.13 중첩 규칙 펼치기

> 상태: 구현됨

CSS 블록 안의 중첩 규칙은 Sass 처럼 평범한 CSS 로 펼쳐집니다.

```weber
style {
    .card, .box {
        padding 1rem
        h3 { margin 0 }
        &.active { color red }
        :hover { color blue }
        @media (max-width: 600px) { padding .5rem }
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

| 중첩 선택자 | 펼친 결과 |
| --- | --- |
| `&` 가 있음 (`&.active`, `.dark &`) | `&` 를 바깥 선택자로 바꿈 |
| `:` 로 시작 (`:hover`, `::before`) | 바깥 선택자에 바로 붙임 |
| 그 밖 (`h3`, `> p`) | 자손 선택자 (`.card h3`, `.card > p`) |
| 쉼표 목록 | 바깥과 안쪽의 모든 조합 |

- 선언 사이에 중첩 규칙이 끼어도 순서를 지킵니다.
- `@media`, `@supports`, `@container`, `@layer` 는 규칙 안에 중첩할 수 있으며, 바깥 선택자를 안으로 가져갑니다.
- `@keyframes` 의 `from`·`to`·`50%` 블록과 `@font-face`·`@page` 의 서술자는 그대로 둡니다.
- `@import`, `@charset`, `@namespace` 는 스타일시트 맨 앞으로 옮깁니다.
- 최상위 선택자에는 `&` 를 쓸 수 없습니다(오류).

## 6.14 자동 접두사

> 상태: 예정

아직 벤더 접두사가 필요한 몇몇 속성에는 접두사 붙은 선언을 함께 출력합니다. `@set prefix off` 로 끌 수 있습니다.

| 속성 | 함께 출력하는 것 |
| --- | --- |
| `user-select` | `-webkit-user-select` |
| `backdrop-filter` | `-webkit-backdrop-filter` |
| `background-clip: text` | `-webkit-background-clip: text` |
| `text-size-adjust` | `-webkit-text-size-adjust` |
| `mask`, `mask-*` | `-webkit-mask`, `-webkit-mask-*` |

목록은 브라우저 지원에 맞춰 판마다 갱신합니다.
