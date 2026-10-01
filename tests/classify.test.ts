import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { classify } from '../src/index.js';
import { doc, html, warnings } from './helpers.js';

const kind = (key: string, value: string | null, tag: string | null, ns: 'html' | 'svg' | 'math' = 'html') =>
  classify(key, value, { tag, ns }).kind;

describe('판별: HTML 요소 / HTML 속성 / CSS / JS', () => {
  test('기본 판별', () => {
    assert.equal(kind('p', 'hello', 'div'), 'element');
    assert.equal(kind('class', 'a', 'div'), 'attribute');
    assert.equal(kind('font-size', '1rem', 'div'), 'style');
    assert.equal(kind('onclick', 'go()', 'div'), 'event');
    assert.equal(kind('--accent', 'red', 'div'), 'style');
    assert.equal(kind('-webkit-line-clamp', '2', 'div'), 'style');
    assert.equal(kind('data-id', '3', 'div'), 'attribute');
    assert.equal(kind('aria-label', 'x', 'div'), 'attribute');
  });

  test('title: head 에서는 요소, 그 밖에서는 속성', () => {
    assert.equal(kind('title', 'x', 'head'), 'element');
    assert.equal(kind('title', 'x', 'div'), 'attribute');
    assert.equal(kind('title', 'x', null), 'element');
    assert.equal(kind('title', 'x', 'svg', 'svg'), 'element');
  });

  test('width/height: img 에 정수면 속성, 단위가 있으면 CSS', () => {
    assert.equal(kind('width', '100', 'img'), 'attribute');
    assert.equal(kind('width', '100px', 'img'), 'style');
    assert.equal(kind('width', '50%', 'canvas'), 'style');
    assert.equal(kind('width', '100', 'div'), 'style');
    assert.equal(kind('height', '300', 'canvas'), 'attribute');
  });

  test('부모 요소 전용 속성이 우선합니다', () => {
    assert.equal(kind('content', 'x', 'meta'), 'attribute');
    assert.equal(kind('content', '"x"', 'div'), 'style');
    assert.equal(kind('label', 'A', 'option'), 'attribute');
    assert.equal(kind('label', '이름', 'form'), 'element');
    assert.equal(kind('span', '2', 'col'), 'attribute');
    assert.equal(kind('span', 'x', 'p'), 'element');
    assert.equal(kind('form', 'f1', 'input'), 'attribute');
    assert.equal(kind('size', '20', 'input'), 'attribute');
    assert.equal(kind('border', '1', 'table'), 'attribute');
    assert.equal(kind('border', '1px solid', 'table'), 'style');
  });

  test('cite: URL 이면 속성, 아니면 요소', () => {
    assert.equal(kind('cite', 'https://example.com', 'blockquote'), 'attribute');
    assert.equal(kind('cite', '누군가', 'blockquote'), 'element');
  });

  test('translate: yes/no 면 속성, 아니면 CSS', () => {
    assert.equal(kind('translate', 'no', 'p'), 'attribute');
    assert.equal(kind('translate', '10px', 'p'), 'style');
  });

  test('head 편의 문법', () => {
    assert.equal(kind('charset', 'utf-8', 'head'), 'meta-charset');
    assert.equal(kind('viewport', 'width=device-width', 'head'), 'meta-name');
    assert.equal(kind('og-title', 'x', 'head'), 'meta-name');
    assert.equal(kind('icon', 'a.png', 'head'), 'link-icon');
    assert.equal(kind('lang', 'ko', 'head'), 'attribute');
  });

  test('SVG', () => {
    assert.equal(kind('cx', '10', 'circle', 'svg'), 'attribute');
    assert.equal(kind('fill', 'red', 'circle', 'svg'), 'attribute');
    assert.equal(kind('viewbox', '0 0 1 1', 'svg', 'svg'), 'attribute');
    assert.equal(kind('circle', null, 'svg', 'svg'), 'element');
    assert.equal(kind('path', 'M0 0', 'svg', 'svg'), 'element');
    assert.equal(kind('path', 'M0 0', 'animateMotion', 'svg'), 'attribute');
    assert.equal(kind('mix-blend-mode', 'multiply', 'g', 'svg'), 'style');
  });

  test('MathML', () => {
    assert.equal(kind('mi', 'x', 'math', 'math'), 'element');
    assert.equal(kind('mathvariant', 'bold', 'mi', 'math'), 'attribute');
  });
});

describe('판별 결과 출력', () => {
  test('불리언 속성', () => {
    assert.equal(
      html('input { checked; disabled false; required true; hidden until-found }'),
      '<input checked required hidden="until-found">',
    );
  });

  test('불리언이 아닌 속성의 true/false 는 그대로', () => {
    assert.equal(html('div { draggable true; contenteditable false }'), '<div draggable="true" contenteditable="false"></div>');
  });

  test('값이 없는 요소 이름은 빈 요소', () => {
    assert.equal(html('div { hr; p }'), '<div>\n  <hr>\n  <p></p>\n</div>');
  });

  test('값을 주면 주요 속성으로 들어가는 요소', () => {
    assert.equal(html('img: cat.png'), '<img src="cat.png">');
    assert.equal(html('iframe: "https://example.com"'), '<iframe src="https://example.com"></iframe>');
    assert.equal(html('input: email'), '<input type="email">');
    assert.equal(html('video: intro.mp4'), '<video src="intro.mp4"></video>');
    assert.equal(html('video: "지원하지 않는 브라우저입니다"'), '<video>지원하지 않는 브라우저입니다</video>');
  });

  test('CSS 값은 따옴표를 그대로 둡니다', () => {
    assert.equal(
      html('p { font-family "Noto Sans KR", sans-serif; content: "→" }'),
      '<p style=\'font-family: "Noto Sans KR", sans-serif; content: "→"\'></p>',
    );
  });

  test('style 속성 문자열은 인라인 스타일에 합쳐집니다', () => {
    assert.equal(html('p { color red; style: "margin: 0;" }'), '<p style="color: red; margin: 0"></p>');
  });

  test('id 가 두 번이면 경고하고 마지막 값을 씁니다', () => {
    assert.equal(html('div { id a; id b }'), '<div id="b"></div>');
    assert.match(warnings('div { id a; id b }')[0], /여러 번/);
  });

  test('블록이 붙으면 항상 요소입니다', () => {
    assert.equal(html('div { title { "x" } }'), '<div>\n  <title>x</title>\n</div>');
    assert.equal(html('my-card { "x" }'), '<my-card>x</my-card>');
  });

  test('사용자 정의 속성 (htmx, alpine 등)', () => {
    assert.equal(html('button { hx-get /api; x-on-click open }'), '<button hx-get="/api" x-on-click="open"></button>');
    assert.deepEqual(warnings('button { hx-get /api }'), []);
  });
});

describe('경고', () => {
  test('오타는 비슷한 이름을 제안합니다', () => {
    assert.match(warnings('div { font-szie 12px }')[0], /'font-size'/);
    assert.match(warnings('div { colr red }')[0], /'color'/);
  });

  test('모르는 이름', () => {
    assert.match(warnings('div { zzzz 1 }')[0], /알 수 없는 이름 'zzzz'/);
  });

  test('요소에 맞지 않는 속성', () => {
    assert.match(warnings('div { href /x }')[0], /<div> 요소에서 쓰이지 않는/);
    assert.deepEqual(warnings('a { href /x }'), []);
  });

  test('모르는 요소, CSS 속성에 붙은 블록', () => {
    assert.match(warnings('dvi { }')[0], /알려진 요소가 아닙니다. 혹시 'div'/);
    assert.match(warnings('margin { }')[0], /CSS 속성인데/);
  });
});

describe('문서 구조 자동 완성', () => {
  test('최상위 문장은 html / head / body 로 나뉩니다', () => {
    const out = doc(`
lang ko
title: "제목"
charset euc-kr
viewport "width=device-width"
style: main.css
script: lib.js
h1: "안녕"
script: app.js
`);
    assert.equal(
      out,
      [
        '<!DOCTYPE html>',
        '<html lang="ko">',
        '  <head>',
        '    <title>제목</title>',
        '    <meta charset="euc-kr">',
        '    <meta name="viewport" content="width=device-width">',
        '    <link rel="stylesheet" href="main.css">',
        '    <script src="lib.js"></script>',
        '  </head>',
        '  <body>',
        '    <h1>안녕</h1>',
        '    <script src="app.js"></script>',
        '  </body>',
        '</html>',
      ].join('\n'),
    );
  });

  test('charset 이 없으면 utf-8 을 넣습니다', () => {
    assert.match(doc('p: x'), /<head>\n {4}<meta charset="utf-8">\n {2}<\/head>/);
  });

  test('html / head / body 블록과 선택자', () => {
    const out = doc('html { lang en; body.dark { p: x } }');
    assert.match(out, /<html lang="en">/);
    assert.match(out, /<body class="dark">\n {4}<p>x<\/p>\n {2}<\/body>/);
  });

  test('auto 모드는 head/body/title 등이 있을 때 문서가 됩니다', async () => {
    const { compile } = await import('../src/index.js');
    assert.equal(compile('title: "x"').mode, 'document');
    assert.equal(compile('body { }').mode, 'document');
    assert.equal(compile('div { }').mode, 'fragment');
  });
});
