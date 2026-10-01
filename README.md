# The Evans Carlson Society

Static site for <https://evanscarlsonsociety.us>, from the design in
`website.svg` (the SVG is the mockup, not the site).

**`master` is source. `gh-pages` is generated output, and that is what Pages
serves.** The mockup is explicit about this (the Safari frame is titled
*"Static Site: The Evans Carlson Society (gh-pages)"*, and the build notes end
with *"…rebuild the gh-pages"*). Nothing on `master` is served directly.

    content/          cached Substack posts (the actual article text)
    site/             hand-authored source: stylesheet, script, portrait,
                      favicon, and the committed cover images
    tools/fetch.py    refresh content/ from Grant's public Substack
    tools/build.py    render content/ + site/ into _build/
    tools/deploy.sh   build, check, force-push _build/ to gh-pages
    check.py          verify every local link in _build/ resolves
    website.svg       the design mockup

## Publishing

    python3 tools/fetch.py     # only when Grant publishes something new
    tools/deploy.sh            # build + check + push gh-pages

`.github/workflows/publish.yml` runs `tools/deploy.sh` on every push to
`master`, so in practice you push source and CI republishes. Delete the
workflow if you would rather run `tools/deploy.sh` by hand — the command is the
same either way, which is why the workflow only calls the script.

`gh-pages` is one throwaway commit, force-pushed each time; every byte on it is
derived, so it carries no history. History lives on `master`.

`tools/build.py` needs ImageMagick (`magick`) **only** to create cover images
that are not already committed — with `site/assets/covers/` present (the normal
case) the build is pure Python and runs on a bare CI runner.

## Content

Articles come from Grant's public Substack, <https://substack.com/@grantkl>.
`tools/fetch.py` caches the archive plus one JSON per post under `content/`.

`tools/build.py` rewrites `_build/` wholesale, so never hand-edit anything in
it; edit `site/` or the templates in `tools/build.py` instead.

## Themes

The star in the masthead opens the theme chooser (`Paper` / `Night`). The
choice is kept in `localStorage` and applied before first paint. Night theme
darkens images via CSS `filter` (opt an image out with `class="no-dim"`).
Header scrolls away normally — deliberately no return-to-top button.

## Preview

Root-relative paths mean you need a server, not `file://`:

    python3 tools/build.py && python3 -m http.server -d _build

## Notes and gaps

- Byline is "Grant Klusmann" (the site's wording); his Substack byline is
  "Grant K.". Change `AUTHOR` in `tools/build.py` to match.
- "The Arab World's Only Marxist-Leninist State" is subscriber-only on
  Substack, so only a preview is public — it is skipped rather than published
  truncated. Import it by hand if Grant provides the text.
- "Coming soon" is a three-word placeholder post and is skipped; `fetch.py`
  drops it at the door.
- Cover images are re-hosted and prescaled to 1024px/480px WebP with JPEG
  fallback. They run 7–70KiB rather than the mockup's ~30KiB target.
- No `.EPUB` download button yet (the spec asks for one; nothing to link).
- The password-protected content editor is still a future plan. For now the
  "static site build tool" the mockup asks for is `tools/build.py`.
