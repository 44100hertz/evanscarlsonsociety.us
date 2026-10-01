#!/usr/bin/env python3
"""Static self-check: build the site, then verify every local link resolves.

    python3 check.py
"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
BUILD = ROOT / "_build"
ATTR = re.compile(r'(?:href|src|srcset)\s*=\s*"([^"]+)"')
SKIP = ("http://", "https://", "mailto:", "data:")


def targets(page):
    for raw in ATTR.findall(page.read_text(encoding="utf-8")):
        for url in raw.split(","):
            url = url.strip().split(" ")[0].split("#")[0].split("?")[0]
            if url and not url.startswith(SKIP):
                yield url


def main():
    if not BUILD.exists():
        print("no _build/ — running tools/build.py")
        subprocess.run([sys.executable, str(ROOT / "tools" / "build.py")], check=True)

    pages = sorted(BUILD.rglob("*.html"))
    if not pages:
        print("BROKEN: _build/ has no pages")
        return 1

    bad = []
    # Root-relative paths (/assets/x) resolve against the deployed site root.
    resolver = lambda u: BUILD / u.lstrip("/") if u.startswith("/") else BUILD / u
    for page in pages:
        for url in targets(page):
            if not resolver(url).exists():
                bad.append(f"{page.relative_to(BUILD)} -> {url}")

    if bad:
        print("BROKEN:\n  " + "\n  ".join(bad))
        return 1
    print(f"OK: {len(pages)} page(s) in _build/, all local links resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
