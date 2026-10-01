# The Evans Carlson Society

Static site for <https://evanscarlsonsociety.us>, from the design in
`website.svg` (the SVG is the mockup, not the site). Built with **Astro**; the
content comes from Grant's public Substack, <https://substack.com/@grantkl>.

**`master` is source. `gh-pages` is generated output, and that is what Pages
serves.** The mockup is explicit about this (the Safari frame is titled
*"Static Site: The Evans Carlson Society (gh-pages)"*, and the build notes end
with *"…rebuild the gh-pages"*). Nothing on `master` is served directly.

## Layout

    src/pages/            routes: /, /articles/, /articles/<slug>/
    src/layouts/Base.astro    the masthead, nav, <head>, theme bootstrap
    src/components/       Card.astro
    src/content/articles/ one JSON per article, written by `pnpm sync`
    src/styles/site.css   paper + night themes
    src/scripts/site.js   theme chooser, scroller
    public/assets/        served as-is: portrait, favicon, cover images
    tools/sync.mjs        fetch + sanitise Substack, prescale covers
    tools/check.mjs       verify every local link in _build/ resolves
    tools/deploy.sh       build, check, force-push _build/ to gh-pages
    content/              raw Substack cache (the awkward part, kept verbatim)

## Working on it

    pnpm install
    pnpm dev               # local dev server with HMR
    pnpm sync              # only when Grant publishes something new
    pnpm build             # -> _build/
    pnpm deploy            # build + check + push gh-pages

`.github/workflows/publish.yml` runs the same stages on every push to `master`,
so in practice you push source and CI republishes. `gh-pages` is one throwaway
commit, force-pushed each time; every byte on it is derived, so it carries no
history. History lives on `master`.

## Content pipeline

`tools/sync.mjs` is the only part that talks to Substack, and the only part that
is not Astro:

1. fetch the post archive and each post's JSON into `content/` (cached, so
   builds are offline and repeatable);
2. sanitise `body_html` down to `p/strong/em/a/sup` — Substack ships cover
   figures, subscribe widgets, `data-attrs` JSON and a "Thanks for reading"
   pitch that sometimes hides inside a widget and sometimes sits as a bare
   paragraph, so this is a real parse, done once, here;
3. prescale covers to 1024px/480px WebP + JPEG and log the dimensions to
   `content/dimensions.json`, which the templates emit as `width`/`height` to
   avoid layout shift;
4. write one clean JSON per article into `src/content/articles/`.

Steps 1–3 need ImageMagick (`magick`) *only* when a cover has to be created;
with `public/assets/covers/` and `content/dimensions.json` present — the normal
case — the whole build is Node and Astro and runs on a bare CI runner.

Astro never fetches anything. `src/content.config.ts` just globs the JSON and
validates it with a zod schema.

## Themes

The star in the masthead opens the theme chooser (`Paper` / `Night`). The
choice is kept in `localStorage` and applied before first paint. Night theme
darkens images via CSS `filter` (opt an image out with `class="no-dim"`).
Header scrolls away normally — deliberately no return-to-top button.

## Notes and gaps

- URLs are `/articles/<slug>/`. They were `/articles/<slug>.html` for the first
  few minutes the domain was live; Astro's directory format is the default and
  worth the change, but nothing redirects the old shape.
- Byline is "Grant Klusmann" (the site's wording); his Substack byline is
  "Grant K.". It is set by `AUTHOR` in `tools/sync.mjs`.
- "The Arab World's Only Marxist-Leninist State" is subscriber-only on
  Substack, so only a preview is public — `sync.mjs` skips it rather than
  publishing it truncated. Import it by hand if Grant provides the text.
- "Coming soon" is a three-word placeholder post and is skipped.
- Cover images are re-hosted and prescaled. They run 7–70KiB rather than the
  mockup's ~30KiB target, and several look like press/agency photos rather than
  Grant's own — see the note about image rights in the repo history.
- No `.EPUB` download button yet (the spec asks for one; nothing to link).
- The password-protected content editor is still a future plan.
