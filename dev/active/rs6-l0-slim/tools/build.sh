#!/bin/zsh
# 측정 보조: build 스크립트에서 tsc 단계만 뺀 빌드(L0 방식). 사용: build.sh <out.txt>  (cwd=app)
echo "# build(no tsc): build-thumbs && vite build && vite build --mode render && check-bundle-size" > "$1"
{ node scripts/build-thumbs.mjs && npx vite build && npx vite build --mode render && node scripts/check-bundle-size.mjs; } >> "$1" 2>&1
echo "exit $?" >> "$1"
