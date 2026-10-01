/**
 * CSS 처리: 중첩된 규칙을 평평하게 펴고 (Sass 처럼), 문자열로 출력합니다.
 */
import type { CssItem } from './ast.js';
import { isCssProperty } from './classify.js';
import { CSS_PROPERTIES } from './data/css.js';
import { HTML_ELEMENTS } from './data/html.js';
import { suggest } from './text.js';

export interface Declaration {
  property: string;
  value: string;
}

export type CssOutput =
  | { type: 'rule'; selector: string; declarations: Declaration[] }
  | { type: 'at'; prelude: string; declarations: Declaration[]; children: CssOutput[] }
  | { type: 'statement'; text: string };

export interface CssReporter {
  error(message: string, offset: number): never;
  warn(message: string, offset: number): void;
}

/** 선택자 대신 서술자(descriptor)를 담는 at-규칙. 부모 선택자와 합치지 않습니다. */
const DESCRIPTOR_AT_RULES = new Set([
  'font-face', 'page', 'property', 'counter-style', 'font-palette-values', 'font-feature-values',
  'view-transition', 'position-try', 'top-left-corner', 'top-left', 'top-center', 'top-right',
  'top-right-corner', 'bottom-left-corner', 'bottom-left', 'bottom-center', 'bottom-right',
  'bottom-right-corner', 'left-top', 'left-middle', 'left-bottom', 'right-top', 'right-middle',
  'right-bottom',
]);

/**
 * 중첩된 CSS 를 평평한 규칙 목록으로 바꿉니다.
 * @param parents 바깥 선택자 목록. 최상위라면 null
 */
export function flattenCss(items: CssItem[], parents: string[] | null, reporter: CssReporter): CssOutput[] {
  const out: CssOutput[] = [];
  flatten(items, parents, out, reporter);
  if (parents) return out;
  // @charset, @import, @namespace 는 스타일시트 맨 앞에 있어야 동작합니다.
  const isPrelude = (r: CssOutput) => r.type === 'statement' && /^@(charset|import|namespace)\b/i.test(r.text);
  return [...out.filter(isPrelude), ...out.filter((r) => !isPrelude(r))];
}

function flatten(items: CssItem[], parents: string[] | null, out: CssOutput[], reporter: CssReporter): void {
  let run: Declaration[] = [];
  let runStart = 0;
  const flush = () => {
    if (!run.length) return;
    if (!parents) reporter.error('CSS 선언은 선택자 블록 안에 써야 합니다.', runStart);
    out.push({ type: 'rule', selector: parents.join(', '), declarations: run });
    run = [];
  };

  for (const item of items) {
    if (item.type === 'declaration') {
      if (!run.length) runStart = item.span.start;
      checkProperty(item.property, item.span.start, reporter);
      run.push({ property: item.property, value: item.value });
      continue;
    }
    flush();
    if (item.type === 'statement') {
      out.push({ type: 'statement', text: item.text });
      continue;
    }

    const prelude = item.prelude;
    if (prelude.startsWith('@')) {
      const name = (/^@([\w-]+)/.exec(prelude)?.[1] ?? '').toLowerCase();
      if (/(^|-)keyframes$/.test(name)) {
        out.push({ type: 'at', prelude, declarations: [], children: keyframes(item.items, reporter) });
      } else if (DESCRIPTOR_AT_RULES.has(name)) {
        out.push(descriptorBlock(prelude, item.items, reporter));
      } else {
        // @media, @supports, @container, @layer ... : 부모 선택자를 안쪽으로 가져갑니다.
        const children: CssOutput[] = [];
        flatten(item.items, parents, children, reporter);
        out.push({ type: 'at', prelude, declarations: [], children });
      }
      continue;
    }

    const selectors = resolveSelectors(prelude, parents, item.span.start, reporter);
    flatten(item.items, selectors, out, reporter);
  }
  flush();
}

/** `@keyframes` 안의 `from`, `to`, `50%` 블록 */
function keyframes(items: CssItem[], reporter: CssReporter): CssOutput[] {
  const out: CssOutput[] = [];
  for (const item of items) {
    if (item.type !== 'block') {
      reporter.error('@keyframes 안에는 from, to, 50% 같은 블록만 쓸 수 있습니다.', item.span.start);
    }
    const declarations: Declaration[] = [];
    for (const child of item.items) {
      if (child.type !== 'declaration') {
        reporter.error('키프레임 블록 안에는 CSS 선언만 쓸 수 있습니다.', child.span.start);
      }
      checkProperty(child.property, child.span.start, reporter);
      declarations.push({ property: child.property, value: child.value });
    }
    out.push({ type: 'rule', selector: item.prelude, declarations });
  }
  return out;
}

/** `@font-face`, `@page` 처럼 서술자(descriptor)를 담는 블록 */
function descriptorBlock(prelude: string, items: CssItem[], reporter: CssReporter): CssOutput {
  const block: CssOutput & { type: 'at' } = { type: 'at', prelude, declarations: [], children: [] };
  for (const item of items) {
    if (item.type === 'declaration') block.declarations.push({ property: item.property, value: item.value });
    else if (item.type === 'block') block.children.push(descriptorBlock(item.prelude, item.items, reporter));
    else block.children.push({ type: 'statement', text: item.text });
  }
  return block;
}

function checkProperty(property: string, offset: number, reporter: CssReporter): void {
  if (isCssProperty(property)) return;
  if (HTML_ELEMENTS.has(property.toLowerCase())) {
    reporter.warn(`'${property}'은(는) CSS 속성이 아닙니다. CSS 블록 안에는 요소를 쓸 수 없습니다.`, offset);
    return;
  }
  const guess = suggest(property.toLowerCase(), CSS_PROPERTIES);
  reporter.warn(
    `'${property}'은(는) 알려진 CSS 속성이 아닙니다.` + (guess ? ` 혹시 '${guess}'인가요?` : ''),
    offset,
  );
}

/**
 * 중첩 선택자를 부모 선택자와 합칩니다.
 *  - `&` 는 부모 선택자로 바뀝니다:      `&.on`    → `.btn.on`
 *  - `:` 로 시작하면 부모에 붙습니다:     `:hover`  → `.btn:hover`
 *  - 그 밖에는 자손 선택자가 됩니다:      `span`    → `.btn span`
 */
export function resolveSelectors(
  prelude: string,
  parents: string[] | null,
  offset: number,
  reporter: CssReporter,
): string[] {
  const parts = splitTopLevel(prelude, ',').map((part) => part.trim()).filter(Boolean);
  if (!parents) {
    for (const part of parts) {
      if (findAmpersands(part).length) reporter.error('최상위 선택자에는 `&`를 쓸 수 없습니다.', offset);
    }
    return parts;
  }
  const result: string[] = [];
  for (const parent of parents) {
    for (const part of parts) {
      const amps = findAmpersands(part);
      if (amps.length) {
        let joined = '';
        let last = 0;
        for (const at of amps) {
          joined += part.slice(last, at) + parent;
          last = at + 1;
        }
        result.push(joined + part.slice(last));
      } else if (part.startsWith(':')) {
        result.push(parent + part);
      } else {
        result.push(`${parent} ${part}`);
      }
    }
  }
  return result;
}

/** 괄호와 따옴표 밖에 있는 separator 로 문자열을 나눕니다. */
export function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = '';
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === separator && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

function findAmpersands(selector: string): number[] {
  const found: number[] = [];
  let quote = '';
  let bracket = 0;
  for (let i = 0; i < selector.length; i++) {
    const c = selector[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '[') bracket++;
    else if (c === ']') bracket--;
    else if (c === '&' && bracket === 0) found.push(i);
  }
  return found;
}

// ───────────────────────── 출력 ─────────────────────────

export interface CssPrintOptions {
  indent: string;
  minify: boolean;
}

/** CSS 규칙들을 줄 단위로 출력합니다. (minify 이면 한 줄) */
export function printCss(rules: CssOutput[], options: CssPrintOptions): string[] {
  if (options.minify) return [rules.map(minifyBlock).join('')];
  const lines: string[] = [];
  const unit = options.indent;
  const write = (block: CssOutput, depth: number) => {
    const pad = unit.repeat(depth);
    if (block.type === 'statement') {
      lines.push(`${pad}${block.text};`);
      return;
    }
    const head = block.type === 'rule' ? block.selector : block.prelude;
    lines.push(`${pad}${head} {`);
    for (const d of block.declarations) lines.push(`${pad}${unit}${d.property}: ${d.value};`);
    if (block.type === 'at') for (const child of block.children) write(child, depth + 1);
    lines.push(`${pad}}`);
  };
  for (const rule of rules) write(rule, 0);
  return lines;
}

function minifyBlock(block: CssOutput): string {
  if (block.type === 'statement') return `${block.text};`;
  const head = block.type === 'rule' ? block.selector : block.prelude;
  const body = block.declarations.map((d) => `${d.property}:${d.value}`).join(';');
  const children = block.type === 'at' ? block.children.map(minifyBlock).join('') : '';
  return `${head}{${body}${body && children ? ';' : ''}${children}}`;
}

/** 인라인 style 속성값 */
export function inlineStyle(declarations: (Declaration | { raw: string })[], minify: boolean): string {
  return declarations
    .map((d) => {
      if ('raw' in d) return d.raw.trim().replace(/;+$/, '');
      return minify ? `${d.property}:${d.value}` : `${d.property}: ${d.value}`;
    })
    .filter(Boolean)
    .join(minify ? ';' : '; ');
}
