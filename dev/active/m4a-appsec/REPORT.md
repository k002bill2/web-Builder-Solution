# M4-a-3 AppSec REPORT — 정적 zip 내보내기 보안 검토

대상 `k002bill2/m4a-appsec` = m4a-impl tip `a834eb88`. 검토자: Security(Claude Code, Opus 5.5). 2026-10-18.
범위: 로컬 코드·로컬 단위 테스트만. 외부 송신·네트워크 스캔 0.

## 잠정 판정 (초안 — 항목별 갱신 중)

**잠정: 조건부 통과 후보 — Critical/High 미확인(조사 중).** 후보 지적 1건(`<template shadowrootmode>` 안은 정리·검사가 닿지 않음) 퍼즈 검증 중.

| # | 항목 | 상태 | 판정 |
|---|---|---|---|
| 1 | zip 작성기 | 조사 중(서브에이전트) | — |
| 2 | 금지 패턴 F-09~F-15 퍼즈 | 조사 중 | — |
| 3 | `09c4309d` 집중 | 코드 읽기 완료, 퍼즈·Codex 대기 | 잠정 Info |
| 4 | 참조 직렬화 신뢰 경계 | 코드 읽기 완료 | 잠정 Info |
| 5 | LICENSES.md·OFL.txt | 조사 중 | — |
| 6 | CSP/sandbox | 조사 중 | — |

## 지적 (심각도순)

(작성 중)
