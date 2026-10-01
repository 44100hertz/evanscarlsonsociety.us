#!/usr/bin/env node
// Verify that every local href/src in the built site resolves. Run after
// `pnpm build`; deploy.sh refuses to publish otherwise.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(ROOT, '_build');
const ATTR = /(?:href|src|srcset)\s*=\s*"([^"]+)"/g;
const SKIP = /^(https?:|mailto:|data:)/;

function* pages(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* pages(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

function* targets(html) {
  for (const [, raw] of html.matchAll(ATTR)) {
    for (const part of raw.split(',')) {
      // root-relative paths resolve against the deployed site root
      const url = part.trim().split(' ')[0].split('#')[0].split('?')[0];
      if (url && !SKIP.test(url)) yield url;
    }
  }
}

if (!fs.existsSync(BUILD)) {
  console.error('no _build/ — run `pnpm build` first');
  process.exit(1);
}

const all = [...pages(BUILD)];
const broken = [];
for (const page of all) {
  for (const url of targets(fs.readFileSync(page, 'utf8'))) {
    const file = url.startsWith('/') ? path.join(BUILD, url) : path.join(path.dirname(page), url);
    if (!fs.existsSync(file)) broken.push(`${path.relative(BUILD, page)} -> ${url}`);
  }
}

if (broken.length) {
  console.error(`BROKEN:\n  ${broken.join('\n  ')}`);
  process.exit(1);
}
console.log(`OK: ${all.length} page(s) in _build/, all local links resolve.`);
