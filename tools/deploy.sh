#!/usr/bin/env bash
# Publish the generated site to the gh-pages branch. Source lives on master.
#
#   tools/deploy.sh
#
# gh-pages is a single throwaway commit — force-pushed, no shared history with
# master — because every byte in it is derived. History belongs on master.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 tools/build.py
python3 check.py          # refuses to publish a site with dangling links
[ -f _build/index.html ] || { echo "build produced no index.html" >&2; exit 1; }

remote="$(git remote get-url origin)"
name="$(git config user.name || true)"
email="$(git config user.email || true)"

cd _build
git init -q -b gh-pages
git add -A
git -c user.name="${name:-site build}" -c user.email="${email:-site-build@localhost}" \
    commit -qm "Publish $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push -q -f "$remote" gh-pages:gh-pages
echo "published $(git log -1 --format=%h) to gh-pages ($(git rev-list --count HEAD) commit)"
