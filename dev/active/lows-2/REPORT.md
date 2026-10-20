# LOWS-2 REPORT

base `02b0a5c1` · 브랜치 `k002bill2/lows-2` · push 0

## BACKLOG 원문 정리

| ID | 출처 | 원문 요지 | 이번 범위 |
|----|------|-----------|-----------|
| B-M4B-06 | M4-b-2 QA 2차 R4 P3 | 내보내기 "다시 시도" 성공 뒤 포커스가 BODY(공용 경로 — 정적 형식 포함) | 결과 '내려받기' 링크로 포커스 · 문구 변경 0 |
| B-SEC-07 | IMPORT-LOWS QA 4항·3항 | 결합 테스트 부재(Blob.type 손상 1 + 정상 1 → 결과 줄 lostImageText 1회) · 실 IndexedDB 확인 미실시 · 복원 진입 131.76(여유 0.02) | 결합 테스트 + 변이 FAIL. 실 IndexedDB·브라우저 확인은 브리프상 범위 밖(브라우저 불필요) |

## 1. B-M4B-06

- RED: `ExportFlow.test.tsx` "B-M4B-06" describe — static-html·static-zip·react-zip 각각 실패(JOB_TIMEOUT) → 다시 시도(포커스) → 완료 시 `document.activeElement` = `<body>` 로 FAIL 확인(최초 2건, react-zip 행은 마감 전 추가 — 수정 전 `ExportAfter.tsx`(base `02b0a5c1`)로 되돌려 3건 FAIL → 복원 후 4/4 PASS 재확인).
- GREEN: `ExportAfter.tsx` `DownloadLink` 마운트 effect — 포커스가 BODY/없음일 때만 링크로 이동. 처음 성공은 누른 형식 버튼 유지(대조 테스트 1건).
- 위치: 조작 뒤 청크(ExportAfter)만 변경 — 편집기 진입 청크 0.
- 범위 메모: `done`인데 download가 없는 경우는 링크가 없어 포커스 이동 대상 없음(기존 동작 유지).
- 예산(build 후 `check-bundle-size`): `/studio` 해시 정규화 128.76 (멈춤 > 128.79) · 복원 진입 131.76 (멈춤 > 131.78) — 증분 0.

## 2. B-SEC-07

- 새 테스트 `app/src/data/persistence/imageRestoreExport.test.ts` (1건): 저장 레코드 정상 1 + Blob.type `text/html` 손상 1(바이트·서명·bytes 합은 정상) → `restoreImages`(실제 `readImageRecord`) → `imageReader` → `exportImages` → `imageFileNames`(zip 이름 규칙) → `exportNotes`(static-zip·static-html·react-zip).
  - 단언: 복원 맵 = 정상 id만 · lost 1 · 보낸 이미지 = 정상 id(`image/png`) · zip 파일 `assets/images/img-01.png` · 형식 3종 모두 결과 줄 `lostImageText(1)` 정확히 1회.
- 변이(적용 → 실행 → `git checkout` 되돌림):
  | 변이 | 결과 |
  |------|------|
  | M1 `imageRecord.ts` Blob.type 검사 제거(손상 레코드가 복원돼 zip 확장자에서 내보내기 전체 실패로 가는 경로) | FAIL — 복원 맵 `[GOOD]` 단언 |
  | M2 `exportImages.ts` 잃은 이미지 `lost++` → `throw IMAGE_FAILED`(손상 레코드 = 내보내기 전체 실패) | FAIL — `Error: 이미지를 그리지 못했습니다` |
- QA 변이표 M3(`readProject` 손상 레코드 → `unreadable`)는 **프로젝트 파일 내보내기** 경로 — 기존 `readProject.test.ts` 3건이 잡는다(QA-REPORT 26행). 이번 결합 테스트는 사이트 내보내기(복원→zip/HTML) 경로로 M1·M2가 그 등가 변이.
- 한계: `exportNotes`에 넣는 summary는 테스트가 `exportImages` 결과로 조립 — 생성기 `onBuilt` summary 배선(`staticHtml.ts:163·179`)은 이 테스트 밖(기존 `exportFlowReactZip.test.ts:81` 등이 결과 줄 끝 lostImageText를 별도 단언).
- 앱 코드 변경 0 → 예산 영향 0. 미실시: 실 IndexedDB 기존 프로필 열기·편집·내보내기 확인(브리프: 브라우저 불필요) — BACKLOG B-SEC-07 잔여로 남김.

## 검증 (fresh · 로그 `dev/active/lows-2/logs/`)

| 명령 (app/) | 결과 |
|------|------|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npx vitest run --maxWorkers=4` | exit 0 · 380 files · 3421 passed (react-zip 행 추가 뒤 재실행) |
| `npm run build` (check-bundle-size 포함 · 마지막 앱 코드 변경 뒤 fresh, 이후 테스트 파일만 변경) | exit 0 · `/studio` 128.76 (멈춤 > 128.79) · 복원 진입 131.76 (멈춤 > 131.78) — 기준 대비 증분 0 |

- 새 의존성 0 · 단언 약화·skip 0 · 문구 변경 0 · push/pull/fetch 0 · 브라우저·Codex 미사용(브리프 지시).
- 감량 단계 미발생(진입 증분 0).
- 절차 미준수 1: REPORT 초안을 8턴 안이 아니라 B-M4B-06 커밋(`86dff609`, 약 18턴째)과 함께 처음 커밋했다.
- 서브에이전트: 사용 안 함(두 항목 모두 수 회 도구 호출 규모, 같은 게이트 공유).

## 커밋

- `2b415bd2` docs(lows-2): BRIEF·PROGRESS
- `86dff609` fix(export): B-M4B-06
- `345ced99` test(persistence): B-SEC-07
- `272c7353` docs(lows-2): REPORT·PROGRESS·로그
- (마감) test(export): B-M4B-06 react-zip 행 + REPORT 보강
