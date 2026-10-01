/**
 * 변환기: 구문 트리를 HTML 요소 트리로 바꿉니다.
 * 각 문장이 무엇인지(요소/속성/스타일/이벤트) 판별해서 알맞은 곳에 붙입니다.
 */
import type { CodeBody, CssItem, CssRuleNode, EntryNode, SelectorParts, Span, WeberNode } from './ast.js';
import {
  classify,
  isCssProperty,
  isEventName,
  isKnownElement,
  svgAttributeName,
  svgElementName,
  type Context,
  type Namespace,
} from './classify.js';
import { flattenCss, splitTopLevel, type CssOutput, type CssReporter, type Declaration } from './css.js';
import { CSS_PROPERTIES } from './data/css.js';
import {
  ALL_HTML_ATTRIBUTES,
  BOOLEAN_ATTRIBUTES,
  HEAD_ONLY_ELEMENTS,
  HTML_ELEMENTS,
  INPUT_TYPES,
  MEDIA_ELEMENTS,
  PRIMARY_ATTRIBUTES,
  VOID_ELEMENTS,
} from './data/html.js';
import { WeberError, type Diagnostic } from './errors.js';
import type { Source } from './source.js';
import { dedentCode, isAbsoluteUrl, looksLikeUrl, suggest, type CodeLines } from './text.js';

// ───────────────────────── 결과 트리 ─────────────────────────

export interface HElement {
  type: 'element';
  tag: string;
  ns: Namespace;
  /** 속성 (삽입 순서대로 출력). class 와 style 은 자리만 차지하고 값은 아래에서 계산 */
  attributes: Map<string, string | null>;
  classes: string[];
  styles: (Declaration | { raw: string })[];
  children: HNode[];
}
export interface HText {
  type: 'text';
  value: string;
}
/** <script> / 문자열로 쓴 <style> 의 내용 */
export interface HCode {
  type: 'code';
  code: CodeLines;
}
/** style 블록에서 만들어진 CSS */
export interface HCss {
  type: 'css';
  rules: CssOutput[];
}
export type HNode = HElement | HText | HCode | HCss;

export type HDocument = { kind: 'document'; html: HElement } | { kind: 'fragment'; nodes: HNode[] };

export type OutputMode = 'auto' | 'document' | 'fragment';

/** 최상위에 이 키가 있으면 전체 HTML 문서로 출력합니다. */
const DOCUMENT_SIGNALS = new Set(['html', 'head', 'body', 'title', 'meta', 'link', 'base', 'charset', 'viewport', 'icon']);

/** SVG 요소에 값을 주면 들어가는 속성 (`path: "M0 0 L10 10"` → d) */
const SVG_PRIMARY_ATTRIBUTES = new Map([
  ['path', 'd'],
  ['polygon', 'points'],
  ['polyline', 'points'],
  ['image', 'href'],
  ['use', 'href'],
]);

const NAME_CANDIDATES = [...CSS_PROPERTIES, ...HTML_ELEMENTS, ...ALL_HTML_ATTRIBUTES];

/** 문장 하나가 만들어내는 결과 */
type Effect =
  | { type: 'child'; node: HNode }
  | { type: 'attribute'; name: string; value: string | null }
  | { type: 'style'; style: Declaration | { raw: string } }
  | { type: 'rule'; rule: CssRuleNode }
  | null;

export function element(tag: string, ns: Namespace = 'html'): HElement {
  return { type: 'element', tag, ns, attributes: new Map(), classes: [], styles: [], children: [] };
}

/** 각 키를 무엇으로 판별했는지: HTML 요소, HTML 속성, CSS, 자바스크립트 */
export type ClassificationKind = 'element' | 'attribute' | 'css' | 'js';

export interface Classification {
  /** 소스에 적힌 키 (선택자 축약 포함) */
  key: string;
  kind: ClassificationKind;
  /** 키가 소스에서 차지하는 범위 (줄바꿈을 \n 으로 통일하고 BOM 을 뺀 소스 기준 오프셋) */
  start: number;
  end: number;
}

export class Transformer implements CssReporter {
  readonly warnings: Diagnostic[] = [];
  readonly classifications: Classification[] = [];
  readonly #source: Source;
  readonly #scopedCss: CssOutput[] = [];
  readonly #rules = new Map<HElement, CssRuleNode[]>();
  #classCounter = 0;

  constructor(source: Source) {
    this.#source = source;
  }

  error(message: string, offset: number): never {
    throw new WeberError(message, this.#source, offset);
  }

  warn(message: string, offset: number): void {
    const { line, column } = this.#source.position(offset);
    this.warnings.push({ message, filename: this.#source.filename, line, column });
  }

  transform(nodes: WeberNode[], mode: OutputMode): HDocument {
    const isDocument =
      mode === 'document' ||
      (mode === 'auto' && nodes.some((n) => n.type === 'entry' && DOCUMENT_SIGNALS.has(n.key.toLowerCase())));
    return isDocument ? this.#document(nodes) : this.#fragment(nodes);
  }

  // ───────────────────────── 문서 / 조각 ─────────────────────────

  #fragment(nodes: WeberNode[]): HDocument {
    const root = element('#fragment');
    const ctx: Context = { tag: null, ns: 'html' };
    for (const node of nodes) {
      const effect = this.#evaluate(node, ctx);
      if (!effect) continue;
      if (effect.type !== 'child') {
        this.error(
          '최상위에는 속성이나 스타일을 쓸 수 없습니다. 요소 블록 { } 안에 넣으세요.',
          node.span.start,
        );
      }
      root.children.push(effect.node);
    }
    if (this.#scopedCss.length) root.children.unshift(this.#styleElement(this.#scopedCss));
    return { kind: 'fragment', nodes: root.children };
  }

  #document(nodes: WeberNode[]): HDocument {
    const html = element('html');
    const head = element('head');
    const body = element('body');
    this.#fillDocument(nodes, html, head, body);
    for (const el of [html, head, body]) this.#finishRules(el);

    const hasCharset = head.children.some(
      (n) => n.type === 'element' && n.tag === 'meta' && n.attributes.has('charset'),
    );
    if (!hasCharset) {
      const meta = element('meta');
      meta.attributes.set('charset', 'utf-8');
      head.children.unshift(meta);
    }
    if (this.#scopedCss.length) {
      // head 가 속성 없는 <style> 로 끝나면 거기에 이어 붙입니다.
      const last = head.children[head.children.length - 1];
      const css = last?.type === 'element' && last.tag === 'style' && !last.attributes.size ? last.children[0] : undefined;
      if (css?.type === 'css') css.rules.push(...this.#scopedCss);
      else head.children.push(this.#styleElement(this.#scopedCss));
    }
    html.children.push(head, body);
    return { kind: 'document', html };
  }

  /** 문서 최상위 문장들을 html / head / body 로 나눠 담습니다. */
  #fillDocument(nodes: WeberNode[], html: HElement, head: HElement, body: HElement): void {
    const ctx: Context = { tag: 'html', ns: 'html' };
    for (const node of nodes) {
      if (node.type === 'entry') {
        const key = node.key.toLowerCase();
        if (key === 'html' || key === 'head' || key === 'body') {
          const target = key === 'html' ? html : key === 'head' ? head : body;
          this.#record(node.keySpan, 'element');
          this.#applySelector(target, node.selector, node.span.start);
          if (node.value) {
            if (key !== 'body') this.error(`'${node.key}'에는 값을 쓸 수 없습니다.`, node.value.span.start);
            body.children.push({ type: 'text', value: node.value.text });
          }
          if (node.body?.type === 'nodes') {
            if (key === 'html') this.#fillDocument(node.body.nodes, html, head, body);
            else this.#fill(target, node.body.nodes, { tag: key, ns: 'html' });
          }
          continue;
        }
      }

      const effect = this.#evaluate(node, ctx);
      if (!effect) continue;
      if (effect.type === 'child') {
        const child = effect.node;
        const toHead =
          child.type === 'element' &&
          (HEAD_ONLY_ELEMENTS.has(child.tag) || (child.tag === 'script' && body.children.length === 0));
        (toHead ? head : body).children.push(child);
      } else {
        this.#apply(html, effect, node.span.start);
      }
    }
  }

  // ───────────────────────── 문장 평가 ─────────────────────────

  #evaluate(node: WeberNode, ctx: Context): Effect {
    if (node.type === 'text') return { type: 'child', node: { type: 'text', value: node.value } };
    if (node.type === 'css-rule') {
      this.#record(node.preludeSpan, 'css');
      this.#recordCss(node.items);
      return { type: 'rule', rule: node };
    }
    return this.#evaluateEntry(node, ctx);
  }

  #evaluateEntry(entry: EntryNode, ctx: Context): Effect {
    const effect = this.#entryEffect(entry, ctx);
    const lower = entry.key.toLowerCase();
    if (lower === 'script' || isEventName(lower)) this.#record(entry.keySpan, 'js');
    else if (lower === 'style' || effect?.type === 'style') this.#record(entry.keySpan, 'css');
    else if (effect?.type === 'attribute') this.#record(entry.keySpan, 'attribute');
    else if (effect?.type === 'child') this.#record(entry.keySpan, 'element');
    return effect;
  }

  /** 키를 무엇으로 판별했는지 기록합니다. (편집기의 색칠 등에 쓰임) */
  #record(span: Span, kind: ClassificationKind): void {
    this.classifications.push({ key: this.#source.text.slice(span.start, span.end), kind, start: span.start, end: span.end });
  }

  /** CSS 블록 안의 속성 이름과 중첩 선택자를 기록합니다. */
  #recordCss(items: CssItem[]): void {
    for (const item of items) {
      if (item.type === 'declaration') {
        this.#record({ start: item.span.start, end: item.span.start + item.property.length }, 'css');
      } else if (item.type === 'block') {
        this.#recordCss(item.items);
      }
    }
  }

  #entryEffect(entry: EntryNode, ctx: Context): Effect {
    const key = entry.key;
    const lower = key.toLowerCase();
    const at = entry.span.start;

    if (key === '') return { type: 'child', node: this.#element(entry, 'div', ctx) };
    if (lower === 'script') return { type: 'child', node: this.#script(entry, ctx) };
    if (lower === 'style') return this.#styleEntry(entry, ctx);
    if (isEventName(lower)) return { type: 'attribute', name: key, value: this.#eventCode(entry) };
    if (entry.selector) return { type: 'child', node: this.#element(entry, key, ctx) };

    if (entry.body) {
      this.#checkBlockKey(entry, ctx);
      return { type: 'child', node: this.#element(entry, key, ctx) };
    }

    const value = entry.value;
    const decision = classify(key, value?.text ?? null, ctx);
    switch (decision.kind) {
      case 'element':
        return { type: 'child', node: this.#element(entry, key, ctx) };
      case 'event':
        return { type: 'attribute', name: key, value: this.#eventCode(entry) };
      case 'style':
        if (!value || value.raw === '') this.error(`CSS 속성 '${key}'에 값이 없습니다.`, at);
        return { type: 'style', style: { property: key, value: value.raw.replace(/\s*\n\s*/g, ' ') } };
      case 'meta-charset': {
        const meta = element('meta');
        meta.attributes.set('charset', this.#requireValue(entry));
        return { type: 'child', node: meta };
      }
      case 'meta-name': {
        const meta = element('meta');
        meta.attributes.set('name', key);
        meta.attributes.set('content', this.#requireValue(entry));
        return { type: 'child', node: meta };
      }
      case 'link-icon': {
        const link = element('link');
        link.attributes.set('rel', 'icon');
        link.attributes.set('href', this.#requireValue(entry));
        return { type: 'child', node: link };
      }
      case 'attribute': {
        if (decision.unknown) this.#warnUnknown(key, ctx, at);
        if (decision.misplaced) this.warn(`'${key}'은(는) <${ctx.tag}> 요소에서 쓰이지 않는 속성입니다.`, at);
        const name = ctx.ns === 'svg' ? svgAttributeName(key) : key;
        return { type: 'attribute', name, value: value ? value.text : null };
      }
    }
  }

  #requireValue(entry: EntryNode): string {
    if (!entry.value) this.error(`'${entry.key}'에 값이 필요합니다.`, entry.span.start);
    return entry.value.text;
  }

  #warnUnknown(key: string, ctx: Context, offset: number): void {
    const lower = key.toLowerCase();
    const guess = suggest(lower, NAME_CANDIDATES);
    if (guess) {
      this.warn(`알 수 없는 이름 '${key}'을(를) HTML 속성으로 처리했습니다. 혹시 '${guess}'인가요?`, offset);
    } else if (ctx.ns === 'html' && !lower.includes('-')) {
      this.warn(`알 수 없는 이름 '${key}'을(를) HTML 속성으로 처리했습니다.`, offset);
    }
  }

  /** 블록이 붙은 키가 요소 이름으로 적절한지 검사합니다. */
  #checkBlockKey(entry: EntryNode, ctx: Context): void {
    const key = entry.key;
    const ns = this.#childNamespace(key, ctx);
    if (isKnownElement(key, ns) || (key.includes('-') && !isCssProperty(key))) return;
    if (isCssProperty(key)) {
      this.warn(`'${key}'은(는) CSS 속성인데 블록 { }이 붙어 요소로 처리했습니다.`, entry.span.start);
      return;
    }
    const guess = ns === 'html' ? suggest(key.toLowerCase(), HTML_ELEMENTS) : null;
    this.warn(
      `'${key}'은(는) 알려진 요소가 아닙니다.` + (guess ? ` 혹시 '${guess}'인가요?` : ''),
      entry.span.start,
    );
  }

  #childNamespace(tag: string, parent: Context): Namespace {
    const lower = tag.toLowerCase();
    if (lower === 'svg') return 'svg';
    if (lower === 'math') return 'math';
    if (parent.ns === 'svg' && parent.tag === 'foreignObject') return 'html';
    return parent.ns;
  }

  // ───────────────────────── 요소 만들기 ─────────────────────────

  #element(entry: EntryNode, name: string, parent: Context): HElement {
    const ns = this.#childNamespace(name, parent);
    const tag = ns === 'html' ? name.toLowerCase() : ns === 'svg' ? svgElementName(name) : name;
    const el = element(tag, ns);
    this.#applySelector(el, entry.selector, entry.span.start);
    if (entry.value) this.#applyValue(el, entry);
    if (entry.body) {
      if (entry.body.type !== 'nodes') this.error(`'${name}' 블록을 읽을 수 없습니다.`, entry.body.span.start);
      this.#fill(el, entry.body.nodes, { tag, ns });
    }
    this.#finishRules(el);
    return el;
  }

  /** `p: "텍스트"` 처럼 요소에 붙은 값을 처리합니다. */
  #applyValue(el: HElement, entry: EntryNode): void {
    const value = entry.value!;
    const text = value.text;
    const at = value.span.start;
    const primary = el.ns === 'html' ? PRIMARY_ATTRIBUTES.get(el.tag) : el.ns === 'svg' ? SVG_PRIMARY_ATTRIBUTES.get(el.tag) : undefined;
    if (primary) {
      this.#setAttribute(el, primary, text, at);
    } else if (el.ns === 'html' && MEDIA_ELEMENTS.has(el.tag) && looksLikeUrl(text)) {
      this.#setAttribute(el, 'src', text, at);
    } else if (el.ns === 'html' && el.tag === 'input') {
      if (!INPUT_TYPES.has(text.trim().toLowerCase())) {
        this.error(
          `'${text}'은(는) input 의 type 이 아닙니다. 다른 속성은 input { ... } 블록 안에 쓰세요.`,
          at,
        );
      }
      this.#setAttribute(el, 'type', text.trim(), at);
    } else if (el.ns === 'html' && VOID_ELEMENTS.has(el.tag)) {
      this.error(`<${el.tag}>은(는) 내용을 가질 수 없는 요소입니다.`, at);
    } else {
      el.children.push({ type: 'text', value: text });
    }
  }

  #fill(el: HElement, nodes: WeberNode[], ctx: Context): void {
    for (const node of nodes) {
      const effect = this.#evaluate(node, ctx);
      if (effect) this.#apply(el, effect, node.span.start);
    }
  }

  #apply(el: HElement, effect: NonNullable<Effect>, at: number): void {
    switch (effect.type) {
      case 'child':
        if (el.ns === 'html' && VOID_ELEMENTS.has(el.tag)) {
          this.error(`<${el.tag}>은(는) 내용을 가질 수 없는 요소입니다. 속성만 쓸 수 있습니다.`, at);
        }
        el.children.push(effect.node);
        break;
      case 'attribute':
        this.#setAttribute(el, effect.name, effect.value, at);
        break;
      case 'style':
        if (!el.attributes.has('style')) el.attributes.set('style', null);
        el.styles.push(effect.style);
        break;
      case 'rule': {
        const rules = this.#rules.get(el) ?? [];
        rules.push(effect.rule);
        this.#rules.set(el, rules);
        break;
      }
    }
  }

  #applySelector(el: HElement, selector: SelectorParts | null, at: number): void {
    if (!selector) return;
    if (selector.id !== null) this.#setAttribute(el, 'id', selector.id, at);
    for (const cls of selector.classes) this.#addClass(el, cls);
    for (const { name, value } of selector.attributes) this.#setAttribute(el, name, value, at);
  }

  #addClass(el: HElement, names: string): void {
    if (!el.attributes.has('class')) el.attributes.set('class', null);
    for (const name of names.split(/\s+/)) {
      if (name && !el.classes.includes(name)) el.classes.push(name);
    }
  }

  #setAttribute(el: HElement, name: string, value: string | null, at: number): void {
    const lower = name.toLowerCase();
    if (lower === 'class') {
      if (value !== null) this.#addClass(el, value);
      return;
    }
    if (lower === 'style') {
      if (value !== null) {
        if (!el.attributes.has('style')) el.attributes.set('style', null);
        el.styles.push({ raw: value });
      }
      return;
    }
    if (el.ns === 'html' && BOOLEAN_ATTRIBUTES.has(lower) && value !== null) {
      const v = value.trim().toLowerCase();
      if (v === 'false') {
        el.attributes.delete(name);
        return;
      }
      if (v === 'true' || v === '' || v === lower) value = null;
    }
    if (el.attributes.has(name)) {
      this.warn(`'${name}' 속성이 여러 번 지정되어 마지막 값을 사용합니다.`, at);
    }
    el.attributes.set(name, value);
  }

  // ───────────────────────── script / style / 이벤트 ─────────────────────────

  #script(entry: EntryNode, ctx: Context): HElement {
    const el = element('script', ctx.ns === 'svg' ? 'svg' : 'html');
    this.#applySelector(el, entry.selector, entry.span.start);
    if (entry.body?.type === 'code') {
      const code = codeLines(entry.body);
      if (code.lines.length === 1 && /^src\s*[:\s]/.test(code.lines[0])) {
        this.warn(
          '`script { src ... }`는 자바스크립트 코드로 처리됩니다. 외부 파일은 `script: 파일.js` 처럼 쓰세요.',
          entry.body.span.start,
        );
      }
      el.children.push({ type: 'code', code });
    } else if (entry.value) {
      const text = entry.value.text.trim();
      if (!/\s/.test(text) && (/\.[cm]?js([?#].*)?$/i.test(text) || isAbsoluteUrl(text))) {
        el.attributes.set('src', text);
      } else {
        el.children.push({ type: 'code', code: dedentCode(text) });
      }
    }
    return el;
  }

  #styleEntry(entry: EntryNode, ctx: Context): Effect {
    const at = entry.span.start;
    const ns = ctx.ns === 'svg' ? 'svg' : 'html';
    if (entry.body?.type === 'css') {
      if (entry.value) this.error('style 에는 값과 블록을 함께 쓸 수 없습니다.', at);
      const el = element('style', ns);
      this.#applySelector(el, entry.selector, at);
      el.children.push({ type: 'css', rules: flattenCss(entry.body.items, null, this) });
      this.#recordCss(entry.body.items);
      return { type: 'child', node: el };
    }
    const text = entry.value?.text.trim() ?? '';
    if (text && !/\s/.test(text) && (/\.css([?#].*)?$/i.test(text) || isAbsoluteUrl(text))) {
      const link = element('link');
      link.attributes.set('rel', 'stylesheet');
      link.attributes.set('href', text);
      this.#applySelector(link, entry.selector, at);
      return { type: 'child', node: link };
    }
    const standalone = ctx.tag === null || ctx.tag === 'head' || ctx.tag === 'html' || entry.selector !== null;
    if (!standalone && text) return { type: 'style', style: { raw: text } };
    const el = element('style', ns);
    this.#applySelector(el, entry.selector, at);
    if (text) el.children.push({ type: 'code', code: dedentCode(text) });
    return { type: 'child', node: el };
  }

  #eventCode(entry: EntryNode): string {
    if (entry.body?.type === 'code') return codeLines(entry.body).lines.join('\n');
    if (entry.value) return entry.value.text;
    return this.error(`이벤트 '${entry.key}'에 실행할 코드가 없습니다.`, entry.span.start);
  }

  // ───────────────────────── 요소 범위 CSS (:hover, @media) ─────────────────────────

  /** 요소 안에 쓴 `:hover { }` 같은 규칙을 전역 스타일시트로 옮깁니다. */
  #finishRules(el: HElement): void {
    const rules = this.#rules.get(el);
    if (!rules) return;
    this.#rules.delete(el);
    let selector: string;
    const id = el.attributes.get('id');
    if (el.tag === 'html' || el.tag === 'body') selector = el.tag;
    else if (id && /^[A-Za-z_][\w-]*$/.test(id)) selector = `#${id}`;
    else {
      const cls = `weber-${++this.#classCounter}`;
      this.#addClass(el, cls);
      selector = `.${cls}`;
    }
    // 인라인 스타일은 스타일시트보다 우선하므로, 그대로 두면 :hover 나 @media 가 덮어쓰지 못합니다.
    // 이 요소에 직접 쓴 스타일도 같은 선택자의 규칙으로 옮깁니다.
    if (el.styles.length) {
      const declarations = el.styles.flatMap((style) => ('raw' in style ? parseDeclarations(style.raw) : [style]));
      this.#scopedCss.push({ type: 'rule', selector, declarations });
      el.styles = [];
      el.attributes.delete('style');
    }
    const items: CssItem[] = rules.map((rule) => ({
      type: 'block',
      prelude: rule.prelude,
      preludeSpan: rule.preludeSpan,
      items: rule.items,
      span: rule.span,
    }));
    this.#scopedCss.push(...flattenCss(items, [selector], this));
  }

  #styleElement(rules: CssOutput[]): HElement {
    const el = element('style');
    el.children.push({ type: 'css', rules });
    return el;
  }
}

/** `color: red; margin: 0` 같은 인라인 스타일 문자열을 선언 목록으로 바꿉니다. */
function parseDeclarations(raw: string): Declaration[] {
  return splitTopLevel(raw, ';').flatMap((part) => {
    const colon = part.indexOf(':');
    if (colon < 0 || !part.slice(0, colon).trim()) return [];
    return [{ property: part.slice(0, colon).trim(), value: part.slice(colon + 1).trim() }];
  });
}

function codeLines(body: CodeBody): CodeLines {
  return dedentCode(body.code, body.verbatimLines);
}
