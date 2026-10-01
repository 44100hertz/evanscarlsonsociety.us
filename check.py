#!/usr/bin/env python3
"""Static self-check: every local link, stylesheet, script and image resolves."""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).parent
PAGES = sorted(ROOT.rglob("*.html"))
ATTR = re.compile(r'(?:href|src|srcset)\s*=\s*"([^"]+)"')
SKIP = ("http://", "https://", "mailto:", "data:")


def targets(page):
    for raw in ATTR.findall(page.read_text(encoding="utf-8")):
        for url in raw.split(","):
            url = url.strip().split(" ")[0].split("#")[0].split("?")[0]
            if url and not url.startswith(SKIP):
                yield url


def main():
    bad = []
    # root-relative paths (/assets/x) resolve against the site root, like GitHub Pages.
    resolver = lambda u: ROOT / u.lstrip("/") if u.startswith("/") else ROOT / u
    for page in PAGES:
        for url in targets(page):
            if not resolver(url).exists():
                bad.append(f"{page.relative_to(ROOT)} -> {url}")

    if bad:
        print("BROKEN:\n  " + "\n  ".join(bad))
        return 1
    print(f"OK: {len(PAGES)} page(s), all local links resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
