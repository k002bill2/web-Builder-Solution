# M2B-5 REPORT — 3안 실렌더 나란히 비교 (Developer) · 결정 A 적용 후 S2~S6 완료

## 1. 요약
- **결론**: 결정 A(비교 청크에 `readRenderMessage`·모양 검사 로컬 사본 + 대조 가드)를 적용하고 SPEC 7.4 S2~S5를 구현·검증했다. 6.2 멈춤선은 단계마다 전 행이 안이었다(최종 `/studio` 진입 **127.34** ≤ 127.37).
- `/profile` 3안 영역 "3안 실제 화면으로 비교" → 전체 폭 모달 대화상자. ≥1280은 3열, 그 아래는 1안씩 + "보는 안" 라디오. 열마다 실제 렌더 문서 iframe(`sandbox="allow-scripts"`, 감싸개 `inert`)과 상태 줄 7종, 대화상자 role=status, Wireframe 폴백, "이 안 선택"(카드와 같은 상태)을 둔다.
- 테스트: 전체 vitest **216 files · 1871 passed · exit 0**(S6 실행은 8절). Codex review --scope branch --base 48487d5 결과는 9절.
- 브라우저(S5): B3·B4는 통과다. B1·B2·B5·B6은 부분이다 — 스크린샷 CDP 타임아웃, 프레임 내부 접근 불가, 실패 주입 경로 없음(7절).

## 2. meta
| 항목 | 값 |
|---|---|
| 책임 역할 | Developer |
| 실행 환경 | Orca managed worktree `m2b-5` + Claude Code (Opus 5.5, 서브에이전트 0) |
| 브랜치 · base | `k002bill2/m2b-5` · `48487d5`(SPEC 병합 지점) · 재개 HEAD `25417e9` |
| 정본 | `docs/design/m2b/SPEC-COMPARE3.md` · `MQ-M2B5.md` 1~4 ★A · `dev/active/m2b-5/DECISION-A.md` |
| 서버 | vite preview 4337(loopback) 1개 · 자기 PID 45774(+npm 45754) cwd `m2b-5/app` 확인 뒤 kill · 4337·4339 LISTEN 0 · 5480 = 다른 PID 82062 무접촉(logs/s5-servers-stop.txt) |
| 수정 금지 대상 | package*.json·lock·CLAUDE.md·docs/·`components/studio`·`render/`·`StudioPage`·`ProfilePage`·`app/` 라우트 — `git diff --exit-code 48487d5 -- …` exit 0 · 예산 값·판정 로직 변경 0 · DECISION-A·BRIEF·SPEC 무수정 |
| 저장소 쓰기 | 0 — 변환은 `writeStartDoc` 순수 호출(U5 · U2 "startDoc 0") |

## 3. 커밋표 (재개 이후)
| SHA | 내용 |
|---|---|
| 9bdf3d0 | A 대조 가드 테스트 수 예측(+2) |
| b06941e | 결정 A — 로컬 사본 + `compareFrameGuard.test`(소스·코퍼스·음성 검증) |
| 0e7db2f · df93119 | S2 예측(+7) · 대화상자·프레임 다리 |
| 4f7d54c · c5e5bb4 | S3 예측(+8) · 상태 7종·알림·폴백·캡션·`CANDIDATE_TEXT.preview` |
| ecd140f · ca2d409 | S4 예측(+4) · 선택 연동·alert·status |
| ac84143 | S5 브라우저 원시 증거 |
| (이후) | S6 Codex·REPORT·PROGRESS 마감 |
| 이전(S0·S1) | f1b07bb · 514da95 · 333e540 · 66d2f0c · 8339bd6 · 26c4e43 · aa89189 · 2018df1 · 25417e9 |

## 4. 6.2 예산 표 (gzip KB, `npm run build` 출력 — logs/s0·s1·s1b·a·s2·s3·s4-build.txt)
| 대상 | baseline | S1 커밋 | A | S2 | S3 | **최종(S4)** | 멈춤선 |
|---|---|---|---|---|---|---|---|
| `/profile` 첫 | 99.61 | 99.61 | 99.61 | 99.62 | 99.61 | **99.61** | > 99.64 |
| `/catalog` 첫 | 99.66 | 99.66 | 99.65 | 99.66 | 99.64 | **99.65** | > 99.69 |
| `/references/:id` 첫 | 97.00 | 97.01 | 97.00 | 97.01 | 96.99 | **97.00** | > 97.03 |
| `/compare` 첫 · 진입 | 98.84 · 121.72 | 98.84 · 121.70 | 98.83 · 121.69 | 98.84 · 121.72 | 98.82 · 121.69 | **98.83 · 121.70** | > 98.87 |
| `/profile` 진입(잡 없음) | 118.67 | 119.02 | 119.00 | 119.15 | 119.13 | **119.13 (+0.46)** | > 119.50 |
| `/profile (3안 있음)` 진입 | ≈121.11 (S0 실측 121.11) | 121.46 | 121.44 | 121.62 | 121.60 | **121.60 (+0.49)** | > 122.00 |
| `/studio/:projectId` 진입 | 127.34 | 127.50 ✗ | 127.33 | 127.36 | 127.34 | **127.34 (±0)** | > 127.37 |
| 렌더 JS · CSS | 83.03 · 8.75 | 같음 | 같음 | 같음 | 같음 | **83.03 · 8.75** | 변화 시 멈춤 |
| 비교 조작 뒤 청크(`CompareDialog.tsx` afterAction) | — | 17.78 | 17.67 | 19.47 | 21.01 | **21.18** | > 25 |

- 스크립트 판정은 단계마다 build exit 0.
- **`/profile` 진입 +0.46 · 3안 있음 +0.49는 SPEC 추정 +0.10~0.25를 넘는다(멈춤선 안).**
  - 원인: `profileEngine` 청크 8.93 → 9.28 → 9.41. 버튼·로더 이음새·문구 3개(S1), announce 중계·열기/닫기·포커스 복귀·props 연결(S2)이 들었다.
  - `CandidateResults` 2.44 → 2.46(카드 부품 re-export).
- **청크 해시 잡음(실측)**: 코드 변경이 없는 청크도 단계마다 ±1~11B 흔들린다. 예: S2→S3 StudioLayout 16602 → 16613B, index 85856 → 85852B (logs/s2·s3-chunkbytes.json).
  - 원인: 다른 청크·CSS 파일 해시가 바뀌면 import 경로 문자열이 바뀌어 gzip 크기가 흔들린다.
  - 그래서 `/studio` 127.33 ↔ 127.36 변동은 내 코드 때문이 아니다. `/studio` 청크에 든 내 코드는 0이다.
  - 다만 멈춤선 ±0.03이 이 잡음과 같은 크기라서 앞으로도 경계에서 판정이 흔들릴 수 있다.

### 4.1 배치 (청크 분할 회피)
| 경로 | 처리 | 근거 |
|---|---|---|
| `render/protocol` `readRenderMessage`·헬퍼 | 로컬 사본 `compareFrame.ts`(결정 A) | 값 import 시 `/studio` +0.16(S1) |
| `features/studio/docPurpose` `docKitTokens` | 복제 `compareKitTokens`(S1 배치 1회차) + 대조 it | 값 import 시 +0.22(S1 1차) |
| `RENDER_DOC_SRC`·`FRAME_REM`·`PREVIEW_WIDTH_OPTIONS`·`previewScale`·`scaleCaption`·`remPx` | 로컬 상수 `COMPARE_*` + `compareGuard.test` G3 | SPEC 2.3·5 |
| `Wireframe`·`heroText`·`scaleText`(CandidateCard) | 비교 청크가 import하지 않고, 이미 받은 `CandidateResults` 모듈을 `CandidatesSection`이 `parts`로 넘김(re-export 3개 추가) | CandidateCard는 CandidateResults 청크 소속 — import하면 공유 청크 분할 |
| `SegmentedControl`·`Tag`·`Button`·`Callout`·`generationText` | 그대로 import | 이미 ProfilePage/profileEngine이 받는 청크(manifest 확인) → 분할 0 |

## 5. 결정 A 대조 가드 (DECISION-A 필수 조건)
- ① **소스 텍스트 동일**: `compareFrameGuard.test.ts` it 1이 `isObject`·`isText`·`isNumber`·`isRect`·`readRenderMessage` 선언을 비교한다.
  - 정규화 규칙: 선언 첫 줄 + 들여쓴 이어지는 줄 + 닫는 `}`를 묶고, 공백을 1칸으로 줄인다.
- ② **코퍼스 동작 동일**: it 2가 메시지 22종(정상·모양 틀림·1025개 초과·빈 id 등)을 쓴다.
  - 각 메시지를 출처 3종(origin `null`·외부·빈값), 소스 4종(그 프레임·다른 프레임·창·null), 프레임 2종(있음·null)으로 조합한다.
  - 각 조합에서 사본 결과와 원본(캔버스 다리와 같은 판정) 결과가 같은지 본다.
- ③ **음성 검증 1회**(logs/a-negative.txt): `protocol.ts`의 `<= 1024`를 `1025`로 임시 변경 → 2 failed → 복원(`git diff` 0) → 2 passed.
- 출처/소스 조건 완화 0: 사본도 `event.source === frame.contentWindow` + 같은 모양 검사다.

## 6. CMP-AC별 근거
| # | 상태 | 근거 |
|---|---|---|
| U1 | ✅ | `pages/ProfileCompare.test.tsx` 보이는 조건 2 it |
| U2 | ✅ | 같은 파일 "누르기 전 요청 0 · aria-busy · startDoc 0" · "청크 실패 → alert + 다시 시도" |
| U3 | ✅ | `CompareDialog.test.tsx` "B열 프레임 메시지로 A열 불변 · click 무시" + `compareFrame.test` |
| U4 | ✅ | 같은 파일 "감싸개 inert · sandbox · title · src" |
| U5 | ✅ | `comparePreviews.test.ts` 5 it |
| U6 | ✅ | 상태 3 it(그림·킷 없이·그리지 못함 / 시간 초과·다시 그리기·늦은 rects / 변환 불가·만들지 못한 안) |
| U7 | ✅ | 알림 3 it(3열 총계·복구 / 부분 실패 총계 / 1안씩) |
| U8 | ✅ | `CompareDialog.test` 2 it + `ProfileCompare.test` 통합(실패 alert → 재시도 → status · 카드와 같은 상태) |
| U9 | ✅ | 폭 전환 = viewport만(render 1회) · <1280 1안씩 기본 = 선택한 안 |
| U10 | ✅ | `ProfileCompare.test` "Esc·닫기 → iframe 0 · 연 버튼 포커스" |
| U11 | ✅ | 캡션 2문장 · "(구조안)" · `CANDIDATE_TEXT.preview` 새 문장 |
| U12 | ✅ | 캡션 1에 기존 문서 안내 문장을 늘 함께 보인다(SPEC 2.4 — 조회 0이라 두 문장 병기) |
| G1 | ✅ | `engineImportGuard` 통과(비교 파일은 엔진 import 0 — 문서 타입도 `data/startDocWrite`에서 파생) |
| G2 | ✅ | `compareGuard.test` — src 전체 allow-same-origin 0 · `PreviewFrame.tsx` sandbox 리터럴 = `"allow-scripts"` 하나 |
| G3 | ✅ | `compareGuard.test` — 로컬 상수·축소 계산 = 원본 |
| G4 | ✅ | `noHardcodedStyle`·`brandIsolation` 통과(전체 suite) |
| G5 | ✅ | 4절 전 행 멈춤선 안 · 시나리오 `/profile (3안 있음)` 존재 |
| B1 | 부분 | 1280 3열 iframe 3개가 실제 렌더된다(높이 4282·4475·4313px — 안마다 다름 · 요약 글자 다름). **스크린샷은 `Page.captureScreenshot` CDP 타임아웃 4회로 없다**(환경) |
| B2 | 부분 | Tab에 IFRAME 0(inert 실측) · AX 트리 iframe 노출 0 · Esc → iframe 0 · 포커스 복귀 ✅. **순서는 SPEC 4절과 다르다**: 실측은 라디오 → [안 라디오] → 닫기 → 미리보기 영역 → X안 선택. 마지막 뒤에는 브라우저 UI(BODY)로 나갔다가 처음으로 돌아온다(네이티브 모달) |
| B3 | ✅(추정과 편차) | 데스크톱 프레임 1280 **29%**(SPEC 30) · 1024 **71%**(73) · 768 **51%**(53) · 390 **21%**(26) · 모바일 프레임 390 **71%**(87) · 1280 **97%**(99) · 4폭 가로 넘침 0. ±2%p 밖인 390 두 값은 SPEC 2.2가 [L3 추정]이다 — 대화상자 inset(`--spacing(4)`)·패딩(`--spacing(6)`) 뒤 안쪽 폭 278px로 실측 |
| B4 | ✅ | 열 때 포커스 = "데스크톱" · AX `status` 글자 "3안 중 3개를 그렸습니다"(ignored false) |
| B5 | 부분 | 불투명 출처 프레임 내부 평가 불가(`Page.getFrameTree` childFrames 0 · ego `task.cdp` 세션 옵션 없음). 근거 = 렌더 문서 F5(`data-motion-play` 미사용) 변경 0 |
| B6 | 부분 | 성공: 대화상자 "B안 선택" → DOM·AX status "B안을 선택했습니다" · 카드 B안 aria-pressed true. 실패 주입은 앱 안 경로가 없어 U8 통합 테스트로만 확인 |

## 7. SPEC과 다르게 한 것 (한 줄 사유)
- **키보드 순서**: 본문 스크롤 영역(`tabIndex=0`)이 열의 "이 안 선택"보다 먼저다.
  - SPEC 2.1은 선택 버튼을 유일한 스크롤 영역 안에 둔다. 그런데 초점을 받는 컨테이너는 양수 tabindex 없이는 자식보다 뒤로 갈 수 없다. 그래서 2.1과 4절이 충돌한다.
  - SPEC 정정은 Jarvis 몫이다.
- **파일 이름**: SPEC 6.1 가칭 `compareFrames.tsx` 대신 `CompareDialog.tsx`·`CompareColumn.tsx`·`PreviewFrame.tsx`·`compareFrame.ts`·`compareText.ts`로 나눴다.
  - 프레임 컴포넌트를 `CompareFrame.tsx`로 만들면 macOS 대소문자 무시 파일시스템에서 `./CompareFrame` import가 `compareFrame.ts`로 풀려 undefined가 된다(실측). 그래서 이름을 바꿨다.
- **선택 버튼 위치**: SPEC 2.1 지시대로 프레임 위(요약·바뀐 쌍 바로 아래)에 둔다.
- **3열 최대 폭**: `max-w-[calc(var(--layout-max-width)*1.5)]`(토큰 참조)로 둔다.

## 8. 테스트 delta
| 단계 | 예측(커밋) | 실제 | RED |
|---|---|---|---|
| baseline | — | 210 · 1840 | — |
| S1 | +9 (333e540) | +10 → 213 · 1850 | logs/s1-red.txt |
| A | +2 (9bdf3d0) | +2 → 214 · 1852 | logs/a-red.txt 2 failed. 예측과 다른 점: it 2(코퍼스)도 사본 export가 없어 RED였다 |
| S2 | +7 (0e7db2f) | +7 → 216 · 1859 | logs/s2-red.txt 7 failed |
| S3 | +8 (4f7d54c) | +8 → 216 · 1867 | logs/s3-red.txt 8 failed |
| S4 | +4 (ecd140f) | +4 → 216 · 1871 | logs/s4-red.txt 3 failed. 포커스 it는 S2 구현으로 이미 통과 |

- 기존 테스트 수정 0 · 단언 약화·skip 0. 7.3 "깨질 기존 테스트"는 실제로 깨진 것 0이다(`ProfileCandidates.test` 접두 정규식 통과 — 이관 없음).
- 내 새 테스트 조정 1건: 시간 초과 경계를 7999/1ms → 7800/200ms로 바꿨다. `shouldAdvanceTime`이 픽스처 준비 중 흐른 실시간을 타이머에 더해서다. 단언 내용은 같다.
- 전체 suite: S5 전 1회 216 · 1871 · exit 0(logs/pre-s5-vitest.txt). S6 1회는 logs/final-full-vitest.txt.
- 게이트: 단계마다 typecheck · lint exit 0(logs/a·s2·s3·s4-gate.txt) · build exit 0.

## 9. Codex 검증
- (S6 결과로 채움)

## 10. 한계 · 주의
- 브라우저 시각 증거(스크린샷)가 없다. ego-browser `Page.captureScreenshot`이 이 환경에서 4번 모두 타임아웃했다. 수치·AX 증거만 있다. QB1·QB2 육안 검수는 M2B-6 QA 몫이다.
- B5(프레임 안 모션)와 B6 실패 경로는 브라우저로 실측하지 못했다(6절).
- 3열 첫 측정 1회는 ResizeObserver가 반영되기 전이라 zoom 1로 찍혔다. 반영 대기 뒤 29%로 확인했다(logs/s5-browser.txt 첫 실행은 덮어씀 — 대기 조건은 `s5-compare.mjs` `zoomed()`).
  - 대화상자를 연 직후 아주 짧게 1280px 프레임이 축소 없이 보일 수 있다. 실사용 영향은 확인 필요다.
- 로더 이음새 `compareLoader.ts`는 `candidateResultsLoader.ts`와 같은 패턴을 복제했다(공유하면 기존 청크 바이트가 바뀐다).
- 책임/환경: 판정·측정은 이 worktree 실측이다. 서브에이전트 0. push·merge·삭제 0.
