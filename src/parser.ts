import type {
  Body,
  CssItem,
  CssRuleNode,
  EntryNode,
  SelectorParts,
  TextNode,
  ValueNode,
  WeberNode,
} from './ast.js';
import { WeberError } from './errors.js';
import { scanJs } from './js-scanner.js';
import { Source } from './source.js';
import { findQuoteEnd, readQuoted, unquote } from './text.js';

/** weber 소스 코드를 구문 트리로 바꿉니다. */
export function parse(source: Source): WeberNode[] {
  return new Parser(source).parseProgram();
}

/** 블록 내용을 읽는 방식 */
type BodyMode = 'nodes' | 'code' | 'css';

/** 키 이름으로 블록을 읽는 방식을 정합니다. */
export function bodyModeOf(key: string): BodyMode {
  const lower = key.toLowerCase();
  if (lower === 'script' || /^on[a-z]+$/.test(lower)) return 'code';
  if (lower === 'style') return 'css';
  return 'nodes';
}

const isSpace = (c: string | undefined) => c === ' ' || c === '\t';
const isWhitespace = (c: string | undefined) => c === ' ' || c === '\t' || c === '\n';
const isQuote = (c: string | undefined) => c === '"' || c === "'" || c === '`';
const isIdentChar = (c: string | undefined) => c !== undefined && /[A-Za-z0-9_-]/.test(c);
const isKeyStart = (c: string | undefined) => c !== undefined && /[A-Za-z_.#[-]/.test(c);
const VALID_KEY = /^-{0,2}[A-Za-z_][A-Za-z0-9_-]*$/;

class Parser {
  readonly source: Source;
  readonly s: string;
  i = 0;

  constructor(source: Source) {
    this.source = source;
    this.s = source.text;
  }

  error(message: string, offset = this.i): never {
    throw new WeberError(message, this.source, offset);
  }

  peek(ahead = 0): string | undefined {
    return this.s[this.i + ahead];
  }

  startsWith(text: string, at = this.i): boolean {
    return this.s.startsWith(text, at);
  }

  parseProgram(): WeberNode[] {
    return this.parseNodes(null);
  }

  // ───────────────────────── 공백과 주석 ─────────────────────────

  skipSpaces(): void {
    while (isSpace(this.peek())) this.i++;
  }

  skipBlockComment(): void {
    const close = this.s.indexOf('*/', this.i + 2);
    if (close < 0) this.error('주석이 닫히지 않았습니다. `*/`가 필요합니다.');
    this.i = close + 2;
  }

  skipLineComment(): void {
    while (this.i < this.s.length && this.s[this.i] !== '\n') this.i++;
  }

  /** 문장 사이의 공백, 줄바꿈, 세미콜론, 주석을 건너뜁니다. */
  skipTrivia(): void {
    for (;;) {
      const c = this.peek();
      if (isWhitespace(c) || c === ';') this.i++;
      else if (this.startsWith('//')) this.skipLineComment();
      else if (this.startsWith('/*')) this.skipBlockComment();
      else return;
    }
  }

  /** from 부터 공백, 줄바꿈, 주석을 건너뛴 위치 */
  nextSignificant(from: number): number {
    let j = from;
    for (;;) {
      if (isWhitespace(this.s[j])) j++;
      else if (this.startsWith('//', j)) {
        while (j < this.s.length && this.s[j] !== '\n') j++;
      } else if (this.startsWith('/*', j)) {
        const close = this.s.indexOf('*/', j + 2);
        if (close < 0) return this.s.length;
        j = close + 2;
      } else return j;
    }
  }

  /** end 앞의 공백을 뺀 위치 (start 보다 앞으로 가지 않음) */
  trimmedEnd(start: number, end: number): number {
    while (end > start && isWhitespace(this.s[end - 1])) end--;
    return end;
  }

  /** 한 문장이 끝났는지 확인합니다. (줄바꿈, `;`, `}`, 파일 끝) */
  expectEndOfStatement(): void {
    for (;;) {
      this.skipSpaces();
      if (this.startsWith('/*')) this.skipBlockComment();
      else if (this.startsWith('//')) this.skipLineComment();
      else break;
    }
    const c = this.peek();
    if (c === undefined || c === '\n' || c === ';' || c === '}') return;
    this.error(`여기에 '${c}'이(가) 올 수 없습니다. 문장은 한 줄에 하나씩 쓰거나 ';'로 구분하세요.`);
  }

  // ───────────────────────── weber 문장 ─────────────────────────

  /** 문장 목록을 읽습니다. openOffset 이 있으면 `}`에서 멈춥니다. (소비하지 않음) */
  parseNodes(openOffset: number | null): WeberNode[] {
    const nodes: WeberNode[] = [];
    for (;;) {
      this.skipTrivia();
      const c = this.peek();
      if (c === undefined) {
        if (openOffset !== null) this.error('블록이 닫히지 않았습니다. `}`가 필요합니다.', openOffset);
        return nodes;
      }
      if (c === '}') {
        if (openOffset === null) this.error('짝이 맞지 않는 `}`입니다.');
        return nodes;
      }
      nodes.push(this.parseNode());
      this.expectEndOfStatement();
    }
  }

  parseNode(): WeberNode {
    const c = this.peek();
    if (isQuote(c)) return this.parseText();
    if (c === ':' || c === '&' || c === '@') return this.parseNestedRule();
    if (isKeyStart(c)) return this.parseEntry();
    return this.error(`예상하지 못한 문자 '${c}'입니다. 텍스트라면 따옴표로 감싸세요.`);
  }

  parseText(): TextNode {
    const start = this.i;
    const value = this.readString();
    return { type: 'text', value, span: { start, end: this.i } };
  }

  readString(): string {
    const r = readQuoted(this.s, this.i);
    if ('error' in r) this.error(r.error, r.at);
    this.i = r.end;
    return r.value;
  }

  readIdent(): string {
    const start = this.i;
    while (isIdentChar(this.peek())) this.i++;
    return this.s.slice(start, this.i);
  }

  parseEntry(): EntryNode {
    const start = this.i;
    const key = this.readIdent();
    if (key && !VALID_KEY.test(key)) this.error(`'${key}'은(는) 올바른 키 이름이 아닙니다.`, start);
    const selector = this.parseSelectorParts();
    if (!key && !selector) this.error('키 이름이 필요합니다.', start);
    const keySpan = { start, end: this.i };

    this.skipSpaces();
    let colon = false;
    if (this.peek() === ':') {
      colon = true;
      this.i++;
      this.skipSpaces();
    }

    const mode = bodyModeOf(key);
    let value: ValueNode | null = null;
    let body: Body | null = null;

    while (this.startsWith('/*')) {
      this.skipBlockComment();
      this.skipSpaces();
    }
    if (this.peek() === '{') {
      body = this.parseBody(mode);
    } else if (!this.atValueEnd()) {
      // `script: https://...` 의 `//`를 주석으로 읽지 않도록, URL 은 일반 값으로 읽습니다.
      const url = mode === 'code' && /^[a-z][a-z0-9+.-]*:\/\//i.test(this.s.slice(this.i, this.i + 40));
      value = mode === 'code' && !url ? this.readCodeValue() : this.readValue();
      this.skipSpaces();
      if (this.peek() === '{') body = this.parseBody(mode);
    }
    if (!body) {
      // 다음 줄에서 여는 중괄호 (`div` ↵ `{`)
      const j = this.nextSignificant(this.i);
      if (this.s[j] === '{') {
        this.i = j;
        body = this.parseBody(mode);
      }
    }
    return { type: 'entry', key, keySpan, selector, colon, value, body, span: { start, end: this.i } };
  }

  /** `.class`, `#id`, `[attr=value]` 축약 */
  parseSelectorParts(): SelectorParts | null {
    let parts: SelectorParts | null = null;
    for (;;) {
      const c = this.peek();
      if (c !== '.' && c !== '#' && c !== '[') return parts;
      parts ??= { id: null, classes: [], attributes: [] };
      const at = this.i;
      this.i++;
      if (c === '.') {
        const name = this.readIdent();
        if (!name) this.error('`.` 뒤에 클래스 이름이 필요합니다.', at);
        parts.classes.push(name);
      } else if (c === '#') {
        const name = this.readIdent();
        if (!name) this.error('`#` 뒤에 아이디가 필요합니다.', at);
        if (parts.id !== null) this.error('아이디는 하나만 지정할 수 있습니다.', at);
        parts.id = name;
      } else {
        this.skipSpaces();
        const nameStart = this.i;
        while (this.i < this.s.length && !' \t\n=]'.includes(this.s[this.i])) this.i++;
        const name = this.s.slice(nameStart, this.i);
        if (!name) this.error('`[` 뒤에 속성 이름이 필요합니다.', at);
        this.skipSpaces();
        let value: string | null = null;
        if (this.peek() === '=') {
          this.i++;
          this.skipSpaces();
          if (isQuote(this.peek())) value = this.readString();
          else {
            const valueStart = this.i;
            while (this.i < this.s.length && !']\n'.includes(this.s[this.i])) this.i++;
            value = this.s.slice(valueStart, this.i).trim();
          }
          this.skipSpaces();
        }
        if (this.peek() !== ']') this.error('`]`가 필요합니다.', at);
        this.i++;
        parts.attributes.push({ name, value });
      }
    }
  }

  /** 값이 없는 문장인지 (줄 끝, `;`, `}`, 주석) */
  atValueEnd(): boolean {
    const c = this.peek();
    return c === undefined || c === '\n' || c === ';' || c === '}' || this.startsWith('//');
  }

  /**
   * `key: value` 의 value 를 읽습니다.
   * 줄바꿈, 괄호 밖의 `;`, `}`, `{`, 공백 뒤의 `//` 에서 끝납니다.
   */
  readValue(): ValueNode {
    const start = this.i;
    const s = this.s;
    if ((s[start] === '"' || s[start] === "'") && findQuoteEnd(s, start) < 0) {
      this.error('문자열이 닫히지 않았습니다. 여러 줄 텍스트는 백틱(`)으로 감싸세요.', start);
    }
    let depth = 0;
    let raw = '';
    let segment = this.i;
    while (this.i < s.length) {
      const c = s[this.i];
      if (c === '\n') break;
      if (c === '"' || c === "'") {
        const end = findQuoteEnd(s, this.i);
        this.i = end < 0 ? this.i + 1 : end + 1;
        continue;
      }
      if (c === '`') {
        const end = findQuoteEnd(s, this.i);
        if (end < 0) this.error('백틱 문자열이 닫히지 않았습니다.');
        this.i = end + 1;
        continue;
      }
      if (c === '(' || c === '[') depth++;
      else if ((c === ')' || c === ']') && depth > 0) depth--;
      else if (depth === 0 && (c === ';' || c === '}' || c === '{')) break;
      else if (depth === 0 && c === '/' && isWhitespace(s[this.i - 1])) {
        if (s[this.i + 1] === '/') break;
        if (s[this.i + 1] === '*') {
          raw += s.slice(segment, this.i);
          this.skipBlockComment();
          segment = this.i;
          continue;
        }
      }
      this.i++;
    }
    raw = (raw + s.slice(segment, this.i)).trim();
    return this.makeValue(raw, start, this.i);
  }

  /** 이벤트/스크립트의 한 줄 코드 값 */
  readCodeValue(): ValueNode {
    const start = this.i;
    const r = scanJs(this.s, this.i, 'line');
    if (r.end < 0) this.error('코드가 끝나지 않았습니다. 닫히지 않은 괄호나 문자열이 있습니다.', start);
    this.i = r.end;
    return this.makeValue(this.s.slice(start, r.end).trim(), start, r.end);
  }

  /** 값이 따옴표 문자열 하나라면 따옴표를 벗기고 이스케이프를 풉니다. */
  makeValue(raw: string, start: number, end: number): ValueNode {
    const span = { start, end };
    if (isQuote(this.s[start])) {
      const r = readQuoted(this.s, start);
      if ('error' in r) this.error(r.error, r.at);
    }
    const decoded = unquote(raw);
    return { raw, text: decoded ?? raw, quoted: decoded !== null, span };
  }

  parseBody(mode: BodyMode): Body {
    const open = this.i;
    this.i++; // `{`
    if (mode === 'code') {
      const r = scanJs(this.s, this.i, 'block');
      if (r.end < 0) this.error('코드 블록이 닫히지 않았습니다. `}`가 필요합니다.', open);
      const code = this.s.slice(this.i, r.end);
      const verbatimLines = r.verbatimLines.map((offset) => offset - this.i);
      this.i = r.end + 1;
      return { type: 'code', code, verbatimLines, span: { start: open, end: this.i } };
    }
    if (mode === 'css') {
      const items = this.parseCssItems(open);
      this.i++;
      return { type: 'css', items, span: { start: open, end: this.i } };
    }
    const nodes = this.parseNodes(open);
    this.i++;
    return { type: 'nodes', nodes, span: { start: open, end: this.i } };
  }

  /** 요소 안의 `:hover { }`, `&.on { }`, `@media ... { }` */
  parseNestedRule(): CssRuleNode {
    const start = this.i;
    const { text, stop } = this.scanCssPrelude();
    if (stop !== '{') {
      this.error('`{`가 필요합니다. `:`, `&`, `@`로 시작하는 문장은 CSS 규칙 블록이어야 합니다.', start);
    }
    const open = this.i;
    const preludeSpan = { start, end: this.trimmedEnd(start, open) };
    this.i++;
    const items = this.parseCssItems(open);
    this.i++;
    return { type: 'css-rule', prelude: normalizePrelude(text), preludeSpan, items, span: { start, end: this.i } };
  }

  // ───────────────────────── CSS ─────────────────────────

  skipCssTrivia(): void {
    for (;;) {
      const c = this.peek();
      if (isWhitespace(c) || c === ';') this.i++;
      else if (this.startsWith('/*')) this.skipBlockComment();
      else if (this.startsWith('//')) this.skipLineComment();
      else return;
    }
  }

  /** CSS 블록의 내용을 읽습니다. (`}`는 소비하지 않음) */
  parseCssItems(openOffset: number | null): CssItem[] {
    const items: CssItem[] = [];
    for (;;) {
      this.skipCssTrivia();
      const c = this.peek();
      if (c === undefined) {
        if (openOffset !== null) this.error('블록이 닫히지 않았습니다. `}`가 필요합니다.', openOffset);
        return items;
      }
      if (c === '}') {
        if (openOffset === null) this.error('짝이 맞지 않는 `}`입니다.');
        return items;
      }
      const start = this.i;
      const { text, stop } = this.scanCssPrelude();
      const prelude = text.trim();
      if (stop === '{') {
        if (!prelude) this.error('`{` 앞에 선택자가 필요합니다.', start);
        const open = this.i;
        const preludeSpan = { start, end: this.trimmedEnd(start, open) };
        this.i++;
        const children = this.parseCssItems(open);
        this.i++;
        items.push({
          type: 'block',
          prelude: normalizePrelude(prelude),
          preludeSpan,
          items: children,
          span: { start, end: this.i },
        });
        continue;
      }
      if (!prelude) continue;
      const span = { start, end: this.i };
      if (prelude.startsWith('@')) {
        items.push({ type: 'statement', text: normalizePrelude(prelude), span });
        continue;
      }
      const m = /^(-{0,2}[A-Za-z_][\w-]*)(?:\s*:\s*|\s+)([\s\S]*)$/.exec(prelude);
      if (!m) {
        if (/^-{0,2}[A-Za-z_][\w-]*\s*:?$/.test(prelude)) {
          this.error(`'${prelude.replace(/\s*:$/, '')}'의 값이 없습니다.`, start);
        }
        this.error(`CSS 선언을 이해할 수 없습니다: '${prelude}'`, start);
      }
      items.push({
        type: 'declaration',
        property: m[1],
        value: m[2].replace(/\s*\n\s*/g, ' ').trim(),
        span,
      });
    }
  }

  /**
   * 선택자나 선언 한 개를 읽습니다. 주석은 제외됩니다.
   * 괄호 밖의 `{`, `;`, `}`, 줄바꿈에서 멈추며, 다음 경우에는 줄바꿈을 넘어 계속 읽습니다.
   *  - 괄호가 열려 있을 때
   *  - 줄이 `,`로 끝날 때 (여러 줄 선택자)
   *  - 다음 줄이 `{` 또는 따옴표로 시작할 때
   */
  scanCssPrelude(): { text: string; stop: '{' | ';' | '}' | '\n' | 'eof' } {
    const s = this.s;
    let depth = 0;
    let text = '';
    let segment = this.i;
    const flush = () => {
      text += s.slice(segment, this.i);
    };
    while (this.i < s.length) {
      const c = s[this.i];
      if (c === '"' || c === "'") {
        const end = findQuoteEnd(s, this.i);
        this.i = end < 0 ? this.i + 1 : end + 1;
        continue;
      }
      if (c === '/' && s[this.i + 1] === '*') {
        flush();
        this.skipBlockComment();
        segment = this.i;
        continue;
      }
      if (c === '/' && s[this.i + 1] === '/' && depth === 0 && (this.i === 0 || isWhitespace(s[this.i - 1]))) {
        flush();
        this.skipLineComment();
        segment = this.i;
        continue;
      }
      if (c === '(' || c === '[') depth++;
      else if ((c === ')' || c === ']') && depth > 0) depth--;
      else if (depth === 0) {
        if (c === '{' || c === ';' || c === '}') {
          flush();
          return { text, stop: c };
        }
        if (c === '\n') {
          flush();
          const sofar = text.trim();
          const j = this.nextSignificant(this.i);
          const next = s[j];
          if (sofar && (sofar.endsWith(',') || next === '{' || next === '"' || next === "'")) {
            text += '\n';
            this.i = j;
            segment = j;
            continue;
          }
          return { text, stop: '\n' };
        }
      }
      this.i++;
    }
    flush();
    return { text, stop: 'eof' };
  }
}

/** 여러 줄에 걸친 선택자를 한 줄로 정리합니다. */
function normalizePrelude(text: string): string {
  return text.trim().replace(/\s*\n\s*/g, ' ');
}
