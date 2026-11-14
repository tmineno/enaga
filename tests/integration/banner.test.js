// サイトの README のバナー(docs/spec/site.md「ロゴと favicon」、受け入れテスト 32)。`enaga check` が実行する(ADR-010)。
// サイトのリポジトリに docs/assets/banner.svg があるときだけ確かめる。enaga のテストでは tests/fixtures/ をサイトのリポジトリとみなす。

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import * as yaml from 'js-yaml';
import { BANNER_FILE, bannerSvg, parseBitmap, trim } from '../../src/ui/html/logo.js';
import { SITE_CONTENT, SITE_ROOT } from '../helpers/fixture.js';

/** @param {string} file */
async function exists(file) {
  return fs.stat(file).then(
    () => true,
    () => false,
  );
}

const banner = path.join(SITE_ROOT, BANNER_FILE);

test(
  'site 32. README のバナーは、logo.txt から作ったものと一致し、README の見出しはその画像1枚で、代替テキストはサイト名',
  { skip: (await exists(banner)) ? false : `${BANNER_FILE} がない` },
  async () => {
    const logo = trim(parseBitmap(await fs.readFile(path.join(SITE_CONTENT, 'assets/logo.txt'), 'utf8')));
    const svg = await fs.readFile(banner, 'utf8');
    assert.equal(svg, bannerSvg(logo), `${BANNER_FILE} が古い。enaga banner で作り直す`);
    const site = /** @type {{ name: string }} */ (
      yaml.load(await fs.readFile(path.join(SITE_CONTENT, 'site.yml'), 'utf8'))
    );
    const alt = site.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const readme = await fs.readFile(path.join(SITE_ROOT, 'README.md'), 'utf8');
    assert.match(readme, new RegExp(`^<h1><img src="docs/assets/banner\\.svg" alt="${alt}"[^>]*></h1>\\n`));
    assert.doesNotMatch(readme, /<picture>|banner-(light|dark)/);
  },
);
