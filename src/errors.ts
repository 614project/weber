import type { Source } from './source.js';

/** 컴파일 중 발생한 경고 */
export interface Diagnostic {
  message: string;
  filename?: string;
  line: number;
  column: number;
}

/** 문법 오류 등, 컴파일을 계속할 수 없는 오류 */
export class WeberError extends Error {
  readonly filename: string | undefined;
  readonly line: number;
  readonly column: number;
  /** 오류 위치를 표시한 소스 코드 조각 */
  readonly frame: string;
  /** 오류 메시지만 (위치 정보 제외) */
  readonly reason: string;

  constructor(reason: string, source: Source, offset: number) {
    const { line, column } = source.position(offset);
    const where = `${source.filename ?? '<입력>'}:${line}:${column}`;
    super(`${reason} (${where})`);
    this.name = 'WeberError';
    this.reason = reason;
    this.filename = source.filename;
    this.line = line;
    this.column = column;
    this.frame = codeFrame(source, line, column);
  }

  /** 사람이 읽기 좋은 형태의 전체 오류 메시지 */
  format(): string {
    return `weber 오류: ${this.message}\n${this.frame}`;
  }
}

/** 오류 위치 주변의 코드를 보여주는 조각을 만듭니다. */
export function codeFrame(source: Source, line: number, column: number): string {
  const lines: string[] = [];
  const width = String(line + 1).length;
  for (let n = Math.max(1, line - 1); n <= line; n++) {
    lines.push(` ${String(n).padStart(width)} | ${source.lineText(n).replace(/\t/g, ' ')}`);
  }
  lines.push(` ${' '.repeat(width)} | ${' '.repeat(Math.max(0, column - 1))}^`);
  return lines.join('\n');
}
