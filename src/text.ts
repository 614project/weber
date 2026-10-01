/** 문자열 처리 도우미 모음 */

export type QuotedResult = { value: string; end: number } | { error: string; at: number };

/**
 * `text[start]`에 있는 따옴표 문자열을 읽어 이스케이프를 풀어줍니다.
 * `"`와 `'`는 한 줄 안에서 닫혀야 하고, 백틱(`)은 여러 줄을 허용합니다.
 * 성공하면 닫는 따옴표 다음 위치(end)를 함께 돌려줍니다.
 */
export function readQuoted(text: string, start: number): QuotedResult {
  const quote = text[start];
  let value = '';
  let i = start + 1;
  while (i < text.length) {
    const c = text[i];
    if (c === quote) return { value, end: i + 1 };
    if (c === '\n' && quote !== '`') {
      return { error: '문자열이 닫히지 않았습니다. 여러 줄 텍스트는 백틱(`)으로 감싸세요.', at: start };
    }
    if (c !== '\\') {
      value += c;
      i++;
      continue;
    }
    const next = text[i + 1];
    i += 2;
    switch (next) {
      case 'n': value += '\n'; break;
      case 't': value += '\t'; break;
      case 'r': value += '\r'; break;
      case '0': value += '\0'; break;
      case '\n': break; // 줄 이어쓰기
      case 'x':
      case 'u': {
        const escapeStart = i - 2;
        let hex: string;
        if (next === 'u' && text[i] === '{') {
          const close = text.indexOf('}', i);
          if (close < 0) return { error: "이스케이프 '\\u{'가 닫히지 않았습니다.", at: escapeStart };
          hex = text.slice(i + 1, close);
          i = close + 1;
        } else {
          hex = text.slice(i, i + (next === 'x' ? 2 : 4));
          i += hex.length;
        }
        const valid = /^[0-9a-fA-F]+$/.test(hex) && (next === 'u' ? hex.length >= 4 || text[escapeStart + 2] === '{' : hex.length === 2);
        const code = valid ? parseInt(hex, 16) : NaN;
        if (Number.isNaN(code) || code > 0x10ffff) {
          return { error: `올바르지 않은 이스케이프 '\\${next}${hex}'입니다.`, at: escapeStart };
        }
        value += String.fromCodePoint(code);
        break;
      }
      case undefined:
        return { error: '문자열이 닫히지 않았습니다.', at: start };
      default:
        value += next;
    }
  }
  return {
    error: quote === '`' ? '백틱 문자열이 닫히지 않았습니다.' : '문자열이 닫히지 않았습니다.',
    at: start,
  };
}

/** 값 전체가 따옴표 문자열 하나라면 그 내용을, 아니면 null 을 돌려줍니다. */
export function unquote(raw: string): string | null {
  if (!/^["'`]/.test(raw)) return null;
  const r = readQuoted(raw, 0);
  return 'value' in r && r.end === raw.length ? r.value : null;
}

/** 같은 줄 안에서 `text[start]`의 따옴표가 닫히는 위치. 없으면 -1 */
export function findQuoteEnd(text: string, start: number): number {
  const quote = text[start];
  for (let i = start + 1; i < text.length; i++) {
    const c = text[i];
    if (c === '\\') {
      i++;
      continue;
    }
    if (c === quote) return i;
    if (c === '\n' && quote !== '`') return -1;
  }
  return -1;
}

export interface CodeLines {
  lines: string[];
  /** true 인 줄은 문자열 내부이므로 들여쓰기를 바꾸지 않습니다. */
  verbatim: boolean[];
}

/**
 * 코드 블록의 공통 들여쓰기를 제거합니다.
 * 문자열/템플릿 리터럴 내부의 줄(verbatimOffsets)은 건드리지 않습니다.
 */
export function dedentCode(code: string, verbatimOffsets: readonly number[] = []): CodeLines {
  const verbatimSet = new Set(verbatimOffsets);
  let lines: string[] = [];
  let verbatim: boolean[] = [];
  let offset = 0;
  for (const line of code.split('\n')) {
    lines.push(line);
    verbatim.push(verbatimSet.has(offset));
    offset += line.length + 1;
  }

  // `{` 와 같은 줄에서 시작한 코드는 들여쓰기 계산에서 제외
  const firstInline = lines[0].trim() !== '';
  if (firstInline) lines[0] = lines[0].trimStart();

  // 앞뒤 빈 줄 제거
  while (lines.length && lines[0].trim() === '' && !verbatim[0]) {
    lines.shift();
    verbatim.shift();
  }
  while (lines.length && lines[lines.length - 1].trim() === '' && !verbatim[lines.length - 1]) {
    lines.pop();
    verbatim.pop();
  }

  let common: string | null = null;
  lines.forEach((line, k) => {
    if (verbatim[k] || line.trim() === '' || (k === 0 && firstInline)) return;
    const indent = /^[ \t]*/.exec(line)![0];
    if (common === null) common = indent;
    else {
      let m = 0;
      while (m < common.length && m < indent.length && common[m] === indent[m]) m++;
      common = common.slice(0, m);
    }
  });
  const cut = (common as string | null)?.length ?? 0;
  lines = lines.map((line, k) => {
    if (verbatim[k]) return line;
    if (line.trim() === '') return '';
    return k === 0 && firstInline ? line.trimEnd() : line.slice(cut).trimEnd();
  });
  return { lines, verbatim };
}

/** HTML 텍스트 이스케이프 */
export function escapeText(text: string): string {
  return text
    .replace(/&(?=[A-Za-z0-9#])/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** HTML 속성값을 따옴표로 감싸 출력합니다. */
export function quoteAttribute(value: string): string {
  const amp = value.replace(/&(?=[A-Za-z0-9#])/g, '&amp;');
  if (amp.includes('"') && !amp.includes("'")) return `'${amp}'`;
  return `"${amp.replace(/"/g, '&quot;')}"`;
}

/** 공백이 없고 파일 경로나 URL 처럼 보이는지 */
export function looksLikeUrl(value: string): boolean {
  const v = value.trim();
  if (!v || /\s/.test(v)) return false;
  return (
    /^([a-z][a-z0-9+.-]*:|\/|\.\.?\/|#)/i.test(v) || /^[\w.~-]+(\/[\w.~%-]*)*\.[a-z0-9]{1,8}([?#].*)?$/i.test(v)
  );
}

/** 절대 URL (`https://...`, `//...`) 인지 */
export function isAbsoluteUrl(value: string): boolean {
  return /^(https?:)?\/\/\S+$/i.test(value.trim());
}

/** 두 문자열 사이의 편집 거리 (인접한 두 글자가 뒤바뀐 것도 1로 셉니다) */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** 후보 중에서 가장 비슷한 이름을 찾습니다. (오타 제안용) */
export function suggest(name: string, candidates: Iterable<string>): string | null {
  const limit = name.length <= 2 ? 0 : name.length <= 4 ? 1 : 2;
  let best: string | null = null;
  let bestDistance = limit + 1;
  if (limit === 0) return null;
  for (const candidate of candidates) {
    if (Math.abs(candidate.length - name.length) > limit) continue;
    const d = editDistance(name, candidate);
    if (d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }
  return best;
}
