# M2A-3c 재개 지시 (영환님 "1-★A, 2-★A" 2026-10-04 · Jarvis)

- 기반: 이 브랜치에 main `bf278d5`를 합쳤다(merge `38852bf`) — **ADR-004 개정 4**(`/studio/:projectId` 진입 128 · 멈춤선 127.70) · **2a-05 SPEC r4.12**(정적 HTML 고정 인라인 스크립트 1개).
- 규칙은 `docs/06-handoff/M2A-3C_PNG_BRIEF.md` 그대로. 바뀌는 것만:

## 1. 예산 (C1 결론 갱신)
- **R1**: `app/scripts/check-bundle-size.mjs`의 `/studio/:projectId` `eagerBudgetKb` 127 → **128**(주석에 "ADR-004 개정 4"), 커밋 메시지에 "ADR-004 개정 4". 그 밖 라우트·첫 화면·렌더 예산 변경 0. 바꾸기 전후 빌드 출력을 REPORT 3절 "재개" 하위 절에.
- PNG 묶음은 **m2a SPEC 3.3 원안대로 진입 때부터** 보인다(C1 최소 시제품 `logs/c1-proto.patch` 기반 가능). 판정: `/studio` 진입 ≤ **127.70**(멈춤선). 넘을 것 같으면 멈추고 보고(개정 4 결정 3·4 — 상향 금지).

## 2. 정적 HTML 메뉴 닫기 (r4.12 — C2 앞에 R2로)
- **R2 (RED 먼저)**: `features/studio/staticHtml/staticMarkup.ts` `buildStaticHtml`이 **생성기 상수** 인라인 스크립트 1개를 넣는다 — 내용은 r4.12 행 그대로(문서 위임 `click` 리스너 1개 → `a[href^="#"]`가 `[popover]` 안이면 그 popover `hidePopover()` · `hidePopover` 없으면 아무것도 안 함). 사용자 글자·URL·문서 값 0, `on*` 속성 0.
- 생성기 검사 변경: "script 0" → **"고정 스크립트(바이트 일치) 외 script 0"** — 3b 테스트 중 "script 0"을 보던 단언은 r4.12에 따라 바뀌는 단언으로 REPORT 이관 표(행별 근거). 문서마다 스크립트 바이트 동일 테스트 · 사용자 글자에 `</script>`가 있어도 스크립트가 늘지 않는 테스트.
- 판정 [B]: 새로 내보낸 HTML(390)에서 K-AC-12 5항 전부 — 특히 "시트 안 앵커 → 시트 닫힘 + 대상 섹션 · 제목 안 가려짐". `logs/r2-kac12.txt`.

## 3. 그다음
- C2(캡처 방식 PoC) → C3 → C4 → C5 브리프 그대로. **C2 PoC는 R2가 넣은 스크립트와 무관**(PNG는 캡처 시점 DOM — 스크립트 실행 0).
- 3b Codex P2 3건(REPORT 2.1)은 이 레인 범위 밖(M2a 마감).
- 턴: 이번 실행 `--max-turns` 100 · **75턴부터 REPORT 마감 우선** · 브라우저 단계 전에 REPORT 먼저 갱신.
