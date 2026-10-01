#!/usr/bin/env python3
"""Regenerate the Evans Carlson Society site from content/ (cached Substack posts).

    python3 tools/build.py          # rebuild index.html, articles/, assets/covers/

Output is committed, so GitHub Pages keeps serving plain files. Needs ImageMagick
(`magick`) on PATH for cover images. Fetch fresh copies of the posts first with
`python3 tools/fetch.py` if Grant has published something new.
"""
import datetime as dt
import glob
import html
import json
import pathlib
import re
import subprocess
import sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
COVERS = ROOT / "assets" / "covers"
ARTICLES = ROOT / "articles"

SITE = "The Evans Carlson Society"
AUTHOR = "Grant Klusmann"
ABOUT = 'A novel broad-front antiwar coalition based in Wisconsin. Learn more: <a href="https://acp.us">https://acp.us</a>'
HOMEPAGE_CARDS = 6

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}
# Dropped along with their contents: Substack's cover figure and subscribe widget.
DROP = {"script", "style", "form", "button", "svg", "picture", "img", "figure",
        "iframe", "video", "object", "input", "embed", "source"}
# Kept as-is (attributes stripped except for links).
KEEP = {"p", "strong", "em", "b", "i", "a", "sup", "sub", "figcaption",
        "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "br"}
# Presentational wrappers: keep the children, throw away the element.
UNWRAP = {"div", "span", "section", "article", "table", "tbody", "tr", "td"}


class Sanitizer(HTMLParser):
    """Reduce Substack's editor markup to the tags the stylesheet knows about."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.skipping = 0

    def handle_starttag(self, tag, attrs):
        if self.skipping:
            if tag not in VOID:
                self.skipping += 1
            return
        if tag in VOID:
            return
        if tag in DROP:
            self.skipping = 1
            return
        if tag in UNWRAP:
            return
        if tag in KEEP:
            if tag == "a":
                href = dict(attrs).get("href", "")
                if not href.startswith(("http://", "https://")):
                    return
                self.out.append(f'<a href="{html.escape(href, quote=True)}">')
            else:
                self.out.append(f"<{tag}>")

    def handle_endtag(self, tag):
        if self.skipping:
            self.skipping -= 1
            return
        if tag in KEEP:
            self.out.append(f"</{tag}>")

    def handle_data(self, data):
        if not self.skipping:
            self.out.append(html.escape(data))


def clean_body(raw):
    s = Sanitizer()
    s.feed(raw)
    s.close()
    text = "".join(s.out)
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]{2,}", " ", text)
    # Drop Substack's trailing "Thanks for reading…" subscribe pitch when the post
    # carries it as a bare paragraph instead of the widget we already removed.
    text = re.sub(r"<p>(?:(?!</p>).)*?(?:Thanks for reading|Subscribe for free|"
                  r"Share this post|Leave a comment)(?:(?!</p>).)*?</p>", "", text,
                  flags=re.S | re.I)
    # Substack leaves stray <p> around dropped widgets.
    return re.sub(r"<p>\s*</p>", "", text).strip()


def first_image_url(raw):
    m = re.search(r'<div class="captioned-image-container">.*?<a[^>]+href="([^"]+)"', raw, re.S)
    if not m:
        m = re.search(r'<div class="captioned-image-container">.*?<img[^>]+src="([^"]+)"', raw, re.S)
    if not m:
        return None
    url = html.unescape(m.group(1))
    if "%3A" in url:  # unwrap substackcdn's /image/fetch/<opts>/<encoded original>
        from urllib.parse import unquote
        url = unquote(url.rsplit("/", 1)[-1])
    return url


def fetch(url, dest):
    if dest.exists():
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["curl", "-fsS", "-m", "60", "-A", "Mozilla/5.0", "-o", str(dest), url],
                   check=True)


def dimensions(path):
    out = subprocess.run(["magick", "identify", "-format", "%w %h", str(path)],
                         check=True, capture_output=True, text=True).stdout
    w, h = out.split()
    return int(w), int(h)


def cover(slug, url):
    """Download, prescale to full + thumb, and report dimensions for both."""
    COVERS.mkdir(parents=True, exist_ok=True)
    src = CONTENT / "covers" / f"{slug}.orig"
    fetch(url, src)
    result = {}
    for name, width, quality in (("full", 1024, 68), ("thumb", 480, 68)):
        for ext in ("webp", "jpg"):
            out = COVERS / f"{slug}-{name}.{ext}"
            cmd = ["magick", str(src), "-resize", f"{width}x>", "-strip", "-quality", str(quality)]
            if ext == "webp":
                cmd += ["-define", "webp:method=6"]
            subprocess.run(cmd + [str(out)], check=True)
        result[name] = dimensions(COVERS / f"{slug}-{name}.webp")
    return result


def picture(srcset, src, w, h, cls=""):
    c = f' class="{cls}"' if cls else ""
    return (f'<picture><source srcset="{srcset}" type="image/webp">'
            f'<img src="{src}" width="{w}" height="{h}"{c} alt=""></picture>')


def page(title, description, body):
    return f"""<!doctype html>
<html lang="en" data-theme="paper">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(description)}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/style.css">
<link rel="preload" as="image" href="/assets/portrait.webp" type="image/webp">
<script>try{{var t=localStorage.getItem("ecs-theme");if(t==="night")document.documentElement.dataset.theme="night";}}catch(e){{}}</script>
</head>
<body>

<header class="masthead wrap">
  <div class="masthead-top">
    <div class="brand-block">
      <a class="brand" href="/">
        <picture>
          <source srcset="/assets/portrait.webp" type="image/webp">
          <img src="/assets/portrait.jpg" width="330" height="579" alt="Evans Carlson">
        </picture>
        <span class="brand-name">The<br>Evans Carlson<br>Society</span>
      </a>
      <div class="theme-menu" id="theme-menu">
        <p class="theme-title">Choose Theme</p>
        <p><button type="button" data-theme-choice="paper" aria-pressed="true">Paper</button>
          &middot;
          <button type="button" data-theme-choice="night" aria-pressed="false">Night</button></p>
      </div>
    </div>

    <button type="button" class="theme-toggle" aria-expanded="false" aria-controls="theme-menu" title="Choose theme">
      <svg viewBox="0 0 40 46" aria-hidden="true">
        <rect x="8" y="2" width="6" height="18"/>
        <rect x="17" y="2" width="6" height="18"/>
        <rect x="26" y="2" width="6" height="18"/>
        <path d="M20,20 L23.06,27.79 L31.41,28.29 L24.95,33.61 L27.05,41.71 L20,37.2 L12.95,41.71 L15.05,33.61 L8.59,28.29 L16.94,27.79 Z"/>
      </svg>
    </button>
  </div>

  <nav class="site-nav" aria-label="Site">
    <a href="/">Home</a><span class="sep">&middot;</span><a href="/articles/">Articles</a><span class="sep">&middot;</span><a href="/#about">About</a>
  </nav>

  <div class="rule" role="presentation"></div>
</header>

<main class="wrap">
{body}
</main>

<script src="/assets/site.js"></script>
</body>
</html>
"""


def human_date(iso):
    d = dt.date.fromisoformat(iso[:10])
    return f"{d.strftime('%b')} {d.day}, {d.year}"


def card(post, cls="card"):
    t, w, h = post["title"], post["thumb_w"], post["thumb_h"]
    img = picture(f"/assets/covers/{post['slug']}-thumb.webp",
                  f"/assets/covers/{post['slug']}-thumb.jpg", w, h)
    return f"""      <li class="{cls}">
        <a href="/articles/{post['slug']}.html">
          {img}
          <h3>{html.escape(t)}</h3>
          <p class="byline">{AUTHOR}<br>{human_date(post['date'])}</p>
        </a>
      </li>"""


def article_page(post):
    fig = ""
    if post["full_w"]:
        img = picture(f"/assets/covers/{post['slug']}-full.webp",
                      f"/assets/covers/{post['slug']}-full.jpg",
                      post["full_w"], post["full_h"])
        fig = f'\n    <figure class="article-figure">{img}</figure>'
    deck = f'\n      <p class="deck">{html.escape(post["subtitle"])}</p>' if post.get("subtitle") else ""
    body = f"""  <article>
    <div class="article-head">
      <h1>{html.escape(post['title'])}</h1>{deck}
      <p class="byline">{AUTHOR} &middot; {human_date(post['date'])}</p>
    </div>{fig}
    <div class="article-body">
{post['body']}
      <p class="source">Filed under <a href="{post['canonical']}">{html.escape(post['pub'])}</a>.</p>
    </div>
  </article>"""
    return page(f"{post['title']} — {SITE}", post.get("subtitle") or post["title"], body)


def main():
    arch = {p["slug"]: p for p in json.loads((CONTENT / "archive.json").read_text())}
    posts = []
    for path in sorted(glob.glob(str(CONTENT / "posts" / "*.json"))):
        raw = json.loads(pathlib.Path(path).read_text())
        a = arch.get(raw["slug"], {})
        if not raw.get("body_html"):
            print(f"  skip {raw['slug']}: no public body")
            continue
        if a.get("audience") not in (None, "everyone"):
            print(f"  skip {raw['slug']}: subscriber-only on Substack, only a preview is public")
            continue
        slug = raw["slug"]
        url = raw.get("cover_image") or first_image_url(raw["body_html"])
        if url:
            dims = cover(slug, url)
        else:
            dims = {"thumb": (0, 0), "full": (0, 0)}
            print(f"  warn {slug}: no cover image")
        posts.append({
            "slug": slug,
            "title": raw["title"],
            "subtitle": (raw.get("subtitle") or "").strip(),
            "date": raw.get("post_date") or a.get("post_date", ""),
            "canonical": raw.get("canonical_url") or f"https://grantkl.substack.com/p/{slug}",
            "pub": "grantkl.substack.com",
            "body": clean_body(raw["body_html"]),
            "thumb_w": dims["thumb"][0], "thumb_h": dims["thumb"][1],
            "full_w": dims["full"][0], "full_h": dims["full"][1],
        })
    posts.sort(key=lambda p: p["date"], reverse=True)

    ARTICLES.mkdir(exist_ok=True)
    written = set()
    for post in posts:
        out = ARTICLES / f"{post['slug']}.html"
        out.write_text(article_page(post))
        written.add(out.name)
    for stale in ARTICLES.glob("*.html"):  # articles/ is wholesale generated
        if stale.name not in written:
            stale.unlink()
            print(f"  removed stale {stale.name}")

    cards = "\n".join(card(p) for p in posts[:HOMEPAGE_CARDS])
    home = f"""  <section id="articles" aria-labelledby="articles-heading">
    <div class="section-head">
      <h2 id="articles-heading">Most Recent Articles</h2>
      <a class="scroller-next" href="/articles/" aria-label="All articles">&#9654;</a>
    </div>

    <ul class="cards">
{cards}
    </ul>
  </section>

  <section id="about" class="about" aria-labelledby="about-heading">
    <h2 id="about-heading">About Us</h2>
    <p>{ABOUT}</p>
  </section>"""
    (ROOT / "index.html").write_text(page(SITE, "Articles and dispatches from the Evans Carlson Society.", home))

    every = "\n".join(card(p) for p in posts)
    index = f"""  <section aria-labelledby="all-heading">
    <div class="section-head"><h2 id="all-heading">Articles</h2></div>
    <ul class="cards cards--grid">
{every}
    </ul>
  </section>"""
    (ARTICLES / "index.html").write_text(page(f"Articles — {SITE}", "Every article.", index))

    print(f"built {len(posts)} articles, {len(written)} pages")
    return 0


if __name__ == "__main__":
    sys.exit(main())
