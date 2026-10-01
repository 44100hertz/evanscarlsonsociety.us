#!/usr/bin/env node
// Pull Grant's public Substack into content/, sanitise the article bodies,
// prescale the cover images, and emit one JSON per article for the Astro
// content collection.
//
//   pnpm sync              only fetch what is missing
//   pnpm sync --refresh    refetch every post
//
// Writes: content/posts/*.json + content/archive.json (raw cache, the awkward
// part we do not want to repeat), content/dimensions.json (logged on the way
// through so a machine without ImageMagick can still build), and
// src/content/articles/*.json (clean input for Astro).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const POSTS = path.join(CONTENT, 'posts');
const ARTICLES = path.join(ROOT, 'src', 'content', 'articles');
const COVERS = path.join(ROOT, 'public', 'assets', 'covers');
const DIMS = path.join(CONTENT, 'dimensions.json');

const PUB = 'https://grantkl.substack.com';
const AUTHOR = 'Grant Klusmann';
const ARCHIVE = path.join(CONTENT, 'archive.json');
const refresh = process.argv.includes('--refresh');

// ---------------------------------------------------------------------------
// Substack body_html -> the handful of tags the stylesheet knows about
// ---------------------------------------------------------------------------

const DROP = new Set(['script', 'style', 'form', 'button', 'svg', 'picture', 'img',
  'figure', 'iframe', 'video', 'object', 'input', 'embed', 'source']);
const KEEP = new Set(['p', 'strong', 'em', 'b', 'i', 'a', 'sup', 'sub', 'figcaption',
  'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'br']);
const VOID = new Set(['br']);

const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function walk(node, out) {
  for (const child of node.childNodes) {
    if (child.nodeType === 3) { out.push(child.rawText); continue; }
    if (child.nodeType !== 1) continue;
    const tag = (child.rawTagName || '').toLowerCase();
    if (DROP.has(tag)) continue;
    if (!KEEP.has(tag)) { walk(child, out); continue; }   // div, span, anything unknown
    if (tag === 'a') {
      const href = child.getAttribute('href') ?? '';
      if (!/^https?:\/\//.test(href)) { walk(child, out); continue; }
      out.push(`<a href="${escAttr(href)}">`);
      walk(child, out);
      out.push('</a>');
      continue;
    }
    out.push(`<${tag}>`);
    walk(child, out);
    if (!VOID.has(tag)) out.push(`</${tag}>`);
  }
}

function cleanBody(raw) {
  const out = [];
  walk(parse(raw, { comment: false }), out);
  return out.join('')
    .replace(/[\u00a0]|&nbsp;/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    // Substack's trailing subscribe pitch sometimes sits outside the widget we drop.
    .replace(/<p>(?:(?!<\/p>)[\s\S])*?(?:Thanks for reading|Subscribe for free|Share this post|Leave a comment)(?:(?!<\/p>)[\s\S])*?<\/p>/gi, '')
    .replace(/<p>\s*<\/p>/g, '')
    .trim();
}

function coverUrl(raw) {
  const m = /<div class="captioned-image-container">[\s\S]*?<a[^>]+href="([^"]+)"/.exec(raw)
    ?? /<div class="captioned-image-container">[\s\S]*?<img[^>]+src="([^"]+)"/.exec(raw);
  if (!m) return null;
  const url = m[1].replace(/&amp;/g, '&');
  if (!url.includes('%3A')) return url;
  return decodeURIComponent(url.slice(url.lastIndexOf('/') + 1));  // unwrap substackcdn
}

// ---------------------------------------------------------------------------
// network + cover images
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

function readJson(file, fallback) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
}

function magick(args) {
  return execFileSync('magick', args, { encoding: 'utf8' });
}

function dimensions(file) {
  const [w, h] = magick(['identify', '-format', '%w %h', file]).split(' ');
  return [Number(w), Number(h)];
}

const COVER_SIZES = { full: [1024, 68], thumb: [480, 68] };

async function cover(slug, url) {
  const file = (n, e) => path.join(COVERS, `${slug}-${n}.${e}`);
  const want = Object.keys(COVER_SIZES).flatMap((n) => ['webp', 'jpg'].map((e) => file(n, e)));
  const logged = readJson(DIMS, {});
  if (want.every((f) => fs.existsSync(f)) && logged[slug]) return logged[slug];

  // The originals are a gitignored cache, so a fresh clone only needs them when
  // a cover actually has to be generated.
  const src = path.join(CONTENT, 'covers', `${slug}.orig`);
  if (!fs.existsSync(src)) {
    if (!url) throw new Error(`${slug}: covers missing and no source image url`);
    await download(url, src);
  }
  fs.mkdirSync(COVERS, { recursive: true });
  for (const [n, [width, quality]] of Object.entries(COVER_SIZES)) {
    for (const ext of ['webp', 'jpg']) {
      const args = [src, '-resize', `${width}x>`, '-strip', '-quality', String(quality)];
      if (ext === 'webp') args.push('-define', 'webp:method=6');
      magick([...args, file(n, ext)]);
    }
  }
  logged[slug] = Object.fromEntries(
    Object.keys(COVER_SIZES).map((n) => [n, dimensions(file(n, 'webp'))]));
  fs.writeFileSync(DIMS, JSON.stringify(logged, null, 1) + '\n');
  return logged[slug];
}

// ---------------------------------------------------------------------------

async function main() {
  fs.mkdirSync(POSTS, { recursive: true });
  fs.mkdirSync(ARTICLES, { recursive: true });

  if (refresh || !fs.existsSync(ARCHIVE)) {
    const res = await fetch(`${PUB}/api/v1/archive?sort=new&limit=200`);
    fs.writeFileSync(ARCHIVE, JSON.stringify(await res.json(), null, 1));
    console.log('archive: fetched');
  }
  const archive = readJson(ARCHIVE, []);
  const meta = Object.fromEntries(archive.map((p) => [p.slug, p]));
  console.log(`archive: ${archive.length} posts`);

  const written = [];
  for (const post of archive) {
    if (post.wordcount < 5) {
      console.log(`  skip ${post.slug}: placeholder post`);
      continue;
    }
    if ((meta[post.slug]?.audience ?? 'everyone') !== 'everyone') {
      console.log(`  skip ${post.slug}: subscriber-only, only a preview is public`);
      continue;
    }
    const cached = path.join(POSTS, `${post.slug}.json`);
    if (refresh || !fs.existsSync(cached)) {
      await download(`${PUB}/api/v1/posts/${post.slug}`, cached);
      console.log(`  fetched ${post.slug}`);
      await sleep(400);   // be polite
    }
    const raw = readJson(cached, null);
    if (!raw?.body_html) {
      console.log(`  skip ${post.slug}: no public body`);
      continue;
    }

    const url = raw.cover_image || coverUrl(raw.body_html);
    const dims = url ? await cover(post.slug, url) : { full: [0, 0], thumb: [0, 0] };
    if (!url) console.log(`  warn ${post.slug}: no cover image`);

    const article = {
      title: raw.title,
      subtitle: (raw.subtitle || '').trim(),
      date: raw.post_date || post.post_date,
      author: AUTHOR,
      canonical: raw.canonical_url || `${PUB}/p/${post.slug}`,
      pub: 'grantkl.substack.com',
      body: cleanBody(raw.body_html),
      thumbW: dims.thumb[0], thumbH: dims.thumb[1],
      fullW: dims.full[0], fullH: dims.full[1],
    };
    fs.writeFileSync(path.join(ARTICLES, `${post.slug}.json`),
      JSON.stringify(article, null, 1) + '\n');
    written.push(post.slug);
  }

  // Drop articles that are no longer in the archive (renamed or unpublished).
  for (const file of fs.readdirSync(ARTICLES)) {
    const slug = file.replace(/\.json$/, '');
    if (file.endsWith('.json') && !written.includes(slug)) {
      fs.unlinkSync(path.join(ARTICLES, file));
      console.log(`  removed stale ${file}`);
    }
  }
  console.log(`synced ${written.length} articles`);
}

main();
