# M4-a-5 BRIEF — LICENSES.md 고정 문안 반영 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (영환님 "1" — Hemingway 문안 초안 그대로 승인, 게이트 링크 줄은 BACKLOG)
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/m4a-licenses` (브랜치 `k002bill2/m4a-licenses`, base origin/main `df8694a6`). `app/node_modules` 설치 완료.
문안 정본: `dev/active/m4a-licenses/COPY.md` 1절 표의 **"이후" 열**(Hemingway, 영환님 승인). 글자 그대로 옮긴다 — 다듬기·띄어쓰기 변경 금지.

## 할 일
1. `app/src/features/studio/zip/licenses.ts` 고정 문장 10곳을 "이후"로 교체. `${files}`·`${lost}` 보간 그대로. 같은 문자열 안 여러 문장은 공백 하나로 이어 붙임(COPY 1절 머리말). 절 제목·순서·목록·조건 분기·파일 수 계산·마지막 개행·`fontLicenseText` 블록 **변경 0**.
2. TDD: `licenses.test.ts`에 새 문장 단언(RED 먼저, 로그 `dev/active/m4a-licenses/logs/red.txt`) · 결정성(같은 입력 2회 → 같은 바이트) · 브랜드 0(F-14 대상 문자열) · 사용자 글자 0. 기존 단언이 옛 문장을 고정하고 있으면 새 문장으로 **정정**(이전/이후 표 REPORT에) — 약화·skip 0.
3. `staticZip.test.ts`·`staticHtml.test.ts`에서 LICENSES 내용·zip 해시를 고정한 단언이 있으면 실측으로 갱신(해시 바뀜은 문안 교체의 기대 결과 — REPORT에 명시).
4. fresh typecheck·lint·test·build. 예산 `/studio` 128.71 · 복원 131.69 **증분 0** 기대(licenses.ts = 조작 뒤 청크). 넘으면 멈춤.
5. REPORT: 바뀐 문장 10곳 대조표(COPY "이후"와 글자 일치 확인 — `grep -F`로 각 문장 1회 이상) · 테스트 수 · 예산.

## 규칙
- 쓰기 경로: `app/src/features/studio/zip/{licenses.ts,licenses.test.ts,staticZip.test.ts}`·`app/src/features/studio/staticHtml/staticHtml.test.ts`·`dev/active/m4a-licenses/`. 그 밖 0. 브라우저 불필요. Codex 불필요(문자열만).
- 명시 경로 커밋, amend·rebase·push 0. 첫 2턴 BRIEF·PROGRESS(+COPY.md) 커밋, REPORT 초안 10턴 안. 마감 전 `git status --short` node_modules 외 빈 값. 최대 30턴.
