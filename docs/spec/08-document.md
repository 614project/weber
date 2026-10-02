# 8. 문서

[← 7. 스크립트](07-javascript.md) · [목차](../README.md) · 다음: [9. 재사용 →](09-reuse.md)

이 장은 weber 가 완전한 HTML 문서를 만드는 규칙을 정합니다. `html`, `head`, `body` 는 써도 되고 안 써도 됩니다. 빠진 것은 weber 가 채웁니다.

## 8.1 문서와 조각

> 상태: 구현됨 (최상위 속성을 신호로 보는 것은 예정)

출력은 둘 중 하나입니다.

- **문서**: `<!DOCTYPE html>` 로 시작하는 완전한 HTML.
- **조각**: 쓴 내용만 담은 HTML. 다른 페이지에 끼워 넣거나 자바스크립트로 쓸 때 알맞습니다.

최상위에 다음 중 하나라도 있으면 문서, 없으면 조각입니다.

- `html`, `head`, `body`, `title`, `meta`, `link`, `base`
- `charset`, `viewport`, `icon`
- 그 밖의 head 설탕 이름(`description`, `og-*` …) — 예정 ([8.6](#86-head-설탕))
- 최상위의 HTML 속성 (`lang ko`, `class dark` 등) — 예정. 이런 속성은 문서의 `<html>` 에만 붙을 수 있기 때문입니다

명령줄의 `--document`·`--fragment`, API 의 `mode`, 또는 `@set mode document` 로 정할 수도 있습니다.

## 8.2 html, head, body 는 써도 되고 안 써도 된다

> 상태: 구현됨 (들여쓰기 블록은 예정)

다음 두 코드의 결과는 같습니다.

```weber
head: { title: "weber" }
body: { h1: "안녕" }
```

```weber
title: "weber"
h1: "안녕"
```

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>weber</title>
  </head>
  <body>
    <h1>안녕</h1>
  </body>
</html>
```

- `head { }`, `head: { }`, `head:` (들여쓰기 블록, 예정) 모두 됩니다. `body`, `html` 도 마찬가지입니다.
- 일부만 써도 됩니다. 예를 들어 `head { }` 만 쓰고 본문은 최상위에 써도 됩니다.
- 같은 것을 여러 번 쓰면 하나로 합칩니다. `head { }` 를 두 번 쓰면 내용이 한 `<head>` 에 차례로 들어갑니다.
- `html`, `head`, `body` 에도 선택자 축약과 속성을 쓸 수 있습니다: `body.dark { }`, `html { lang ko }`.

## 8.3 최상위 문장의 자리

> 상태: 구현됨

문서의 최상위 문장은 HTML 파서처럼 알맞은 곳으로 들어갑니다.

| 문장 | 들어가는 곳 |
| --- | --- |
| `title`, `meta`, `link`, `style`, `base`, head 설탕 | `<head>` |
| `script` | 본문이 시작되기 전이면 `<head>`, 그 뒤면 `<body>` |
| HTML 속성 (`lang`, `class` …)과 CSS | `<html>` |
| 그 밖의 요소와 텍스트 | `<body>` |

```weber
lang ko
title: "내 페이지"
style: style.css
script: lib.js
h1: "안녕하세요"
script: app.js
```

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <title>내 페이지</title>
    <link rel="stylesheet" href="style.css">
    <script src="lib.js"></script>
  </head>
  <body>
    <h1>안녕하세요</h1>
    <script src="app.js"></script>
  </body>
</html>
```

## 8.4 끌어올리기

> 상태: 예정

head 에만 있을 수 있는 요소를 본문이나 다른 요소 안에 쓰면, `<head>` 로 옮깁니다.

- 옮기는 요소: `title`, `base`, `meta`
- 옮길 때는 [설명](11-diagnostics-output.md#113-설명)에 기록합니다. 경고는 하지 않습니다.
- 요소 안의 `title 값` 은 [판별](03-classification.md#35-블록이-없는-문장의-판별-순서)에 따라 속성이므로 옮기지 않습니다. 요소로 쓴 `title { }` 만 옮깁니다.

```weber 예정
body {
    title { "블록으로 쓴 제목" }
    meta { name robots; content noindex }
    h1: "본문"
}
```

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>블록으로 쓴 제목</title>
    <meta name="robots" content="noindex">
  </head>
  <body>
    <h1>본문</h1>
  </body>
</html>
```

## 8.5 기본으로 채우는 것

> 상태: `<meta charset>` 은 구현됨, 나머지는 예정

문서를 만들 때 빠져 있으면 채우는 것들입니다.

| 채우는 것 | 언제 | 끄는 법 | 상태 |
| --- | --- | --- | --- |
| `<meta charset="utf-8">` | charset 을 쓰지 않았을 때. head 맨 앞에 | `@set charset off` | 구현됨 (끄기는 예정) |
| `<meta name="viewport" content="width=device-width, initial-scale=1">` | viewport 를 쓰지 않았을 때. charset 바로 뒤에 | `@set viewport off` | 예정 |
| `<title>` | title 을 쓰지 않았고 `h1` 이 있을 때. 첫 `h1` 의 글자로 | `@set auto-title off` | 예정 |

```weber 예정
lang ko
h1: "weber 소개"
p: "본문"
```

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>weber 소개</title>
  </head>
  <body>
    <h1>weber 소개</h1>
    <p>본문</p>
  </body>
</html>
```

- `lang` 을 쓰지 않았으면 [설명](11-diagnostics-output.md#113-설명)에 알려 줍니다(경고는 아님). 화면 읽기 프로그램과 글꼴 선택에 쓰이므로 쓰는 것이 좋습니다.

> 이 명세의 다른 "구현됨" 예제들은 현재 컴파일러의 출력을 보여 주므로, 아직 viewport 와 자동 title 이 없습니다.

## 8.6 head 설탕

> 상태: 표의 일부는 예정

head 문맥과 문서 최상위에서 쓰는 짧은 표기입니다.

| 쓰는 법 | 결과 | 상태 |
| --- | --- | --- |
| `charset utf-8` | `<meta charset="utf-8">` | 구현됨 |
| `viewport 값`, `description 값`, `keywords 값`, `author 값`, `theme-color 값` 등 | `<meta name="…" content="값">` | 구현됨 |
| `icon favicon.png` | `<link rel="icon" href="favicon.png">` | 구현됨 |
| `style: style.css`, `style: https://…` | `<link rel="stylesheet" href="…">` | 구현됨 |
| head 블록 안의 모르는 이름 | `<meta name="이름" content="값">` | 구현됨 |
| `og-이름 값` | `<meta property="og:이름" content="값">` | 예정 |
| `twitter-이름 값` | `<meta name="twitter:이름" content="값">` | 예정 |
| `manifest site.webmanifest` | `<link rel="manifest" href="…">` | 예정 |
| `canonical https://…` | `<link rel="canonical" href="…">` | 예정 |
| `link style.css` | `<link rel="stylesheet" href="style.css">` ([rel 추측](04-content.md#43-요소-값의-인자)) | 예정 |

```weber 예정
title: "weber"
description "쌓아 올리면 웹이 됩니다"
og-image https://weber.dev/cover.png
twitter-card summary_large_image
canonical https://weber.dev/
```

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>weber</title>
    <meta name="description" content="쌓아 올리면 웹이 됩니다">
    <meta property="og:image" content="https://weber.dev/cover.png">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="canonical" href="https://weber.dev/">
  </head>
  <body></body>
</html>
```

## 8.7 문서 전체에 거는 CSS

> 상태: 구현됨 (`:root` 는 예정)

문서 최상위에 쓴 CSS 문장은 `<html>` 에 붙습니다. 상속되는 속성(글꼴, 색 등)을 문서 전체에 줄 때 편합니다.

```weber
title: "글꼴"
font-family system-ui, sans-serif
p: "본문"
```

```html
<!DOCTYPE html>
<html style="font-family: system-ui, sans-serif">
  <head>
    <meta charset="utf-8">
    <title>글꼴</title>
  </head>
  <body>
    <p>본문</p>
  </body>
</html>
```

최상위의 사용자 정의 속성(`--accent`)과 최상위의 `:hover { }`·`@dark { }` 같은 규칙은 `:root` 를 선택자로 하는 규칙이 됩니다([6.4](06-css.md#64-css-변수), 예정).
