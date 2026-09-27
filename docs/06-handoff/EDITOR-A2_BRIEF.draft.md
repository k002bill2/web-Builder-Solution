# EDITOR-A2 — 편집기 틀 · 저장 (2a-05a2) Developer 브리프 **초안**

> 초안(Designer, 2026-09-27, 레인 `editor-a2-spec`). **발행 전 확인**: 3절 선행 3건이 끝났는지, 9절 "a2 착수 전 결정 필요" 2건(Q-18·Q-24) — **r4.1에서 둘 다 A로 결정됨(9.1)**. 수치는 L3 추정이며 착수 때 재실측한다.

## 1. 책임/목표
- 책임 Developer / 실행 Orca + Claude Code. 보고 대상 Jarvis. 기준 = **a1-β 병합 뒤 main**(착수 때 SHA 기입).
- 설계 기준: `docs/design/2a-05/SPEC.md` **r4** — 3.1·3.2(E-S05~E-S10·E-S19·E-S21 표시·E-S31·E-S33) · 4절 배치 · 5.1·5.6·5.7·5.10 · 6절 · 8.1·8.2·**8.2.1**·8.3·8.3.1 · 10절 S-B4 · 11.2 · 13.1 a2 행. 변형 대응표 `docs/design/2a-05/VARIANT-MAP.md`. SPEC 재설계 금지 — 어긋나면 멈추고 REPORT에 설계 질문으로.
- 목업 차이는 SPEC 11.3 EM 번호를 PROGRESS에 한 줄씩 인용(EM-01·02·05·06·15·16·18·20·21·24).

## 2. 범위
| 묶음 | 내용 | 수용 기준 |
|---|---|---|
| 셸·배치 | 집중 모드 툴바(h1·돌아가기·저장 상태·미리보기 폭) · 3단/2단/탭 배치 · 제목 구조 · 섹션 선택 | E-AC-03·04·05·13·14 |
| 캔버스 | 와이어프레임(2a-04c `Wireframe` 재사용 판단) + 슬롯 글자 · "구조 미리보기" 캡션 · 미리보기 폭 · 선택 라벨 | E-AC-15·16 |
| 필드·저장 | 필드 편집(글자 수 권장·상한) · "페이지 정보"(SEO 메타) · 자동 저장(a1-α `useAutosaveScheduler` 연결) · 실패·오프라인 · `STALE_DOC` 충돌 · 떠나기 경고 | E-AC-06·07·08·09·10·12 |
| 데이터 | `getDoc`·`saveDoc`(판정 순서·멱등) · **`startDoc` 구현 + 어댑터·변형 매핑 표**(8.2.1) · 편집 시작 → `/studio/:projectId`(12.3) | E-AC-11 · **E-AC-40·41·42** · 8.2.1 검증 |

- **범위 수 맞춤**: 브리프 요청 "E-AC-03~16"(14개)에 SPEC 11.2 단계 열이 a2인 **E-AC-40~42**를 더한다 — SPEC "a2 17개"와 같다.
- 제외(a3·a4): 섹션 추가·삭제·순서·변형 교체·테마·이미지 슬롯(E-AC-17~24·45~47) · 게이트·내보내기·스냅샷·실행 취소(E-AC-25~32·43·44). a2의 게이트 영역은 **자리만**(h2 "품질 게이트" + "검사 전" 캡션 — E-AC-04 제목 구조용), 계산 없음.

## 3. 선행 (모두 충족 전 착수 금지)
1. **a1-β 병합** — `k002bill2/editor-a1-beta`(`8231e9b`)는 `/profile` 진입 직후 여유 0.25~0.28로 **중지** 상태(`git show k002bill2/editor-a1-beta:dev/active/editor-a1-beta/REPORT.md` 1·3절). `StudioPage.tsx`(E-S01~S04 셸) · `memoryProjectRepository.ts` · 라우트가 여기서 온다. **`engine/engineImportGuard.test.ts` 개정은 a1-β에 없다**(L1: a1-β diff 38파일에 없음 · a1-β `memoryProjectRepository.ts` 머리 주석 "engine import 가드에 걸려 startDoc 미구현") → a2 D 레인 **첫 커밋**(4절). 실패 1건 남음: `ProfileCandidates.test` P-AC-29(편집 시작 → `/studio`) — a2 데이터 레인이 `/studio/:projectId`로 고칠 대상.
2. **profile-headroom 병합** — 목표 `/profile` 진입 직후 ≤ 124.40(`k002bill2/profile-headroom` 브리프). 편집 시작 연결(프로필 청크)이 이 여유를 쓴다.
3. ~~결정 2건~~ **충족(r4.1)** — Q-18 A · Q-24 A(9.1).
- 이미 준비됨(main): L4 엔진(`engine/**` — `createDocFromCandidate`·`hashDoc`·`validatePageDoc`·섹션 정의·슬롯 스키마) · 2a-04c 구조안·와이어프레임(`features/profile/CandidateCard.tsx:48` `Wireframe`) · a1-α 부품(`features/studio/{useAutosaveScheduler,saveStatusText}.ts`, `components/studio/StudioEmptyStates.tsx`, `data/projectRepository.ts` 인터페이스 — `startDoc` 선언 :105).

## 4. 레인 분할 제안 (3개 · 파일이 겹치지 않게)

| 레인 | 소유 파일(새 파일 위주, `app/src/`) | 수용 기준 | 의존 · 순서 | 턴 예상(L3) |
|---|---|---|---|---|
| **A2-D 데이터** | `data/memoryProjectRepository.ts`(getDoc·saveDoc·startDoc — a1-β 파일 이어받음) · `data/projectRepository.ts`(`UNKNOWN_VARIANT` 코드 · startDoc 결과에 바뀐 쌍 목록) · **새** `data/engineVariantMap.ts`(표 + 매핑 함수 — 표 리터럴은 이 파일에만) · **새** `data/startDocWrite.ts`(조작 뒤 본문 — 어댑터 · `createDocFromCandidate` 호출 · 엔진 예외 → 쓰기 0) · `engine/engineImportGuard.test.ts` 허용 목록(이 레인만) · `features/profile/CandidatesSection.tsx` 편집 시작 연결(마지막 커밋) | E-AC-11·40·41·42 · 8.2.1 검증 · P-AC-29 복구 | a1-β·profile-headroom 병합 뒤. **첫 커밋 = 가드 개정**(허용 목록: `pages/StudioPage.tsx` · `components/studio/**` · `features/studio/**` · `data/startDocWrite.ts` — 라우트 lazy 청크·조작 뒤 청크만) → 이 커밋을 **먼저 main에 병합**해야 S·F가 engine을 런타임 import할 수 있다. 나머지는 S·F와 병렬 | 35~45 |
| **A2-S 셸·캔버스** | `pages/StudioPage.tsx`(a1-β 셸 이어받음 — 이 레인 소유) · **새** `components/studio/{StudioToolbar,StudioLayout,SectionList,StructureCanvas,PreviewWidth,StudioTabs}.tsx` · **새** `features/studio/{useStudioDoc,selection,layoutMode}.ts` · `components/layout/AppLayout.tsx`는 a1-β 분기 그대로(수정 금지) | E-AC-03·04·05·13·14·15·16 · E-AC-33(알림 영역 1개) | a1-β 병합 뒤. 문서는 **테스트 픽스처 주입**(`engine/testing/sampleDoc.ts` — 테스트 파일만 engine import). A 다음 병합 | 45~55 |
| **A2-F 필드·저장** | **새** `components/studio/{FieldEditor,PageInfoFields,SaveStatus,ConflictCallout}.tsx` · **새** `features/studio/{useDocSave,fieldCounter,leaveGuard}.ts` · a1-α `useAutosaveScheduler` 사용(수정은 필요 시 이 레인만) | E-AC-06·07·08·09·10·12 | a1-β 병합 뒤, 목 저장소로 A와 병렬. **`StudioPage.tsx`는 건드리지 않고** 부품·훅만 → S 병합 뒤 마지막 커밋 1개로 연결(또는 S 레인이 연결) | 40~50 |

- **engine 런타임 import 순서**: 가드 개정(D 첫 커밋) 병합 전에는 S·F가 engine을 **테스트 파일에서만** import한다(`hashDoc`·섹션 정의·슬롯 스키마 연결은 가드 병합 뒤 커밋). 가드 없이 넣으면 각자 worktree에서 `engineImportGuard`가 실패한다.
- **Q-18 A 엔진 변경(r4.2, Codex r1 high)**: 컴포저 `motion`을 문서에 옮기려면 엔진 계약 변경이 필요하다(`CandidatePlan.sections[].motion?` + `createDocFromCandidate.ts:46`을 `minMotion(entry.motion ?? "L1", 상한)`으로 — SPEC 8.2.1 끝). **권장**: D 레인에 범위 예외 2파일(`engine/doc/createDocFromCandidate.ts` + `createDocFromCandidate.test.ts`)을 허용하고 RED(컴포저 L2 → 문서 L2) → GREEN, 기존 엔진 테스트 불변. 대안: D 착수 전 소형 L4 수정 레인. **Jarvis 확정(2026-09-27): 권장안 — D 레인 범위 예외 2파일 허용**(엔진 계약 변경은 `motion?` 선택 필드 추가뿐이고 기존 엔진 테스트 불변이 조건. 별도 L4 레인은 턴·병합 1회를 더 쓰므로 채택하지 않음). 어댑터는 `toEngineCandidate`를 쓰지 않는다(모션을 버리고 `/profile` 청크에 있음).
- 병렬 규칙: 세 레인 모두 worktree 격리 · `git commit -- <경로>`. 공유 파일은 **없게** 나눴다 — `StudioPage.tsx`는 S만, `projectRepository.ts`·가드는 D만. 겹치는 요구가 생기면 멈추고 보고.
- 병합 순서: **D → S → F**(병합마다 `npm run build` 재실측). D가 늦으면 S·F는 목 저장소로 끝내고 기다린다.
- 대안(레인 2개): D 단독 + (S+F) 한 레인 — 턴 80~100 예상이라 한 번에 끝나지 않을 위험(2a-04a 선례). 3개를 권장.

## 5. 파일 지도 요약 (쓰기 금지 포함)
- 읽기만: `engine/**`(L4 소유 — `import`만, 수정 금지. **예외(Jarvis 확정)**: 4절 Q-18 A 엔진 변경 2파일 — D 레인만) · `features/profile/CandidateCard.tsx`(`Wireframe` 재사용은 import만; 모양을 바꿔야 하면 `components/studio/`에 사본이 아니라 멈추고 보고) · `features/detail/previewView.ts`(`PREVIEW_VIEWS` 라벨 상수 — E-AC-15는 같은 상수 import) · `domain/generation.ts`(`toEngineCandidate` — **표를 여기 넣지 않는다**, SPEC 8.2.1) · `domain/composeCandidates.ts`.
- 수정 금지: `design/` · `docs/design/` · 번들 예산·분류(`check-bundle-size.mjs` 판정) · `components/ds/*`(새 부품은 `components/studio/`, S-B6) · 아이콘 파일(S-B7) · 보드·프로필 저장소(`data/memoryBoardConfirm.ts` 등 — a1-β·profile-headroom 소유).

## 6. 번들 예산 예상 (ADR-004 100 / 125, gzip KB, **L3**)
- 기준(L1): a1-β 최종 실측 **`/studio/:projectId` 90.73 / 104.28**(여유 **9.27 / 20.72**) — `k002bill2/editor-a1-beta:dev/active/editor-a1-beta/REPORT.md` 1절 표 21행(main에 없음 → `git show`로 읽기). 공통 89.34. **착수 때 main 재실측값으로 바꾼다.**
- 예상(S-B4): 첫 화면 `StudioPage` 청크 +5~8(툴바·배치·목록·캔버스·필드·저장 훅·알림) → **≈ 96~99** · 진입 직후 엔진(`hashDoc`·`validatePageDoc`·섹션 정의·슬롯 스키마) +8~14 → **≈ 112~119**. 멈춤선 = 여유 0.3(첫 화면 99.70 · 진입 직후 124.70) — 넘으면 멈추고 보고(예산 변경 없음).
- **다른 화면 순증가 0 원칙**: 편집기는 lazy 라우트라 `/catalog`·`/compare`·`/references/:id` 첫 화면·진입 직후 변화 0, 공통 0이어야 한다(S-B1 이후 새 공통 변경 없음). 예외 후보 1건만 허용·실측 보고: **`/profile` 편집 시작 연결**(D 레인 마지막 커밋) — `startDoc` 호출·`navigate` state(바뀐 쌍 목록)·결과 알림 슬롯이 `ProfilePage` 청크에 든다(L3 +0.03~0.08). **어댑터·표·`createDocFromCandidate`·(b) 문구는 조작 뒤 청크**("편집 시작" onClick에서 로드 — 2a-04c `memoryGenerate`와 같은 분류, 예산 밖·크기만 출력). profile-headroom 뒤 여유 ≥ 0.3 유지가 조건.
- 숨은 증가 점검(2a-04c 선례): 새 모듈이 `domain/generation.ts`·`profileDraft`를 **런타임** import해 공유 청크가 생기지 않는지 — 청크 목록 전후 비교.

## 7. 금지
- Q-18~24 중 결정 안 된 것을 코드로 정하기(9절) · `addSection` 5인자 SPEC 드리프트 손대기(a3 선행) · 앱 밖 문서 수정(REPORT·PROGRESS 제외) · 새 의존성 · 단언 약화·삭제·skip·retry · push·병합·삭제 · fable 무접촉 · 외부 URL·이미지(권리 경계).

## 8. 검증
- TDD RED → GREEN(RED 로그 보존). 레인별: `npm run typecheck` · `npm run lint` · 표적 test · `npm run build`(원본 로그 + exit). 전체 suite는 병합 레인에서 1회.
- 데이터: 8.3 `saveDoc` 판정 순서 · 8.3.1 `startDoc` 판정 순서·경쟁·멱등(`delay`·`fail` `phase: request|commit|response`) · 8.2.1: 픽스처 6개 × 3안 `startDoc` 성공 · 표 밖 쌍 → `UNKNOWN_VARIANT` 쓰기 0·재시도 버튼 0 · 바뀐 쌍 알림 이동 뒤 1회(처음·멱등 재생 각각 · `DOC_EXISTS`·다시 열기 0회) · 가드(표 bound 행 = `SECTION_LIBRARY` 키 · 목적지 ⊂ 엔진 레지스트리 · 표 리터럴 파일 1개) · `DocStart.updatedAt` = 주입 `now`.
- 화면: 5폭(1920·1280·1024·768·390) 가로 넘침 0 · Tab 순서 = 4.3 · 탭 키보드 — 브라우저는 **ego-browser만**(Playwright 금지), 앱 안 클릭으로만 이동(메모리 store — 새로고침하면 사라짐).
- 번들: 6절 표를 레인·병합마다 실측(S-B11 시나리오 전부 · 공통 전후 따로 · 조작 뒤 청크 크기).
- **Q-24 대비**: 빌드 CSS 크기·해시를 착수 전·후 비교(engine 소스 문자열이 Tailwind 유틸리티로 잡히는 재발 경로, L4b REPORT 9절 `.ordinal` 사례). Q-24 A(9.1): `@source not "./engine"`을 D 첫 커밋에 넣고, 그 뒤에도 CSS가 바뀌면 바뀐 규칙을 REPORT에 적고 멈춤.
- Codex 검증: 레인마다 `review --scope working-tree`(커밋 전) 또는 `branch --base <분기점>`, 최대 3라운드.

## 9. 설계 질문 — 영향 (결정하지 않음)

| Q | 내용(근거 `dev/active/l4-engine-b/REPORT.md` 12절) | a2 영향 | 표시 |
|---|---|---|---|
| Q-18 | 새 문서 섹션 모션 — `toEngineCandidate`(`domain/generation.ts:95-102`)가 컴포저 `motion`을 버리고 엔진이 `min(L1, 정의 상한)` | D 레인 어댑터가 `motion`을 넘길지 · 캔버스 모션 표시 | ~~a2 착수 전 결정 필요~~ **A로 결정(9.1)** |
| Q-24 | Tailwind가 `engine` 소스를 스캔해 CSS가 바뀌는 경로(가드 없음) | a2가 engine을 런타임으로 처음 부르는 단계 — 빌드 CSS 변동 위험 | ~~a2 착수 전 결정 필요~~ **A로 결정(9.1)** |
| Q-19 | `GateIssue.severity` · 목적 출처(`theme.purpose`) | 없음(게이트 자리만) | a3·a4 전 결정 |
| Q-20 · Q-22 · Q-23 | R-03 계산식 · 모르는 변형 게이트 판정 · R-07 모션 기준 | 없음 | a4 전 결정 |
| (목록 밖) `addSection` 5인자 | `engine/ops/sectionOps.ts:52-59` ↔ SPEC 8.2 4인자 | 없음 | a3 전 SPEC 반영 |

## 9.1 결정 (영환님 ★A, 2026-09-27 — SPEC 이력 r4.1)
- **Q-18 = A**: 어댑터가 컴포저 `motion`을 넘긴다 · 섹션 정의 상한으로 제한. D 레인 범위. 캔버스 모션 표시 없음.
- **Q-24 = A**: `app/src/index.css`에 `@source not "./engine"` + 빌드 CSS 크기·해시 전후 비교. D 레인 **첫 커밋**(가드 개정과 같은 커밋).
- **Q-21 후속**: 매핑·알림으로 진행. 엔진 services 변형 추가는 a3 전 별도 과제(이 브리프 범위 밖).
- **a1-β와의 경계 정정(Jarvis)**: a1-β RESUME-2가 "편집 시작" → `/studio/:projectId` **이동**(문서 없음 E-S03)과 P-AC-29 복구를 맡는다. D 레인은 그 버튼에 `startDoc` 호출만 더한다(3절 1·4절 D 행의 P-AC-29 문구는 이 줄이 우선).
- 3절 선행 3번(결정 2건)은 이로써 충족. 남은 선행: a1-β 병합(profile-headroom 포함).

## 10. REPORT
- `dev/active/editor-a2-<레인>/REPORT.md`: 로컬 SHA · 파일 · 테스트 수 변화 · AC별 판정 · RED/GREEN 로그 · 번들 전후 표(6절) · CSS 전후(Q-24) · EM 인용 · Codex 라운드 · 남은 위험. 턴 상한의 75%부터 REPORT 우선.
