# RS4-CP4-MEASURE PROGRESS

시작: 2026-10-17 / base f477c161 / 브랜치 k002bill2/rs4-cp4-measure

- [x] 0. BRIEF·PROGRESS 커밋
- [x] M0. base build 원문 저장 + /studio·복원·/profile·/projects 수치 표 (커밋)
- [x] M1. 편집기 인계 전체 스파이크 — 배치안 (a)(b) × 시나리오(기본/복원/pending) 측정, UNMEASURED 명시
- [x] M1. 패치 보존(patches/) → 자기 변경 복원 → base 재빌드 동일 확인 (커밋)
- [x] M2. /studio closure 모듈 gzip 상위 표 (raw/base-studio-chunks.txt — 청크 단위)
- [x] M2. 동작 변화 0 후보 build 실측 — BRIEF-M2 런에서 완료(아래 M2 절)
- [x] M2+M1 합산 빌드 1회 — BRIEF-M2 런에서 완료(M2-5)
- [x] 최종 fresh 게이트 typecheck·lint·test·build (315 files / 2842 tests 기대), git diff -- app/ 빈 출력
- [x] REPORT.md (결론 첫 줄) 커밋

서브에이전트: ① M1 경로 조사 완료(반영) ② M2 후보 조사 완료(추정 표만 REPORT 반영, 빌드 미검증)

## M2 실측 (BRIEF-M2, 2026-10-17)
- [x] M2-0. BRIEF-M2·PROGRESS 커밋
- [x] M2-1. 후보 1 preload 중복 제거 — /studio 128.32·129.63 (채택, HTML 가드 추가 후 재빌드·index.html preload 유지 확인)
- [x] M2-2. 후보 2 polyfill:false — 128.24·129.63 (채택)
- [x] M2-3. 후보 4 writeBodyLoader 분리 — 128.41·129.70, 공통 +0.06·테스트 이음새 5곳 깨짐 (기각)
- [x] M2-4. 조합 1+2 — 128.09·129.40
- [x] M2-5. 조합 + a — 129.33(+0.80)·130.70(+0.70) → 상향 필요
- [x] M2-6. 후보 3 1회 시도(preserveEntrySignatures) — 변화 0, 원인 미확인
- [x] M2-7. 복원 · git diff -- app/ 빈 출력 · fresh build(128.47·131.45) + test(315/2842)
- [x] M2-8. REPORT-M2.md 커밋

서브에이전트(M2): 사용 안 함(BRIEF-M2 지시).
