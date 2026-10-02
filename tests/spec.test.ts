import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { compile } from '../src/index.js';

/**
 * docs/ 의 언어 명세를 검사합니다.
 *  - ```weber 예제는 변환되어야 하고, 바로 뒤에 ```html 이 있으면 결과가 같아야 합니다.
 *    아직 구현하지 않은 기능의 예제는 ```weber 예정 으로 표시하며 검사하지 않습니다.
 *  - 문서 사이의 링크와 #앵커가 실제로 있는 파일과 제목을 가리켜야 합니다.
 */
const docs = fileURLToPath(new URL('../../docs/', import.meta.url));

function markdownFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return markdownFiles(full);
    return entry.name.endsWith('.md') ? [full] : [];
  });
}

const files = markdownFiles(docs).sort();
const relative = (file: string) => path.relative(path.join(docs, '..'), file);
const lineOf = (text: string, offset: number) => text.slice(0, offset).split('\n').length;

interface Fence {
  info: string;
  code: string;
  start: number;
  end: number;
}

function fences(text: string): Fence[] {
  return [...text.matchAll(/^```([^\n`]*)\n([\s\S]*?)^```$/gm)].map((m) => ({
    info: m[1].trim(),
    code: m[2],
    start: m.index,
    end: m.index + m[0].length,
  }));
}

describe('언어 명세의 예제', () => {
  let implemented = 0;
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const blocks = fences(text);
    blocks.forEach((block, k) => {
      if (block.info !== 'weber') return;
      implemented++;
      const next = blocks[k + 1];
      const expected =
        next?.info === 'html' && text.slice(block.end, next.start).trim() === '' ? next.code : null;
      test(`${relative(file)}:${lineOf(text, block.start)}${expected ? ' (출력 비교)' : ''}`, () => {
        const result = compile(block.code, { filename: relative(file) });
        if (expected !== null) assert.equal(result.html.trimEnd(), expected.trimEnd());
      });
    });
  }
  test('구현된 기능의 예제를 찾았습니다', () => assert.ok(implemented >= 20, `예제 ${implemented}개`));
});

/** GitHub 이 제목에 붙이는 앵커 */
function slug(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

const anchorCache = new Map<string, Set<string>>();
function anchors(file: string): Set<string> {
  let set = anchorCache.get(file);
  if (!set) {
    set = new Set();
    const seen = new Map<string, number>();
    const body = readFileSync(file, 'utf8').replace(/^```[\s\S]*?^```$/gm, '');
    for (const m of body.matchAll(/^#{1,6}\s+(.+)$/gm)) {
      const base = slug(m[1]);
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      set.add(count ? `${base}-${count}` : base);
    }
    anchorCache.set(file, set);
  }
  return set;
}

describe('언어 명세의 링크', () => {
  for (const file of files) {
    test(relative(file), () => {
      const body = readFileSync(file, 'utf8').replace(/^```[\s\S]*?^```$/gm, '');
      for (const m of body.matchAll(/\]\(([^)\s]+)\)/g)) {
        const target = m[1];
        if (/^(https?:|mailto:)/.test(target)) continue;
        const [p, anchor] = target.split('#');
        const dest = p ? path.resolve(path.dirname(file), p) : file;
        assert.ok(existsSync(dest), `링크 대상이 없습니다: ${target}`);
        if (anchor && dest.endsWith('.md')) {
          assert.ok(anchors(dest).has(decodeURIComponent(anchor)), `앵커가 없습니다: ${target}`);
        }
      }
    });
  }
});
