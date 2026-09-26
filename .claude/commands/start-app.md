---
name: start-app
description: 앱(app/) Vite 개발 서버 실행 워크플로우.
disable-model-invocation: true
---

# Start App

`app/` 개발 서버를 시작한다. 이 프로젝트는 현재 프런트엔드 단독이다(백엔드 미정, ADR-001).

## 워크플로우

### 1. 포트 확인

기본 5173은 다른 프로젝트(Agent-System 대시보드 등)와 겹치므로 **5480**을 쓴다.

```bash
lsof -iTCP:5480 -sTCP:LISTEN -P || echo "PORT_FREE"
```

- 사용 중이면 그 프로세스의 작업 디렉터리를 확인한다: `lsof -p <PID> -a -d cwd -Fn`
  - 이 저장소(또는 이 저장소 worktree)의 서버면 재시작 여부를 사용자에게 묻는다
  - 다른 프로젝트면 종료하지 않고 다른 포트(5481…)를 쓴다

### 2. 의존성 확인

```bash
cd app && npm install
```
- `package-lock.json`이 바뀌었을 수 있으므로(병합 후 등) 매번 실행해도 된다. lockfile을 바꾸지 않으려면 `npm ci`.

### 3. 개발 서버 시작 (세션과 분리)

```bash
cd app && nohup npx vite --host 127.0.0.1 --port 5480 --strictPort > /tmp/web-builder-vite.log 2>&1 & disown
```
- `127.0.0.1`에만 바인딩한다 (브리프 규칙: 확인용 서버는 로컬만).
- Claude Code 백그라운드 작업으로 띄우면 셸 래퍼가 종료 코드 144로 끝났다고 표시되는 일이 있다. `nohup … & disown`으로 띄운다.

### 4. 실행 확인

```bash
for i in $(seq 1 15); do curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5480/ | grep -q 200 && break; sleep 1; done
lsof -iTCP:5480 -sTCP:LISTEN -P -t   # PID 기록
```
- 사용자에게 URL과 PID를 알린다. 브라우저로 열어 달라고 하면 `open http://127.0.0.1:5480/catalog`.

## 화면 경로

| 화면 | 경로 | 상태 |
|---|---|---|
| 1a-01 카탈로그 | `/catalog` | 구현 |
| 1a-02 레퍼런스 상세 | `/references/ref-a` | 구현 |
| 1a-03 비교 보드 | `/compare` | 구현 (비교 목록은 세션 메모리 — 카탈로그에서 담은 뒤 이동) |
| 프로필·편집기 | `/profile`, `/studio` | 안내 화면 |

## 트러블슈팅

- **모듈 에러**: `rm -rf app/node_modules && cd app && npm ci`
- **HMR 불안정**: `rm -rf app/node_modules/.vite`
- **로그**: `tail -F /tmp/web-builder-vite.log`
