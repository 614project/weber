/**
 * 출력기: HTML 요소 트리를 문자열로 만듭니다.
 *
 * 줄바꿈과 들여쓰기는 렌더링 결과를 바꾸지 않는 곳에만 넣습니다.
 * 형제 노드 사이에는, 둘 중 하나라도 블록 요소(div, p, li, script ...)일 때만 줄을 바꿉니다.
 * 그래서 `"안녕"` 다음에 `b: "세상"` 을 쓰면 `안녕<b>세상</b>` 처럼 붙어서 출력됩니다.
 */
import { inlineStyle, printCss } from './css.js';
import {
  BLOCK_ELEMENTS,
  MATH_TOKEN_ELEMENTS,
  PREFORMATTED_ELEMENTS,
  SVG_TEXT_ELEMENTS,
  VOID_ELEMENTS,
} from './data/html.js';
import { escapeText, quoteAttribute } from './text.js';
import type { HDocument, HElement, HNode } from './transform.js';

export interface PrintOptions {
  /** 들여쓰기 한 단계 */
  indent: string;
  /** 줄바꿈과 들여쓰기 없이 출력 */
  minify: boolean;
}

export function print(doc: HDocument, options: PrintOptions): string {
  return new Printer(options).document(doc);
}

class Printer {
  readonly #indent: string;
  readonly #minify: boolean;

  constructor(options: PrintOptions) {
    this.#indent = options.indent;
    this.#minify = options.minify;
  }

  document(doc: HDocument): string {
    if (doc.kind === 'document') {
      const html = this.#element(doc.html, 0, false);
      return this.#minify ? `<!DOCTYPE html>${html}` : `<!DOCTYPE html>\n${html}\n`;
    }
    let out = '';
    doc.nodes.forEach((node, k) => {
      if (k > 0 && !this.#minify && (isBlock(doc.nodes[k - 1]) || isBlock(node))) out += '\n';
      out += this.#node(node, 0, false);
    });
    return this.#minify || !out ? out : `${out}\n`;
  }

  #pad(depth: number): string {
    return this.#indent.repeat(depth);
  }

  #node(node: HNode, depth: number, verbatim: boolean): string {
    switch (node.type) {
      case 'text':
        return escapeText(node.value);
      case 'element':
        return this.#element(node, depth, verbatim);
      default:
        // code / css 는 부모 요소(#element)가 직접 출력합니다.
        return '';
    }
  }

  #element(el: HElement, depth: number, verbatim: boolean): string {
    const open = `<${el.tag}${this.#attributes(el)}`;
    if (el.ns === 'html' && VOID_ELEMENTS.has(el.tag)) return `${open}>`;
    if (el.ns !== 'html' && el.children.length === 0) return `${open} />`;
    const close = `</${el.tag}>`;

    const first = el.children[0];
    if (first && (first.type === 'code' || first.type === 'css')) {
      return `${open}>${this.#rawContent(el, depth, verbatim)}${close}`;
    }

    const preformatted = verbatim || (el.ns === 'html' && PREFORMATTED_ELEMENTS.has(el.tag));
    let out = `${open}>`;
    if (this.#minify || preformatted) {
      // HTML 파서는 <pre>, <textarea> 바로 뒤의 줄바꿈 하나를 지우므로, 내용이 줄바꿈으로 시작하면 하나 더 넣습니다.
      if (first?.type === 'text' && first.value.startsWith('\n') && (el.tag === 'pre' || el.tag === 'textarea')) out += '\n';
      for (const child of el.children) out += this.#node(child, depth + 1, preformatted);
      return out + close;
    }
    // SVG/MathML 컨테이너 안에서는 요소 사이의 공백이 무시되므로 어디서든 줄을 바꿀 수 있습니다.
    const breakAll = ignoresWhitespace(el);
    const block = (node: HNode) => (breakAll && node.type === 'element') || isBlock(node);
    const children = el.children;
    const breaks = children.map((child, k) => k > 0 && (block(children[k - 1]) || block(child)));
    const last = children[children.length - 1];
    // 블록 요소의 맨 앞/맨 뒤 공백은 화면에 나타나지 않으므로, 여러 줄일 때는 감싸서 정리합니다.
    const multiline = breaks.includes(true) || (first && block(first)) || (last && block(last));
    const wrap = multiline && (breakAll || isBlock(el));
    children.forEach((child, k) => {
      if (breaks[k] || (k === 0 && (wrap || block(child)))) out += `\n${this.#pad(depth + 1)}`;
      out += this.#node(child, depth + 1, false);
    });
    if (last && (wrap || block(last))) out += `\n${this.#pad(depth)}`;
    return out + close;
  }

  /** <script>, <style> 의 내용 */
  #rawContent(el: HElement, depth: number, verbatim: boolean): string {
    const content = el.children[0];
    const closer = el.tag === 'style' ? /<\/style/gi : /<\/script/gi;
    const safe = (line: string) => line.replace(closer, (m) => `<\\/${m.slice(2)}`);

    if (content.type === 'css') {
      const lines = printCss(content.rules, { indent: this.#indent, minify: this.#minify }).map(safe);
      if (!lines.length || lines.join('') === '') return '';
      if (this.#minify || verbatim) return lines.join('');
      const pad = this.#pad(depth + 1);
      return `\n${lines.map((line) => pad + line).join('\n')}\n${this.#pad(depth)}`;
    }
    if (content.type !== 'code') return '';
    const { lines, verbatim: keep } = content.code;
    if (!lines.length) return '';
    if (this.#minify || verbatim) return lines.map(safe).join('\n');
    const pad = this.#pad(depth + 1);
    const body = lines.map((line, k) => (keep[k] || line === '' ? safe(line) : pad + safe(line)));
    return `\n${body.join('\n')}\n${this.#pad(depth)}`;
  }

  #attributes(el: HElement): string {
    let out = '';
    for (const [name, raw] of el.attributes) {
      let value = raw;
      if (name === 'class') {
        if (!el.classes.length) continue;
        value = el.classes.join(' ');
      } else if (name === 'style') {
        value = inlineStyle(el.styles, this.#minify);
        if (!value) continue;
      }
      out += value === null ? ` ${name}` : ` ${name}=${quoteAttribute(value)}`;
    }
    return out;
  }
}

/** 자식 요소 사이의 공백이 렌더링되지 않는 요소인지 (SVG 도형 컨테이너, MathML) */
function ignoresWhitespace(el: HElement): boolean {
  if (el.ns === 'svg') return !SVG_TEXT_ELEMENTS.has(el.tag);
  if (el.ns === 'math') return !MATH_TOKEN_ELEMENTS.has(el.tag);
  return false;
}

/** 앞뒤에 공백(줄바꿈)이 생겨도 화면이 바뀌지 않는 노드인지 */
function isBlock(node: HNode): boolean {
  if (node.type !== 'element') return false;
  if (node.ns === 'html') return BLOCK_ELEMENTS.has(node.tag);
  if (node.ns === 'svg') return node.tag !== 'svg' && !SVG_TEXT_ELEMENTS.has(node.tag);
  return node.tag !== 'math' && !MATH_TOKEN_ELEMENTS.has(node.tag);
}
