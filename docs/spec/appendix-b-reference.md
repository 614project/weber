# 부록 B. 참조 표

[← 부록 A. 문법 요약](appendix-a-grammar.md) · [목차](../README.md) · 다음: [부록 C. 구현 상태와 호환성 →](appendix-c-status.md)

본문에 흩어진 이름 목록을 모았습니다. 목록은 컴파일러의 데이터(`src/data/`)와 같아야 합니다.

## B.1 단위 추론 표

> 상태: 예정 ([6.2](06-css.md#62-단위-추론))

| 갈래 | 단위 | 속성 |
| --- | --- | --- |
| 길이 | `px` (`@set unit`) | `width` `height` `min-width` `min-height` `max-width` `max-height` `block-size` `inline-size` `min-block-size` `min-inline-size` `max-block-size` `max-inline-size` |
| | | `margin` `margin-top` `margin-right` `margin-bottom` `margin-left` `margin-block` `margin-block-start` `margin-block-end` `margin-inline` `margin-inline-start` `margin-inline-end` |
| | | `padding` 과 그 낱낱의 속성 (margin 과 같은 이름들) |
| | | `inset` `inset-block` `inset-block-start` `inset-block-end` `inset-inline` `inset-inline-start` `inset-inline-end` `top` `right` `bottom` `left` |
| | | `gap` `row-gap` `column-gap` `grid-gap` `grid-row-gap` `grid-column-gap` |
| | | `font-size` `letter-spacing` `word-spacing` `text-indent` `vertical-align` |
| | | `border-radius` `border-top-left-radius` `border-top-right-radius` `border-bottom-left-radius` `border-bottom-right-radius` `border-start-start-radius` `border-start-end-radius` `border-end-start-radius` `border-end-end-radius` |
| | | `flex-basis` `grid-template-columns` `grid-template-rows` `grid-auto-columns` `grid-auto-rows` `column-width` |
| | | `background-position` `background-position-x` `background-position-y` `background-size` `mask-position` `mask-size` `object-position` |
| | | `transform-origin` `perspective` `perspective-origin` `translate` `offset-distance` `shape-margin` |
| | | `scroll-margin` `scroll-padding` 과 그 낱낱의 속성 |
| | | `outline-offset` `text-underline-offset` `border-spacing` |
| | | `contain-intrinsic-size` `contain-intrinsic-width` `contain-intrinsic-height` `contain-intrinsic-block-size` `contain-intrinsic-inline-size` |
| | | `r` `cx` `cy` `rx` `ry` `x` `y` (SVG 도형을 CSS 로 쓸 때) |
| 선 굵기·그림자 | 언제나 `px` | `border` `border-top` `border-right` `border-bottom` `border-left` `border-block` `border-inline` 과 그 `-start`·`-end` |
| | | `border-width` `border-top-width` `border-right-width` `border-bottom-width` `border-left-width` 과 논리 속성의 `-width` |
| | | `outline` `outline-width` `column-rule` `column-rule-width` |
| | | `box-shadow` `text-shadow` `text-decoration-thickness` `-webkit-text-stroke` `-webkit-text-stroke-width` |
| 시간 | `s` / `ms` | `transition` `transition-duration` `transition-delay` `animation` `animation-duration` `animation-delay` |
| 각도 | `deg` | `rotate` `offset-rotate` (마지막 숫자) |
| 단위 없음 | — | `line-height` `opacity` `fill-opacity` `stroke-opacity` `stop-opacity` `flood-opacity` `z-index` |
| | | `flex` (세 번째 숫자만 길이) `flex-grow` `flex-shrink` `order` |
| | | `font-weight` `font-size-adjust` `scale` `zoom` `aspect-ratio` `tab-size` `orphans` `widows` `initial-letter` `math-depth` `line-clamp` `-webkit-line-clamp` |
| | | `columns` `column-count` `animation-iteration-count` |
| | | `grid-row` `grid-row-start` `grid-row-end` `grid-column` `grid-column-start` `grid-column-end` `grid-area` |
| | | `counter-increment` `counter-reset` `counter-set` |
| | | `stroke-width` `stroke-dasharray` `stroke-dashoffset` `stroke-miterlimit` `shape-image-threshold` |
| | | `border-image-width` `border-image-outset` `border-image-slice` |
| | | 사용자 정의 속성 (`--*`), 표에 없는 속성 |
| 자리마다 다름 | | `font` (글자 크기만 길이) — [6.2.2](06-css.md#622-값-안에서의-규칙) |

## B.2 상태 이름

> 상태: 예정 ([6.8](06-css.md#68-상태-블록))

| 이름 | 선택자 |
| --- | --- |
| `hover` `focus` `focus-visible` `focus-within` `active` `visited` `target` `checked` `disabled` `enabled` `required` `optional` `valid` `invalid` `empty` `placeholder-shown` | `:이름` |
| `first` `last` `only` | `:first-child` `:last-child` `:only-child` |
| `odd` `even` | `:nth-child(odd)` `:nth-child(even)` |
| `open` | `[open]` |
| `before` `after` `placeholder` `selection` `marker` `backdrop` | `::이름` |

## B.3 반응형 별칭

> 상태: 예정 ([6.9](06-css.md#69-반응형-별칭))

| 별칭 | 미디어 쿼리 | 설정 이름 |
| --- | --- | --- |
| `@mobile` | `(max-width: 640px)` | `mobile` |
| `@tablet` | `(max-width: 1024px)` | `tablet` |
| `@desktop` | `(min-width: 1025px)` | `desktop` |
| `@wide` | `(min-width: 1440px)` | `wide` |
| `@min 값` / `@max 값` | `(min-width: 값)` / `(max-width: 값)` | — |
| `@dark` / `@light` | `(prefers-color-scheme: dark)` / `(prefers-color-scheme: light)` | — |
| `@print` / `@screen` | `print` / `screen` | — |
| `@landscape` / `@portrait` | `(orientation: landscape)` / `(orientation: portrait)` | — |
| `@reduce-motion` | `(prefers-reduced-motion: reduce)` | — |

## B.4 이벤트 이름

> 상태: 예정 ([7.2](07-javascript.md#72-이벤트-줄임)). `on…` 표기는 이 목록과 상관없이 모든 이름에 쓸 수 있습니다.

| 갈래 | 이름 |
| --- | --- |
| 마우스 | `click` `dblclick` `contextmenu` `mousedown` `mouseup` `mousemove` `mouseenter` `mouseleave` `mouseover` `mouseout` `wheel` |
| 포인터·터치 | `pointerdown` `pointerup` `pointermove` `pointerenter` `pointerleave` `pointerover` `pointerout` `pointercancel` `touchstart` `touchend` `touchmove` `touchcancel` |
| 키보드·입력 | `keydown` `keyup` `keypress` `beforeinput` `input` `change` `compositionstart` `compositionupdate` `compositionend` |
| 폼 | `submit` `reset` `invalid` `select` `search` |
| 포커스 | `focus` `blur` `focusin` `focusout` |
| 끌어 놓기 | `drag` `dragstart` `dragend` `dragenter` `dragleave` `dragover` `drop` |
| 클립보드 | `copy` `cut` `paste` |
| 미디어 | `play` `pause` `ended` `timeupdate` `volumechange` `canplay` `loadeddata` `seeking` `seeked` |
| 불러오기 | `load` `error` `abort` |
| 스크롤·크기 | `scroll` `scrollend` `resize` |
| 애니메이션 | `animationstart` `animationend` `animationiteration` `transitionstart` `transitionend` `transitionrun` `transitioncancel` |
| 대화 상자·팝오버 | `toggle` `beforetoggle` `close` `cancel` |

## B.5 CSS 별칭과 layout 낱말

> 상태: 예정

- CSS 별칭: [6.5](06-css.md#65-별칭) 의 표 (`bg`, `radius`, `size`, `padding-x`, `padding-y`, `margin-x`, `margin-y`, `inset-x`, `inset-y`)
- layout 낱말: [6.6](06-css.md#66-layout) 의 표 (`row`, `column`, `grid`, `inline`, `center`, `middle`, `start`, `end`, `between`, `around`, `evenly`, `wrap`, `gap`)

## B.6 요소별 인자와 설명 속성

> 상태: 예정 ([4.3](04-content.md#43-요소-값의-인자))

| 요소 | 주요 인자 → 속성 | 따옴표 문자열 → |
| --- | --- | --- |
| `a`, `area` | URL·메일 주소 → `href` | 내용 (`area` 는 `alt`) |
| `img` | 파일·URL → `src` | `alt` |
| `iframe` | 파일·URL → `src` | `title` |
| `embed`, `audio`, `video`, `script` | 파일·URL → `src` | 내용 (`embed` 는 없음) |
| `track` | 파일·URL → `src` | `label` |
| `source` | 파일·URL → `src` (`picture` 안에서는 `srcset`) | 없음 |
| `link`, `base` | 파일·URL → `href` (`link` 는 `rel` 추측) | 없음 |
| `form` | URL → `action` | 내용 |
| `object` | 파일·URL → `data` | 내용 |
| `input` | type 이름 → `type` | `placeholder` |
| `button` | `submit`·`reset`·`button` → `type` | 내용 |
| `label`, `output` | 낱말 → `for` | 내용 |
| `option`, `data` | 낱말 → `value` | 내용 |
| `time` | 날짜·시간 → `datetime` | 내용 |
| `meter`, `progress` | 숫자 → `value`, 두 번째 숫자 → `max` | 내용 |

## B.7 태그 생략

> 상태: 예정 ([4.8](04-content.md#48-문맥에-따른-태그-생략))

| 부모 | 태그 |
| --- | --- |
| `ul` `ol` `menu` | `li` |
| `table` `thead` `tbody` `tfoot` | `tr` |
| `tr` | `td` (`thead` 안이면 `th`) |
| `select` `datalist` `optgroup` | `option` |
| `picture` `audio` `video` | `source` |
| `p` `span` `a` `button` `label` `h1`~`h6` `strong` `em` `b` `i` `small` `code` `q` `cite` `abbr` | `span` |
| SVG 컨테이너 | `g` |
| 그 밖 | `div` |

## B.8 head 이름

> 상태: 구현됨 (og-, twitter-, manifest, canonical 은 예정)

| 이름 | 결과 |
| --- | --- |
| `title` `meta` `link` `base` `style` `script` `noscript` `template` | head 요소 |
| `charset` | `<meta charset>` |
| `viewport` `description` `keywords` `author` `generator` `theme-color` `color-scheme` `robots` `referrer` `application-name` `creator` `publisher` `googlebot` `format-detection` | `<meta name content>` |
| `icon` | `<link rel="icon">` |
| `og-*` | `<meta property="og:*">` |
| `twitter-*` | `<meta name="twitter:*">` |
| `manifest` | `<link rel="manifest">` |
| `canonical` | `<link rel="canonical">` |

문서 최상위에서 `<head>` 로 옮겨지는 요소는 `title` `meta` `link` `base` `style` 이고, `script` 는 본문 전에 있을 때만입니다.

## B.9 불리언 속성

> 상태: 구현됨 ([5.3](05-attributes.md#53-불리언-속성))

`allowfullscreen` `alpha` `async` `autofocus` `autoplay` `checked` `controls` `default` `defer` `disabled` `formnovalidate` `hidden` `inert` `ismap` `itemscope` `loop` `multiple` `muted` `nomodule` `novalidate` `open` `playsinline` `readonly` `required` `reversed` `selected` `shadowrootclonable` `shadowrootdelegatesfocus` `shadowrootserializable`

## B.10 input 의 type 이름

> 상태: 구현됨 ([4.2](04-content.md#42-내용을-가질-수-없는-요소))

`button` `checkbox` `color` `date` `datetime-local` `email` `file` `hidden` `image` `month` `number` `password` `radio` `range` `reset` `search` `submit` `tel` `text` `time` `url` `week`

## B.11 지시문

> 상태: 예정

| 지시문 | 뜻 | 자세히 |
| --- | --- | --- |
| `@include "경로"` | 파일 내용을 펼침 | [9.6](09-reuse.md#96-파일-나누기) |
| `@use "경로"` | 정의만 가져옴 | [9.6](09-reuse.md#96-파일-나누기) |
| `@component 이름(…) { }` | 컴포넌트 정의 | [9.3](09-reuse.md#93-컴포넌트) |
| `@slot [이름] [{ }]` | 슬롯 | [9.4](09-reuse.md#94-슬롯) |
| `@each $x in 목록 { }` | 반복 | [9.7](09-reuse.md#97-반복) |
| `@if 조건 { } @else { }` | 조건 | [9.8](09-reuse.md#98-조건) |
| `@set 이름 값` | 설정 | [10.1](10-settings.md#101-set) |
| `@json "파일"` | JSON 데이터 (값 자리) | [9.1](09-reuse.md#91-변수) |
