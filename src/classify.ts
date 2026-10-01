/**
 * 판별기: `key value` 한 줄이 HTML 요소인지, HTML 속성인지, CSS 인지, JS 이벤트인지 결정합니다.
 * 블록(`key { }`)이 붙은 문장은 항상 요소이므로 여기까지 오지 않습니다.
 */
import { CSS_PROPERTIES } from './data/css.js';
import {
  ALL_HTML_ATTRIBUTES,
  ELEMENT_ATTRIBUTES,
  GLOBAL_ATTRIBUTES,
  HEAD_ELEMENTS,
  HTML_ELEMENTS,
  MATH_ATTRIBUTES,
  MATH_ELEMENTS,
  META_NAMES,
  SVG_ATTRIBUTES,
  SVG_ELEMENTS,
} from './data/html.js';
import { looksLikeUrl } from './text.js';

export type Namespace = 'html' | 'svg' | 'math';

export interface Context {
  /** 지금 내용을 채우고 있는 요소의 태그. 조각(fragment)의 최상위라면 null */
  tag: string | null;
  ns: Namespace;
}

export type Decision =
  | { kind: 'element' }
  | { kind: 'attribute'; unknown?: boolean; misplaced?: boolean }
  | { kind: 'style' }
  | { kind: 'event' }
  | { kind: 'meta-charset' }
  | { kind: 'meta-name' }
  | { kind: 'link-icon' };

const lowerSet = (set: ReadonlySet<string>) => new Set([...set].map((v) => v.toLowerCase()));
const SVG_ATTRIBUTES_LOWER = lowerSet(SVG_ATTRIBUTES);
const SVG_ELEMENTS_LOWER = lowerSet(SVG_ELEMENTS);
const SVG_ELEMENT_CASE = new Map([...SVG_ELEMENTS].map((v) => [v.toLowerCase(), v]));
const SVG_ATTRIBUTE_CASE = new Map([...SVG_ATTRIBUTES].map((v) => [v.toLowerCase(), v]));

/** SVG 요소/속성 이름을 표준 대소문자로 바꿉니다. (`lineargradient` → `linearGradient`) */
export function svgElementName(name: string): string {
  return SVG_ELEMENT_CASE.get(name.toLowerCase()) ?? name;
}
export function svgAttributeName(name: string): string {
  return SVG_ATTRIBUTE_CASE.get(name.toLowerCase()) ?? name;
}

/** 해당 이름공간에서 알려진 요소인지 */
export function isKnownElement(name: string, ns: Namespace): boolean {
  const lower = name.toLowerCase();
  if (ns === 'svg') return SVG_ELEMENTS_LOWER.has(lower);
  if (ns === 'math') return MATH_ELEMENTS.has(lower);
  return HTML_ELEMENTS.has(lower);
}

/** CSS 속성으로 인정되는 이름인지 (사용자 정의 속성, 벤더 접두사 포함) */
export function isCssProperty(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.startsWith('--') || /^-(webkit|moz|ms|o)-/.test(lower) || CSS_PROPERTIES.has(lower);
}

export function isEventName(name: string): boolean {
  return /^on[a-z]+$/.test(name.toLowerCase());
}

export function classify(key: string, value: string | null, ctx: Context): Decision {
  const lower = key.toLowerCase();

  if (isEventName(lower)) return { kind: 'event' };
  if (lower.startsWith('--') || /^-(webkit|moz|ms|o)-/.test(lower)) return { kind: 'style' };
  if (lower.startsWith('data-') || lower.startsWith('aria-')) return { kind: 'attribute' };

  // <head> (또는 문서 최상위) 에서만 통하는 편의 문법
  if (ctx.ns === 'html' && (ctx.tag === 'head' || ctx.tag === 'html')) {
    if (HEAD_ELEMENTS.has(lower)) return { kind: 'element' };
    if (lower === 'charset') return { kind: 'meta-charset' };
    if (META_NAMES.has(lower)) return { kind: 'meta-name' };
    if (lower === 'icon') return { kind: 'link-icon' };
    if (ctx.tag === 'head' && !HTML_ELEMENTS.has(lower) && !GLOBAL_ATTRIBUTES.has(lower)) {
      return { kind: 'meta-name' };
    }
  }

  if (ctx.ns === 'svg') return classifySvg(lower, ctx);
  if (ctx.ns === 'math') return classifyMath(lower);
  return classifyHtml(lower, value, ctx);
}

function classifyHtml(lower: string, value: string | null, ctx: Context): Decision {
  const tag = ctx.tag?.toLowerCase() ?? null;
  const own = tag !== null ? ELEMENT_ATTRIBUTES.get(tag) : undefined;

  // 1. 부모 요소 전용 속성 (meta 의 content, img 의 width=100, option 의 label ...)
  if (own?.has(lower) && valueFits(tag!, lower, value)) return { kind: 'attribute' };

  // 2. 요소 이름이기도 한 전역 속성 (title, slot) 은 요소 안에서는 속성
  if (tag !== null && (lower === 'title' || lower === 'slot')) return { kind: 'attribute' };

  // 3. HTML 요소
  if (HTML_ELEMENTS.has(lower)) return { kind: 'element' };

  // 4. CSS 속성
  if (CSS_PROPERTIES.has(lower)) {
    if (lower === 'translate' && value !== null && /^(yes|no)$/i.test(value.trim())) {
      return { kind: 'attribute' };
    }
    return { kind: 'style' };
  }

  // 5. HTML 속성
  if (GLOBAL_ATTRIBUTES.has(lower)) return { kind: 'attribute' };
  if (ALL_HTML_ATTRIBUTES.has(lower)) {
    const misplaced = tag !== null && HTML_ELEMENTS.has(tag) && !own?.has(lower);
    return { kind: 'attribute', misplaced };
  }

  // 6. 모르는 이름은 속성으로 (hx-get, x-data 같은 사용자 정의 속성)
  return { kind: 'attribute', unknown: true };
}

/** 이름이 겹치는 속성은 값의 모양을 보고 결정합니다. */
function valueFits(tag: string, attribute: string, value: string | null): boolean {
  if (attribute === 'width' || attribute === 'height' || (tag === 'table' && attribute === 'border')) {
    return value === null || /^\d+$/.test(value.trim());
  }
  if (attribute === 'cite') return value !== null && looksLikeUrl(value);
  return true;
}

function classifySvg(lower: string, ctx: Context): Decision {
  if (lower === 'path' && ctx.tag !== 'animateMotion') return { kind: 'element' };
  if (SVG_ATTRIBUTES_LOWER.has(lower)) return { kind: 'attribute' };
  if (SVG_ELEMENTS_LOWER.has(lower)) return { kind: 'element' };
  if (GLOBAL_ATTRIBUTES.has(lower)) return { kind: 'attribute' };
  if (CSS_PROPERTIES.has(lower)) return { kind: 'style' };
  return { kind: 'attribute', unknown: true };
}

function classifyMath(lower: string): Decision {
  if (MATH_ATTRIBUTES.has(lower)) return { kind: 'attribute' };
  if (MATH_ELEMENTS.has(lower)) return { kind: 'element' };
  if (GLOBAL_ATTRIBUTES.has(lower)) return { kind: 'attribute' };
  if (CSS_PROPERTIES.has(lower)) return { kind: 'style' };
  return { kind: 'attribute', unknown: true };
}
