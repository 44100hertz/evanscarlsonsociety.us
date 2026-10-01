#!/usr/bin/env bash
# Publish the generated site to the gh-pages branch. Source lives on master.
#
#   tools/deploy.sh
#
# gh-pages is a single throwaway commit, force-pushed every time — everything in
# it is derived, so it carries no history. History belongs on master.
#
# The push happens from a detached worktree of *this* repository, not from a
# scratch repo, so it inherits the origin URL and whatever credentials the
# environment already has (SSH locally, actions/checkout's token in CI).
set -euo pipefail
cd "$(dirname "$0")/.."

python3 tools/build.py
python3 check.py          # refuses to publish a site with dangling links
[ -f _build/index.html ] || { echo "build produced no index.html" >&2; exit 1; }

name="$(git config user.name || true)"
email="$(git config user.email || true)"
if [ -n "${GITHUB_TOKEN:-}" ] && [ -n "${GITHUB_REPOSITORY:-}" ]; then
    remote="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
else
    remote="$(git remote get-url origin)"
fi
wt="$(mktemp -d)"
branch="gh-pages"

cleanup() { git worktree remove --force "$wt" 2>/dev/null || rm -rf "$wt"; }
trap cleanup EXIT

git worktree add -f --detach "$wt" >/dev/null
find "$wt" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a _build/. "$wt"/
git -C "$wt" add -A
git -C "$wt" -c user.name="${name:-site build}" -c user.email="${email:-site-build@localhost}" \
    commit -qm "Publish $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git -C "$wt" push -f "$remote" "HEAD:refs/heads/$branch" 2>&1 |
    sed "s#x-access-token:[^@]*@#x-access-token:***@#g"

echo "published $(git -C "$wt" log -1 --format=%h) to $branch"
