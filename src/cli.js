#!/usr/bin/env node
// enaga のコマンド(docs/spec/build.md「公開する入口」)。サイトのリポジトリのルートで実行する。
// 原稿の場所の既定は ./content。出力の場所は ./dist で、変えられない(build.md「Performance / Safety」)。

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { main as build, ROOT } from './build.js';
import { main as dev } from './dev/server.js';
import { runRefsVerify } from './refcheck/run.js';
import { BANNER_FILE, bannerSvg, parseBitmap, trim } from './ui/html/logo.js';

const USAGE = `usage: enaga <command> [options]

commands:
  build        [--content <dir>]                    build the site into ./dist
  dev          [--content <dir>]                    preview ./dist at 127.0.0.1:$PORT (default 8000), rebuilding on save
  check        [--content <dir>]                    run the site checks (needs the Playwright browser)
  refs:verify  [--all | --check] [--content <dir>]  confirm that the references exist
  banner       [--content <dir>]                    write ${BANNER_FILE} from <content>/assets/logo.txt

<dir> defaults to ./content.`;

/** 原稿の確かめ方(ADR-004、ADR-010)。enaga の中のテストのうち、値を書かない不変条件だけをサイトの原稿で実行する。 */
export const SITE_CHECKS = [
  'tests/integration/invariants.test.js',
  'tests/integration/banner.test.js',
  'tests/browser/site-invariants.test.js',
];

/**
 * --content を読む。
 * @param {string[]} argv
 * @returns {{ content: string } | string} 誤りなら、その説明
 */
function parseOptions(argv) {
  const out = { content: path.resolve('content') };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== '--content') return `unknown argument ${argv[i]}`;
    const v = argv[++i];
    if (v === undefined) return '--content needs a directory';
    out.content = path.resolve(v);
  }
  return out;
}

/**
 * 子プロセスを、入出力をそのままつないで実行し、終了コードを返す。
 * @param {string[]} args @param {NodeJS.ProcessEnv} env
 * @returns {Promise<number>}
 */
function run(args, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, { stdio: 'inherit', env });
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

/**
 * コマンドを実行する。
 * Preconditions: 依存をインストール済み。check は Playwright のブラウザもインストール済み。
 * Postconditions: 終了コードを返す。0 は成功、1 はビルドやテストの失敗、64 は引数の誤り。
 *   dev はサーバーを動かしたまま undefined を返す(止めるまで終わらない)。
 *   refs:verify の終了コードは docs/spec/reference-check.md のとおり。
 * Failure modes: 引数が誤っていれば、使い方を標準エラー出力に出して 64。
 * Side effects: build と dev は ./dist を消して書き直す。refs:verify はネットワークに問い合わせ、確認の記録を書く。
 *   banner は ./docs/assets/banner.svg を書く。
 * @param {string[]} argv  コマンド名から後の引数
 * @returns {Promise<number | undefined>}
 */
export async function main(argv) {
  const [command, ...rest] = argv;
  if (command === 'refs:verify') {
    return runRefsVerify({
      argv: rest,
      contentDir: path.resolve('content'),
      fetch: (url, init) => fetch(url, init),
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      now: () => new Date(),
      log: (line) => console.log(line),
    });
  }
  const options = parseOptions(rest);
  if (typeof options === 'string' || !['build', 'dev', 'check', 'banner'].includes(command)) {
    if (command && command !== 'help' && command !== '--help') {
      console.error(typeof options === 'string' ? options : `unknown command ${command}`);
    }
    console.error(USAGE);
    return command === 'help' || command === '--help' ? 0 : 64;
  }
  if (command === 'build') {
    return build({ contentDir: options.content, outDir: path.resolve('dist') });
  }
  if (command === 'dev') {
    dev({ contentDir: options.content, outDir: path.resolve('dist') });
    return undefined;
  }
  if (command === 'check') {
    return run(['--test', ...SITE_CHECKS.map((f) => path.join(ROOT, f))], {
      ...process.env,
      ENAGA_SITE_ROOT: process.cwd(),
      ENAGA_SITE_CONTENT: options.content,
    });
  }
  const logo = trim(parseBitmap(await fs.readFile(path.join(options.content, 'assets/logo.txt'), 'utf8')));
  const file = path.resolve(BANNER_FILE);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, bannerSvg(logo));
  console.log(BANNER_FILE);
  return 0;
}

const code = await main(process.argv.slice(2)).catch((e) => {
  console.error(e);
  return 1;
});
if (code !== undefined) process.exitCode = code;
