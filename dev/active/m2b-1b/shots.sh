#!/bin/bash
# QB 캡처 — static/*.html(127.0.0.1:4339, python http.server) × 1280·768·390 → shots/<문서>-<폭>.png (Chrome headless, 뷰포트만).
# ego screenshot이 CDP 시간 초과라 대체. Chrome이 저장 뒤 종료하지 않아 파일이 생기면 프로세스를 끝낸다. -cap = 시트 열림 사본.
# 390: headless 창 최소 폭(≈500) 때문에 뷰포트가 390보다 넓어져 오른쪽이 잘린다 → static/_w390.html?d=문서 (390폭 iframe) 창 520 폭으로 찍고 iframe을 창 가운데(위 100·왼 65)에 두고 sips 가운데 크롭으로 390×높이를 자른다.
# footer 문서(FULL)는 --screenshot이 스크롤 위치를 반영하지 못해(-cap 사본 = 빈 화면) 내보내기 원본을 높이 5000 창으로 전체 페이지 캡처 → <문서>-full-<폭>.png
cd "$(dirname "$0")"
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DOCS="qb-1-hamburger qb-1-hamburger-cap qb-2-two-tier qb-2-two-tier-cap qb-3-transparent-center qb-4-transparent-fullbleed qb-13-sticky-hamburger qb-13-sticky-two-tier qb-13-transparent"
FULL="qb-10-map qb-11-minimal qb-11-minimal-biz qb-13-biz-extended-map qb-13-minimal qb-13-minimal-biz"
mkdir -p shots; rm -f shots/*.png; i=0
printf '%s' '<!doctype html><style>html,body{margin:0}body{padding:100px 65px}iframe{display:block;border:0}</style><script>const q=new URLSearchParams(location.search);document.write(`<iframe width="390" height="${q.get("h")}" src="${q.get("d")}.html"></iframe>`)</script>' > static/_w390.html
trap 'rm -f static/_w390.html' EXIT
for d in $DOCS $FULL; do for wh in 1280,900 768,1024 390,844; do
  w=${wh%,*}; out="$PWD/shots/$d-$w.png"
  case " $FULL " in *" $d "*) wh=$w,5000; out="$PWD/shots/$d-full-$w.png";; esac; rm -f "$out"; i=$((i+1))
  url="http://127.0.0.1:4339/$d.html"; h=${wh#*,}
  if [ "$w" = 390 ]; then url="http://127.0.0.1:4339/_w390.html?d=$d&h=$h"; wh=520,$((h + 200)); fi
  "$C" --headless=new --disable-gpu --hide-scrollbars --user-data-dir=/tmp/m2b1b-chrome-$i --window-size=$wh --virtual-time-budget=2500 --screenshot="$out" "$url" >/dev/null 2>&1 & pid=$!
  for _ in $(seq 1 60); do [ -s "$out" ] && break; sleep 0.5; done
  sleep 0.3; kill $pid 2>/dev/null; wait $pid 2>/dev/null; rm -rf /tmp/m2b1b-chrome-$i
  [ -s "$out" ] || echo "FAIL $d $w"
  [ "$w" = 390 ] && sips -c "$h" 390 "$out" >/dev/null
done; done
ls shots/*.png | wc -l
