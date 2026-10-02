# 10. 설정

[← 9. 재사용](09-reuse.md) · [목차](../README.md) · 다음: [11. 진단과 출력 →](11-diagnostics-output.md)

> 상태: 이 장의 기능은 모두 예정입니다. (1.0 은 명령줄과 API 의 `mode`, `minify`, `indent` 만 있습니다.)

weber 의 추측과 기본값은 대부분 바꾸거나 끌 수 있습니다. 이 장은 그 방법을 정합니다.

## 10.1 @set

```weber 예정
@set unit rem
@set mobile 600
@set viewport off
```

- `@set 이름 값` 은 그 **파일 전체**에 적용됩니다. 파일 어디에 써도 되지만 맨 위에 쓰기를 권합니다.
- 같은 설정을 여러 번 쓰면 마지막 값을 쓰고 경고합니다.
- `on`/`off` 대신 `yes`/`no`, `true`/`false` 도 됩니다.
- `@include` 로 펼친 파일은 포함한 파일의 설정을 물려받습니다. 펼친 파일 안의 `@set` 은 그 파일 안에서만 적용됩니다.

## 10.2 설정 목록

| 이름 | 값 | 기본값 | 뜻 | 자세히 |
| --- | --- | --- | --- | --- |
| `mode` | `auto`, `document`, `fragment` | `auto` | 문서로 낼지 조각으로 낼지 | [8.1](08-document.md#81-문서와-조각) |
| `unit` | `px`, `rem`, `em`, `none` | `px` | 길이의 기본 단위. `none` 은 단위 추론을 끔 | [6.2](06-css.md#62-단위-추론) |
| `mobile` | 길이 | `640` | `@mobile` 의 최대 너비 | [6.9](06-css.md#69-반응형-별칭) |
| `tablet` | 길이 | `1024` | `@tablet` 의 최대 너비 | [6.9](06-css.md#69-반응형-별칭) |
| `desktop` | 길이 | `1025` | `@desktop` 의 최소 너비 | [6.9](06-css.md#69-반응형-별칭) |
| `wide` | 길이 | `1440` | `@wide` 의 최소 너비 | [6.9](06-css.md#69-반응형-별칭) |
| `charset` | `on`, `off` | `on` | `<meta charset>` 채우기 | [8.5](08-document.md#85-기본으로-채우는-것) |
| `viewport` | `on`, `off` | `on` | viewport 메타 채우기 | [8.5](08-document.md#85-기본으로-채우는-것) |
| `auto-title` | `on`, `off` | `on` | 첫 `h1` 으로 `<title>` 채우기 | [8.5](08-document.md#85-기본으로-채우는-것) |
| `wrap` | `on`, `off` | `on` | 흩어진 `li` 등을 자동으로 감싸기 | [4.9](04-content.md#49-자동으로-감싸기) |
| `prefix` | `on`, `off` | `on` | 벤더 접두사 자동으로 붙이기 | [6.14](06-css.md#614-자동-접두사) |
| `strict` | `on`, `off` | `off` | 엄격 모드 | [10.3](#103-엄격-모드) |
| `ignore` | 경고 코드 (여러 개는 공백으로) | 없음 | 그 경고를 숨김 | [11.2](11-diagnostics-output.md#112-경고) |

## 10.3 엄격 모드

`@set strict on`, 명령줄의 `--strict`, API 의 `strict: true` 로 켭니다.

- **모든 경고가 오류**가 됩니다. 모르는 이름, 요소에 맞지 않는 속성, 정의되지 않은 변수 등이 모두 변환을 멈춥니다.
- 파일 끝에서 닫히지 않은 블록도 오류입니다([2.10](02-syntax.md#210-닫히지-않은-블록)).
- `@set ignore` 로 숨긴 경고는 엄격 모드에서도 오류가 되지 않습니다.
- 단위 추론, 태그 생략 같은 규칙은 그대로 적용됩니다. 이것들은 정해진 규칙이지 실수가 아니기 때문입니다. 끄려면 각 설정을 씁니다.

큰 프로젝트나 CI 에서 실수를 일찍 잡을 때 씁니다.

## 10.4 명령줄과 API

| 어디서 | 쓰는 법 |
| --- | --- |
| 명령줄 | `weber index.weber --set unit=rem --set viewport=off`, `--strict` |
| API | `compile(code, { settings: { unit: 'rem', viewport: false }, strict: true })` |

- 명령줄과 API 의 설정은 **기본값**을 바꿉니다. 파일 안의 `@set` 이 그것을 덮어씁니다. 파일마다 필요한 설정이 다를 수 있기 때문입니다.
- 단, `--strict`(API 의 `strict: true`)는 파일 안에서 끌 수 없습니다. CI 에서 검사를 강제할 수 있어야 하기 때문입니다.
