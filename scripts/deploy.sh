#!/bin/sh
# Bouwt de site en publiceert hem op de gh-pages-branch (GitHub Pages).
# Gebruik: npm run deploy
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="$ROOT/.deploy"
cd "$ROOT"

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Geen GitHub-remote 'origin' gevonden. Koppel eerst een repository." >&2
  exit 1
fi

npm test
npm run build

# Werkmap voor gh-pages: bestaande branch ophalen of een lege nieuwe branch maken.
if [ ! -d "$DEPLOY_DIR" ]; then
  git fetch origin gh-pages >/dev/null 2>&1 || true
  if git show-ref --verify --quiet refs/remotes/origin/gh-pages; then
    git worktree add -B gh-pages "$DEPLOY_DIR" origin/gh-pages
  else
    git worktree add --orphan -b gh-pages "$DEPLOY_DIR"
  fi
fi

cd "$DEPLOY_DIR"
git pull --ff-only origin gh-pages >/dev/null 2>&1 || true
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R "$ROOT/dist/." .
touch .nojekyll

git add -A
if git diff --cached --quiet; then
  echo "Geen wijzigingen om te publiceren."
  exit 0
fi
git commit -m "deploy: site bijgewerkt vanaf $(cd "$ROOT" && git rev-parse --short HEAD)" >/dev/null
git push origin gh-pages
echo "Gepubliceerd. GitHub Pages werkt de site binnen een minuut bij."
