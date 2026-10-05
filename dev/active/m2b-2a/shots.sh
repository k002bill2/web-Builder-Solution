#!/bin/bash
# QB 캡처 — static/*.html(127.0.0.1:4339, python http.server, qb.mjs가 저장한 같은 문서의 정적 HTML) × 1280·768·390 → shots/<문서>-<폭>.png
# 방식 = m2b-1b shots.sh: Chrome headless · 정적 사이트 문서 전체 높이 창(fullPage 상당 — 렌더 sandbox iframe 아님) · 390은 _w390.html 래퍼(390폭 iframe) + sips 가운데 크롭
cd "$(dirname "$0")"
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p shots; rm -f shots/*.png; i=0
printf '%s' '<!doctype html><style>html,body{margin:0}body{padding:100px 65px}iframe{display:block;border:0}</style><script>const q=new URLSearchParams(location.search);document.write(`<iframe width="390" height="${q.get("h")}" src="${q.get("d")}.html"></iframe>`)</script>' > static/_w390.html
trap 'rm -f static/_w390.html' EXIT
for spec in qb-1:2200 qb-2:2400 qb-3:2400 qb-4:2600 qb-13:4600 qb-13-flip:4600 qb-14:4600 qb-15:9000; do
  d=${spec%:*}; H=${spec#*:}
  for w in 1280 768 390; do
    out="$PWD/shots/$d-$w.png"; rm -f "$out"; i=$((i+1)); h=$H; [ "$w" = 390 ] && h=$((H + 1200))
    url="http://127.0.0.1:4339/$d.html"; wh=$w,$h
    if [ "$w" = 390 ]; then url="http://127.0.0.1:4339/_w390.html?d=$d&h=$h"; wh=520,$((h + 200)); fi
    "$C" --headless=new --disable-gpu --hide-scrollbars --user-data-dir=/tmp/m2b2a-chrome-$i --window-size=$wh --virtual-time-budget=2500 --screenshot="$out" "$url" >/dev/null 2>&1 & pid=$!
    for _ in $(seq 1 80); do [ -s "$out" ] && break; sleep 0.5; done
    sleep 0.3; kill $pid 2>/dev/null; wait $pid 2>/dev/null; rm -rf /tmp/m2b2a-chrome-$i
    [ -s "$out" ] || echo "FAIL $d $w"
    [ "$w" = 390 ] && [ -s "$out" ] && sips -c "$h" 390 "$out" >/dev/null
  done
done
ls shots/*.png | wc -l
