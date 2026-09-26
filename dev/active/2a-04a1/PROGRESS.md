# 2A-04a1 PROGRESS — 프로필 데이터 계층 · 버전 계보 · 원자적 확정

- 브리프 `docs/06-handoff/2A-04a1_DEVELOPER_BRIEF.md` · 설계 `docs/design/2a-04/SPEC.md` r3 6.1~6.3 · 브랜치 `k002bill2/2a-04a1` · 분기점 `44f12ea` · 로컬 커밋만
- 목업 차이(ADR-003): 이번 단계는 화면이 없어 11절 M-번호 해당 없음 (M-18 P-S25 패널은 2a-04b)

## 기준선 (`44f12ea`, fresh)
- test 46 files · **525 passed** · lint 0 (`logs/baseline-test.txt`)
- 번들(gzip KB, 첫 화면 / 진입 직후, `logs/baseline-build.txt`): 공통 88.66 · `/catalog` 98.50 / 100.88 · 상세 95.83 / 98.21 · `/compare` 98.50 / 120.97 · 자리표시 89.12 / 91.51

## 진행
1. [x] RED ① 라벨 계보(`draftStatusOf`·`confirmLabel`) 2 failed (`logs/red-1-labels.txt`)
2. [x] **번들 첫 실측** — 공통 청크 계약만(ConfirmedRef 3필드·STALE_PROFILE·profileHead·래퍼 인자·라벨·확정 인자·STALE_PROFILE 문구(엔진 청크)): 공통 +0.03 · `/compare` 첫 화면 98.52(여유 1.48) (`logs/probe1-common-contract.txt`) → 예산 안, 대안 불필요
3. [x] RED ② 저장소 13건 중 12 failed(1건은 typecheck 증명용 `@ts-expect-error`) (`logs/red-2-repository.txt`)
4. [x] GREEN: `studioStore`·`profileRepository`·`memoryProfileRepository`·보드 메모리 구현 재배선 (`logs/green-1-repository.txt`), 번들 재측정 `/compare` 98.53 / 121.74 (`logs/probe2-memory-store.txt`)
5. [x] 기존 테스트 SPEC 9절 범위 수정 · WIP 커밋 `fd85a4f`
6. [x] 보드 화면 P-AC-11·40·42 — Red-Green(보드 화면 4파일을 `44f12ea`로 되돌리면 4 failed, `logs/red-3-page-revert.txt`) → 복원 4 passed · 커밋 `9bca6ca`
7. [x] 검증 4종 fresh: typecheck 0 · lint 0 · test 49 files **545 passed** · build 0 (`logs/verify-*.txt`)
8. [x] 브라우저 스모크 127.0.0.1:5299 (ego-browser) — 서버 종료·`lsof` 비어 있음
9. [x] Codex 리뷰 1회 (`logs/codex-review.txt`) — 지적 0건 → REPORT 커밋
