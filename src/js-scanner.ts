/**
 * 자바스크립트 코드를 "읽기만" 하는 간단한 스캐너.
 * 문자열, 템플릿 리터럴, 주석, 정규식 안의 중괄호에 속지 않고
 * `script { ... }` 블록의 끝(짝이 맞는 `}`)을 찾기 위해 사용합니다.
 */

export interface JsScanResult {
  /** 끝 위치. 찾지 못하면 -1 */
  end: number;
  /** 문자열/템플릿 리터럴 내부에서 시작하는 줄의 시작 오프셋 (들여쓰기를 바꾸면 안 되는 줄) */
  verbatimLines: number[];
}

/** 이 문자 뒤에 오는 `/`는 나눗셈이 아니라 정규식의 시작입니다. */
const REGEX_PRECEDERS = new Set('(,=:[!&|?{};+-*%<>~^'.split(''));
const REGEX_KEYWORDS = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do',
  'else', 'yield', 'await',
]);
const IDENT = /[A-Za-z0-9_$]/;

/**
 * @param mode
 *  - `block`: `{` 바로 다음에서 시작해, 짝이 맞는 `}`의 위치를 반환합니다.
 *  - `line` : 괄호가 모두 닫힌 상태의 줄바꿈, 짝 없는 `}`, 또는 `//` 주석의 시작 위치를 반환합니다.
 */
export function scanJs(s: string, start: number, mode: 'block' | 'line'): JsScanResult {
  const n = s.length;
  const verbatimLines: number[] = [];
  const stack: string[] = [];
  let i = start;
  /** 마지막으로 읽은 의미 있는 문자 (정규식/나눗셈 구분용) */
  let last = '';
  let lastWord = '';

  const fail = (): JsScanResult => ({ end: -1, verbatimLines });

  /** 템플릿 리터럴 본문을 읽습니다. 닫히면 'closed', `${`를 만나면 'expr' */
  const template = (): 'closed' | 'expr' | 'eof' => {
    while (i < n) {
      const c = s[i];
      if (c === '\\') {
        if (s[i + 1] === '\n') verbatimLines.push(i + 2);
        i += 2;
        continue;
      }
      if (c === '`') {
        i++;
        return 'closed';
      }
      if (c === '$' && s[i + 1] === '{') {
        stack.push('${');
        i += 2;
        return 'expr';
      }
      if (c === '\n') verbatimLines.push(i + 1);
      i++;
    }
    return 'eof';
  };

  while (i < n) {
    const c = s[i];

    if (c === '\n') {
      if (mode === 'line' && stack.length === 0) return { end: i, verbatimLines };
      i++;
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      i++;
      continue;
    }

    // 주석
    if (c === '/' && s[i + 1] === '/') {
      if (mode === 'line' && stack.length === 0) return { end: i, verbatimLines };
      while (i < n && s[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && s[i + 1] === '*') {
      const close = s.indexOf('*/', i + 2);
      if (close < 0) return fail();
      i = close + 2;
      continue;
    }

    // 문자열
    if (c === '"' || c === "'") {
      i++;
      while (i < n && s[i] !== c && s[i] !== '\n') {
        if (s[i] === '\\') {
          if (s[i + 1] === '\n') verbatimLines.push(i + 2);
          i += 2;
          continue;
        }
        i++;
      }
      if (s[i] === c) i++;
      last = 'a';
      lastWord = '';
      continue;
    }

    // 템플릿 리터럴
    if (c === '`') {
      i++;
      const r = template();
      if (r === 'eof') return fail();
      last = r === 'expr' ? '{' : 'a';
      lastWord = '';
      continue;
    }

    // 정규식 또는 나눗셈
    if (c === '/') {
      if (last === '' || REGEX_PRECEDERS.has(last) || REGEX_KEYWORDS.has(lastWord)) {
        let j = i + 1;
        let inClass = false;
        let closed = false;
        while (j < n && s[j] !== '\n') {
          const d = s[j];
          if (d === '\\') {
            j += 2;
            continue;
          }
          if (d === '[') inClass = true;
          else if (d === ']') inClass = false;
          else if (d === '/' && !inClass) {
            closed = true;
            break;
          }
          j++;
        }
        if (closed) {
          i = j + 1;
          while (i < n && /[A-Za-z]/.test(s[i])) i++;
          last = 'a';
          lastWord = '';
          continue;
        }
      }
      i++;
      last = '/';
      lastWord = '';
      continue;
    }

    // 괄호
    if (c === '{' || c === '(' || c === '[') {
      stack.push(c);
      last = c;
      lastWord = '';
      i++;
      continue;
    }
    if (c === '}' || c === ')' || c === ']') {
      if (stack.length === 0) {
        if (c === '}') return { end: i, verbatimLines };
        i++;
        last = c;
        continue;
      }
      const top = stack.pop();
      i++;
      if (top === '${') {
        const r = template();
        if (r === 'eof') return fail();
        last = r === 'expr' ? '{' : 'a';
        lastWord = '';
        continue;
      }
      last = c;
      lastWord = '';
      continue;
    }

    // 식별자, 숫자
    if (IDENT.test(c)) {
      let j = i;
      while (j < n && IDENT.test(s[j])) j++;
      lastWord = s.slice(i, j);
      last = 'a';
      i = j;
      continue;
    }

    last = c;
    lastWord = '';
    i++;
  }

  return mode === 'line' && stack.length === 0 ? { end: n, verbatimLines } : fail();
}
