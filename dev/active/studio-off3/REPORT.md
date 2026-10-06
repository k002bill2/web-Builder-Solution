# STUDIO-OFF3 REPORT — `/studio` 진입 청크 구조 점검 + 동작 변화 0 감량

- 브랜치 `k002bill2/studio-off3` · base `713947d` · 2026-10-06~07 · 서브에이전트 0 · push/merge/삭제 0
- **첫 줄: `/studio/:projectId` 진입 직후 128.67 → 128.19 (−0.48) · 판정선 128.70 대비 여유 0.03 → 0.51 · 다른 라우트 −0.00~−0.03 · 렌더 JS 84.19·CSS 8.85 그대로 · `m2cBaseline.json` 수정 0.**

## 1. 커밋
| 커밋 | 내용 |
|---|---|
| `d91a898` | BRIEF·PROGRESS P0 |
| `d4e98da` | AUDIT.md — 청크·모듈 gzip 표 · (A)/(B)/(C) 분류(코드 변경 전) |
| `600ef1a` | A1 — `src/build/studioEngineChunk.ts`(+가드 테스트 3건) · `vite.config.ts` 앱 빌드에 codeSplitting 그룹 1개 |

## 2. 구조 점검 요약 (AUDIT.md)
- 진입 128.67 = 23청크. /studio 전용 28.69, 나머지 99.98은 다른 라우트 진입과 공유.
- 모듈 단위 잘못 배치 0(현재 코드 기준 도달성 재측정). 새로 찾은 레버 = **청크 경계 gzip 손실**: 전용 5청크를 이으면 −1.59(이론 상한). 그중 다른 경로 바이트를 늘리지 않는 것은 `_issue`+`_runGate` 병합뿐(두 청크를 받는 경로는 /studio 진입과 /profile 조작 뒤 startDocWrite이고 둘 다 이미 함께 받음).
- (B) 5건(자동 저장 스케줄러 지연 ≈−0.8~−1.2 등)·(C)(공통 react/router 89.37, 공유 자동 청크 ≈10.6, 기능 분량) — 적용 0, AUDIT 4절.

## 3. (A) 적용 표 (`npm run build` = check-bundle-size, `logs/build-base.txt` → `logs/build-a1.txt`)
| 단계 | 변경 | /studio 진입 | /studio 첫 화면 | 다른 라우트(진입 직후) |
|---|---|---|---|---|
| base | — | 128.67 | 91.79 | catalog 102.45 · references 99.69 · compare 121.97 · profile 119.19 · profile(3안) 121.67 · projects 100.36 |
| **A1** | issue 14 + runGate 6 모듈 → 청크 1개(정확 경로 목록, 의존 재귀 끔) | **128.19 (−0.48)** | 91.83 (+0.04) | 102.44 · 99.69 · 121.96 · 119.17 · 121.65 · 100.33 (모두 −0.00~−0.03) |
| A2(탈락) | projectRepository+useProjectRepository 병합 | 128.18 (−0.01, 잡음) | — | projects −0.06 · /profile 조작 뒤 +0.18 → 적용 안 함 |
| R1(탈락) | startDocWrite → gateCheck 경유 import | — | — | gateCheck manifest 키 소실(검사기 실패) |
| g1(탈락) | A1을 의존 재귀 포함(기본값)으로 | 126.84 | — | 모든 라우트 +9.6 |

- 다른 라우트 첫 화면: catalog 100.06→100.05 · profile 99.73→99.72 · projects 94.05→94.04, 나머지 그대로.
- 조작 뒤(판정 밖): /profile CompareDialog +21.03→+20.51(−0.52) · memoryProjectRepository +2.04→+2.02 · /studio exportFlow +3.35→+3.40(+0.05, 미리 받기 목록 파일명 3개). 그 밖 조작 뒤 행 그대로.
- /studio 첫 화면 +0.04 이유: StudioPage 청크의 StudioLayout 미리 받기 목록에 contrast·effectiveProfile·profileContrast 파일명 3개가 붙음(issue 청크가 runGate 의존을 정적 import). 이 3청크는 원래 진입 직후 자동 닫힘(gateCheck)에 있어 받는 바이트 합은 같고, 받는 시점만 StudioLayout과 같이로 앞당겨짐 — 화면 동작 변화 0.
- 테스트 단언 변경 0 · 기존 테스트 파일 수정 0 · mock 경로 변경 0. 새 가드 테스트 `src/build/studioEngineChunk.test.ts` 3건(RED: 모듈 없음 → GREEN 3/3).
- 수정 0: 엔진(src/engine)·PageDoc 계약·docs/**·lock·CLAUDE.md·m2cBaseline.json·scripts/**(check-bundle-size·bundleBudget). 새 의존성 0. `vite.config.ts`는 앱 모드 build 블록에만 1줄(render·thumbs 모드 무변경 — 렌더 84.19·썸네일 CSS sha 가드 통과).

## 4. 검증 (fresh, `600ef1a`)
- `npm run typecheck` exit 0 · `npm run lint` exit 0 (`logs/final-typecheck.txt`·`final-lint.txt`)
- `npm run build` exit 0 — 번들 표 전 행 `logs/build-a1.txt`, 썸네일 21장 가드 통과
- `npx vitest run` 1회 exit 0 — **250 files / 2193 tests 통과** (`logs/final-vitest.txt`)

## 5. Ego Lite (preview 4337, space 13)
- `npm run build` 산출물 → `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`. 시작 전 `listTaskSpaces()`=[]. 창 상태 normal(최소화 아님) 확인.
- 경로(첫 goto 1회 뒤 앱 안 클릭만, 새로고침 0): 카탈로그 → 부티크 법률사무소 상세 → 비교 추가 → 보드 열기 → "이 레퍼런스로 프로필 만들기" → "프로필 확정 (v1)" → "3안 만들기 (v1)" → A안 선택 → "A안으로 편집 시작" → `/studio/project-1`.
- 건드린 것(엔진 공유 청크를 쓰는 경로) 확인:
  | 기능 | 결과 |
  |---|---|
  | 편집 시작(startDocWrite = runGate+issue) | 편집기 열림 · 알림 "바뀐 점 3개…" |
  | 품질 게이트(gateCheck → 합친 청크) | 9줄 표시 · SEO 메타 차단 2 · 내보내기 이유 "차단 2건(SEO 메타: 제목 없음)" |
  | 섹션 이동(docEngine) | Services 아래로 → 4번째 · 알림 "Services를 4번째로 옮겼습니다" |
  | 섹션 추가(AddSectionDialog) | 대화상자 → FAQ 추가 → 5번째 · 알림 "FAQ를 5번째에 추가했습니다" · 대화상자 닫힘 |
- 캡처 3장(`captureBeyondViewport:false` + 뷰포트 clip): `shots/1-editor-gate.png` · `2-add-section-dialog.png` · `3-after-add.png`.
- 정리: `finish({keep:[]})` → `listTaskSpaces()`=[] 재확인 · preview 종료 → 4337 리슨 0 · main 5480·영환님 창 무접촉.

## 6. Codex
- (아래 갱신)

## 7. 영환님·Jarvis 결정 자료
1. 여유 0.51(판정선 128.70 기준)은 기준선 미변경 — 다음 레인(B-M3P-06·B-ER-08·B-ER-09) 배분은 결정 몫.
2. 더 필요하면 (B) 중 B1(자동 저장 스케줄러 첫 편집 때 받기, ≈−0.8~−1.2 추정, 저장 상태 표시 지연)이 가장 큼 — 체감 변화·검사기 목록 갱신 필요.
3. 심볼 단위 엔진 분할은 src/engine 수정이라 이 브리프 금지 범위 — 별도 승인 시에만.

## 8. meta
- 근거 수준: 합계 L1(빌드 실측), 모듈 기여 L2(sourcemap 문자 비율 추정), (B) 예상치 L2/L3. 불확실성 Low(A1은 공식 검사기 실측).
