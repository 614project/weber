/** weber 구문 트리 (파서의 결과물) */

/** 소스 코드 상의 범위 (오프셋) */
export interface Span {
  start: number;
  end: number;
}

/** `"텍스트"` — 따옴표로 감싼 텍스트 한 줄 */
export interface TextNode {
  type: 'text';
  value: string;
  span: Span;
}

/** `key`, `key: value`, `key value`, `key { ... }` 형태의 문장 */
export interface EntryNode {
  type: 'entry';
  /** 키 이름. `.card { }` 처럼 태그를 생략하면 빈 문자열 */
  key: string;
  /** `div.card#main[title=hi]` 처럼 키에 붙은 선택자 축약 */
  selector: SelectorParts | null;
  /** 키 뒤에 쌍점(:)이 있었는지 */
  colon: boolean;
  value: ValueNode | null;
  body: Body | null;
  span: Span;
}

export interface SelectorParts {
  id: string | null;
  classes: string[];
  attributes: { name: string; value: string | null }[];
}

export interface ValueNode {
  /** 소스에 적힌 그대로의 값 (앞뒤 공백 제거) */
  raw: string;
  /** 값 전체가 문자열 하나라면 따옴표를 벗긴 내용, 아니면 raw 와 같음 */
  text: string;
  /** 값 전체가 따옴표로 감싼 문자열 하나인지 */
  quoted: boolean;
  span: Span;
}

export type Body = NodesBody | CodeBody | CssBody;

/** 일반 weber 블록 */
export interface NodesBody {
  type: 'nodes';
  nodes: WeberNode[];
  span: Span;
}

/** 자바스크립트 블록 (`script { }`, `onclick { }`) — 내용을 그대로 보존 */
export interface CodeBody {
  type: 'code';
  code: string;
  /** code 안에서, 문자열/템플릿 리터럴 내부에서 시작하는 줄의 오프셋 (들여쓰기 금지) */
  verbatimLines: number[];
  span: Span;
}

/** CSS 블록 (`style { }`, `:hover { }`) */
export interface CssBody {
  type: 'css';
  items: CssItem[];
  span: Span;
}

/** 요소 안에 쓴 `:hover { }`, `&.active { }`, `@media ... { }` */
export interface CssRuleNode {
  type: 'css-rule';
  prelude: string;
  items: CssItem[];
  span: Span;
}

export type WeberNode = TextNode | EntryNode | CssRuleNode;

export type CssItem = CssDeclaration | CssBlock | CssStatement;

/** `color: red` 또는 `color red` */
export interface CssDeclaration {
  type: 'declaration';
  property: string;
  value: string;
  span: Span;
}

/** `선택자 { ... }` 또는 `@media ... { ... }` */
export interface CssBlock {
  type: 'block';
  prelude: string;
  items: CssItem[];
  span: Span;
}

/** `@import url(x);` 처럼 블록이 없는 at-규칙 */
export interface CssStatement {
  type: 'statement';
  text: string;
  span: Span;
}
