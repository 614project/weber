# 5. 속성

[← 4. 요소와 내용](04-content.md) · [목차](../README.md) · 다음: [6. 스타일 →](06-css.md)

이 장은 HTML 속성으로 판별된 문장이 어떻게 출력되는지, 그리고 속성을 쓰는 여러 표기를 정합니다.

## 5.1 속성값

> 상태: 구현됨

- 값이 따옴표 문자열 하나면 따옴표를 벗깁니다. 그 밖에는 값을 그대로 씁니다: `href /about`, `alt "웃는 고양이"`.
- 값이 없는 속성은 이름만 출력합니다: `download` → `<a download>`.
- 출력할 때 값의 `"` 와 모호한 `&` 는 이스케이프합니다. 값에 `"` 만 있고 `'` 가 없으면 작은따옴표로 감쌉니다 ([11.4](11-diagnostics-output.md#114-출력-형식)).

## 5.2 등호로 쓰기

> 상태: 예정

HTML 의 속성 표기를 그대로 쓸 수 있습니다. **등호(`=`)로 쓴 문장은 판별 없이 언제나 속성입니다.**

```weber 예정
button {
    type=submit class="btn primary" disabled
    title = "보내기"
    "보내기"
}
```

```html
<button type="submit" class="btn primary" disabled title="보내기">보내기</button>
```

- `이름=값`, `이름 = 값`, `이름="값"`, `이름='값'` 모두 됩니다.
- HTML 처럼, 따옴표 없는 값은 공백 전까지입니다. 그래서 한 줄에 여러 속성을 쓸 수 있고, 값 없는 이름은 불리언 속성입니다. HTML 여는 태그 안의 내용을 그대로 붙여 넣으면 됩니다.
- 공백이 들어간 값은 따옴표로 감쌉니다: `content="width=device-width, initial-scale=1"`.
- `class` 합치기([5.4](#54-class))와 불리언 처리([5.3](#53-불리언-속성))는 그대로 적용됩니다.
- CSS 블록(`style { }` 등) 안에서는 `=` 를 쓸 수 없습니다.

> 1.0 과의 차이: `class=box` 는 지금까지 클래스 이름 `=box` 가 되었습니다.

## 5.3 불리언 속성

> 상태: 구현됨 (`yes`/`no`/`on`/`off`/`1`/`0` 은 예정)

`checked`, `disabled`, `hidden`, `required` 같은 불리언 속성은 이름만 쓰거나 참·거짓 값을 줍니다.

```weber
input { checked; disabled false; required true; hidden until-found }
```

```html
<input checked required hidden="until-found">
```

| 값 | 결과 | 상태 |
| --- | --- | --- |
| 없음, `true`, 속성 이름 자체 | 이름만 출력 (`checked`) | 구현됨 |
| `false` | 속성을 출력하지 않음 | 구현됨 |
| `yes`, `on`, `1` | 이름만 출력 | 예정 |
| `no`, `off`, `0` | 속성을 출력하지 않음 | 예정 |
| 그 밖의 값 | 그 값을 출력 (`hidden="until-found"`) | 구현됨 |

불리언 속성이 아닌 속성(`draggable`, `contenteditable`, `aria-*` …)의 `true`/`false` 는 글자 그대로 출력합니다.

> 1.0 과의 차이: `disabled no` 는 지금까지 `disabled="no"` 였고, 브라우저는 이를 **켜진 것**으로 봅니다. 이제는 속성을 빼서 뜻대로 꺼집니다.

## 5.4 class

> 상태: 구현됨 (쉼표 구분은 예정)

- 선택자 축약의 클래스, `class` 문장, `=` 표기의 class 는 모두 합쳐집니다. 나온 순서를 지키고 중복은 지웁니다.
- 공백으로 여러 클래스를 줄 수 있습니다. 쉼표로 나눠도 됩니다(예정): `class card, featured`.

```weber
p.a { class "b a c" }
```

```html
<p class="a b c"></p>
```

## 5.5 id 와 같은 속성을 여러 번 쓸 때

> 상태: 구현됨

`class` 와 `style` 을 뺀 속성을 같은 요소에 여러 번 쓰면, 마지막 값을 쓰고 경고합니다.

```weber
div { id a; id b }
```

```html
<div id="b"></div>
```

## 5.6 style 속성 문자열

> 상태: 구현됨

요소 안의 `style: "…"` 은 인라인 스타일 문자열입니다. CSS 문장으로 쓴 스타일과 합쳐집니다. 문자열 안의 CSS 는 그대로 쓰며, 단위 추론 같은 변환을 하지 않습니다.

```weber
p { color red; style: "margin: 0;" }
```

```html
<p style="color: red; margin: 0"></p>
```

## 5.7 접두사 묶음

> 상태: 예정

이름이 `-` 로 끝나는 키에 블록을 붙이면, 블록 안 키들의 앞에 그 접두사를 붙입니다. 붙인 다음에는 보통 문장처럼 판별합니다. 그래서 속성과 CSS 모두에 쓸 수 있습니다.

```weber 예정
button {
    "닫기"
    aria- { label "대화 상자 닫기"; expanded false }
    data- { action close; target dialog }
    font- { size 14; weight 600 }
}
```

```html
<button aria-label="대화 상자 닫기" aria-expanded="false" data-action="close" data-target="dialog" style="font-size: 14px; font-weight: 600">닫기</button>
```

- 묶음은 겹쳐 쓸 수 있습니다: `border- { top- { width 2 } }` → `border-top-width`.
- 묶음 안에 블록을 가진 요소를 쓸 수는 없습니다.

## 5.8 SVG 속성 이름

> 상태: 구현됨

SVG 속성은 대소문자를 표준 표기로 고칩니다: `viewbox` → `viewBox`, `preserveaspectratio` → `preserveAspectRatio`.
