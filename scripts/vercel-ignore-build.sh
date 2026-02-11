#!/usr/bin/env bash
# Vercel Ignored Build Step — exit 0 to skip, exit 1 to build.
# Usage: bash scripts/vercel-ignore-build.sh <web|api>

set -euo pipefail

PROJECT="$1"

if [[ "$PROJECT" != "web" && "$PROJECT" != "api" ]]; then
  echo "Usage: bash scripts/vercel-ignore-build.sh <web|api>"
  exit 1 # build as safety fallback
fi

# Force deploy via commit message
COMMIT_MSG=$(git log -1 --format='%s')
if [[ "$COMMIT_MSG" == *"[force deploy]"* ]]; then
  echo "~ Commit message contains [force deploy] — proceeding with build."
  exit 1
fi

# First deploy (no previous SHA)
if [[ -z "${VERCEL_GIT_PREVIOUS_SHA:-}" ]]; then
  echo "~ No previous deploy SHA found — proceeding with build."
  exit 1
fi

# Verify the previous SHA is reachable (shallow clones may not have it)
if ! git cat-file -e "$VERCEL_GIT_PREVIOUS_SHA" 2>/dev/null; then
  echo "~ Previous SHA $VERCEL_GIT_PREVIOUS_SHA is unreachable — proceeding with build."
  exit 1
fi

CHANGED_FILES=$(git diff --name-only "$VERCEL_GIT_PREVIOUS_SHA"..HEAD)

if [[ -z "$CHANGED_FILES" ]]; then
  echo "~ No files changed — skipping build."
  exit 0
fi

echo "~ Changed files since last deploy:"
echo "$CHANGED_FILES"
echo ""

# Root config files that affect all projects
ROOT_CONFIGS="turbo.json package.json pnpm-lock.yaml tsconfig.base.json pnpm-workspace.yaml .npmrc"

for config in $ROOT_CONFIGS; do
  if echo "$CHANGED_FILES" | grep -qx "$config"; then
    echo "~ Root config '$config' changed — proceeding with build."
    exit 1
  fi
done

# Project-specific paths
case "$PROJECT" in
  web) PATHS="packages/web/ packages/shared/" ;;
  api) PATHS="packages/api/ packages/shared/" ;;
esac

for path in $PATHS; do
  if echo "$CHANGED_FILES" | grep -q "^$path"; then
    echo "~ Changes detected in '$path' — proceeding with build."
    exit 1
  fi
done

echo "~ No relevant changes for '$PROJECT' — skipping build."
exit 0
