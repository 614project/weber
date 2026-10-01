import { compile, type CompileOptions } from '../src/index.js';

/** 조각(fragment) 모드로 변환한 HTML (끝 줄바꿈 제거) */
export function html(code: string, options: CompileOptions = {}): string {
  return compile(code, { mode: 'fragment', ...options }).html.replace(/\n$/, '');
}

/** 전체 문서 모드로 변환한 HTML (끝 줄바꿈 제거) */
export function doc(code: string, options: CompileOptions = {}): string {
  return compile(code, { mode: 'document', ...options }).html.replace(/\n$/, '');
}

/** 경고 메시지 목록 */
export function warnings(code: string, options: CompileOptions = {}): string[] {
  return compile(code, { mode: 'fragment', ...options }).warnings.map((w) => w.message);
}

/** 여러 줄 문자열의 공통 들여쓰기를 제거합니다. */
export function dedent(text: string): string {
  const lines = text.replace(/^\n/, '').replace(/\n[ \t]*$/, '').split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => /^ */.exec(l)![0].length));
  return lines.map((l) => l.slice(indent)).join('\n');
}
