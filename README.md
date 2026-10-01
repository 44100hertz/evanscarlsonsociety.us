# The Evans Carlson Society

Static site for <https://evanscarlsonsociety.us>, built from the design in
`website.svg` (the SVG is the mockup, not the site). No build step, no
dependencies: plain HTML, one stylesheet, one script, served straight from the
repo root by GitHub Pages.

## Layout

- `index.html` — homepage: masthead, "Most Recent Articles" scroller, "About Us".
- `articles/*.html` — article pages.
- `assets/` — stylesheet, script, portrait, placeholder figure, favicon.
- `CNAME` — `evanscarlsonsociety.us`.
- `check.py` — `python3 check.py` verifies every local link/image resolves.

## Themes

The star in the masthead opens the theme chooser (`Paper` / `Night`). The
choice is kept in `localStorage` and applied before first paint. Night theme
darkens images via CSS `filter` (opt an image out with `class="no-dim"`).
Header scrolls away normally — deliberately no return-to-top button.

## Preview

Root-relative paths mean you need a server, not `file://`:

    python3 -m http.server

## Not done yet

- `assets/placeholder.svg` stands in for article figures. The mockup's chart
  is a watermarked Adobe Stock image, so it is not shipped.
- The article body is the mockup's lorem-ipsum placeholder, not real copy.
- No `.EPUB` download button (spec asks for one; no EPUB exists to link).
- The content editor / Netlify rebuild portal is still a future plan.
