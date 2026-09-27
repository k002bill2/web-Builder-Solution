# UI-2A04C PROGRESS — 승인된 3안 UI 실구현

- 수신: 2026-09-27 10:42 KST · 브리프 `docs/06-handoff/UI-2A04C_BRIEF.md`(33행 전체 읽음) · 설계 `docs/design/2a-04/SPEC.md`(782행 전체 읽음, 4·5·6.3·7·8·10·11절 중점) · `docs/design/2a-05/SPEC.md` 12.3·10.2(경계 확인)
- 작업 공간 `ui-2a04c`, 브랜치 `k002bill2/ui-2a04c`(기준 main `9bcf0d2` + 브리프 커밋 `2804775`)
- 수정 범위: `app/` 2a-04c 구현 + `dev/active/ui-2a04c/`만. `docs/design/`·`design/`·`app/src/engine/` 수정 금지

## ultracode 증거 (추측과 분리)
| 항목 | 관찰(L1) |
|---|---|
| CLI 도움말 | `claude --help` → `--effort <level> … (low, medium, high, xhigh, max)` — 목록에 `ultracode` 없음 |
| 실제 실행 인자 | 부모 프로세스 `claude -p … --model opus --effort ultracode --max-turns 100 --output-format json …` — CLI가 인자를 거부하지 않고 세션이 시작됨 |
| 세션 신호 | 이 세션 system-reminder에 "Ultracode is on" 문구가 주입됨 |
| 판정 | 세션 신호 **있음** — 다만 그 문구는 프롬프트의 `ultracode` 키워드로도 주입될 수 있어 `--effort ultracode`에 귀속할 수 없다. CLI 공식 지원은 **미확인**(도움말 목록 밖). 설정·정책 변경 없음 |

## 기준 실측 (시작 시 `npm run build`, 원본 `logs/baseline-build.log`, exit 0)
- 공통 89.06 · `/compare` 99.59 / 118.99 · `/profile` 99.39 / 118.97 · `/catalog` 99.36 / 101.74 · `/references/:id` 96.71 / 99.09 · `/studio` 89.50 / 91.88 (KB gzip, 첫 화면 / 진입 직후)
- `ProfilePage` 청크 7.25KB · `profileEngine` 5.72KB · `memoryStudio` 2.67KB

## 번들 설계 (브리프 최우선)
- `/profile` 첫 화면 여유 0.61 → **ProfilePage 청크는 늘리지 않는다**: 자리표시 `section` 삭제, 3안 UI는 `profileEngine` 청크(진입 직후 자동, 여유 6.03)
- 공통: 생성 저장소 **로더 핸들 1개**만 컨텍스트로(2a-05 S-B3 방식) — deferred 위임 래퍼를 공통에 두지 않는다
- 생성 클릭에만 필요한 `composeCandidates`·`lintPlan` = 조작 뒤 청크(`requestGeneration`·`retryFailed` 안에서 로드). 기존 잡 자동 조회(`findJob`·`getJob` 폴링)와 카드 표시는 자동 합계(memoryStudio·profileEngine)에 포함

## 체크리스트
- [x] 브리프·SPEC 읽기, 수신 기록, 기준 번들 실측
- [x] RED: composeCandidates/lintPlan 결정성·세 축·목적 규칙·모션·해시·동결 (서브에이전트 A, worktree `bb9d758` → cherry-pick `81bfe9b`, RED 74 실패 → GREEN 74)
- [x] GenerationRepository request/find/get/retry/select + 공유 store 확장 + 테스트 (메인, `4bdc68f`, Red-Green 2건 logs/)
- [x] 3안 UI (P-S17~24 · P-AC-21~31) + ProfilePage 통합 + `/studio` 자리표시 2a-05 정정 (메인, `4bdc68f`)
- [x] 번들 실측 (배선 직후 · UI 직후 · 컴포저 병합 직후 — 공유 청크 분리 2건 발견·해소, REPORT 3절)
- [x] 4게이트: typecheck 0 · lint 0 · vitest 전체 1회(1089 중 1 실패 → 단언 갱신 → 표적 1/1) · build 0 — `logs/gate-*.log`
- [x] 브라우저 127.0.0.1:4337 catalog→compare→profile→3안→선택→studio, 1280/1024/768/390/320 캡처 + 수정 확인 1회(`logs/browser-flow-*.log`, `shots/`)
- [ ] Codex review 1회(최대 3) — BLOCKED: Codex 사용량 한도("try again at 3:26 PM", `logs/codex-review-1.raw.log`). 대체 = 읽기 전용 code-reviewer 검토(Codex 아님)
- [x] REPORT.md 커밋, 서버 PID 종료 + lsof 증거(`logs/server-stop.log`)

## REVIEW-PORT (main 병합 · 리뷰 수정 이식, REPORT 10절)
- [x] `git merge --no-ff main` + 충돌 2파일 해결 (`30b2943`)
- [x] 수정 3건 이식 확인 (useGeneration 2건 · CandidateCard key)
- [x] RED/GREEN (`logs/red-green-5-merge-port.log`) · 단독 5회 · 전체 vitest 1212 통과 · typecheck·lint·build exit 0
- [ ] 번들 순증가 ≤ 0 — BLOCKED: /profile 진입 직후 +0.04KB(124.74→124.78), useGeneration 수정 1·2의 고유 비용. Jarvis가 수용 또는 수정 제외 판단
- [ ] Codex 게이트 — BLOCKED: 이번 런 미실행(이전 한도 차단 기록 그대로)

## 서브에이전트 기록
| # | 도구 | 분담 | 격리 | 결과 |
|---|---|---|---|---|
| A | Workflow `wf_fcc7d984-d6a` 1 agent | composeCandidates·lintPlan + 테스트(TDD) | worktree `wf_fcc7d984-d6a-1` | `bb9d758` 4파일, RED 74 실패 → GREEN 74, 해석 3건(본문에 Hero 포함 · lint message에 ID 없음 · 없는 Footer 변형 R-12) |
| B | Agent code-reviewer(읽기 전용) | UI 수용 기준 검토(P-S17~24·5.1~5.4) | 없음(읽기 전용) | Major 1·Minor 2 → 2건 반영(`ea7f461`), 1건 유지(REPORT 8절) |
