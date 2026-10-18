# M3-1 BRIEF — 추천 모드 구현 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (영환님 "1 진행 · 자동 진행")
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/m3-reco-impl` (브랜치 `k002bill2/m3-reco-impl`, base origin/main `268226f2`). node_modules 설치 완료.
정본: `docs/design/m3/RECO-SPEC.md` r1 + **7a 결정 기록**(RQ-01~11 ★: RQ-01 B 보드 담기 + 전 선택 행 교체 · RQ-02 B 품질 2항목 순위 제외 만점 70 · RQ-03 A · RQ-04 A · RQ-05 A · RQ-06 A 파생 표 + 엔진 대조 가드 · RQ-07 A 5/3 · RQ-08 A · RQ-09 A status 공유 · RQ-10 A · RQ-11 A 조건부). 수용 기준 RECO-AC-01~17 · TDD T-REC-01~06 · E2E-S4.
Designer 생략 사유: 명세 채택 완료 — 이 레인은 구현. 근거 문장 문안은 SPEC 자리표시 키 그대로(최종 문안 Hemingway 후속).

## 순서
- **E0 실측 관문(먼저, 10턴 안)**: Provider 통로 `runQueued` 최소 구현 → build로 `/studio` 정규화 · `/profile`·`/compare`·`/catalog` 첫 화면 · 다른 라우트 진입 실측. 판정: `/studio` ≤ 128.74 · 다른 라우트 증분 ≤ 0.03 · 한도 안 → 계속. **넘으면 감량 1회 → 그래도 넘으면 멈추고 수치 보고**(새 개정은 영환님 상신 대상). 생성 레퍼런스 21개 비교 행 커버리지 전수 확인(SPEC 3.3 [미확인]).
- E1 `domain/recommend.ts` 점수(reco-v1, 정수·결정성·동점 id 사전순) + `RECO_SECTION_FIT` 파생 표 + 엔진 대조 가드 테스트 — T-REC-01~05.
- E2 `tab=rec` 화면: 카드 3 + "2개 더 보기" · 근거 펼치기 · 상태(빈/로딩/오류/근거 부족) · 390/1280 · status 공유(`Announcement`). rec 청크는 `tab=rec`일 때만 로드 — **`tab=all`에서 안 받는다는 로드 조건 테스트** 필수. `CatalogPage.test.tsx:198-215`(V2-AC-21) 자리 문구 단언은 RECO-AC-08 기준으로 정정(이전/이후 표).
- E3 승인 후 적용: 미리보기 차이 목록 → 적용(저장 확인 뒤 성공) → 되돌리기 · 승인 전 변경 0(T-REC-06) — 적용 본문은 조작 뒤 청크.
- E4 검사기 `check-bundle-size.mjs` SCENARIOS "/catalog (추천)" 행 · fresh 게이트 · Ego Lite(preview `--port 4399 --strictPort`: 필터 → 추천 → 근거 → 적용 → `/compare` 초안 반영 → 되돌리기, 390·1280) · Codex adversarial 1회(`--scope branch --base 268226f2`, `--help` 금지) · 반영 1회.

## 규칙
- TDD(단계마다 RED 로그 `dev/active/m3-reco-impl/logs/`) · 기존 단언 약화·skip 0. 엔진 계약·저장 스키마 변경 0 · 새 의존성 0 — 필요해지면 멈추고 보고.
- 예산 기준선은 실측 상향 시 같은 커밋에서(판정선 안일 때만) — 개정 문서는 Jarvis.
- 쓰기 경로: `domain/recommend*`·`pages/CatalogPage*`·`components/catalog/**`·`components/reco/**`(신설)·`src/app/AppProviders.tsx`·트레이 컨텍스트(통로만)·`data/memoryCompareBoardRepository*`(호출만, 스키마 0)·`app/scripts/{check-bundle-size.mjs,bundleBudget*,m2cBaseline.json}`·`dev/active/m3-reco-impl/`. `features/studio/**` 접촉 0(병렬 `m4a-retry-fix`).
- 명시 경로 커밋, amend·rebase·push·merge 0. 첫 2턴 BRIEF·PROGRESS 커밋 · **E0 끝나면 REPORT 초안 커밋** · 단계마다 PROGRESS·REPORT 커밋. preview 종료·리슨 0 기록. 마감 전 `git status --short` node_modules 외 빈 값.
- 서브에이전트: 쓰기 1개(`isolation: worktree` — E1 순수 모듈·테스트 ∥ 메인 E2 화면) 권장. 최대 120턴 · 105턴부터 새 구현 중단 → Ego Lite·Codex·게이트·REPORT.
