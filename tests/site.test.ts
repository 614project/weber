import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { compile } from '../src/index.js';

/** introduce/ 의 weber 사이트와 플레이그라운드 예제가 경고 없이 변환되는지 확인합니다. */
const site = new URL('../../introduce/', import.meta.url);

describe('weber 사이트 (introduce/)', () => {
  for (const file of readdirSync(site).filter((f) => f.endsWith('.weber'))) {
    test(`${file} 는 경고 없이 전체 문서로 변환됩니다`, () => {
      const result = compile(readFileSync(new URL(file, site), 'utf8'), { filename: file });
      assert.equal(result.mode, 'document');
      assert.deepEqual(result.warnings, []);
    });
  }

  test('플레이그라운드 예제는 모두 경고 없이 변환됩니다', async () => {
    const { EXAMPLES } = await import(new URL('examples.js', site).href);
    assert.ok(EXAMPLES.length > 0);
    for (const example of EXAMPLES as { id: string; code: string }[]) {
      assert.deepEqual(compile(example.code).warnings, [], example.id);
    }
  });
});
