# GEN-MARK-2-IMPL PROGRESS

- 브리프: `BRIEF.md` · 정본 `docs/design/gen-mark/SPEC-2.md` r1 + `MQ-2.md`(MQ-GM2-1~4 A)
- base main `3706c22` · 브랜치 `k002bill2/gen-mark-2-impl` · 시작 2026-10-11 02:21 KST
- 서브에이전트 분할: 불필요(브리프)

## 체크리스트
- [x] P0 `npm ci`(lock 변경 0) · PROGRESS 커밋
- [x] base `3706c22` 빌드 수치 기록
- [x] MQ-GM2-3 A 표시 맵(`SourceTags.tsx` export `LICENSE_LABEL`) · 접두 `라이선스: ` · SourceTags·ColumnHeader·FilterRail·CatalogPage 부제
- [x] MQ-GM2-1 A ColumnHeader → SourceTags 재사용(래퍼 `inline` 배치) · `BoardColumnView.sourceKind`
- [x] MQ-GM2-2 A 생성 조합 상세 메타에서 buildNote 제외
- [x] 게이트 4종(typecheck·lint·test·build) + base/head 예산 표
- [x] Codex review (branch --base 3706c22) 최대 2라운드
- [x] Ego Lite(4365) E1·E2·E3 캡처 · 정리
- [x] BACKLOG B-GM-01~03 결과 · REPORT

## 기록
- RED 예측 = 영문 원값·접두·boardView·buildNote 단언 실패 → 실제 RED 20건(U5는 기존 동작이라 PASS 예측대로). SPEC 8절 목록 밖 단언 2곳(V2-AC-17r2 체크박스 이름 · M3P-3b 라이선스 글자)도 표시 문구 갱신 — 약화 0.
- 게이트: typecheck 0 · lint 0(새 상수 export 경고 1 → 사유 주석 disable) · vitest 302 files / 2730 pass · build exit 0.
- 청크: 새 공유 청크 0. `compareTray` 청크가 `SourceTags` 청크로 합쳐짐(청크 수 118→117). SourceTags 소비 = Catalog·Detail·Compare.
- 커밋 `19def08`.
- Codex r1 지적 0 → r2 생략. Ego E1·E2·E3 캡처 6장(`ego/`) · 정리 완료. 최종 fresh build exit 0, 수치 동일. REPORT `REPORT.md`.
