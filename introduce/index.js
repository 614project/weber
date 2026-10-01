// 소개 페이지: 코드 예제를 색칠하고, 실제 weber 컴파일러로 변환한 결과를 보여 줍니다.
import { compile, encodeCode, highlightHtml, highlightWeber, VERSION } from './weber-ui.js';

/** 미리보기용으로, 조각(fragment) 결과를 완전한 문서로 감쌉니다. */
const previewDocument = (result) =>
  result.mode === 'document'
    ? result.html
    : `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><style>body{margin:16px;font-family:system-ui,sans-serif}</style></head><body>${result.html}</body></html>`;

for (const pre of document.querySelectorAll('pre[data-weber]')) {
  const code = pre.textContent;
  try {
    pre.innerHTML = highlightWeber(code, compile(code).classifications);
  } catch {
    pre.innerHTML = highlightWeber(code);
  }
}

for (const pre of document.querySelectorAll('pre[data-html]')) {
  pre.innerHTML = highlightHtml(pre.textContent);
}

// 문법 예제: 옆 칸에 변환 결과, 아래에 플레이그라운드 링크
for (const sample of document.querySelectorAll('.sample')) {
  const source = sample.querySelector('pre[data-weber]');
  const output = sample.querySelector('pre[data-output]');
  const link = sample.querySelector('a.open');
  const code = source.textContent;
  output.innerHTML = highlightHtml(compile(code).html.trimEnd());
  if (link) link.href = `playground.html#${await encodeCode(code)}`;
}

// 머리 그림: 코드 아래에 실제 결과를 보여 줍니다.
const heroCode = document.getElementById('hero-code');
const heroPreview = document.getElementById('hero-preview');
if (heroCode && heroPreview) {
  heroPreview.srcdoc = previewDocument(compile(heroCode.textContent));
  heroPreview.hidden = false;
}

for (const el of document.querySelectorAll('[data-version]')) el.textContent = `weber v${VERSION}`;
