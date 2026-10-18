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
    src/components/       Card.astro, Scroller.astro, icons/
    src/content/articles/ one JSON per article, written by `pnpm sync`
    src/styles/site.css   paper + night themes
    src/scripts/site.js   theme toggle, print button, scroller
    public/assets/        served as-is: portrait, favicon, covers, qr.svg
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

The Marine Corps badge in the masthead is decorative now (it used to open the
chooser). The theme toggle and print button float, background-free, under the
right end of the triple rule: they are absolutely positioned inside that rule's
margin, so they add no height to the masthead. Both are Famicons outline
glyphs (MIT); the theme toggle shows the sun while paper is active and the moon
while night is active — both icons are always in the markup and CSS reveals one
off `[data-theme]`, so `site.js` only flips the attribute, stores the choice in
`localStorage` and retitles the button. The choice is
applied before first paint by the inline bootstrap in `Base.astro`; `site.js`
only overrides the server default when a choice is stored. Night theme darkens
images via CSS `filter` (opt an image out with `class="no-dim"`). Header
scrolls away normally — deliberately no return-to-top button.

## Print

Printing has its own layout (`@media print` at the end of `site.css`) and ignores
the screen theme: paper colours, the masthead as usual minus the floating theme
and print controls, the nav line replaced by `https://EvansCarlsonSociety.us`,
the article on its own (the scroller, its arrows and the "Top of page" link drop
out), covers capped at 95mm tall, and a closing footer — italic "Read more at
https://EvansCarlsonSociety.us" plus a QR code — at the end of the document. The
QR code is `public/assets/qr.svg`, generated once with qrencode (version 3-M) and
decodes to the site root. On screen the same cover cap is 72vh, so a near-square
or portrait cover cannot swallow the viewport.

## Type

Noto Serif (display: masthead, headings) and Asar (body), both from Google
Fonts, per the mockup. Every size on the page is `em` off one fluid body
`font-size: clamp(...)`, so the whole page scales with the viewport; the
article column is capped at 40em per the mockup's measure note.

## Notes and gaps

- URLs are `/articles/<slug>/`. They were `/articles/<slug>.html` for the first
  few minutes the domain was live; Astro's directory format is the default and
  worth the change, but nothing redirects the old shape. `/articles/` is a plain
  newest-first grid of the same collection the homepage scroller holds.
- `icons.svg` at the repo root is the abandoned hand-drawn icon mockup (day,
  night, print on a red island). The site uses Famicons outline glyphs now and
  no longer reads that file; it is untracked.
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
