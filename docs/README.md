# weber 문서

weber 는 `키 { ... }` 와 `키: 값` 을 쌓아 웹페이지를 만드는 언어입니다. 이 폴더에는 weber 언어 명세가 있습니다.

- 처음이라면 [저장소의 README](../README.md)와 [플레이그라운드](https://614project.github.io/weber/playground.html)부터 보세요.
- 명세는 weber 가 **무엇을 받아들이고 무엇을 내놓는지** 정한 문서입니다. 컴파일러는 이 명세를 따릅니다.
- 명세에는 이미 구현된 기능과 앞으로 구현할 기능이 함께 있습니다. 각 절에 상태가 적혀 있고, 전체 목록은 [부록 C](spec/appendix-c-status.md)에 있습니다.

## 언어 명세

| 장 | 내용 |
| --- | --- |
| [1. 개요와 설계 원칙](spec/01-overview.md) | weber 가 지향하는 것, 읽는 법, 용어 |
| [2. 기본 문법](spec/02-syntax.md) | 주석, 문장, 키와 값, 블록, 들여쓰기 블록, 선택자 축약, 한 줄 중첩, 반복, 문자열 |
| [3. 판별](spec/03-classification.md) | 한 줄이 요소인지 속성인지 CSS 인지 JS 인지 정하는 규칙 |
| [4. 요소와 내용](spec/04-content.md) | 요소 값의 인자, 링크 화살표, 텍스트 줄, 목록·표 설탕, 태그 생략, 자동 감싸기, 원본 HTML, 마크다운 |
| [5. 속성](spec/05-attributes.md) | `=` 표기, 불리언, class, 접두사 묶음 |
| [6. 스타일](spec/06-css.md) | 단위 추론, 별칭과 layout, 상태 블록, 반응형 별칭, css·style 블록, 중첩 규칙 |
| [7. 스크립트](spec/07-javascript.md) | 이벤트, `@이벤트` 와 수식어, script·module |
| [8. 문서](spec/08-document.md) | html·head·body 생략, 최상위 문장의 자리, 끌어올리기, 기본으로 채우는 것, head 설탕 |
| [9. 재사용](spec/09-reuse.md) | 변수와 끼워넣기, 컴포넌트와 슬롯, 파일 나누기, 반복과 조건 |
| [10. 설정](spec/10-settings.md) | `@set`, 엄격 모드 |
| [11. 진단과 출력](spec/11-diagnostics-output.md) | 오류, 경고, 설명, 출력 형식 |
| [부록 A. 문법 요약](spec/appendix-a-grammar.md) | 문법을 짧은 표기로 |
| [부록 B. 참조 표](spec/appendix-b-reference.md) | 단위, 상태 이름, 이벤트, 별칭, 요소별 인자, head 이름 |
| [부록 C. 구현 상태와 호환성](spec/appendix-c-status.md) | 구현된 것과 예정인 것, 1.0 과 달라지는 점, 구현 순서 |

## 방향: 유연함과 융통성

weber 는 쓰는 사람에게 맞춥니다. 같은 뜻이면 여러 표기를 받아들이고, 빠진 것은 상식적으로 채웁니다.
대신 모든 추측은 확인할 수 있고, 언제든 명시해서 바꿀 수 있습니다. 자세한 원칙은 [1.2](spec/01-overview.md#12-설계-원칙)에 있습니다.

아래 표에는 구현된 것과 예정인 것이 섞여 있습니다. 상태는 각 절에 적혀 있습니다.

| 이렇게 쓰면 | 이렇게 됩니다 | 절 |
| --- | --- | --- |
| `font-size 16` | `font-size: 16px` | [6.2](spec/06-css.md#62-단위-추론) |
| `head`, `body` 를 생략 | 알맞은 곳에 나눠 담음 | [8.2](spec/08-document.md#82-html-head-body-는-써도-되고-안-써도-된다) |
| `nav:` 다음 줄을 들여쓰기 | 중괄호 블록과 같음 | [2.9](spec/02-syntax.md#29-들여쓰기-블록) |
| `"홈" -> /` | `<a href="/">홈</a>` | [4.4](spec/04-content.md#44-링크-화살표) |
| `- 사과` | `<ul><li>사과</li></ul>` | [4.6](spec/04-content.md#46-목록-설탕) |
| `img cat.png "고양이"` | `<img src="cat.png" alt="고양이">` | [4.3](spec/04-content.md#43-요소-값의-인자) |
| `layout row between middle` | flex 와 정렬 선언 | [6.6](spec/06-css.md#66-layout) |
| `hover { bg #eee }` | `:hover` 규칙 | [6.8](spec/06-css.md#68-상태-블록) |
| `@mobile { … }` | `@media (max-width: 640px)` | [6.9](spec/06-css.md#69-반응형-별칭) |
| `@submit.prevent { … }` | `preventDefault` 를 넣은 `onsubmit` | [7.3](spec/07-javascript.md#73-수식어) |
| `class="box"` | 언제나 HTML 속성 | [5.2](spec/05-attributes.md#52-등호로-쓰기) |

## 한눈에 보기

> 상태: 예정 — 명세의 여러 설탕을 한데 모은 예입니다.

```weber 예정
// weber 카페
lang ko
title: "weber 카페"

$brand #6c4cf1

@component menu-item(name, price) {
    li {
        layout row between
        span: $name
        b: "${price}원"
    }
}

header {
    layout row between middle
    padding 16 24
    bg $brand
    color white
    h1: "weber 카페"
    nav {
        "메뉴" -> #menu
        "오시는 길" -> #map
    }
}

main#menu {
    max-width 640
    margin 24 auto
    ul {
        padding 0
        list-style none
        menu-item("아메리카노", 4500)
        menu-item("카페 라떼", 5000)
    }
    button "주문하기" {
        padding 12 20
        radius 8
        hover { bg $brand; color white }
        @click: alert('주문되었습니다')
    }
}
```

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>weber 카페</title>
    <style>
      .weber-1 {
        padding: 12px 20px;
        border-radius: 8px;
      }
      .weber-1:hover {
        background: #6c4cf1;
        color: white;
      }
    </style>
  </head>
  <body>
    <header style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: #6c4cf1; color: white">
      <h1>weber 카페</h1>
      <nav><a href="#menu">메뉴</a><a href="#map">오시는 길</a></nav>
    </header>
    <main id="menu" style="max-width: 640px; margin: 24px auto">
      <ul style="padding: 0; list-style: none">
        <li style="display: flex; justify-content: space-between"><span>아메리카노</span><b>4500원</b></li>
        <li style="display: flex; justify-content: space-between"><span>카페 라떼</span><b>5000원</b></li>
      </ul>
      <button onclick="alert('주문되었습니다')" class="weber-1">주문하기</button>
    </main>
  </body>
</html>
```

## 명세를 고칠 때

- 기능을 구현하면 그 절의 상태를 "구현됨"으로 바꾸고, 예제 코드 블록의 `weber 예정` 을 `weber` 로 바꿉니다. 그러면 `npm test` 가 그 예제를 실제로 변환해서 바로 뒤의 `html` 블록과 비교합니다.
- 명세와 컴파일러가 다르면 둘 중 하나가 틀린 것입니다. 어느 쪽을 고칠지 정한 뒤 함께 고칩니다.
