# RS6-L4 PROGRESS — UX 상태·버튼·충돌·문구

브랜치 `k002bill2/rs6-l4-ux` · base `aca09805` · 브리프 `BRIEF.md`.

## 체크리스트
- [x] 0. BRIEF·PROGRESS 커밋 (`4b8f088f`)
- [x] 1. 정본 읽기 (PLAN 5절 L4 · I6 8절·3절·10절 · UX-5 전문 · L2/L3a/L3b 인계) — 대응표 서브에이전트는 쓰지 않음(사유: 메인이 이미 직접 읽음 · REPORT 11절)
- [x] 2. CP1 SaveStatus 판정 출처 교체 — RED 11(`logs/cp1-red.txt`) → GREEN 17/17 · build 129.52 초과 → 감량 1회 129.25 초과 → **정지**. 코드는 `patches/cp1-reduce1.patch`(미커밋)
- [ ] 3. CP2 저장 확인·다시 저장·폐기 대화상자 — BLOCKED: 예산 정지(BRIEF "감량 1회 뒤 멈춤")
- [ ] 4. CP3 ConflictCallout 두 선택·포커스·replace(=rebase) epoch +1 — BLOCKED: 예산 정지
- [ ] 5. CP4 문구 · 금지 문구 0 · memory 모드 — BLOCKED: 예산 정지
- [x] 6. 예산 — 상한 초과 보고(REPORT 0~3·6절). 기준선 파일 변경 0(상한 밖이라 갱신 대상 아님)
- [ ] 7. Ego Lite 실화면 — BLOCKED: 예산 정지로 브랜치 앱 코드 = base(볼 변경 없음)
- [x] 8. Codex review r1 (`logs/codex-r1.txt` — P1 예산 · P2 slow status 알림, 정지로 반영 0)
- [x] 9. fresh typecheck·lint·test(331/2957)·build(129.09) 마감 — 브랜치 = base 앱 코드
- [x] 10. REPORT.md 작성 + 커밋

## 로그
- 2026-10-17 착수 · base build 129.09 / 132.07 · raw 130.42 / 133.45 (`logs/base-build.txt`).
- CP1 RED 예측: 새 출처 행(reason 문구 4 · inflight · dirty · slow 꼬리 · hang alert · 훅 결선) RED, memory·saved·offline·not-committed·stale 행은 지금 동작이라 GREEN. 실측 RED 11 / GREEN 6 = 예측 일치(`logs/cp1-red.txt`).
- CP1 GREEN 1차 build: 129.52(+0.43) · raw 130.86 · 복원 132.50 — 상한 초과(`logs/cp1-build.txt`). 문자열만 약 180B(gzip -9 추정).
- 감량 1회(상쇄 조사 포함): ① ConflictCallout lazy ② 환경 reason 문구 → 조작 뒤 `save/reasonText.ts`(coreIo.text) → 129.25 · raw 130.58 · 복원 132.24 — 여전히 초과(`logs/cp1-reduce1-build.txt`) → BRIEF 규칙대로 새 구현 정지.
- 패치 상태 전체 스위트: 2971/2974 — 실패 3 = 문구·배치 변경 예상 깨짐(REPORT 4절 표).
- 앱 코드 base로 되돌림 · 패치 보존 · fresh 게이트 4개 통과(REPORT 9절).
- 서브에이전트: 0개.

## MEASURE 레인 (`BRIEF-MEASURE.md`, 측정 전용 · 앱 커밋 0)
- [x] M-0. BRIEF-MEASURE·PROGRESS 커밋 (`ec2d8aab`)
- [x] M0. base 129.09/130.42/132.07/133.45 재현 · cp1 129.25/130.58/132.24/133.61 재현 (`raw/measure-m0-*`)
- [x] M1-CP2. 누적 129.67/131.03/132.65/134.06 (`raw/measure-cp2-build.txt` · `patches/measure-cp2.patch`)
- [x] M1-CP3. 누적 129.68/131.03/132.66/134.07 · epoch +1 테스트 변이 RED 확인 (`raw/measure-cp3-*` · `patches/measure-cp3.patch`)
- [x] M1-CP4. 누적 129.72/131.08/132.70/134.11 (`raw/measure-cp4-build.txt` · `patches/measure-cp4.patch`)
- [x] M2. 상쇄 A표 4건 실측(−0.29·−0.09·−0.05·−0.14) · 조합 M2d 129.15/130.47/132.13 · B표 3건 조사만 (서브에이전트 Explore 1개 — `raw/measure-m2-subagent-survey.md`)
- [x] M3. ① stale 행 변형 129.12/130.43/132.10 exit 0 · 테스트 4 깨짐 ② 1곳 유지 +0.17(간선 시 +0.46)
- [x] M4. 패치 9개 보존·apply --check ok → 복원(diff 0·porcelain 0) → dist sha 동일 · typecheck·lint·test(331/2957)·build 0
- [x] M5. REPORT-MEASURE.md + 커밋
- Codex·Ego Lite: 브리프 금지로 생략

## R2 레인 (`BRIEF-R2.md`, L4 전체 구현 재개 · M3a 조합 · 상향 0)
- [x] R0. BRIEF-R2·PROGRESS 커밋
- [x] R1. CP1 SaveStatus 판정 출처(I6 8.1 · stale 행) — RED 9/46(`logs/r2-cp1-red.txt`, 예측 = 새 테스트 + 의미 교체 6건 전부 RED) → GREEN 60/60(`logs/r2-cp1-green.txt`) · 전체 스위트에서 포트 stale 의존 2건 추가 발견(FieldUndo P2-3 · useDocSaveLeave STALE 경고) → I6 8.1 근거로 교체 · build 129.35(중간 — ConflictCallout lazy·M2 전, `logs/r2-cp1-build.txt`)
- [x] R2. CP2 저장 확인·다시 저장·폐기 대화상자 — RED(신규 2파일 import 실패 + report 1, `logs/r2-cp2-red.txt`) → GREEN 26/26(`logs/r2-cp2-green.txt`) · 전체 2990/2991→StudioLayout 가짜 타이머 findBy 수정 후 통과 · M2a 구조(SaveActions lazy)로 바로 작성 · build 129.52(중간, `logs/r2-cp2-build.txt`)
- [x] R3. CP3 ConflictCallout 두 선택·포커스·replace epoch +1 — RED 3/5(`logs/r2-cp3-red.txt`) → GREEN 5/5 · epoch 변이 RED 2(`logs/r2-cp3-epoch-mutation-red.txt`)→복원 PASS · 전체 336/2994 통과 · build 129.31(중간 — M2b 포함, M2c·M2d 전, `logs/r2-cp3-build.txt`)
- [x] R4. CP4 문구·금지 문구 0·memory 모드 — RED 2/25(slow 알림 · 저장 먼저 실패 문장, `logs/r2-cp4-red.txt`) · 금지 문구 가드 8건은 첫 실행부터 GREEN(가드 성격) · memory U9는 CP2 버튼 테스트 → GREEN 25/25 · 전체 338/3005 · build 129.32(중간 — M2c·M2d 전, `logs/r2-cp4-build.txt`)
- [ ] R5. 상쇄 M2a~M2d (`src/build/` 목록 모듈) — 실측
- [ ] R6. 예산 판정 · 기준선 파일 갱신(상한 안일 때)
- [ ] R7. Ego Lite 실화면 (1280·390 · stale 2탭)
- [ ] R8. Codex review (`--scope branch --base aca09805`) · 반영 1회
- [ ] R9. fresh typecheck·lint·test·build
- [ ] R10. REPORT.md R2 절 + 커밋
