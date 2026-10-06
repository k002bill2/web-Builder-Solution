#!/bin/bash
# M2B-6 3폭 시각 회귀 기준선 캡처 — 저장소 밖 의존성 0(macOS Chrome·python3·sips만).
# 사용: ./shots.sh <출력폴더>   (전제: static/ 를 127.0.0.1:4339 로 서빙 — python3 -m http.server 4339 --bind 127.0.0.1 -d static)
# 방식 = Chrome headless --screenshot · 창 높이 = logs/s2-heights.json(폭별 문서 높이, 모션 뒤 실측) · 렌더 sandbox iframe 아님(정적 사본).
# 모션: --force-prefers-reduced-motion (kit/motion.css 감소 분기 = 0초부터 최종 상태, MF-AC-B3). 모션 켠 채 4병렬 캡처는 등장 시작 프레임이 찍혀 비결정(logs/s2-determinism-motion-on.txt).
# 390 = _w390.html 래퍼(390폭 iframe, 여백 100/65) + sips 가운데 크롭(Chrome headless 창 최소 폭 회피). 4개 병렬.
set -u
cd "$(dirname "$0")"
OUT=${1:?출력 폴더}; mkdir -p "$OUT"
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
printf '%s' '<!doctype html><style>html,body{margin:0}body{padding:100px 65px}iframe{display:block;border:0}</style><script>const q=new URLSearchParams(location.search);document.write(`<iframe width="390" height="${q.get("h")}" src="${q.get("d")}.html"></iframe>`)</script>' > static/_w390.html
shot() { # name width height out
  local d=$1 w=$2 h=$3 o=$4 url wh tmp
  tmp=$(mktemp -d /tmp/m2b6-chrome-XXXX)
  url="http://127.0.0.1:4339/$d.html"; wh=$w,$h
  if [ "$w" = 390 ]; then url="http://127.0.0.1:4339/_w390.html?d=$d&h=$h"; wh=520,$((h + 200)); fi
  rm -f "$o"
  "$C" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --force-prefers-reduced-motion --user-data-dir="$tmp" --window-size=$wh --virtual-time-budget=3000 --screenshot="$o" "$url" >/dev/null 2>&1 & local pid=$!
  for _ in $(seq 1 100); do [ -s "$o" ] && break; sleep 0.3; done
  sleep 0.3; kill $pid 2>/dev/null; wait $pid 2>/dev/null; rm -rf "$tmp"
  [ -s "$o" ] || { echo "FAIL $d $w"; return; }
  [ "$w" = 390 ] && sips -c "$h" 390 "$o" >/dev/null
}
export -f shot; export C
python3 -c '
import json; d=json.load(open("logs/s2-heights.json"))
for n,v in sorted(d.items()):
  for w in ("1280","768","390"): print(n, w, v[w]["h"])
' | while read n w h; do echo "$n $w $h $OUT/$n-$w.png"; done | xargs -P 4 -L 1 bash -c 'shot "$0" "$1" "$2" "$3"'
rm -f static/_w390.html
ls "$OUT"/*.png | wc -l
