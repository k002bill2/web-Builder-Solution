# P2-L1 Developer 브리프 — 프로젝트 파일 형식·검증·재매김·이미지 재인코딩 (순수 모듈)

- 역할 Developer / Orca managed Claude Code / worktree p2-l1 / base `2285df8`(P2-SPEC 병합 + ADR-007 개정 4 + ENTRY-SLIM + ADR-004 개정 13). `npm ci` 완료.
- 정본: `docs/design/persistence/P2-SPEC.md` — **머리 "Jarvis 채택 결정"이 본문보다 우선**(특히 3.3 ⑤ 재인코딩 유지 · AC-P01 수정) · 2절 형식 · 3.2~3.4 · 6절 번들 · 7절 AC-P01·P02·P03·P05(U) · 8절 L1 행. `docs/decisions/ADR-007-local-persistence.md` 개정 3·4 · `docs/design/persistence/THREATS.md` T4.
- 범위 = 8절 L1 행 + 재인코딩: 새 `features/projectFile/format.ts`(상수·타입·parity 테스트) · `checkFile.ts`(① 크기 ~ ⑥ 참조) · `rekey.ts`(3.4 치환 — 새 id는 `nextSeqId`, 대상 `seq` 불변) · `encode.ts`(state → 파일 조각) · `data/startDocWrite.ts`에 순수 함수 `rekeyDoc(doc, projectId)` 1개(engine 허용 목록 안) + **이미지 재인코딩 함수**: ⑤ 규칙 검사·`createImageBitmap` 디코드 성공 뒤 각 변형본을 **업로드 경로와 같은 인코더**(`features/studio/images/ingest/deps.ts` — 같은 형식·같은 사다리 폭)로 다시 인코딩한 바이트를 반환(인코더 재사용 가능 여부 [L1] 확인, 재사용 불가면 같은 설정을 공유 상수로). UI 0 · IDB 쓰기 0(L3) · 화면 0(L2).
- 재인코딩 테스트: jsdom에 canvas·`createImageBitmap`이 없으면 인코더를 주입 가능한 의존성(기존 ingest deps 패턴)으로 두고 가짜로 U — "디코드 실패 = 거절·쓰기 0", "재인코딩 결과 바이트가 저장 대상", "형식·치수 불변". 실제 브라우저 확인은 L3 Ego Lite.

## 번들 관문
- main 실측: `/studio` 진입 **129.09**(멈춤 >129.65) · 복원 **132.13**(멈춤 >132.68) · `/profile` 첫 화면 **99.87 / 100** · `/projects` 104.69. 이 레인 진입 몫 **0** — 새 모듈은 아직 어떤 화면도 import하지 않으므로 build 수치 불변이어야 함. `startDocWrite.ts`가 진입 closure라면 `rekeyDoc` 추가로 늘 수 있음 → 구현 첫 커밋 직후(**15턴 전**) build 실측, 증가분은 REPORT에 정확히. `/profile` 100 초과 시 멈춤.

## 검증·금지
- TDD(RED 예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0, **amend·rebase 금지**). AC-P02(거절 = 쓰기 0 — 단계별 실패 문장 IM-1~IM-6)·AC-P05(열기 무결)가 RED 출발점 · 재매김 왕복(encode → check → rekey = 값 동일, 새 id·hash 재계산) · 미래 formatVersion = IM-3.
- typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · REPORT. Ego Lite 생략(UI 0 — 사유 기록). **Codex는 Jarvis 몫.**
- 엔진·PageDoc 계약·docs/**·lock·CLAUDE.md 수정 0(engine은 `startDocWrite`에서 import만), 새 의존성 0, 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지. main 5480 무접촉.
- **턴 한도 대응**: 레인이 크면(SPEC 8절) L1a(format·checkFile ①~④) 먼저 커밋 → L1b(⑤ 이미지·재인코딩·rekey·encode). **첫 3턴 안에 BRIEF P0 커밋.** L1a 커밋 20턴 전 · L1b 커밋 38턴 전 · 44턴부터 게이트·REPORT만 · REPORT 초안 48턴 전 커밋. 한국어.
