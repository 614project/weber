/**
 * weber — `key { ... }` 와 `key: value` 를 쌓아 웹을 만드는 언어.
 *
 * ```ts
 * import { compile } from 'weber';
 * const { html } = compile('body {\n  h1: "hello world!"\n}');
 * ```
 */
import type { WeberNode } from './ast.js';
import type { Diagnostic } from './errors.js';
import { parse as parseSource } from './parser.js';
import { print } from './printer.js';
import { Source } from './source.js';
import { Transformer, type OutputMode } from './transform.js';

export type * from './ast.js';
export { classify, type Context, type Decision, type Namespace } from './classify.js';
export { WeberError, type Diagnostic } from './errors.js';
export type { OutputMode } from './transform.js';
export { VERSION } from './version.js';

export interface CompileOptions {
  /** 오류 메시지에 표시할 파일 이름 */
  filename?: string;
  /**
   * 출력 형태
   *  - `auto` (기본값): 최상위에 html/head/body/title 등이 있으면 전체 문서, 아니면 조각
   *  - `document`: 항상 `<!DOCTYPE html>` 로 시작하는 전체 문서
   *  - `fragment`: 쓴 내용만 출력
   */
  mode?: OutputMode;
  /** 공백 없이 압축해서 출력 (기본값 false) */
  minify?: boolean;
  /** 들여쓰기 칸 수 또는 문자열 (기본값 2) */
  indent?: number | string;
}

export interface CompileResult {
  html: string;
  /** 실제로 출력된 형태 */
  mode: 'document' | 'fragment';
  warnings: Diagnostic[];
}

/**
 * weber 코드를 HTML 로 변환합니다.
 * @throws {WeberError} 문법 오류가 있을 때
 */
export function compile(code: string, options: CompileOptions = {}): CompileResult {
  const source = new Source(code, options.filename);
  const nodes = parseSource(source);
  const transformer = new Transformer(source);
  const doc = transformer.transform(nodes, options.mode ?? 'auto');
  const indent = typeof options.indent === 'string' ? options.indent : ' '.repeat(options.indent ?? 2);
  const html = print(doc, { indent, minify: options.minify ?? false });
  return { html, mode: doc.kind, warnings: transformer.warnings };
}

/** weber 코드를 구문 트리로 바꿉니다. (도구 제작용) */
export function parse(code: string, filename?: string): WeberNode[] {
  return parseSource(new Source(code, filename));
}
