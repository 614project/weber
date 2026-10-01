import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compile } from '../src/index.js';
import { dedent } from './helpers.js';

test('README 첫 번째 예제: head/body 가 있으면 전체 문서가 됩니다', () => {
  const result = compile(dedent(`
    head {
        title: "weber"
    }
    body {
        h1: "hello world!"
    }
  `));
  assert.equal(result.mode, 'document');
  assert.equal(
    result.html,
    dedent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>weber</title>
        </head>
        <body>
          <h1>hello world!</h1>
        </body>
      </html>
    `) + '\n',
  );
  assert.deepEqual(result.warnings, []);
});

test('README 두 번째 예제: 속성, 스타일, 이벤트, 스크립트를 알아서 구분합니다', () => {
  const result = compile(dedent(`
    div {
        class weber
        font-size 1rem
        p: "614project"
        button {
            "click me!"
            onclick {
                alert('hello')
            }
        }
        script {
            console.log("hello world!")
        }
    }
  `));
  assert.equal(result.mode, 'fragment');
  assert.equal(
    result.html,
    dedent(`
      <div class="weber" style="font-size: 1rem">
        <p>614project</p>
        <button onclick="alert('hello')">click me!</button>
        <script>
          console.log("hello world!")
        </script>
      </div>
    `) + '\n',
  );
  assert.deepEqual(result.warnings, []);
});
