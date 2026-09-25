#!/bin/bash
# Pre-Compaction Reminder — 컨텍스트 압축 직전 스킬/Dev Docs 상태를 stdout 으로
# 리마인더 출력(advisory). 경로는 CLAUDE_PROJECT_DIR 로 앵커링(없으면 cwd).

ROOT="${CLAUDE_PROJECT_DIR:-.}"

echo "[PRE-COMPACT REMINDER]"

# 사용 가능한 스킬 목록
if [ -d "$ROOT/.claude/skills" ]; then
  SKILLS=$(ls -d "$ROOT"/.claude/skills/*/ 2>/dev/null | xargs -I{} basename {})
  if [ -n "$SKILLS" ]; then
    echo "Available skills: $SKILLS"
  fi
fi

# 활성 Dev Docs 확인
if [ -d "$ROOT/dev/active" ]; then
  ACTIVE=$(ls "$ROOT/dev/active" 2>/dev/null)
  if [ -n "$ACTIVE" ]; then
    echo "Active dev docs: $ACTIVE"
    echo "Run: '/resume' to continue work"
  fi
fi
