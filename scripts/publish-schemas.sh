#!/usr/bin/env bash
# Copies this checkout's schemas into a checkout of the gh-pages branch, at the
# path each schema's own $id names, so the URL a contract writes in `$schema`
# resolves. Run by .github/workflows/publish-schemas.yml on a release tag.
#
# A released $id never changes (SR-152): if the path already exists on the site
# with the same bytes this is a no-op, and with different bytes it fails.
#
# Usage: scripts/publish-schemas.sh <tag> <pages-dir>
# Prints the site-relative directory it published to, e.g. schemas/v0.2
set -euo pipefail

tag="${1:?usage: publish-schemas.sh <tag> <pages-dir>}"
pages="${2:?usage: publish-schemas.sh <tag> <pages-dir>}"
site="https://knapsack-oss.github.io/design-system-contract/"

if [[ ! "$tag" =~ ^v([0-9]+)\.([0-9]+)\.[0-9]+$ ]]; then
  echo "error: tag '$tag' is not vMAJOR.MINOR.PATCH" >&2; exit 1
fi
want="schemas/v${BASH_REMATCH[1]}.${BASH_REMATCH[2]}"

shopt -s nullglob
files=(schemas/*.schema.json)
if (( ${#files[@]} == 0 )); then echo "error: no schemas/*.schema.json" >&2; exit 1; fi

status=unchanged
for f in "${files[@]}"; do
  id="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).$id ?? "")' "$f")"
  rel="${id#"$site"}"
  if [[ "$rel" == "$id" ]]; then
    echo "error: $f has \$id '$id', which is not under $site" >&2; exit 1
  fi
  if [[ "$rel" != "$want/$(basename "$f")" ]]; then
    echo "error: $f has \$id path '$rel' but tag $tag publishes to '$want/$(basename "$f")'." >&2
    echo "       The tag's MAJOR.MINOR must match the format version in the \$id (D-84)." >&2
    exit 1
  fi
  dest="$pages/$rel"
  if [[ -e "$dest" ]]; then
    if cmp -s "$f" "$dest"; then continue; fi
    echo "error: $rel is already published with different bytes." >&2
    echo "       A released \$id never changes (SR-152). Ship the change under a new format version." >&2
    exit 1
  fi
  mkdir -p "$(dirname "$dest")"
  cp "$f" "$dest"
  status=published
done

echo "$status $want"
