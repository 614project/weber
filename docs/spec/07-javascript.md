# 7. 스크립트

[← 6. 스타일](06-css.md) · [목차](../README.md) · 다음: [8. 문서 →](08-document.md)

이 장은 자바스크립트를 쓰는 방법을 정합니다. weber 는 자바스크립트 코드를 고치지 않고 그대로 출력합니다. 바꾸는 것은 코드가 들어갈 자리와 몇 가지 짧은 표기뿐입니다.

## 7.1 on 이벤트

> 상태: 구현됨

`on` 으로 시작하는 키(`onclick`, `oninput`, `onsubmit` …)는 이벤트 처리기 속성입니다.

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

- **한 줄로 쓰면 줄 끝까지가 코드입니다.** `;` 도 코드에 포함됩니다. 같은 줄 뒤에 다른 문장을 이어 쓸 수 없지만, 블록을 닫는 `}` 는 쓸 수 있습니다: `button { "+"; onclick: n++ }`.
- 블록으로 쓰면 블록 전체가 코드입니다. 공통 들여쓰기를 빼고, 여러 줄이면 줄바꿈을 그대로 둡니다.
- 값 전체가 따옴표 문자열이면 따옴표를 벗긴 내용이 코드입니다: `onclick: "alert('hi')"`.
- 코드에 `"` 가 있고 `'` 가 없으면 속성을 작은따옴표로 감쌉니다: `onclick='alert("hi")'`.

## 7.2 이벤트 줄임

> 상태: 예정

`@이벤트이름` 은 `on이벤트이름` 과 같습니다. Vue 의 표기와 같습니다.

```weber 예정
button {
    "저장"
    @click: save()
    @mouseenter {
        this.classList.add('hover')
    }
}
```

```html
<button onclick="save()" onmouseenter="this.classList.add('hover')">저장</button>
```

- `@` 뒤에는 DOM 이벤트 이름이 옵니다. 목록은 [부록 B.4](appendix-b-reference.md#b4-이벤트-이름)에 있습니다.
- `input`, `select`, `search` 처럼 요소 이름과 같은 이벤트도 `@` 덕분에 헷갈리지 않습니다: `@input: update(this.value)`.
- `@media` 같은 CSS at-규칙 이름과 겹치는 이벤트 이름은 없습니다.

## 7.3 수식어

> 상태: 예정

이벤트 이름 뒤에 `.수식어` 를 붙이면 자주 쓰는 처리를 코드 앞에 넣어 줍니다.

```weber 예정
form {
    @submit.prevent {
        save(new FormData(this))
    }
    input {
        type search
        @keydown.enter: search(this.value)
        @keydown.esc: this.value = ''
    }
}
```

```html
<form onsubmit="event.preventDefault();
save(new FormData(this))"><input type="search" onkeydown="if (event.key === 'Enter') {
search(this.value)
}
if (event.key === 'Escape') {
this.value = ''
}"></form>
```

| 수식어 | 하는 일 |
| --- | --- |
| `.prevent` | `event.preventDefault();` |
| `.stop` | `event.stopPropagation();` |
| `.self` | `event.target === this` 일 때만 실행 |
| `.once` | 처음 한 번만 실행 |
| `.enter`, `.esc`, `.space`, `.tab`, `.delete`, `.up`, `.down`, `.left`, `.right` | 그 키일 때만 실행 (`event.key` 로 비교) |
| `.ctrl`, `.shift`, `.alt`, `.meta` | 그 보조 키를 누르고 있을 때만 실행 |

- 수식어는 여러 개 이어 쓸 수 있습니다: `@keydown.ctrl.enter.prevent`.
- 조건이 있는 수식어는 코드를 `if (…) { … }` 로 감쌉니다. `.prevent` 와 `.stop` 은 조건을 만족할 때만 실행됩니다.
- 같은 요소에 같은 이벤트를 여러 번 쓰면, 하나의 처리기 속성 안에 차례로 이어 붙입니다.

## 7.4 script

> 상태: 구현됨 (인자는 예정)

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

- 블록의 내용은 자바스크립트입니다. 문자열, 템플릿 리터럴, 정규식, 주석 안의 중괄호를 정확히 가려 블록의 끝을 찾습니다.
- 값이 `.js`·`.mjs`·`.cjs` 파일이나 URL 이면 `src` 가 되고, 그 밖에는 코드입니다.
- 다른 속성은 선택자 축약으로 줍니다: `script[type=module]`. [인자](04-content.md#43-요소-값의-인자)로도 줄 수 있습니다(예정): `script app.js defer`.
- `script { src … }` 는 자바스크립트로 읽히므로 경고합니다. 외부 파일은 `script: 파일.js` 로 씁니다.
- 문서 최상위의 `script` 는 본문이 시작되기 전이면 `<head>`, 그 뒤면 `<body>` 에 들어갑니다([8.3](08-document.md#83-최상위-문장의-자리)).

## 7.5 module

> 상태: 예정

`module` 은 `type="module"` 인 `script` 입니다.

```weber 예정
module {
    import { start } from './app.js'
    start()
}
module: ./widgets.js
```

```html
<script type="module">
  import { start } from './app.js'
  start()
</script>
<script type="module" src="./widgets.js"></script>
```

## 7.6 자바스크립트는 그대로

> 상태: 구현됨

- 코드는 고치지 않습니다. 공통 들여쓰기만 정리하고, 출력할 때 감싸는 요소에 맞춰 다시 들여씁니다.
- 여러 줄 템플릿 리터럴과 문자열 안의 줄은 들여쓰기를 바꾸지 않습니다. 값이 달라지기 때문입니다.
- 코드 안의 `</script` 는 `<\/script` 로 바꿉니다. 그래야 HTML 에서 `<script>` 가 일찍 끝나지 않습니다.
- 자바스크립트 안에서는 weber 변수 끼워넣기(`$이름`)를 하지 않습니다. 값을 넘기려면 `data-` 속성을 씁니다.
