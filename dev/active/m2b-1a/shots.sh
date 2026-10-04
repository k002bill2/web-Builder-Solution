#!/bin/zsh
# QB 캡처 — static/*.html(buildStaticHtml 결과)을 Chrome headless --screenshot으로. 390·768은 해당 폭 iframe 감싸기(브리프). 뷰포트 캡처(fullPage 0)
set -u
D=/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-1a/dev/active/m2b-1a
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
typeset -A HH; HH=(1280 900 768 1024 390 844)
shoot() { # name file width
  local name=$1 f=$2 w=$3 h=${HH[$3]} url
  if [ $w = 1280 ]; then url="file://$D/static/$f"; else
    print -r -- "<!doctype html><style>html,body{margin:0}iframe{border:0;display:block}</style><iframe src=\"$f\" width=\"$w\" height=\"$h\"></iframe>" > "$D/static/wrap-$w-$f"; url="file://$D/static/wrap-$w-$f"; fi
  for i in 1 2 3; do
    timeout 60 "$CH" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files --window-size=$w,$h --virtual-time-budget=3000 --screenshot="$D/shots/$name-$w.png" "$url" >/dev/null 2>&1 && [ -s "$D/shots/$name-$w.png" ] && { echo "ok $name-$w"; return; }
    echo "retry $name-$w $i"
  done; echo "FAIL $name-$w"
}
for p in qb-5-split qb-6-center qb-7-grid qb-8-text qb-9-image qb-12; do for w in 1280 768 390; do shoot $p $p.html $w; done; done
for v in split center grid text image; do for w in 1280 390; do shoot qb-13-$v qb-13-$v.html $w; done; done
