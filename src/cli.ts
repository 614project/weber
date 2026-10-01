#!/usr/bin/env node
import { mkdirSync, readFileSync, readdirSync, statSync, watch, writeFileSync } from 'node:fs';
import path from 'node:path';
import { compile, VERSION, WeberError, type CompileOptions, type Diagnostic, type OutputMode } from './index.js';

const HELP = `weber ${VERSION} — key { ... } 와 key: value 로 웹을 만드는 언어

사용법: weber [옵션] <파일 또는 폴더...>

  weber index.weber               index.html 을 만듭니다
  weber index.weber -o out.html   지정한 파일로 출력합니다
  weber src -o dist               폴더 안의 모든 .weber 파일을 dist 로 변환합니다
  weber index.weber --stdout      결과를 화면(표준 출력)으로 내보냅니다
  cat index.weber | weber -       표준 입력을 읽어 표준 출력으로 내보냅니다

옵션:
  -o, --out <경로>     출력 파일 또는 폴더
      --stdout         결과를 표준 출력으로 내보냄
  -w, --watch          파일이 바뀔 때마다 다시 변환
  -m, --minify         공백 없이 압축해서 출력
      --indent <n>     들여쓰기 칸 수 (기본값 2, tab 도 가능)
      --document       항상 전체 HTML 문서(<!DOCTYPE html>...)로 출력
      --fragment       쓴 내용만 출력 (doctype, head, body 자동 생성 안 함)
  -q, --quiet          경고를 표시하지 않음
  -v, --version        버전 표시
  -h, --help           도움말 표시
`;

interface CliOptions {
  inputs: string[];
  out?: string;
  stdout: boolean;
  watch: boolean;
  quiet: boolean;
  compile: CompileOptions;
}

interface Job {
  /** 입력 파일 경로. '-' 이면 표준 입력 */
  input: string;
  /** 출력 파일 경로. null 이면 표준 출력 */
  output: string | null;
}

const useColor = process.stderr.isTTY && !process.env.NO_COLOR;
const paint = (code: number, text: string) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text);
const red = (t: string) => paint(31, t);
const yellow = (t: string) => paint(33, t);
const green = (t: string) => paint(32, t);
const dim = (t: string) => paint(2, t);

class UsageError extends Error {}

function parseArgs(argv: string[]): CliOptions | 'help' | 'version' {
  const options: CliOptions = { inputs: [], stdout: false, watch: false, quiet: false, compile: {} };
  let mode: OutputMode = 'auto';
  for (let k = 0; k < argv.length; k++) {
    let arg = argv[k];
    let inline: string | undefined;
    const eq = arg.indexOf('=');
    if (arg.startsWith('--') && eq > 0) {
      inline = arg.slice(eq + 1);
      arg = arg.slice(0, eq);
    }
    const take = (): string => {
      const value = inline ?? argv[++k];
      if (value === undefined) throw new UsageError(`${arg} 뒤에 값이 필요합니다.`);
      return value;
    };
    switch (arg) {
      case '-h':
      case '--help':
        return 'help';
      case '-v':
      case '--version':
        return 'version';
      case '-o':
      case '--out':
        options.out = take();
        break;
      case '--stdout':
        options.stdout = true;
        break;
      case '-w':
      case '--watch':
        options.watch = true;
        break;
      case '-m':
      case '--minify':
        options.compile.minify = true;
        break;
      case '--indent': {
        const value = take();
        if (value === 'tab') options.compile.indent = '\t';
        else if (/^\d+$/.test(value)) options.compile.indent = Number(value);
        else throw new UsageError(`--indent 에는 숫자나 tab 을 써야 합니다: ${value}`);
        break;
      }
      case '--document':
        mode = 'document';
        break;
      case '--fragment':
        mode = 'fragment';
        break;
      case '-q':
      case '--quiet':
        options.quiet = true;
        break;
      default:
        if (arg.startsWith('-') && arg !== '-') throw new UsageError(`알 수 없는 옵션입니다: ${arg}`);
        options.inputs.push(arg);
    }
  }
  options.compile.mode = mode;
  return options;
}

/** 폴더 안의 .weber 파일을 모두 찾습니다. (node_modules, 숨김 폴더 제외) */
function findWeberFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...findWeberFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.weber')) found.push(full);
  }
  return found.sort();
}

const toHtmlName = (file: string) => file.replace(/\.weber$/i, '') + '.html';

function isDirectory(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** 입력 하나에 대한 작업 목록 (폴더면 안의 파일 전부) */
function jobsFor(input: string, options: CliOptions, single: boolean): Job[] {
  if (input === '-') return [{ input, output: null }];
  if (isDirectory(input)) {
    return findWeberFiles(input).map((file) => ({
      input: file,
      output: options.stdout
        ? null
        : options.out
          ? path.join(options.out, toHtmlName(path.relative(input, file)))
          : toHtmlName(file),
    }));
  }
  let output: string | null;
  if (options.stdout) output = null;
  else if (!options.out) output = toHtmlName(input);
  else if (single && !options.out.endsWith('/') && !isDirectory(options.out)) output = options.out;
  else output = path.join(options.out, toHtmlName(path.basename(input)));
  return [{ input, output }];
}

function formatWarning(w: Diagnostic): string {
  return `${yellow('경고')}: ${w.message} ${dim(`(${w.filename ?? '<입력>'}:${w.line}:${w.column})`)}`;
}

/** 작업 하나를 실행합니다. 성공하면 true */
function run(job: Job, options: CliOptions): boolean {
  const label = job.input === '-' ? '<표준 입력>' : job.input;
  let code: string;
  try {
    code = job.input === '-' ? readFileSync(0, 'utf8') : readFileSync(job.input, 'utf8');
  } catch (e) {
    console.error(`${red('오류')}: ${label} 파일을 읽을 수 없습니다. (${(e as Error).message})`);
    return false;
  }
  try {
    const result = compile(code, { ...options.compile, filename: job.input === '-' ? undefined : job.input });
    if (!options.quiet) for (const w of result.warnings) console.error(formatWarning(w));
    if (job.output === null) {
      process.stdout.write(result.html);
    } else {
      mkdirSync(path.dirname(job.output), { recursive: true });
      writeFileSync(job.output, result.html);
      console.error(`${green('✔')} ${label} → ${job.output}`);
    }
    return true;
  } catch (e) {
    if (e instanceof WeberError) {
      console.error(`${red('weber 오류')}: ${e.message}\n${e.frame}`);
      return false;
    }
    throw e;
  }
}

function startWatching(options: CliOptions, jobs: Job[]): void {
  const timers = new Map<string, NodeJS.Timeout>();
  const schedule = (job: Job) => {
    const key = path.resolve(job.input);
    clearTimeout(timers.get(key));
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        if (isFile(job.input)) run(job, options);
      }, 60),
    );
  };

  for (const input of options.inputs) {
    if (input === '-') continue;
    if (isDirectory(input)) {
      watch(input, { recursive: true }, (_event, filename) => {
        if (!filename || !String(filename).endsWith('.weber')) return;
        const file = path.join(input, String(filename));
        const job = jobsFor(input, options, false).find((j) => path.resolve(j.input) === path.resolve(file));
        if (job) schedule(job);
      });
    } else {
      const dir = path.dirname(input);
      const base = path.basename(input);
      const job = jobs.find((j) => j.input === input);
      watch(dir, (_event, filename) => {
        if (job && String(filename) === base) schedule(job);
      });
    }
  }
  console.error(dim('변경을 기다리는 중... (종료: Ctrl+C)'));
}

function isFile(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

function main(argv: string[]): number {
  let options: CliOptions | 'help' | 'version';
  try {
    options = parseArgs(argv);
  } catch (e) {
    if (!(e instanceof UsageError)) throw e;
    console.error(`${red('오류')}: ${e.message}\n\n${HELP}`);
    return 2;
  }
  if (options === 'help') {
    process.stdout.write(HELP);
    return 0;
  }
  if (options === 'version') {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }
  if (!options.inputs.length) {
    process.stdout.write(HELP);
    return 2;
  }

  const single = options.inputs.length === 1 && !isDirectory(options.inputs[0]);
  if (!single && options.out?.endsWith('.html') && !options.stdout) {
    console.error(`${red('오류')}: 여러 파일을 변환할 때는 -o 에 폴더를 지정하세요.`);
    return 2;
  }
  const jobs: Job[] = [];
  for (const input of options.inputs) {
    if (input !== '-' && !isDirectory(input) && !isFile(input)) {
      console.error(`${red('오류')}: ${input} 을(를) 찾을 수 없습니다.`);
      return 1;
    }
    jobs.push(...jobsFor(input, options, single));
  }
  if (!jobs.length) {
    console.error(`${yellow('경고')}: 변환할 .weber 파일이 없습니다.`);
  }

  let ok = true;
  for (const job of jobs) ok = run(job, options) && ok;

  if (options.watch) {
    startWatching(options, jobs);
    return -1;
  }
  return ok ? 0 : 1;
}

const status = main(process.argv.slice(2));
if (status >= 0) process.exitCode = status;
