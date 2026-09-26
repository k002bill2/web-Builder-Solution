---
allowed-tools: Bash(git:*), Read, Grep, Glob
description: 간단한 수정용 빠른 커밋 (검증 스킵)
argument-hint: [커밋 메시지]
---

# Quick Commit

검증 없이 빠르게 커밋한다. 문서, 설정, 단순 수정에만 사용.

## 절차

1. `git branch --show-current` 확인 — `main`이면 코드 변경은 커밋하지 않는다 (CLAUDE.md Rules 7). 문서(`docs/`)만인 경우에도 사용자 확인 후 진행
2. `git status --short` 확인. 변경사항 없으면 중단
3. 대상 파일을 **경로로 지정해** stage (`git add -A` 금지 — 스크린샷·로그·로컬 설정이 섞인다)
4. 커밋 메시지:
   - $ARGUMENTS 있으면 그대로 사용
   - 없으면 Conventional Commits 형식으로 생성 (`docs:`, `chore:` 등, 필요하면 `docs(v2-2b):`처럼 작업 범위)
5. 커밋 후 `git log -1 --format=%B`로 co-author 푸터 확인, 없으면 푸시 전 `--amend`로 추가

## 사용 시점

- 문서 수정 (docs/, README, CLAUDE.md — CLAUDE.md는 보호 파일이라 사용자 승인 필요)
- 설정 파일 변경 (.claude/, .gitignore)
- 주석/타이포 수정

## 주의

- `app/src` 로직 변경에는 사용 금지 → `/verify-loop` 후 커밋
- `design/` 변경은 커밋 금지 (읽기 전용 원본)
- push·원격 추가는 사용자 승인 후에만
