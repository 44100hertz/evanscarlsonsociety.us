#!/usr/bin/env python3
"""Refresh content/ from Grant's public Substack (no login needed).

    python3 tools/fetch.py

Caches the archive plus one JSON per post, then run tools/build.py.
"""
import json
import pathlib
import sys
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
PUB = "https://grantkl.substack.com"


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=30).read()


def main():
    CONTENT.mkdir(exist_ok=True)
    (CONTENT / "posts").mkdir(exist_ok=True)
    archive = json.loads(get(f"{PUB}/api/v1/archive?sort=new&limit=200"))
    (CONTENT / "archive.json").write_text(json.dumps(archive, indent=1))
    print(f"archive: {len(archive)} posts")

    for meta in archive:
        slug = meta["slug"]
        if meta.get("wordcount", 0) < 5:
            print(f"  skip {slug}: placeholder post")
            continue
        dest = CONTENT / "posts" / f"{slug}.json"
        if dest.exists() and not dest.read_text().strip().endswith("}"):
            dest.unlink()
        dest.write_bytes(get(f"{PUB}/api/v1/posts/{slug}"))
        print(f"  cached {slug}")
        time.sleep(0.4)  # be polite
    return 0


if __name__ == "__main__":
    sys.exit(main())
