// introduce/ 의 weber 사이트를 _site/ 로 빌드합니다. (GitHub Pages 배포용)
//   node scripts/build-site.mjs           빌드
//   node scripts/build-site.mjs --serve   빌드 후 http://localhost:8080 에서 보기
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'introduce');
const out = path.join(root, '_site');
const compiler = path.join(root, 'dist/src');

if (!existsSync(path.join(compiler, 'index.js'))) {
  console.error('dist/src 가 없습니다. 먼저 npm run build 를 실행하세요.');
  process.exit(1);
}
const { compile, WeberError } = await import(path.join(compiler, 'index.js'));

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

let failed = false;
for (const file of readdirSync(site)) {
  const from = path.join(site, file);
  if (file.endsWith('.weber')) {
    try {
      const result = compile(readFileSync(from, 'utf8'), { filename: path.relative(root, from) });
      for (const w of result.warnings) {
        console.error(`경고: ${w.message} (${w.filename}:${w.line}:${w.column})`);
        failed = true;
      }
      writeFileSync(path.join(out, file.replace(/\.weber$/, '.html')), result.html);
      console.log(`✔ ${path.relative(root, from)} → _site/${file.replace(/\.weber$/, '.html')}`);
    } catch (error) {
      if (!(error instanceof WeberError)) throw error;
      console.error(error.format());
      failed = true;
    }
  } else {
    cpSync(from, path.join(out, file), { recursive: true });
  }
}

// 플레이그라운드가 브라우저에서 쓸 컴파일러 (cli.js, 타입 선언, 소스맵 제외)
const copyCompiler = (from, to) => {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    if (entry.isDirectory()) copyCompiler(source, path.join(to, entry.name));
    else if (entry.name.endsWith('.js') && entry.name !== 'cli.js') {
      const code = readFileSync(source, 'utf8').replace(/\n\/\/# sourceMappingURL=.*\n?$/, '\n');
      writeFileSync(path.join(to, entry.name), code);
    }
  }
};
copyCompiler(compiler, path.join(out, 'weber'));
writeFileSync(path.join(out, '.nojekyll'), '');

if (failed) {
  console.error('사이트 빌드에 실패했습니다.');
  process.exit(1);
}

if (process.argv.includes('--serve')) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.css': 'text/css' };
  const port = Number(process.env.PORT ?? 8080);
  createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let file = path.join(out, decodeURIComponent(url.pathname));
    if (!file.startsWith(out)) file = out;
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!existsSync(file)) {
      res.writeHead(404).end('Not found');
      return;
    }
    res.writeHead(200, { 'content-type': `${types[path.extname(file)] ?? 'application/octet-stream'}; charset=utf-8` });
    res.end(readFileSync(file));
  }).listen(port, () => console.log(`http://localhost:${port}`));
}
