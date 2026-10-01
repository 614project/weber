import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { compile, parse, WeberError } from '../src/index.js';
import { dedent, html } from './helpers.js';

describe('기본 문법', () => {
  test('`key: value` 와 `key value` 는 같습니다', () => {
    assert.equal(html('div { class: a; color: red }'), html('div { class a; color red }'));
    assert.equal(html('p: hello'), '<p>hello</p>');
    assert.equal(html('p hello'), '<p>hello</p>');
  });

  test('따옴표 문자열과 이스케이프', () => {
    assert.equal(html(`p: "say \\"hi\\""`), '<p>say "hi"</p>');
    assert.equal(html(`p: 'it\\'s'`), "<p>it's</p>");
    assert.equal(html('p: "\\u{1F600} \\u00e9 \\x41"'), '<p>😀 é A</p>');
    assert.equal(html('p: "<b>&amp;</b>"'), '<p>&lt;b&gt;&amp;amp;&lt;/b&gt;</p>');
  });

  test('따옴표 없는 텍스트 안의 작은따옴표', () => {
    assert.equal(html("p: it's mine"), "<p>it's mine</p>");
  });

  test('백틱 문자열은 여러 줄을 허용합니다', () => {
    assert.equal(html('pre {\n  `line 1\n  line 2`\n}'), '<pre>line 1\n  line 2</pre>');
  });

  test('세미콜론으로 한 줄에 여러 문장을 쓸 수 있습니다', () => {
    assert.equal(html('p { "a"; b: "b"; color red }'), '<p style="color: red">a<b>b</b></p>');
  });

  test('값과 블록을 함께 쓸 수 있습니다', () => {
    assert.equal(html('a: "홈" { href / }'), '<a href="/">홈</a>');
  });

  test('여는 중괄호를 다음 줄에 써도 됩니다', () => {
    assert.equal(html('div\n{\n  p: x\n}'), '<div>\n  <p>x</p>\n</div>');
  });

  test('주석', () => {
    const code = dedent(`
      // 한 줄 주석
      div { /* 블록 주석 */
        p: hi // 끝 주석
        a { href https://example.com/path }
        input { accept image/* }
      }
    `);
    assert.equal(
      html(code),
      dedent(`
        <div>
          <p>hi</p>
          <a href="https://example.com/path"></a><input accept="image/*">
        </div>
      `),
    );
  });

  test('값 중간의 블록 주석은 지워집니다', () => {
    assert.equal(html('p { color red /* 빨강 */ }'), '<p style="color: red"></p>');
  });

  test('괄호 안의 세미콜론은 값의 일부입니다', () => {
    assert.equal(
      html('div { background url(data:image/png;base64,AAA=) }'),
      '<div style="background: url(data:image/png;base64,AAA=)"></div>',
    );
  });
});

describe('선택자 축약', () => {
  test('태그.클래스#아이디[속성]', () => {
    assert.equal(
      html('a.btn.primary#go[href="/next"][target=_blank]: "다음"'),
      '<a id="go" class="btn primary" href="/next" target="_blank">다음</a>',
    );
  });

  test('태그를 생략하면 div', () => {
    assert.equal(html('.card { "x" }'), '<div class="card">x</div>');
    assert.equal(html('#main { }'), '<div id="main"></div>');
  });

  test('값이 없는 [속성] 은 불리언 속성', () => {
    assert.equal(html('input[required][type=email]'), '<input required type="email">');
  });

  test('선택자의 클래스와 class 문장은 합쳐집니다', () => {
    assert.equal(html('p.a { class "b a c" }'), '<p class="a b c"></p>');
  });
});

describe('구문 트리', () => {
  test('parse() 는 구문 트리를 돌려줍니다', () => {
    const [node] = parse('a.x: "hi" { href / }');
    assert.equal(node.type, 'entry');
    if (node.type !== 'entry') return;
    assert.equal(node.key, 'a');
    assert.deepEqual(node.selector, { id: null, classes: ['x'], attributes: [] });
    assert.equal(node.value?.text, 'hi');
    assert.equal(node.value?.quoted, true);
    assert.equal(node.body?.type, 'nodes');
  });
});

describe('오류', () => {
  const error = (code: string): WeberError => {
    try {
      compile(code, { filename: 'test.weber' });
    } catch (e) {
      assert.ok(e instanceof WeberError, String(e));
      return e;
    }
    assert.fail('오류가 발생해야 합니다');
  };

  test('닫히지 않은 문자열', () => {
    const e = error('div {\n  p: "hello\n}');
    assert.match(e.reason, /문자열이 닫히지 않았습니다/);
    assert.equal(e.line, 2);
    assert.equal(e.column, 6);
    assert.match(e.format(), /test\.weber:2:6/);
    assert.match(e.frame, / 2 \|   p: "hello\n {3}\| {6}\^/);
  });

  test('닫히지 않은 블록', () => {
    const e = error('div {\n  p: hi');
    assert.match(e.reason, /블록이 닫히지 않았습니다/);
    assert.deepEqual([e.line, e.column], [1, 5]);
  });

  test('짝이 맞지 않는 }', () => {
    assert.match(error('p: a\n}').reason, /짝이 맞지 않는/);
  });

  test('한 줄에 두 문장', () => {
    assert.match(error('p { "a" "b" }').reason, /한 줄에 하나씩/);
  });

  test('빈 요소에 내용', () => {
    assert.match(error('img { p: "x" }').reason, /내용을 가질 수 없는/);
    assert.match(error('br: x').reason, /내용을 가질 수 없는/);
  });

  test('조각의 최상위 속성', () => {
    assert.match(error('color red').reason, /최상위에는 속성이나 스타일을/);
  });

  test('잘못된 input type', () => {
    assert.match(error('input: banana').reason, /type 이 아닙니다/);
  });

  test('CSS 속성에 값이 없음', () => {
    assert.match(error('div { color }').reason, /값이 없습니다/);
    assert.match(error('style { a { color } }').reason, /값이 없습니다/);
  });

  test('잘못된 이스케이프', () => {
    assert.match(error('p: "\\u{zz}"').reason, /이스케이프/);
  });

  test('닫히지 않은 코드 블록', () => {
    assert.match(error('div { onclick { alert(1) }').reason, /블록이 닫히지 않았습니다/);
  });

  test('요소 안의 : 로 시작하는 문장은 블록이어야 합니다', () => {
    assert.match(error('div { :hover }').reason, /`\{`가 필요합니다/);
  });
});
