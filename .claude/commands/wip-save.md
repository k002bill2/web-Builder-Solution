---
allowed-tools: Bash(git:*), Read, Write
description: 작업 상태 저장/복원 (WIP 커밋)
argument-hint: [save|restore] [설명]
---

# WIP Save/Restore

작업 중간 상태를 저장하고 복원한다. (네이티브 `/checkpoint`와 이름 충돌을 피해 `/wip-save`. 커밋 접두어 `checkpoint:`는 유지.)

## Save (저장)

1. 현재 브랜치가 `main`이 아닌지 확인한다 (CLAUDE.md Rules 7 — 작업은 전용 브랜치/worktree)
2. 변경 파일을 확인하고 경로로 stage 한다 (`app/dist/`, `*.log`, 스크린샷 등 제외)
```bash
git status --short
git add <경로...>
git commit -m "checkpoint: [설명 또는 자동 생성]"
```
3. 진행 중 작업이 있으면 `dev/active/<task>/PROGRESS.md`에 "WIP 저장 지점" 한 줄 추가

## Restore (복원)

최근 checkpoint 커밋을 찾아서:
```bash
git log --oneline --grep="checkpoint:" -5
```

선택한 checkpoint로 복원 (작업 트리 변경은 유지):
```bash
git reset --soft [checkpoint-hash]
```

## 사용 시점

- 큰 작업 중 중간 저장
- 위험한 변경 전 안전망
- 새 세션으로 넘기기 전 상태 저장

## 주의
- 이미 push한 checkpoint는 reset하지 않는다
