# The Evans Carlson Society

Static site for <https://evanscarlsonsociety.us>, built from the design in
`website.svg` (the SVG is the mockup, not the site). No framework and no
dependencies: plain HTML, one stylesheet, one script, served straight from the
repo root by GitHub Pages.

## Content

Articles come from Grant's public Substack, <https://substack.com/@grantkl>.
`content/` holds the cached source: `archive.json` plus one JSON per post.
`tools/fetch.py` refreshes it, `tools/build.py` renders the site from it, and
the output is committed — so Pages still serves plain files.

    python3 tools/fetch.py     # only needed when Grant publishes something new
    python3 tools/build.py     # regenerates index.html, articles/, assets/covers/
    python3 check.py           # verifies every local link/image resolves

`tools/build.py` needs ImageMagick (`magick`) on PATH. It rewrites `index.html`,
`articles/index.html` and `articles/*.html` wholesale — anything else in
`articles/` is deleted, so don't hand-edit there.

## Layout

- `index.html` — masthead, newest six articles, "About Us".
- `articles/index.html` — every article.
- `articles/*.html` — one page per article.
- `assets/` — stylesheet, script, portrait, per-article covers, favicon.
- `tools/` — fetch and build.
- `CNAME` — `evanscarlsonsociety.us`.

## Themes

The star in the masthead opens the theme chooser (`Paper` / `Night`). The
choice is kept in `localStorage` and applied before first paint. Night theme
darkens images via CSS `filter` (opt an image out with `class="no-dim"`).
Header scrolls away normally — deliberately no return-to-top button.

## Preview

Root-relative paths mean you need a server, not `file://`:

    python3 -m http.server

## Notes and gaps

- Byline is "Grant Klusmann" (the site's wording); his Substack byline is
  "Grant K.". Change `AUTHOR` in `tools/build.py` to match.
- "The Arab World's Only Marxist-Leninist State" is subscriber-only on
  Substack, so only a preview is public — it is skipped rather than published
  truncated. Import it by hand if Grant provides the text.
- "Coming soon" is a three-word placeholder post and is skipped.
- Cover images are re-hosted and prescaled to 1024px/480px WebP with JPEG
  fallback. They run 7–70KiB rather than the mockup's ~30KiB target.
- No `.EPUB` download button yet (the spec asks for one; nothing to link).
- The content editor / Netlify rebuild portal is still a future plan; for now
  the "build tool" is `tools/build.py`.
