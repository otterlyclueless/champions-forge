#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

missing=0

check_refs() {
  local kind="$1"
  local pattern="$2"

  while IFS= read -r ref; do
    [[ -z "$ref" ]] && continue
    if [[ ! -f "$ref" ]]; then
      printf 'Missing %s: %s\n' "$kind" "$ref" >&2
      missing=1
    fi
  done < <(rg -o "$pattern" index.html | sort -u)
}

check_refs "script" 'app/[^"]+\.js'
check_refs "stylesheet" 'styles/[^"]+\.css'

if [[ "$missing" -ne 0 ]]; then
  exit 1
fi

while IFS= read -r js_file; do
  node --check "$js_file" >/dev/null
done < <(find app -name '*.js' -type f | sort)

node --check sw.js >/dev/null
git diff --check

printf 'Path and syntax checks passed.\n'
