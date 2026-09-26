---
name: session-wrap
description: 세션 종료 시 문서/패턴/학습/후속작업을 정리
---

# Session Wrap

세션 종료 전에 작업 결과를 정리하고 다음 세션에서 이어갈 수 있게 한다.

## 트리거 조건

- 사용자가 `/session-wrap` 또는 "세션 정리" 요청 시
- 장시간 작업 후 컨텍스트 압축 전

## 실행 프로세스

### Phase 1: 컨텍스트 수집 (순차, 메인이 직접)

1. `git status --short`, `git diff --stat`
2. `git log --oneline -10`
3. `git worktree list` — 진행 중인 작업 공간(Orca worktree) 확인
4. `dev/active/*/PROGRESS.md` 중 이번 세션에 바뀐 것

### Phase 2: 정리 (4관점)

변경 규모가 작으면 메인이 직접, 크면 병렬 에이전트로 나눈다.

1. **문서 갱신** — `dev/active/<task>/PROGRESS.md`(단계 상태·커밋 해시), `docs/06-handoff/BACKLOG.md`(새 보류 항목), 필요 시 ADR·CLAUDE.md(보호 파일 — 제안만)
2. **패턴** — 이번 세션에 정해진 프로젝트 관례(토큰 사용, 테스트 방식, 번들 분할 등)
3. **학습 기록** — 재현 가능한 결정·함정만 `~/.claude/projects/-Users-younghwankang-Work-web-builder-solution/memory/`에 파일로, `MEMORY.md`에 한 줄 링크
4. **다음 단계** — 미완료 작업, 다음 브리프 후보, 리스크

### Phase 3: 통합 요약

1. 세션 요약 리포트
2. MEMORY.md 인덱스 갱신 + 신규 memory 파일 frontmatter 확인
3. 사용자에게 최종 요약

## 출력 형식

```markdown
# Session Wrap Report

## 이번 세션 요약
- [N]개 파일 수정 · [N]개 커밋 · 브랜치/worktree: ...
- 주요 작업: ...

## 문서 업데이트 필요
- [ ] [파일]: [내용]

## 새 패턴/결정
- ...

## 다음 세션 TODO
1. ...

## 리스크/주의
- ...
```

## 주의사항

- 커밋되지 않은 변경이 있으면 먼저 커밋 여부를 확인한다
- 켜 둔 개발 서버가 있으면 종료 여부를 확인한다 (`/stop-app`)
- MEMORY 기록은 코드·git 기록에 없는 결정·함정만
