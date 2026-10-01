import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { compile } from '../src/index.js';

/**
 * README 의 ```weber 코드 블록은 모두 변환되어야 하고,
 * 바로 뒤에 ```html 블록이 있으면 변환 결과가 그와 같아야 합니다.
 */
const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8');
const blocks = [...readme.matchAll(/^```(\w*)\n([\s\S]*?)^```$/gm)].map((m) => ({
  lang: m[1],
  code: m[2],
  start: m.index,
  end: m.index + m[0].length,
}));

describe('README 예제', () => {
  let count = 0;
  blocks.forEach((block, k) => {
    if (block.lang !== 'weber') return;
    const next = blocks[k + 1];
    const expected = next?.lang === 'html' && readme.slice(block.end, next.start).trim() === '' ? next.code : null;
    const line = readme.slice(0, block.start).split('\n').length;
    count++;
    test(`README.md ${line}번째 줄의 예제${expected ? ' (출력 비교)' : ''}`, () => {
      const result = compile(block.code, { filename: 'README.md' });
      if (expected !== null) assert.equal(result.html.trimEnd(), expected.trimEnd());
      assert.deepEqual(result.warnings, []);
    });
  });
  test('예제를 찾았습니다', () => assert.ok(count >= 10));
});
