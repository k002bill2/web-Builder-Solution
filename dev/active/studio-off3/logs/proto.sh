#!/bin/zsh
# usage: proto.sh <id> — 현재 작업 트리를 /tmp/so3/<id>로 앱 빌드(vite build만)하고 라우트 합계 출력
cd /Users/younghwankang/orca/workspaces/web-builder-solution/studio-off3/app
npx vite build --outDir /tmp/so3/$1 --emptyOutDir > /tmp/so3/$1.log 2>&1 || { echo BUILD FAIL; tail -20 /tmp/so3/$1.log; exit 1; }
node ../dev/active/studio-off3/logs/routes.mjs /tmp/so3/$1
