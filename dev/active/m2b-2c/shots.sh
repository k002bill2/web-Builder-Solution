#!/bin/bash
# QB 캡처 — static/*.html(127.0.0.1:4339, python http.server, qb.mjs가 저장한 같은 문서의 정적 HTML) — m2b-2b shots.sh 복사, 문서 목록만 교체 × 1280·768·390 → shots/<문서>-<폭>.png
# 방식 = Chrome headless · 정적 사이트 문서 전체 높이 창(fullPage 상당 — 렌더 sandbox iframe 아님) · 390은 _w390.html 래퍼(390폭 iframe) + sips 가운데 크롭
# ego-browser page.screenshot은 2회 재시도 모두 CDP 시간 초과(logs/qb-run.txt SHOT-RETRY) → 브리프 3절대로 Chrome headless 전환. 16000px 넘는 문서는 위 16000px만(창 상한).
# qb-12-ring = qb-12.html 사본 + CTA a에 autofocus(판정용 사본 — 제품 출력 아님): 실제 포커스 링 보이기
cd "$(dirname "$0")"
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p shots; rm -f shots/qb-*-{1280,768,390}.png; i=0
printf '%s' '<!doctype html><style>html,body{margin:0}body{padding:100px 65px}iframe{display:block;border:0}</style><script>const q=new URLSearchParams(location.search);document.write(`<iframe width="390" height="${q.get("h")}" src="${q.get("d")}.html"></iframe>`)</script>' > static/_w390.html
trap 'rm -f static/_w390.html' EXIT
for spec in qb-9:900 qb-10:900 qb-11:1200 qb-12:900 qb-12-ring:900 qb-13:7800 qb-13-flip:7800 qb-14:2000 qb-15:16000; do
  d=${spec%:*}; H=${spec#*:}
  for w in 1280 768 390; do
    out="$PWD/shots/$d-$w.png"; rm -f "$out"; i=$((i+1)); h=$H
    url="http://127.0.0.1:4339/$d.html"; wh=$w,$h
    if [ "$w" = 390 ]; then url="http://127.0.0.1:4339/_w390.html?d=$d&h=$h"; wh=520,$((h + 200)); fi
    "$C" --headless=new --disable-gpu --hide-scrollbars --user-data-dir=/tmp/m2b2c-chrome-$i --window-size=$wh --virtual-time-budget=2500 --screenshot="$out" "$url" >/dev/null 2>&1 & pid=$!
    for _ in $(seq 1 80); do [ -s "$out" ] && break; sleep 0.5; done
    sleep 0.3; kill $pid 2>/dev/null; wait $pid 2>/dev/null; rm -rf /tmp/m2b2c-chrome-$i
    [ -s "$out" ] || echo "FAIL $d $w"
    [ "$w" = 390 ] && [ -s "$out" ] && sips -c "$h" 390 "$out" >/dev/null
  done
done
ls shots/*.png | wc -l
