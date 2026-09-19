#!/bin/bash
set -euo pipefail

beta_number="${1:-}"

if [[ ! "$beta_number" =~ ^[1-9][0-9]*$ ]]; then
    echo "Beta releases require a positive numeric beta number." >&2
    exit 1
fi

initial_version="$(node -p "require('./package.json').version")"

if [[ ! "$initial_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Invalid initial version: $initial_version" >&2
    exit 1
fi

write_output() {
    local key="$1"
    local value="$2"

    if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
        echo "$key=$value" >> "$GITHUB_OUTPUT"
    else
        echo "$key=$value"
    fi
}

# 同时兼容未来的 vX.Y.Z 与已有的 zhtrans-vX.Y.Z 正式 tag。
latest_stable="$({
    git tag | awk '
        /^v[0-9]+\.[0-9]+\.[0-9]+$/ { print substr($0, 2), $0 }
        /^zhtrans-v[0-9]+\.[0-9]+\.[0-9]+$/ { print substr($0, 10), $0 }
    '
} | sort -k1,1V | tail -n 1 || true)"

if [[ -z "$latest_stable" ]]; then
    target_version="$initial_version"
    release_base=""
else
    read -r target_version release_base <<< "$latest_stable"
fi

if [[ -n "$release_base" ]] && git merge-base --is-ancestor "$release_base" HEAD; then
    commits="$(git log "${release_base}..HEAD" --format='%s%n%b')"
else
    commits="$(git log HEAD --format='%s%n%b')"
fi

if grep -Eq '^[a-zA-Z]+(\([^)]*\))?!:|^BREAKING[ -]CHANGE:' <<< "$commits"; then
    bump="major"
elif grep -Eq '^feat(\([^)]*\))?:' <<< "$commits"; then
    bump="minor"
elif grep -Eq '^(fix|perf)(\([^)]*\))?:' <<< "$commits"; then
    bump="patch"
else
    write_output skip true
    exit 0
fi

IFS=. read -r major minor patch <<< "$target_version"

case "$bump" in
    major)
        next_version="$((major + 1)).0.0"
        ;;
    minor)
        next_version="${major}.$((minor + 1)).0"
        ;;
    patch)
        next_version="${major}.${minor}.$((patch + 1))"
        ;;
esac

beta_tag_at_head="$(
    git tag --points-at HEAD |
        grep -E "^v${next_version//./\\.}-beta\.[0-9]+$" |
        sort -V |
        tail -n 1 || true
)"

if [[ -n "$beta_tag_at_head" ]]; then
    release_tag="$beta_tag_at_head"
else
    release_tag="v${next_version}-beta.${beta_number}"
fi

write_output skip false
write_output tag "$release_tag"
