/** 소스 코드와 위치(줄/칸) 정보를 다룹니다. */
export interface Position {
  /** 1부터 시작하는 줄 번호 */
  line: number;
  /** 1부터 시작하는 칸 번호 */
  column: number;
}

export class Source {
  readonly text: string;
  readonly filename: string | undefined;
  readonly #lineStarts: number[] = [0];

  constructor(text: string, filename?: string) {
    // BOM 제거, 줄바꿈 통일
    this.text = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    this.filename = filename;
    for (let i = 0; i < this.text.length; i++) {
      if (this.text[i] === '\n') this.#lineStarts.push(i + 1);
    }
  }

  /** 오프셋을 줄/칸 위치로 바꿉니다. */
  position(offset: number): Position {
    const starts = this.#lineStarts;
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, column: offset - starts[lo] + 1 };
  }

  /** 해당 줄의 내용 (줄바꿈 제외) */
  lineText(line: number): string {
    const start = this.#lineStarts[line - 1] ?? this.text.length;
    const end = this.#lineStarts[line] !== undefined ? this.#lineStarts[line] - 1 : this.text.length;
    return this.text.slice(start, end);
  }
}
