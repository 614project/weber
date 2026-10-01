// 소개 페이지와 플레이그라운드가 함께 쓰는 도구: 코드 색칠, 공유 링크 인코딩
import { compile, VERSION } from './weber/index.js';

export { compile, VERSION };

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const span = (cls, text) => (cls ? `<span class="${cls}">${escape(text)}</span>` : escape(text));

/** 같은 줄(백틱은 여러 줄)에서 따옴표가 닫히는 위치. 없으면 -1 */
function quoteEnd(code, start) {
  const quote = code[start];
  for (let i = start + 1; i < code.length; i++) {
    if (code[i] === '\\') i++;
    else if (code[i] === quote) return i;
    else if (code[i] === '\n' && quote !== '`') return -1;
  }
  return -1;
}

/**
 * weber 코드를 색칠한 HTML 을 돌려줍니다.
 * @param marks compile() 결과의 classifications (키를 무엇으로 판별했는지)
 * @param errorAt 오류 위치 (오프셋). 그 글자에 밑줄을 긋습니다.
 */
export function highlightWeber(code, marks = [], errorAt = -1) {
  const starts = new Map(marks.map((m) => [m.start, m]));
  let out = '';
  const emit = (cls, from, to) => {
    if (errorAt >= from && errorAt < to) {
      out += span(cls, code.slice(from, errorAt));
      const ch = code[errorAt];
      out += `<span class="err${cls ? ` ${cls}` : ''}">${ch === '\n' ? ' ' : escape(ch)}</span>`;
      if (ch === '\n') out += '\n';
      out += span(cls, code.slice(errorAt + 1, to));
    } else {
      out += span(cls, code.slice(from, to));
    }
  };

  let i = 0;
  while (i < code.length) {
    const mark = starts.get(i);
    if (mark && mark.end > i) {
      emit(`k-${mark.kind}`, i, mark.end);
      i = mark.end;
      continue;
    }
    const c = code[i];
    const afterSpace = i === 0 || /\s/.test(code[i - 1]);
    let end = -1;
    let cls = '';
    if (c === '/' && code[i + 1] === '/' && afterSpace) {
      end = code.indexOf('\n', i);
      if (end < 0) end = code.length;
      cls = 't-comment';
    } else if (c === '/' && code[i + 1] === '*') {
      end = code.indexOf('*/', i + 2);
      end = end < 0 ? code.length : end + 2;
      cls = 't-comment';
    } else if (c === '"' || c === "'" || c === '`') {
      const close = quoteEnd(code, i);
      if (close > 0) {
        end = close + 1;
        cls = 't-string';
      }
    } else if (c === '{' || c === '}') {
      end = i + 1;
      cls = 't-punct';
    }
    if (end < 0) {
      end = i + 1;
      while (end < code.length && !starts.has(end) && !'/"\'`{}'.includes(code[end])) end++;
    }
    emit(cls, i, end);
    i = end;
  }
  if (errorAt >= code.length) out += '<span class="err"> </span>';
  return out;
}

/** 변환된 HTML 을 색칠합니다. style 은 CSS 색, on* 와 script 는 JS 색으로 칠해 입력과 짝을 맞춥니다. */
export function highlightHtml(html) {
  let out = '';
  let i = 0;
  while (i < html.length) {
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i);
      const stop = end < 0 ? html.length : end + 3;
      out += span('t-comment', html.slice(i, stop));
      i = stop;
      continue;
    }
    const tag = /^<(\/?)([A-Za-z][\w:-]*)|^<!DOCTYPE[^>]*>/i.exec(html.slice(i, i + 64));
    if (!tag) {
      let end = html.indexOf('<', i + 1);
      if (end < 0) end = html.length;
      out += escape(html.slice(i, end));
      i = end;
      continue;
    }
    if (!tag[2]) {
      out += span('t-comment', tag[0]);
      i += tag[0].length;
      continue;
    }
    const name = tag[2].toLowerCase();
    out += span('k-element', tag[0]);
    i += tag[0].length;
    // 속성들
    const attr = /\s+([^\s=/>]+)(?:(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+))?/y;
    for (;;) {
      attr.lastIndex = i;
      const m = attr.exec(html);
      if (!m) break;
      const attrName = m[1].toLowerCase();
      const valueClass = attrName === 'style' ? 'k-css' : /^on/.test(attrName) ? 'k-js' : 't-string';
      out += escape(m[0].slice(0, m[0].indexOf(m[1]))) + span('k-attribute', m[1]);
      if (m[2]) out += escape(m[2]) + span(valueClass, m[3]);
      i = attr.lastIndex;
    }
    const close = /^\s*\/?>/.exec(html.slice(i));
    if (close) {
      out += span('k-element', close[0]);
      i += close[0].length;
    }
    // <script>, <style> 의 내용
    if (!tag[1] && (name === 'script' || name === 'style')) {
      const end = html.toLowerCase().indexOf(`</${name}`, i);
      const stop = end < 0 ? html.length : end;
      out += span(name === 'style' ? 'k-css' : 'k-js', html.slice(i, stop));
      i = stop;
    }
  }
  return out;
}

const toBase64Url = (bytes) => {
  let binary = '';
  for (let k = 0; k < bytes.length; k += 0x8000) binary += String.fromCharCode(...bytes.subarray(k, k + 0x8000));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromBase64Url = (text) => {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
};
const pipe = async (bytes, transform) =>
  new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(transform)).arrayBuffer());

/** 코드를 주소(#...)에 담을 수 있는 문자열로 바꿉니다. 가능하면 압축합니다. */
export async function encodeCode(code) {
  const bytes = new TextEncoder().encode(code);
  if (typeof CompressionStream === 'function') {
    return `z=${toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')))}`;
  }
  return `code=${toBase64Url(bytes)}`;
}

/** encodeCode() 로 만든 문자열(주소의 # 뒷부분)에서 코드를 꺼냅니다. 실패하면 null */
export async function decodeCode(hash) {
  const m = /^#?(z|code)=([\w-]+)$/.exec(hash);
  if (!m) return null;
  try {
    let bytes = fromBase64Url(m[2]);
    if (m[1] === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}
