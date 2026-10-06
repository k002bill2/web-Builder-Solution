# ER-3b PROGRESS — 스냅샷 화면 (ER-AC-S3·S4·S6~S10)

- base `45a5721` · 브랜치 `k002bill2/er-3b` · 서브에이전트 0 · 기준 빌드 `logs/build-base.txt`: /studio 진입 **127.69** · 첫 91.76 (멈춤 > 128.43, ER-3b 목표 ≤ +0.35)

## 체크리스트
- [x] P0 BRIEF·PROGRESS 명시 커밋
- [x] A. useDocSave 저장 먼저(`flushed`)·쓰기 채택(`adopt`) + imageStore 참조 집합(스냅샷)·한도 문장 — RED → GREEN
- [x] B. (재개로 해소 — 9a96a51) 이전 BLOCKED: /studio 진입 128.49 > 128.43 + 6절 밖 가드 1건 — 테스트 11/11 GREEN이나 미커밋(wip-stage-bc.patch) · 툴바 "스냅샷" · SnapshotDialog(조작 뒤) · SnapshotPreview(조작 뒤) · 복원(저장 훅 경로) · 편집 잠금 — RED → GREEN · 번들 1회
- [x] C. (재개로 해소 — 9a96a51) 이전 BLOCKED: B와 같은 이유(테스트는 B와 같은 파일에서 GREEN·미커밋) · 포커스(사라지는 버튼) · 좁은 폭 대화상자 1개 · 390 탭 전환 잠금 · 최근 10 + 더 보기 · 복원 실패 alert — RED → GREEN
- [x] (재개로 해소 — build 128.33 · vitest 0 실패) 이전: 검증 4종(typecheck·lint·test·build) + 번들 표
- [x] (재개 ⑤에서 실행) 이전: 창 0·서버 0 · Ego Lite build+preview 4337 경로 A 1280·390 캡처 · finish({keep:[]}) · listTaskSpaces()=[] · 서버 종료·리슨 0
- [x] (재개 ⑥ exit 0) 이전: 전체 vitest exit 0
- [x] Codex review --scope branch --base 45a5721 (≤2)
- [x] REPORT 커밋

## 재개 (DECISION-RESUME 결정 1~4 · 2026-10-06)
- [x] ① 번들 감량 3회 — 1회 Callout→자체 마크업 128.51(Callout 청크는 기준에도 있음, 추정 틀림) · 2회 대화상자·미리보기·복원·되돌리기를 조작 뒤 청크 `SnapshotLayer` 1개로 128.35 · 3회 `isPageDoc` props 전달(지연 청크 미리 받기 목록 파일 4개 제거)+lazy 로더 파일 분리 **128.30**(≤128.43 통과 · 목표 128.04 미달 · ER-3b 몫 0.61 → REPORT 첫 줄)
- [x] ② 가드 `memoryExport.test.ts:235` 대체(허용 목록 정적 + 내보내기 1회 = 스냅샷 1개 동작)
- [x] ③ Codex r1 P1 복원 중 돌아가기 잠금 · P2 edit 직후 flushed/adopt 동기 · P2 미리보기 kitTokens = 스냅샷 profileVersion
- [x] ④ S6 화면 · S10 실메모리 저장소 통합
- [x] ⑤ Ego Lite build+preview 4337 경로 A 1280·390 · finish({keep:[]}) · listTaskSpaces()=[] · 서버 종료·리슨 0
- [x] ⑥ 전체 vitest exit 0 · Codex r2 base 45a5721 · REPORT

## TDD 예측 (재개)
| 단계 | 새 테스트 수 예측 | RED 예측 |
|---|---|---|
| D 가드 | 1(+기존 1 대체) | 대체 정적 가드: 허용 목록 = SnapshotDialog.tsx 정확히 일치 → GREEN(작업 트리). 동작 가드(내보내기 1회 = 스냅샷 1 · 수동은 수 불변) = 기존 저장소 동작 고정이라 **RED 아님** 예측 |
| E Codex | 3 | 3/3 RED — P1 복원 대기 중 "편집으로 돌아가기" 누르면 미리보기가 닫힘 · P2 같은 act 안 edit→flushed가 저장 없이 true · P2 미리보기 kitTokens가 편집 문서 버전 팔레트 |
| F 보완 | 2 | S6 화면(A→스냅샷→교체→복원 = A가 캔버스 images에 남음) · S10 실메모리(adopt 복원→편집→flushed→requestExport(savedRevision) STALE 0·잡 docRevision 연속) — 구현이 이미 있어 **RED 아님** 예측(보완 테스트) |

## TDD 예측 (1차) (RED 전 기록 — RED 테스트는 tip에 커밋하지 않고 GREEN과 함께)
| 단계 | 새 테스트 수 예측 | 내용 |
|---|---|---|
| A | 5 | useDocSave 3(진행 중 저장 뒤 쓰기 직렬 · 실패/STALE이면 쓰기 0 · 채택 뒤 다음 저장 STALE 0·revision 연속) · imageStore 2(참조 집합 ∪ 스냅샷 · 탭 한도 스냅샷 거부 문장) |
| B | 8 | S3 미리보기(캔버스·aria-disabled+이유·포커스 Callout 제목·돌아가기 포커스) · 입력 직후 미리보기 → 저장 추가 0 · S4 복원 알림·h1·되돌리기 → 새 revision · S9 입력 직후 "지금 상태 저장" = 최신 포함 · S9 저장 실패 → 호출 0+문장 · S10 실메모리 저장소 복원→편집→저장→내보내기 revision · S7 내보내기 전 스냅샷 목록·미리보기 · S6 이미지 A 스냅샷→교체 → A 유지 |
| C | 5 | 좁은 폭 390·1024 대화상자 1개(2) · 390 탭 전환 뒤 잠금 · 더 보기 → 포커스 유지 · 복원 실패 role=alert 1회·포커스 유지 |

## 로그
- A: RED 5/5(`logs/red-a.txt`, 예측 5 일치) → GREEN 24/24(표적 3파일) · typecheck·lint exit 0(`logs/gate-a.txt`). 테스트 도우미: act 콜백 안에서 저장 약속을 기다리면 교착 → act 밖 시작 + 렌더 흘리기
- B·C: RED 11/11(`logs/red-bc.txt`, HEAD 사본) → GREEN 11/11(`logs/green-bc.txt`) · build `logs/build-bc.txt` /studio 128.49 > 128.43 → 즉시 멈춤 · 가드 memoryExport.test.ts:235 실패 · 미커밋 → `wip-stage-bc.patch`
- Codex r1 완료 P1 2 · P2 2(REPORT 5절) · 반영 0(멈춤)
- D 가드: 정적 가드 허용 목록 대체 + 동작 가드 1 → 19/19 GREEN(동작 가드 RED 아님 — 예측 일치) · 전체 vitest exit 0 2094(`logs/vitest-resume-1.txt`) · 커밋 `9a96a51`
- E Codex r1: RED 3/3(`logs/red-e.txt`, 예측 일치) → GREEN — P1 테스트는 RED 뒤 테스트 쪽 실수 1건 수정(제목 입력칸을 열지 않음 → 잠금 확인 대상 "검사 · 내보내기"·결과는 캔버스 문서로, RED 단언 aria-disabled는 그대로) · 스튜디오·features 284 통과 · lint 0 · build exit 0 /studio **128.33**(`logs/build-e.txt`)
- F 보완: S6 화면(`SnapshotImages.test.tsx`)·S10 실메모리(`snapshotRevision.test.tsx`) 첫 실행 GREEN(예측 "RED 아님" 일치). S6 Red-Green 확인: StudioLayout 참조 집합에서 스냅샷 문서를 빼면 실패([A] ≠ [A,B]) → 되돌리면 통과 · typecheck·lint 0
- ⑤ Ego Lite 공간 85 · 1280·390 경로 A 전 흐름 성공 `shots/r1~r12` · finish({keep:[]}) → listTaskSpaces()=[] · 4337 리슨 0
- ⑥ 전체 vitest exit 0 235/2099(`logs/vitest-full-final.txt`) · Codex r2 완료(`logs/codex-r2.txt`) P1 1·P2 2 — 턴 상한 규칙으로 미반영(REPORT 6절) · REPORT 커밋

