import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { compile } from '../src/index.js';
import { dedent, doc, html, warnings } from './helpers.js';

describe('style 블록', () => {
  test('weber 식 선언(쌍점, 세미콜론 생략)과 일반 CSS 를 모두 받습니다', () => {
    const out = html(dedent(`
      style {
        body { margin 0; font-family "Noto Sans KR", sans-serif }
        a:hover { color: red; }
      }
    `));
    assert.equal(
      out,
      dedent(`
        <style>
          body {
            margin: 0;
            font-family: "Noto Sans KR", sans-serif;
          }
          a:hover {
            color: red;
          }
        </style>
      `),
    );
  });

  test('중첩 규칙을 펼칩니다 (&, :, 자손, 쉼표)', () => {
    const out = html(dedent(`
      style {
        .card, .box {
          padding 1rem
          h3 { margin 0 }
          &:hover, &.on { color red }
          ::before { content "" }
          > p { margin 0 }
          .dark & { color white }
        }
      }
    `));
    assert.equal(
      out,
      dedent(`
        <style>
          .card, .box {
            padding: 1rem;
          }
          .card h3, .box h3 {
            margin: 0;
          }
          .card:hover, .card.on, .box:hover, .box.on {
            color: red;
          }
          .card::before, .box::before {
            content: "";
          }
          .card > p, .box > p {
            margin: 0;
          }
          .dark .card, .dark .box {
            color: white;
          }
        </style>
      `),
    );
  });

  test('선언 사이에 중첩 규칙이 있어도 순서를 지킵니다', () => {
    const out = html('style { a { color red; b { top 0 }; color blue } }', { minify: true });
    assert.equal(out, '<style>a{color:red}a b{top:0}a{color:blue}</style>');
  });

  test('@media 를 규칙 안에 중첩할 수 있습니다', () => {
    const out = html('style { .a { top 0; @media (max-width: 600px) { top 1px; b { left 0 } } } }', { minify: true });
    assert.equal(out, '<style>.a{top:0}@media (max-width: 600px){.a{top:1px}.a b{left:0}}</style>');
  });

  test('@keyframes, @font-face, @import', () => {
    const out = html(
      dedent(`
        style {
          @keyframes spin { from { transform rotate(0) } to { transform rotate(360deg) } }
          @font-face { font-family Foo; src url(foo.woff2) }
          body { margin 0 }
          @import url("reset.css");
        }
      `),
      { minify: true },
    );
    assert.equal(
      out,
      '<style>@import url("reset.css");@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}' +
        '@font-face{font-family:Foo;src:url(foo.woff2)}body{margin:0}</style>',
    );
  });

  test('여러 줄 선택자와 여러 줄 값', () => {
    const out = html(
      dedent(`
        style {
          h1,
          h2
          {
            grid-template-areas: "a b"
                                 "c d";
            transition: color 1s,
              background 2s
          }
        }
      `),
      { minify: true },
    );
    assert.equal(out, '<style>h1, h2{grid-template-areas:"a b" "c d";transition:color 1s, background 2s}</style>');
  });

  test('url() 안의 // 와 ; 는 주석이나 구분자가 아닙니다', () => {
    const out = html('style { a { background url(//cdn.example.com/a.png); b url(data:a;b) } }', { minify: true });
    assert.equal(out, '<style>a{background:url(//cdn.example.com/a.png);b:url(data:a;b)}</style>');
  });

  test('모르는 CSS 속성은 경고합니다', () => {
    assert.match(warnings('style { a { colr red } }')[0], /'colr'은\(는\) 알려진 CSS 속성이 아닙니다. 혹시 'color'/);
    assert.deepEqual(warnings('style { @font-face { font-display swap } }'), []);
  });

  test('style 값: CSS 파일이면 link, 아니면 <style> 또는 인라인 스타일', () => {
    assert.equal(html('style: theme.css'), '<link rel="stylesheet" href="theme.css">');
    assert.equal(html('style: "a { color: red }"'), '<style>\n  a { color: red }\n</style>');
    assert.equal(html('p { style: "color: red" }'), '<p style="color: red"></p>');
  });
});

describe('요소 안의 CSS 규칙 (:hover, @media)', () => {
  test('자동 클래스를 붙이고 스타일시트로 옮깁니다', () => {
    const out = html(dedent(`
      button {
        "확인"
        color white
        :hover { color yellow }
        &:active, &.on { color red }
        @media (max-width: 600px) { display none }
      }
    `));
    assert.equal(
      out,
      dedent(`
        <style>
          .weber-1 {
            color: white;
          }
          .weber-1:hover {
            color: yellow;
          }
          .weber-1:active, .weber-1.on {
            color: red;
          }
          @media (max-width: 600px) {
            .weber-1 {
              display: none;
            }
          }
        </style>
        <button class="weber-1">확인</button>
      `),
    );
  });

  test('직접 쓴 스타일도 함께 옮겨서 :hover, @media 가 덮어쓸 수 있게 합니다', () => {
    const out = html('a { color red; style: "margin: 0; background: url(a;b.png)"; :hover { color blue } }', { minify: true });
    assert.equal(out, '<style>.weber-1{color:red;margin:0;background:url(a;b.png)}.weber-1:hover{color:blue}</style><a class="weber-1"></a>');
  });

  test('head 끝의 style 블록에 이어 붙입니다', () => {
    const out = doc('style { p { top 0 } }\np { :hover { top 1px } }', { minify: true });
    assert.match(out, /<head><meta charset="utf-8"><style>p\{top:0\}\.weber-1:hover\{top:1px\}<\/style><\/head>/);
  });

  test('id 가 있으면 id 선택자를 씁니다', () => {
    const out = html('a#home { :hover { color red } }', { minify: true });
    assert.equal(out, '<style>#home:hover{color:red}</style><a id="home"></a>');
  });

  test('문서 모드에서는 head 끝에 들어갑니다', () => {
    const out = doc('body { :hover { color red } }', { minify: true });
    assert.equal(
      out,
      '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body:hover{color:red}</style></head><body></body></html>',
    );
  });
});

describe('자바스크립트', () => {
  test('script 블록: 들여쓰기를 정리하고 내용은 그대로 둡니다', () => {
    const out = html(dedent(`
      div {
        script {
            function hi() {
                return "}"
            }
        }
      }
    `));
    assert.equal(
      out,
      dedent(`
        <div>
          <script>
            function hi() {
                return "}"
            }
          </script>
        </div>
      `),
    );
  });

  test('문자열, 템플릿, 정규식, 주석 속의 중괄호에 속지 않습니다', () => {
    const code = dedent(`
      script {
        const a = "{" + '}' + \`\${ {b: 1}.b } }\`
        const re = /[}{]/g, half = 1 / 2 / 1
        // }
        /* } */
      }
    `);
    const out = html(code);
    assert.ok(out.includes('const re = /[}{]/g, half = 1 / 2 / 1'));
    assert.ok(out.includes('/* } */\n</script>'));
  });

  test('여러 줄 템플릿 리터럴의 내용은 들여쓰기를 바꾸지 않습니다', () => {
    const out = html('div {\n  script {\n    const s = `a\nb`\n  }\n}');
    assert.equal(out, '<div>\n  <script>\n    const s = `a\nb`\n  </script>\n</div>');
  });

  test('</script> 는 이스케이프됩니다', () => {
    assert.equal(html('script { x = "</script>" }'), '<script>\n  x = "<\\/script>"\n</script>');
  });

  test('script 값: 파일이나 URL 이면 src, 아니면 코드', () => {
    assert.equal(html('script: app.js'), '<script src="app.js"></script>');
    assert.equal(html('script: https://unpkg.com/htmx.org@2'), '<script src="https://unpkg.com/htmx.org@2"></script>');
    assert.equal(html('script[type=module]: ./main.mjs'), '<script type="module" src="./main.mjs"></script>');
    assert.equal(html('script: alert(1); alert(2)'), '<script>\n  alert(1); alert(2)\n</script>');
  });

  test('script { src ... } 는 경고합니다', () => {
    assert.match(warnings('script { src: "a.js" }')[0], /script: 파일\.js/);
  });

  test('이벤트: 한 줄 값과 블록', () => {
    assert.equal(html('button { onclick: count++; save() }'), '<button onclick="count++; save()"></button>');
    assert.equal(
      html('button { onclick { if (a) { b("x") }\n  c() } }'),
      '<button onclick=\'if (a) { b("x") }\nc()\'></button>',
    );
    assert.equal(html("a { onclick: \"alert('hi')\" }"), '<a onclick="alert(\'hi\')"></a>');
  });

  test('이벤트 값의 & 는 꼭 필요할 때만 이스케이프합니다', () => {
    assert.equal(html('a {\n  onclick: a && b\n  href "?x=1&y=2"\n}'), '<a onclick="a && b" href="?x=1&amp;y=2"></a>');
  });

  test('이벤트의 한 줄 값은 세미콜론을 포함해 줄 끝까지입니다', () => {
    assert.equal(html('a { onclick: a(); b(); "텍스트" }'), '<a onclick=\'a(); b(); "텍스트"\'></a>');
  });
});

describe('출력 옵션', () => {
  const code = 'div { p: "a"; span: "b" }';

  test('minify', () => {
    assert.equal(html(code, { minify: true }), '<div><p>a</p><span>b</span></div>');
  });

  test('indent', () => {
    assert.equal(html(code, { indent: 4 }), '<div>\n    <p>a</p>\n    <span>b</span>\n</div>');
    assert.equal(html(code, { indent: '\t' }), '<div>\n\t<p>a</p>\n\t<span>b</span>\n</div>');
  });

  test('인라인 요소 사이에는 공백을 넣지 않습니다', () => {
    assert.equal(html('nav { a: "홈"; a: "소개" }'), '<nav><a>홈</a><a>소개</a></nav>');
    assert.equal(html('p { "안녕, "; b: "세상"; "!" }'), '<p>안녕, <b>세상</b>!</p>');
  });

  test('pre 내용이 줄바꿈으로 시작하면 줄바꿈을 하나 더 넣습니다', () => {
    assert.equal(html('pre: "\\nx"'), '<pre>\n\nx</pre>');
  });

  test('pre 안에서는 줄을 바꾸지 않습니다', () => {
    assert.equal(html('pre { code { div: "x" } }'), '<pre><code><div>x</div></code></pre>');
  });

  test('파일 이름은 오류 위치에 표시됩니다', () => {
    assert.throws(() => compile('p: "x', { filename: 'a.weber' }), /a\.weber:1:4/);
  });
});
