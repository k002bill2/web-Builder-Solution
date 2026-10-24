# MQ-SMP 결정 기록 (SAMPLE-SPEC r0)

- 결정: 영환님 2026-10-25 Slack "★, push 승인" — 아래 ★ 전부 채택 · 문안 Jarvis
- 입력: `SAMPLE-SPEC.md` 6절(Designer r0) · `docs/security/extract/THREAT-MODEL.md` r0(Security) · `dev/active/sample-spec/EXTRACT-LEGAL-LEDGER.md`(Newton, 리스크 중간)
- SAMPLE-SPEC 6절과 다른 ★: **05·06** (Security·Newton 결과 반영 — 아래 근거)

| ID | 결정 | 비고 |
|---|---|---|
| MQ-SMP-01 | **B** 디자인 샘플 묶음 zip 1개(PNG·HTML·`design-tokens.json`·`sections.json`·README) + 기존 개별 버튼 유지 | SAMPLE-SPEC 2.3 |
| MQ-SMP-02 | **A** 자체 평평한 JSON(`design-sample/tokens@0`) | DTCG 호환은 [L3 확인 필요] — 확인 뒤 확장 |
| MQ-SMP-03 | **A** 내보내기 순서 PNG → 샘플 묶음 → HTML 1개 → HTML 샘플 zip → React 코드 샘플 zip | M4-a Q18 A 결정을 이 결정으로 대체 |
| MQ-SMP-04 | **A** 승인 고정 문안(LICENSES `zip/licenses.ts:35,37`·React README) "사이트"→"샘플" 최소 치환 | 권리 문장 의미 불변 |
| MQ-SMP-05 | **B 로컬 CLI(사용자 PC, 정적 fetch 우선·JS 끔)** | SAMPLE-SPEC ★C(보류) → THREAT-MODEL 5절 ★B로 변경. 서버 fetch(SSRF·공격 프록시)·브라우저 확장(사용자 세션 유출) 기각 |
| MQ-SMP-06 | **C 허용 목록 도메인만** | SAMPLE-SPEC ★B(robots + 사용자 체크) → 변경. Newton 원장 ★1: 사용자 체크는 원사이트 권리자 허락을 대신하지 않음. robots 존중은 추가로 유지 |
| MQ-SMP-07 | **A** ADR-004 새 개정으로 `/studio` 진입 몫 **최대 +0.05** 배정 | 실측 후 개정 23 기록(구현 레인). 상한 129.13·132.11 불변 |
| MQ-SMP-08 | **A** 정적 HTML 시안 Safari·Firefox 열람 확인 → 백로그(B-SMP-01, 수동 1회) | |

## 경로 B 착수 조건 (변경 없음)

ADR-009 2절 게이트 + THREAT-MODEL Blocker **BL-1~7 전부 해제 전 코드 착수 금지.** BL-1 = 실제 법무 확인(질문 5개: 원장 1절 "법무 확인이 꼭 필요한 질문") — 영환님 측 진행.
단, **BL-4(앱 `isCssValue` 함수 표기 거부 강화, `app/src/render/protocol.ts:70`)는 경로 A 구현 레인에 선반영**한다(경로 B와 무관한 방어 심층화).
