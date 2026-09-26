---
name: stop-app
description: 이 저장소의 Vite 개발 서버 중지.
disable-model-invocation: true
---

# Stop App

이 저장소(`web-builder-solution`)에서 띄운 개발 서버만 중지한다.

## 절차

1. 후보 찾기:
```bash
lsof -iTCP -sTCP:LISTEN -P | grep node
```
2. 각 PID의 작업 디렉터리 확인 — **이 저장소 또는 이 저장소의 worktree인 것만** 대상:
```bash
lsof -p <PID> -a -d cwd -Fn
```
3. 대상만 종료:
```bash
kill <PID>
```
4. 확인: `lsof -iTCP:5480 -sTCP:LISTEN -P` 결과가 비어야 한다.

## 주의

- `pkill -f vite`처럼 이름으로 일괄 종료하지 않는다 — 같은 머신에서 다른 프로젝트(APFS, Agent-System 등) Vite 서버가 함께 돈다.
