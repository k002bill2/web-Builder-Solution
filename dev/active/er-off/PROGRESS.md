# ER-OFF PROGRESS — `/studio` 진입 청크 상쇄 (base 9befa6a)

목표: `/studio/:projectId` 진입 직후 127.05 → ≤126.45KB(−0.60), 동작 변화 0.

## 체크리스트
- [x] BRIEF P0 커밋
- [x] base build 실측 127.05 (`logs/build-base.txt`)
- [x] 진입 청크 구성 분석 (StudioLayout 16.84 · issue 5.95 · runGate 2.50 …)
- [x] 후보별 시제품 build 실측 → 아래 표 (코드 변경 전, 모두 되돌림 — `git checkout -- <파일>`)
- [x] 실현 가능성 판정 — **불가**: 동작 변화 0(A군) 최대 −0.16 실측 · −0.32 추정 상한 < −0.60
- [x] (불가) 억지 변경 없이 멈춤 — 이동 구현·TDD·RED 예측 커밋 N/A(옮기는 요소 0)
- [ ] 시제품 되돌림 확인 `git diff --stat 9befa6a -- app` 비어 있음
- [ ] 전체 vitest 1회 exit 0
- [ ] Ego Lite
- [ ] Codex review --scope branch --base 9befa6a
- [ ] REPORT

## 진입 청크 구성 (base, gzip KB)
| 청크 | gz | 비고 |
|---|---|---|
| index(공통) | 86.06 | 다른 화면 공유 — 레버 아님 |
| StudioLayout | 16.84 | 편집 틀 |
| issue(공유) | 5.95 | 엔진 섹션·규칙·gateText |
| react | 3.28 | |
| runGate | 2.50 | 게이트 |
| 그 밖 | 12.42 | deferredStudio·fixtures·memoryProject 등 |
| 합 | 127.05 | |

- 모듈 단위 잘못 배치(진입이 정적으로 안 닿는 모듈) = 0 (rolldown runtime 제외).
- StudioLayout 청크가 조작 뒤 청크에 내보내는 심볼 7개 모두 진입에서도 쓴다 → export 단위 잘못 배치 0.
- issue 청크 심볼 중 조작 뒤·다른 화면 청크만 쓰는 것: EngineOpError·indexOf/sectionAt·id 정규식 등(엔진 파일).

## 후보 표 (시제품 = vite build API 단독 빌드 → `/tmp/eroff/p-<id>`, 검사기와 같은 auto 목록 정적 closure · gzip Node zlib · KB=1000B)
스크립트·결과: `logs/proto.mjs` · `logs/analyze.mjs` · `logs/reach.mjs` · `logs/proto-results.txt`. gzip 비가산 → 조합은 따로 빌드.

### A군 — 동작 변화 0 가능 (이미 있는 조작 뒤 청크 await 뒤에서만 실행 · m2c-3s P3형)
| id | 내용 | 진입 | Δ | 비고 |
|---|---|---|---|---|
| A1 | StudioLayout move·remove·swap·add의 `await loadDocEngine()` 뒤 꼬리 → docEngine 함수 호출 1줄로(호출 스텁 유지) | 126.93 | −0.12 | StudioLayout 16.84→16.69 |
| A2 | useSectionOps.run `await applyDocOp` 뒤(docRef·stack.push·setLast·edit) → 호출 1줄 | 127.05 | −0.00 | StudioLayout −0.03, 반올림 |
| A1+A2 | 조합 | **126.89** | **−0.16** | 실측 최대 |
| A3 | useExportFlow.request `loadExportFlow` 뒤(setResult·setRunning 2줄) | — | ≈0 | 이미 본문은 exportFlow 청크. 측정 생략(2줄) |
| A4 | issue 청크 중 조작 뒤·다른 화면 청크만 쓰는 엔진 심볼(EngineOpError·id 정규식·sectionAt·isSectionType·sectionDefs 목록 등) → 엔진 파일 분리 | 추정 ≤126.89 | ≤−0.16 [추정] | 출력 바이트 제거 추정(5.952→5.790). 실제는 `indexOf`(B)를 진입 canMove가 써서 더 작다. **엔진 파일 수정 = "엔진 계약 변경 0" 경계** → 미시제품 |
| A 상한 | A1+A2+A4 | ≈126.73 | ≈−0.32 [추정] | 목표 −0.60의 절반 |

### B군 — 상한 참고만(구현 안 함: 타이밍·보이는 동작 변화)
| id | 내용 | 진입 | Δ | 왜 B군인가 |
|---|---|---|---|---|
| B1 | 자동 저장 Scheduler 클래스 제거 상한 | 126.28 | −0.77 | 마운트 때 생성 · 첫 편집 `dirty` 표시가 동기 → 늦게 받으면 저장 상태 한 틱 늦음 |
| B2 | useExportFlow.start 본문 제거 상한 | 127.05 | −0.00 | 감량 없음 |
| B3 | ConflictCallout + useDocSave.resolve 본문 제거 상한 | 126.87 | −0.18 | m2c-3s P2a 탈락(STALE_DOC 가드 RED) 같은 방식 |
| B4 | PageInfoFields 제거 상한 | 126.79 | −0.26 | m2c-3s P1a 탈락(클릭 직후 한 틱 늦음·포커스) 같은 방식 |
| B3+B4 | | 126.59 | −0.46 | |
| B1~B4 | | 125.79 | −1.26 | |
| A+B 전부 | A1+A2+B1~B4 | 125.61 | −1.44 | |

### 판정
- −0.60(≤126.45)은 **B1(자동 저장 스케줄러) 없이는 어떤 조합도 닿지 않는다.** B1은 동작(저장 상태 표시 타이밍) 변화가 생겨 브리프 범위 밖.
- A군 부분 감량(−0.16)도 브리프 2단계(문턱 기준)대로 구현하지 않음 → 앱 코드 diff 0.
