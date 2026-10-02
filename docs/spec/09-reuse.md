# 9. 재사용

[← 8. 문서](08-document.md) · [목차](../README.md) · 다음: [10. 설정 →](10-settings.md)

> 상태: 이 장의 기능은 모두 예정입니다.

같은 것을 여러 번 쓰지 않도록, weber 는 변수, 컴포넌트, 파일 나누기, 반복과 조건을 제공합니다.
모두 **변환할 때** 처리되며, 결과물에는 펼쳐진 HTML 만 남습니다.

## 9.1 변수

`$` 로 시작하는 문장은 변수 선언입니다.

```weber 예정
$brand #6c4cf1
$site: "weber"
$gap = 12

header {
    bg $brand
    padding $gap
    h1: "$site 소개"
}
```

```html
<header style="background: #6c4cf1; padding: 12px">
  <h1>weber 소개</h1>
</header>
```

- 선언은 `$이름 값`, `$이름: 값`, `$이름 = 값` 어느 것이든 됩니다.
- 이름은 영문자로 시작하고 영문자·숫자·`_`·`-` 로 이어집니다.
- **값의 종류**: 텍스트·숫자는 그대로, `[사과, 바나나]` 는 목록, `@json "파일.json"` 은 JSON 데이터(객체·배열)입니다.
- **범위**: 변수는 선언한 블록과 그 안쪽에서 보입니다. 같은 블록 안에서는 선언하기 전 줄에서도 쓸 수 있습니다. 안쪽 블록에서 같은 이름을 선언하면 바깥 것을 가립니다.
- 같은 블록에서 같은 변수를 두 번 선언하면 마지막 값을 쓰고 경고합니다.
- 변수를 바꾼 다음에 CSS 의 [단위 추론](06-css.md#62-단위-추론)을 합니다: `$gap = 12` 와 `padding $gap` → `padding: 12px`.
- 값 없이 `$이름` 만 쓴 문장은 그 변수의 내용을 텍스트로 넣습니다.

## 9.2 끼워넣기

값과 문자열 안의 `$이름` 은 변수의 내용으로 바뀝니다.

| 표기 | 뜻 |
| --- | --- |
| `$이름` | 변수의 내용 |
| `${이름}` | 같은 뜻. 바로 뒤에 글자가 이어질 때 씁니다: `"${size}px"` |
| `$이름.속성`, `${이름.속성}` | 객체의 속성 (JSON 데이터) |
| `\$` | `$` 글자 자체 |

- **바뀌는 곳**: 텍스트, 따옴표 문자열, 따옴표 없는 값, 속성값, CSS 값, 선택자 축약의 `[속성=값]`, 마크다운.
- **바뀌지 않는 곳**: 자바스크립트(`script`, `on…`, `@이벤트`), 원본 HTML.
- `$` 뒤가 이름의 첫 글자가 아니면 그냥 `$` 입니다. 그래서 `"$5"` 는 그대로 `$5` 입니다.
- 정의되지 않은 변수는 글자 그대로 두고 경고합니다.
- 목록을 텍스트 자리에 쓰면 `, ` 로 이어 붙입니다.
- 요소 값을 [낱말로 나눌 때](04-content.md#43-요소-값의-인자)는 먼저 나누고, 그다음 각 낱말 안에서 끼워넣기를 합니다. 그래서 변수 내용에 공백이 있어도 한 낱말입니다. 다만 낱말의 모양은 바뀐 내용으로 판단하므로, 내용으로 넣을 텍스트는 `"$title"` 처럼 따옴표로 감쌉니다.

## 9.3 컴포넌트

`@component` 로 자주 쓰는 구조에 이름을 붙이고, 요소처럼 불러 씁니다.

```weber 예정
@component card(title, image = placeholder.png) {
    article.card {
        img $image "$title"
        h3: $title
        @slot
    }
}

card("weber 소개", cover.png) {
    p: "쌓아 올리면 웹이 됩니다."
}
card {
    title "이름 붙인 인자"
    p: "이름이 맞는 문장은 인자로, 나머지는 슬롯으로 갑니다."
}
card: "인자 하나"
```

```html
<article class="card">
  <img src="cover.png" alt="weber 소개">
  <h3>weber 소개</h3>
  <p>쌓아 올리면 웹이 됩니다.</p>
</article>
<article class="card">
  <img src="placeholder.png" alt="이름 붙인 인자">
  <h3>이름 붙인 인자</h3>
  <p>이름이 맞는 문장은 인자로, 나머지는 슬롯으로 갑니다.</p>
</article>
<article class="card">
  <img src="placeholder.png" alt="인자 하나">
  <h3>인자 하나</h3>
</article>
```

**정의**

- `@component 이름(매개변수, …) { 본문 }`. 매개변수가 없으면 괄호를 생략합니다.
- 매개변수에는 기본값을 줄 수 있습니다: `image = placeholder.png`.
- 본문 안에서 매개변수는 변수입니다: `$title`.
- 컴포넌트는 파일 어디에서 정의해도 파일 전체에서 쓸 수 있습니다. 다른 파일의 컴포넌트는 [`@use`](#96-파일-나누기)로 가져옵니다.
- 이름이 HTML 요소와 같으면 경고하고, 그 파일에서는 컴포넌트가 우선합니다.

**부르기**

| 표기 | 인자 |
| --- | --- |
| `card("제목", cover.png)` | 괄호 안의 값을 차례로 |
| `card: "제목"`, `card "제목" cover.png` | 값의 낱말을 차례로 |
| `card { title "제목" }` | 블록 안에서 매개변수 이름을 키로 쓴 문장 |

- 세 표기를 섞어 쓸 수 있습니다. 위치로 준 인자가 먼저 채워지고, 이름으로 준 인자가 그것을 덮어씁니다.
- 블록에서 인자가 아닌 나머지 내용은 [슬롯](#94-슬롯)으로 갑니다.
- 기본값이 없는 매개변수를 주지 않으면 빈 값으로 하고 경고합니다.
- 부를 때 붙인 선택자 축약과 속성은 컴포넌트의 **맨 바깥 요소**에 붙습니다: `card.featured#first { }`. 맨 바깥 요소가 여럿이면 첫 번째에 붙이고 경고합니다.
- 이름 뒤에 바로 `(` 가 오면 컴포넌트 부르기입니다. 정의되지 않은 이름이면 오류입니다.
- 컴포넌트가 자기 자신을 끝없이 부르면 오류입니다(깊이 100 까지).

## 9.4 슬롯

슬롯은 부르는 쪽이 내용을 채우는 자리입니다.

| 표기 | 뜻 |
| --- | --- |
| `@slot` | 기본 슬롯. 부를 때 블록의 나머지 내용 |
| `@slot 이름` | 이름 있는 슬롯. 부를 때 `이름 { … }` 블록의 내용 |
| `@slot { … }`, `@slot 이름 { … }` | 채우지 않았을 때 쓸 기본 내용 |

```weber 예정
@component dialog(title) {
    section.dialog {
        h2: $title
        @slot
        footer {
            @slot actions {
                button "닫기"
            }
        }
    }
}

dialog("저장할까요?") {
    p: "바뀐 내용이 있습니다."
    actions {
        button "저장"
        button "취소"
    }
}
```

```html
<section class="dialog">
  <h2>저장할까요?</h2>
  <p>바뀐 내용이 있습니다.</p>
  <footer><button>저장</button><button>취소</button></footer>
</section>
```

이름 있는 슬롯과 같은 이름의 블록(`actions { }`)은 슬롯을 채우는 데 쓰이고, 요소가 되지 않습니다. 컴포넌트에 그 이름의 슬롯이 없으면 보통 요소입니다.

## 9.5 컴포넌트의 스타일

컴포넌트 본문의 [`css { }`](06-css.md#611-css-블록)는 컴포넌트의 맨 바깥 요소를 범위로 합니다. 맨 바깥 요소에는 `w-이름` 클래스가 붙고, 규칙은 컴포넌트를 몇 번 쓰든 **한 번만** 출력합니다.

```weber 예정
@component badge(text) {
    span.badge: $text {
        css {
            padding 2 8
            radius 999
            bg #efeaff
            color #6c4cf1
        }
    }
}

p { "새 기능 "; badge("NEW"); " 을 써 보세요" }
```

```html
<style>
  .w-badge {
    padding: 2px 8px;
    border-radius: 999px;
    background: #efeaff;
    color: #6c4cf1;
  }
</style>
<p>새 기능 <span class="badge w-badge">NEW</span> 을 써 보세요</p>
```

## 9.6 파일 나누기

| 지시문 | 하는 일 |
| --- | --- |
| `@include "경로"` | 그 파일의 내용을 이 자리에 펼칩니다 |
| `@use "경로"` | 그 파일의 변수, 컴포넌트, 설정만 가져옵니다. 출력은 없습니다 |

```weber 예정
// header.weber
header {
    h1: "weber"
    nav { "홈" -> /; "문서" -> /docs }
}

// index.weber
title: "홈"
@include "header.weber"
p: "본문"
```

`@include` 는 확장자에 따라 내용을 다르게 넣습니다.

| 확장자 | 넣는 방법 |
| --- | --- |
| `.weber` 또는 확장자 생략 | weber 로 읽어 그 자리에 펼침 (정의도 가져옴) |
| `.html`, `.svg` | [원본 HTML](04-content.md#410-원본-html) |
| `.md` | [마크다운](04-content.md#411-마크다운) |
| `.css` | `<style>` (문서에서는 head 로) |
| `.js` | `<script>` |
| `.txt` | 텍스트 |

- 경로는 지금 파일을 기준으로 한 상대 경로입니다.
- 펼친 문장은 **펼친 자리의 문맥**으로 판별합니다. `ul { @include "items.weber" }` 안의 `li` 는 `ul` 안에 들어갑니다.
- 같은 파일을 여러 번 `@use` 해도 한 번만 읽습니다. 서로가 서로를 포함하면 오류입니다.
- 파일 시스템이 없는 곳(브라우저, 플레이그라운드)에서는 API 의 `resolve(경로)` 옵션으로 파일 내용을 넘겨줍니다.

## 9.7 반복

```weber 예정
$fruits [사과, 바나나, 체리]
ul {
    @each $fruit, $n in $fruits {
        li: "$n. $fruit"
    }
}
```

```html
<ul>
  <li>1. 사과</li>
  <li>2. 바나나</li>
  <li>3. 체리</li>
</ul>
```

- `@each $항목 in 목록 { }`, 번호가 필요하면 `@each $항목, $번호 in 목록 { }` (번호는 1부터).
- 목록 자리에는 `[a, b, c]`, 정수 범위 `1..5`, 목록 변수, `@json "파일.json"` 을 쓸 수 있습니다.
- JSON 객체의 속성은 `$항목.속성` 으로 꺼냅니다.

```weber 예정
@each $post in @json "posts.json" {
    article {
        h2: $post.title
        p: $post.summary
        "더 읽기" -> $post.url
    }
}
```

간단한 반복은 [`*N`](02-syntax.md#213-반복)으로도 씁니다.

## 9.8 조건

```weber 예정
$beta on

header {
    h1: "weber"
    @if $beta {
        span.badge: "베타"
    } @else {
        span.version: "1.0"
    }
}
```

```html
<header>
  <h1>weber</h1>
  <span class="badge">베타</span>
</header>
```

| 조건 | 참일 때 |
| --- | --- |
| `$x` | 정의되어 있고, 비어 있지 않고, `false`·`no`·`off`·`0` 이 아님 |
| `not $x` | `$x` 가 참이 아님 |
| `$x == 값`, `$x != 값` | 글자로 비교해서 같음 / 다름 |

- `@else if 조건 { }` 로 이어 쓸 수 있습니다. `@else` 는 다음 줄에 써도 됩니다.
