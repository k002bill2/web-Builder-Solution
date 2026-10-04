#!/bin/bash
# P3 캡처 1장 — 1b shots.sh 방식(Chrome headless · 뷰포트만 · 390은 _w390 iframe 래퍼 + sips 가운데 크롭). ego page.screenshot 2회 시간 초과 시 대체.
# 대상 = static/p3-two-tier-nonav.html(qb.mjs가 같은 문서의 정적 HTML로 저장) → shots/p3-two-tier-nonav-390.png (127.0.0.1:4339)
cd "$(dirname "$0")"
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
d=p3-two-tier-nonav; h=844; out="$PWD/shots/qa-$d-390.png"; rm -f "$out"
printf '%s' '<!doctype html><style>html,body{margin:0}body{padding:100px 65px}iframe{display:block;border:0}</style><script>const q=new URLSearchParams(location.search);document.write(`<iframe width="390" height="${q.get("h")}" src="${q.get("d")}.html"></iframe>`)</script>' > static/_w390.html
trap 'rm -f static/_w390.html' EXIT
"$C" --headless=new --disable-gpu --hide-scrollbars --user-data-dir=/tmp/m2b1bhqa-chrome --window-size=520,$((h + 200)) --virtual-time-budget=2500 --screenshot="$out" "http://127.0.0.1:4339/_w390.html?d=$d&h=$h" >/dev/null 2>&1 & pid=$!
for _ in $(seq 1 60); do [ -s "$out" ] && break; sleep 0.5; done
sleep 0.3; kill $pid 2>/dev/null; wait $pid 2>/dev/null; rm -rf /tmp/m2b1bhqa-chrome
[ -s "$out" ] || { echo "FAIL $d 390"; exit 1; }
sips -c "$h" 390 "$out" >/dev/null; sips -g pixelWidth -g pixelHeight "$out" | tail -2
