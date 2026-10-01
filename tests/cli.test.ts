import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../src/index.js';

const CLI = fileURLToPath(new URL('../src/cli.js', import.meta.url));
const dir = mkdtempSync(path.join(tmpdir(), 'weber-cli-'));
after(() => rmSync(dir, { recursive: true, force: true }));

function weber(args: string[], input?: string) {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    cwd: dir,
    input,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

describe('CLI', () => {
  writeFileSync(path.join(dir, 'page.weber'), 'body {\n  h1: "안녕"\n}\n');

  test('파일 옆에 .html 을 만듭니다', () => {
    const r = weber(['page.weber']);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stderr, /page\.weber → page\.html/);
    assert.match(readFileSync(path.join(dir, 'page.html'), 'utf8'), /<h1>안녕<\/h1>/);
  });

  test('-o 로 출력 파일을 지정합니다', () => {
    const r = weber(['page.weber', '-o', 'out/index.html', '--minify']);
    assert.equal(r.status, 0, r.stderr);
    assert.match(readFileSync(path.join(dir, 'out/index.html'), 'utf8'), /^<!DOCTYPE html><html><head>/);
  });

  test('--stdout, --fragment, --indent', () => {
    const r = weber(['page.weber', '--stdout', '--fragment', '--indent=4']);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, '<body>\n    <h1>안녕</h1>\n</body>\n');
  });

  test('표준 입력', () => {
    const r = weber(['-'], 'p: "hi"');
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, '<p>hi</p>\n');
  });

  test('폴더를 통째로 변환합니다', () => {
    mkdirSync(path.join(dir, 'site/blog'), { recursive: true });
    writeFileSync(path.join(dir, 'site/index.weber'), 'title: "홈"');
    writeFileSync(path.join(dir, 'site/blog/post.weber'), 'title: "글"');
    const r = weber(['site', '-o', 'dist']);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(path.join(dir, 'dist/index.html')));
    assert.ok(existsSync(path.join(dir, 'dist/blog/post.html')));
  });

  test('경고는 표준 에러로, --quiet 이면 숨깁니다', () => {
    writeFileSync(path.join(dir, 'warn.weber'), 'div { colr red }');
    assert.match(weber(['warn.weber', '--stdout']).stderr, /경고: .*'color'.*warn\.weber:1:7/);
    assert.equal(weber(['warn.weber', '--stdout', '-q']).stderr, '');
  });

  test('문법 오류는 위치와 함께 알리고 1 로 끝납니다', () => {
    writeFileSync(path.join(dir, 'bad.weber'), 'div {\n  p: "oops\n}\n');
    const r = weber(['bad.weber']);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /weber 오류: 문자열이 닫히지 않았습니다.*bad\.weber:2:6/);
    assert.match(r.stderr, / 2 \|   p: "oops/);
  });

  test('없는 파일, 잘못된 옵션', () => {
    assert.equal(weber(['nope.weber']).status, 1);
    assert.equal(weber(['--wat']).status, 2);
  });

  test('--version, --help', () => {
    assert.equal(weber(['--version']).stdout.trim(), VERSION);
    assert.match(weber(['--help']).stdout, /사용법: weber/);
  });

  test('package.json 의 버전과 같습니다', () => {
    const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
    assert.equal(pkg.version, VERSION);
  });
});
