# SPEC-4 r0.2a — Codex 4라운드 (사용자 승인) — REPORT

- **판정: 미실행(BLOCKED)**. Codex 쿼터가 소진되어 리뷰가 돌지 않았다. 원문은 `codex-a4.txt`(exit 1)이다.
  - 오류 원문: "Codex did not return valid structured JSON. — You’ve hit your usage limit … try again at 6:29 AM."
- 대상: `a7458ca` → `d1394e0`(r0.2a). 실행 시각은 `codex-a4.started`에 있다.
- 자체 점검(`QA-JUDGMENT.md`, Codex 실행 전에 기록): 새 P1/P2 0건, P3 1건(S-2 — 실제로는 일어나지 않는 분기로 판단)이다. 작성자 자체 점검이라 독립 근거가 아니다.
- 상태: **r0.2a는 여전히 미재검토다.** 4라운드는 승인된 1회로 남겨 두었고, 쿼터가 복구된 뒤(06:29 이후) 같은 명령으로 1회 재실행한다.
- 재실행 명령: `node ~/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs adversarial-review --scope branch --base a7458ca "<r0.2a 집중>"`
- 대안: `/codex:rescue`도 같은 Codex 쿼터를 쓰므로 대안이 될 수 없다. 다른 모델의 독립 컨텍스트 검토(서브에이전트)는 Codex 게이트를 대신하지 못한다. 대신 쓸지는 사용자가 결정한다.

## 재실행 (2026-10-15 · 사용자 "4라운드 재실행")
- 같은 명령을 1회 실행했다. 원문은 `codex-a4b.txt`(exit 0)이다. 판정은 **needs-attention · P2 1건**이다. 자체 점검에서는 이 건을 놓쳤다.
  - [P2] 기억이 없는 상태에서는 세대가 정의되지 않는다. 그래서 ①을 "토큰 일치"로 해석하면 최초 요청 실패의 `PendingStart` 생성(F-5·F-7·F-10)이 무시되어 보호가 사라진다. 반대로 "없음 = 없음"으로 허용하면, draft가 생겼다 해제된 뒤 늦게 도착한 결과가 오래된 기억을 다시 만든다.
- **반영(r0.2b, 한 번)**:
  - 기억이 없어도 유지되는 프로젝트별 `epoch`를 둔다. 모든 변화 때 +1이다.
  - ①은 `epoch === e0`로 판정한다.
  - ③은 `heldAt === e0 + 1`일 때만 적용한다.
  - 수용 기준 RS4-AC-18c를 추가했다.
- **r0.2b는 Codex 미재검토다.** 승인받은 4라운드를 다 썼으므로 추가 라운드는 없다.
- 독립 검증은 구현 CP2 RED 단계로 넘긴다. RS4-AC-18·18b·18c를 먼저 실패시킨다.
