# M2A-3a 내보내기 기반 — REPORT

- 브리프 `docs/06-handoff/M2A-3A_EXPORT-BASE_BRIEF.md` · 시작 커밋 `bec1b38` · 브랜치 `k002bill2/m2a-3a`

## 1. 커밋 표
| 단계 | 커밋 | 내용 |
|---|---|---|
| 수신 | c357938 | 수신 기록 · REPORT 골격 (경로 실수: `app/dev/active/`에 들어감) |
| 수신 | 5d1af48 | 경로 정정 `app/dev → dev` · `gate.sh` |
| E0 | bb53e01 | E0 실측 · **정지 보고** — 코드 변경 0(시제품은 `logs/e0-proto.patch`로 보존 후 원복) |
| 재개 E-pre | b8506d7 | `openStudio.tsx` ready 경쟁 수정(STUDIO-SLIM S5 이관) — 단언 변경 0 · 사용 파일 6개 묶음 x10 10/10 |
| 재개 E0 | (이 커밋) | **ADR-004 개정 3** — `/studio` 진입 한도만 127(시나리오별 `eagerBudgetKb`) · 시제품 실측 124.71 |

## 2. E0 공간 확보 (전후 실측 · 옮긴 코드)
**결론: 정지 조건 충족 — 진입 ≤ 124.70 경로가 실측으로 보이지 않아 E1 이전에 멈춘다.** 예산 상수·멈춤선 변경 0, 코드 변경 0.

| 측정 | `/studio` 첫 화면 | 진입 직후 | 근거 |
|---|---|---|---|
| 기준선(bec1b38) | 91.72 | **124.70** | `logs/e0-build.txt` |
| 시제품 전체(S-B4대로 `runGate` 진입 직후 자동 + 게이트 8줄 표시 + 버튼·이유) | 91.71 | **130.97 (+6.27)** | `logs/e0-proto-bundle.txt` · `logs/e0-proto.patch` |
| 옵션 A 시제품(게이트 목록·`runGate`를 "검사 결과 보기" 누른 뒤로, 버튼·폴백 이유는 진입) | 91.72 | **125.57 (+0.87)** | `logs/e0-optionA.txt` |
| 원복 후 | 91.72 | 124.70 | `logs/e0-after-revert.txt` |

- 증가분 분해(+6.27, **하한** — 시제품은 줄 이름표 외 머리 Tag 톤·경고 대화상자 연결·포커스 이동을 단순화했다): `runGate` 계열 **4.75**(gateCheck 1.92 · requiredSections 0.80 · contrast 0.89 · profileContrast 0.76 · effectiveProfile 0.38 — 앞의 셋 빼고는 지금 `/studio` 진입에 없는 domain 대비 코드) + 표시·배선 **1.44**(GateList 1.11).
- 우선순위 1(S-B5 조작 뒤): 경고 대화상자·잡 조회·결과 처리·`requestExport` 경로는 **모두 새 코드**라 처음부터 조작 뒤에 두면 진입 +0이지만, 기존 진입 코드를 빼 주지는 않는다 → 확보량 0.
- 우선순위 2(`runGate`는 이미 진입 직후 엔진 청크): **브리프 전제와 다름** — 지금 진입에 있는 것은 `gateText`·`issue`(canvasIssues 경유)뿐이고 `runGate`(대비 판정 포함)는 진입에 없다(8절).
- 우선순위 3(정리): 진입 큰 항목(모듈별 gzip 추정, `logs/e0-attr-optionA.txt`) = StudioLayout 2.84 · StructureCanvas 1.60 · useAutosaveScheduler 1.48 · 섹션 정의(bodySections 1.53 · boundSections 0.83) — 모두 S-B4 첫 화면·자동 조건 코드. 중복·미사용 코드로 6KB는커녕 1KB도 확인되지 않았다.
- ADR-004 실한도 125도 멈춤선 대비 +0.30뿐이라 **멈춤선을 올려도 해결되지 않는다**(옵션 A조차 125.57).

**선택지(영환님 결정 — 추천 순)**
1. **A + B 병행(추천)**: A(1280에서도 게이트 목록을 접힌 상태로 시작 — 브리프 예시, SPEC 개정) +0.87을 B로 상쇄. A만으로는 125 초과.
   - A 비용: E-S22·E-S23 "진입 즉시 게이트 차단 → 버튼 사전 차단"이 첫 검사(펼침·"검사 · 내보내기") 뒤로 밀린다 → 5.12·5.13·E-AC-25·29 문장 개정 필요. 폴백 이유(K-AC-18·E-AC-50)는 `RENDERED_VARIANTS`만 써서 진입에서 그대로 가능.
2. **B 단독(L3 추정 — 빌드 안 함)**: `/studio`가 진입 직후 받지만 부르지 않는 보드·생성 저장소 코드를 공유 store 로더 밖으로(memoryCompareBoardRepository 1.20 · memoryGenerationRepository 0.88 · profileDraft 청크 3.89 중 보드 몫 ≈ 3.4) → 추정 **−4.5~5.5**. +6.27을 다 덮지 못할 가능성이 높고, 2a-04 store 배선 변경(PARALLEL_LANES 규칙 1) · `/compare`·`/profile` ±0.03 규칙과 충돌 위험 → 별도 레인.
3. **C 예산 개정(ADR-004)**: `/studio` 진입 직후 한도 상향 — 이 레인 권한 밖.

### 2.1 재개(★A) — E-pre · E0 재측정
- **E-pre**: 공용 도우미 `features/studio/testing/openStudio.tsx`가 h1 뒤 `document.title === "<이름> 편집"`까지 기다린 뒤 `connectRenderFrame()`(StudioShell.test `open()`과 같은 기다림). 제목 비움은 각 파일 `afterEach` 대신 **도우미 안에서 이동 직전**에 한다 — 사용 파일 6개 모두에 같은 줄을 넣는 것과 같은 효과(이전 테스트 제목을 "effect 끝남"으로 잘못 읽지 않음)이고 사용 파일 변경 0. 판정: CanvasPalette·EmptySlot·SectionAdd·SectionMove·SectionRemove·SectionVariant 묶음 단독 **x10 = 10/10**(27 tests, load 18~25) `logs/epre-x10.txt`.
- **E0 재측정(118.44 기준)**: E0 시제품(`logs/e0-proto.patch` — S-B4대로 `runGate` 진입 직후 자동 · 게이트 8줄 펼침 · 버튼·이유)을 merge 뒤 트리에 다시 얹어 빌드 → `/studio` 진입 **118.44 → 124.71(+6.27)** · 첫 화면 91.72 (`logs/e0r-proto.txt`). 시제품은 하한이라(2절 분해) 실구현은 더 크다 → **124.70 초과 → ADR-004 개정 3 결정 2 적용**.
- 바꾼 것: `scripts/bundleBudget.mjs` 시나리오별 `eagerBudgetKb`(기본 `ROUTE_EAGER_BUDGET_KB` 125 그대로) + `check-bundle-size.mjs` `/studio/:projectId`만 `eagerBudgetKb: 127`(멈춤선 126.70). 첫 화면·다른 라우트·렌더 예산 변경 0. RED `logs/e0r-red.txt`(1 failed) → GREEN 8/8.
- 전후 실측: 바꾸기 전 = `/studio` 진입 118.44 / 예산 125(`logs/epre-gate.txt`) · 바꾼 뒤(시제품 얹은 트리) = **124.71 / 예산 127** · 그 밖 /compare 98.84/121.72 · /projects 94.01/100.19 · /profile 99.61/118.67 · 렌더 79.89 (`logs/e0r-gate.txt`). 남은 여유 = 126.70 − 실측 — E1~E5 진입분은 이 안에서, 조작 뒤 코드는 `STUDIO_AFTER_ACTION`.

## 3. 게이트 표시 (E1 · E2)
E0 정지로 미진행 — 영환님 결정(2절 선택지) 대기.

## 4. requestExport 판정 순서 · 생성기 주입 모양 (E3)
E0 정지로 미진행 — 영환님 결정(2절 선택지) 대기. E3도 독립 진행 불가: `memoryProjectRepository.ts`가 PROJECT_AUTO(진입 직후, 여유 0)에 있어 `requestExport: missing` → 판정 위임만 해도 진입이 늘고, `runGate`를 부르는 데이터 파일은 `engineImportGuard` 허용 목록 추가가 필요하다.

## 5. 버튼 · 이유 · 결과 문구 (E4 · E5, 바꾼 문구)
E0 정지로 미진행 — 영환님 결정(2절 선택지) 대기.

## 6. E-AC · K-AC 판정 (번호별)
| AC | 판정 |
|---|---|
| E-AC-25~30 · 43 · 44 · 48 · 50 · K-AC-18 | 미판정 — E0 정지 |

## 7. 번들 표 (체크포인트별)
| 체크포인트 | 공통 | `/studio` 첫 / 진입 | `/compare` 첫 / 진입 | `/profile` 첫 / 진입 | 렌더 JS / CSS |
|---|---|---|---|---|---|
| E0 기준선 = 원복 후 | 89.34 | 91.72 / 124.70 | 98.75 / 121.40 | 99.60 / 123.64 | 79.89 / 6.32 |
| E0 시제품(참고, 커밋 안 함) | — | 91.71 / 130.97 | — | — | — |
| E0 옵션 A 시제품(참고, 커밋 안 함) | 89.34 | 91.72 / 125.57 | — | — | — |

## 8. SPEC 차이
- 코드 변경 0이라 SPEC과 다르게 구현한 곳은 없다.
- **브리프 전제 차이**: 브리프 E0-2 "계산(`runGate`)은 이미 진입 직후 엔진 청크(S-B4) 쪽에 둔다" — 실측(dist 문자열·closure)으로 `runGate`·대비 판정은 지금 어느 `/studio` 청크에도 없다(`unmeasured` 문자열 0, `logs/e0-build.txt` 빌드). 진입에 있는 엔진 게이트 코드는 `gateText`·`issue`뿐.

## 9. 남은 위험 (3b에 넘길 것)
1. `/studio` 진입 여유 0이 M2A-3 전체(3a·3b·3c)의 선결 조건 — 2절 선택지 결정 없이는 게이트 표시·버튼 사전 차단·`requestExport` 배선 모두 진입을 늘린다.
2. 옵션 A를 고르면 SPEC 5.12·5.13·E-S22·E-S23·E-AC-25·29 개정(Designer) 필요.
3. 옵션 B는 2a-04 저장소 배선 변경 — 다른 화면 ±0.03 규칙과 함께 판정해야 한다.
4. 4337 서버: 이 실행에서 띄우지 않음(`lsof -i :4337` 결과 없음).
