# CSP-SPEC PROGRESS

base `2531ebf8` · 브랜치 `k002bill2/csp-spec` · 산출 `docs/design/csp/CSP-SPEC.md`

- [x] BRIEF·PROGRESS 커밋
- [x] 정본 읽기 (sec-readproject REPORT 4절 · EXPORT-SPEC r1 · REACTZIP-SPEC r1 · 생성기 코드 읽기 전용)
- [x] 1. 형식별 정책 3종 — 지시어 표·근거(리소스 목록)
- [x] 2. 메뉴 스크립트 해시 고정 + 대조 테스트 · popover 대안 비교
- [x] 3. 렌더 불변 계약 · React zip Vite 빌드 산출물 해시 처리(meta 위치·dev 서버 영향)
- [x] 4. CSP-AC-xx · 테스트 계획 · 예산 영향
- [x] 5. 설계 질문 CQ-xx(★)
- [x] SPEC 초안 커밋 (12턴 안)
- [x] Codex adversarial-review 1회 → 반영
- [x] 최종 커밋 · `git status --short` 빈 값

## 서브에이전트
- 서브에이전트 분할: 불필요 (단일 문서 명세, 정본 읽기 중심)

## 기록
- 2026-10-18 R1: 초안 274줄 작성 후 Claude 사용 한도로 중단(미커밋).
- 2026-10-19 R2: 초안·BRIEF-R2 커밋 `4c974d65`(r0). 누락 = [미확인→2단계 grep] 3곳 → r1 `c0441256`에서 확정:
  - 1.2.1 zip `data:` 불필요(빌드 render CSS url() = @font-face 6개뿐, `stripFontFaces`가 제거) → zip 정책에서 `data:` 삭제 + CSP-AC-11(어긋남 가드).
  - 1.3.1 Vite 8.3.1 타입에서 `apply`·`injectTo: "head-prepend"`·`assetsInlineLimit` 확인(메인 checkout node_modules — worktree엔 없음).
  - 4.2 깨질 테스트 grep 사실화 · 0절에 산출물 소비처(앱 내 재로드 0)·결과 해시 변화 추가.
- Codex adversarial 1회: approve · 지적 0 → 반영 사항 없음. CQ-08 추가(CQ 총 8개, ★ 전부 표기 · 사용자 질의 대상 0).
- 남은 일(구현·QA 레인): CSP-AC-C1·C2(컨테이너 빌드·dev)·R1~R5(ego-browser 실측). CQ-03·05는 실측 결과로 확정.
