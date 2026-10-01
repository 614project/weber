// weber 플레이그라운드: 입력할 때마다 변환하고, 판별 결과대로 코드를 색칠하고, 결과를 미리 보여 줍니다.
import { EXAMPLES } from './examples.js';
import { compile, decodeCode, encodeCode, highlightHtml, highlightWeber, VERSION } from './weber-ui.js';

const $ = (selector) => document.querySelector(selector);
const source = $('#source');
const highlight = $('#highlight');
const status = $('#status');
const preview = $('#preview');
const htmlView = $('#html-view');
const examples = $('#examples');
const minify = $('#minify');
const modeLabel = $('#mode-label');
const STORAGE_KEY = 'weber-playground';
const INDENT = '    ';

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 마지막으로 성공한 변환 결과. 오류가 난 동안에도 색칠과 미리보기를 유지하는 데 씁니다. */
let last = { code: '', marks: [], result: null };

// ───────────── 예제 ─────────────

for (const example of EXAMPLES) {
  examples.append(new Option(example.title, example.id));
}
examples.append(new Option('직접 쓰는 중', 'custom'));

examples.addEventListener('change', () => {
  const example = EXAMPLES.find((e) => e.id === examples.value);
  if (!example) return;
  setCode(example.code);
  history.replaceState(null, '', location.pathname);
});

// ───────────── 변환 ─────────────

/** 이전 코드에서 바뀐 부분만큼 색칠 위치를 옮깁니다. (오류가 난 동안 색이 사라지지 않도록) */
function shiftMarks(marks, before, after) {
  let prefix = 0;
  const max = Math.min(before.length, after.length);
  while (prefix < max && before[prefix] === after[prefix]) prefix++;
  let suffix = 0;
  while (suffix < max - prefix && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]) suffix++;
  const changedEnd = before.length - suffix;
  const delta = after.length - before.length;
  return marks.flatMap((m) => {
    if (m.end <= prefix) return [m];
    if (m.start >= changedEnd) return [{ ...m, start: m.start + delta, end: m.end + delta }];
    return [];
  });
}

/** 줄/칸을 오프셋으로 */
function offsetOf(code, line, column) {
  let offset = 0;
  for (let k = 1; k < line; k++) {
    const next = code.indexOf('\n', offset);
    if (next < 0) return code.length;
    offset = next + 1;
  }
  return Math.min(offset + column - 1, code.length);
}

function previewDocument(result) {
  if (result.mode === 'document') return result.html;
  return (
    '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<style>body{margin:16px;font-family:system-ui,sans-serif}</style></head>' +
    `<body>${result.html}</body></html>`
  );
}

let previewTimer = 0;
let lastPreview = '';
function updatePreview(result) {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    const doc = previewDocument(result);
    if (doc !== lastPreview) preview.srcdoc = lastPreview = doc;
  }, 250);
}

function diagnostic(line, column, message) {
  return `<li><button type="button" data-line="${line}" data-column="${column}">${line}:${column}</button> ${escape(message)}</li>`;
}

function render() {
  const code = source.value;
  try {
    const result = compile(code, { filename: 'playground.weber', minify: minify.checked });
    last = { code, marks: result.classifications, result };
    highlight.innerHTML = highlightWeber(code, result.classifications) + '\n';
    htmlView.innerHTML = highlightHtml(result.html);
    modeLabel.textContent = result.mode === 'document' ? '전체 문서' : '조각';
    const count = (kind) => result.classifications.filter((c) => c.kind === kind).length;
    status.innerHTML =
      `<span class="ok">✓ 변환됨</span> · 요소 ${count('element')} · 속성 ${count('attribute')} · CSS ${count('css')} · JS ${count('js')}` +
      (result.warnings.length
        ? `<ul>${result.warnings.map((w) => diagnostic(w.line, w.column, `경고: ${w.message}`)).join('')}</ul>`
        : '');
    updatePreview(result);
  } catch (error) {
    if (!(error && error.name === 'WeberError')) throw error;
    const marks = shiftMarks(last.marks, last.code, code);
    last = { ...last, code, marks };
    highlight.innerHTML = highlightWeber(code, marks, offsetOf(code, error.line, error.column)) + '\n';
    status.innerHTML = `<span class="bad">✕ 오류</span><ul>${diagnostic(error.line, error.column, error.reason)}</ul>`;
  }
  syncScroll();
}

let renderTimer = 0;
function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 60);
}

function setCode(code) {
  source.value = code;
  source.setSelectionRange(0, 0);
  source.scrollTop = 0;
  render();
  save();
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, source.value);
  } catch {
    // 저장소를 쓸 수 없는 환경 (사생활 보호 모드 등)
  }
}

// 오류/경고 위치로 이동
status.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-line]');
  if (!button) return;
  const at = offsetOf(source.value, Number(button.dataset.line), Number(button.dataset.column));
  source.focus();
  source.setSelectionRange(at, at + 1);
});

// ───────────── 편집기 ─────────────

function syncScroll() {
  highlight.scrollTop = source.scrollTop;
  highlight.scrollLeft = source.scrollLeft;
}
source.addEventListener('scroll', syncScroll);

source.addEventListener('input', () => {
  examples.value = 'custom';
  scheduleRender();
  save();
});

/** 되돌리기(Ctrl+Z)가 되도록 텍스트를 넣습니다. */
function insertText(text, from = source.selectionStart, to = source.selectionEnd) {
  source.setSelectionRange(from, to);
  if (!document.execCommand('insertText', false, text)) {
    source.setRangeText(text, from, to, 'end');
    source.dispatchEvent(new Event('input'));
  }
}

source.addEventListener('keydown', (event) => {
  if (event.isComposing || event.keyCode === 229) return; // 한글 입력 중
  const { selectionStart: start, selectionEnd: end, value } = source;
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;

  if (event.key === 'Tab') {
    event.preventDefault();
    if (start === end && !event.shiftKey) return insertText(INDENT);
    // 여러 줄 들여쓰기 / 내어쓰기
    const blockEnd = value.indexOf('\n', end - (end > start && value[end - 1] === '\n' ? 1 : 0));
    const stop = blockEnd < 0 ? value.length : blockEnd;
    const lines = value.slice(lineStart, stop).split('\n');
    const changed = lines.map((line) => (event.shiftKey ? line.replace(/^( {1,4}|\t)/, '') : INDENT + line)).join('\n');
    insertText(changed, lineStart, stop);
    source.setSelectionRange(lineStart, lineStart + changed.length);
    return;
  }

  if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
    event.preventDefault();
    const line = value.slice(lineStart, start);
    const indent = /^[ \t]*/.exec(line)[0];
    if (/\{\s*$/.test(line)) {
      // `div {|}` 에서 Enter → 가운데 줄로
      if (value[end] === '}') {
        insertText(`\n${indent}${INDENT}\n${indent}`);
        const caret = start + 1 + indent.length + INDENT.length;
        source.setSelectionRange(caret, caret);
      } else {
        insertText(`\n${indent}${INDENT}`);
      }
    } else {
      insertText(`\n${indent}`);
    }
    return;
  }

  if (event.key === '}' && start === end) {
    const before = value.slice(lineStart, start);
    if (/^[ \t]+$/.test(before)) {
      event.preventDefault();
      insertText(`${before.replace(/( {1,4}|\t)$/, '')}}`, lineStart, start);
    }
  }
});

// ───────────── 출력 탭 ─────────────

function selectTab(tab) {
  const isPreview = tab === 'preview';
  $('#tab-preview').setAttribute('aria-selected', String(isPreview));
  $('#tab-html').setAttribute('aria-selected', String(!isPreview));
  preview.hidden = !isPreview;
  htmlView.hidden = isPreview;
}
$('#tab-preview').addEventListener('click', () => selectTab('preview'));
$('#tab-html').addEventListener('click', () => selectTab('html'));
minify.addEventListener('change', render);

// ───────────── 공유, 복사, 내려받기 ─────────────

let toastTimer = 0;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

async function copy(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch {
    toast('복사하지 못했습니다. 브라우저 권한을 확인해 주세요.');
  }
}

$('#share').addEventListener('click', async () => {
  history.replaceState(null, '', `#${await encodeCode(source.value)}`);
  copy(location.href, '공유 링크를 복사했습니다');
});

$('#copy').addEventListener('click', () => {
  if (last.result) copy(last.result.html, 'HTML 을 복사했습니다');
});

$('#download').addEventListener('click', () => {
  if (!last.result) return;
  const url = URL.createObjectURL(new Blob([previewDocument(last.result)], { type: 'text/html' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'index.html' });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// ───────────── 시작 ─────────────

async function initialCode() {
  const shared = await decodeCode(location.hash);
  if (shared !== null) return { code: shared, example: 'custom' };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { code: saved, example: EXAMPLES.find((e) => e.code === saved)?.id ?? 'custom' };
  } catch {
    // 저장소를 쓸 수 없으면 첫 예제로
  }
  return { code: EXAMPLES[0].code, example: EXAMPLES[0].id };
}

window.addEventListener('hashchange', async () => {
  const shared = await decodeCode(location.hash);
  if (shared !== null) {
    examples.value = 'custom';
    setCode(shared);
  }
});

const start = await initialCode();
examples.value = start.example;
source.value = start.code;
render();
document.title = `플레이그라운드 — weber v${VERSION}`;
