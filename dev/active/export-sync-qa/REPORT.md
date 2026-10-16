# EXPORT-SYNC-QA REPORT — dcce2ec 독립 검증 (2026-10-13)

결론: **PASS (범위 안 미측정 2건 별도 표기)**. 게이트 4/4 통과 · Codex 결함 0 · preview 정적 HTML 성공 · dev 안내 문장 원문 일치. 앱 코드 수정 0, push·merge 0.

- 대상 HEAD `dcce2ecd4fd08308c311253fa8f9a70ad6878a80` (branch `k002bill2/export-sync-qa`), export 변경 = `572fdef..dcce2ec` 5파일 +34/−7.
- 쓰기 범위: `dev/active/export-sync-qa/`만. 계약·예산·기준선 변경 0.

## 1. 검증 게이트 (fresh, `logs/exit-codes.txt`)

| 명령 (app/) | exit | 결과 | raw log |
|---|---|---|---|
| `npm ci` | 0 | 설치 | `logs/npm-ci.log` |
| `npm run typecheck` | 0 | tsc 오류 0 | `logs/typecheck.log` |
| `npm run lint` | 0 | eslint 오류 0 | `logs/lint.log` |
| `npx vitest --run` | 0 | **Test Files 304 passed (304) · Tests 2768 passed (2768)** · 53.16s | `logs/vitest.log` |
| `npm run build` | 0 | 번들 가드 통과(썸네일 21장 · 버전 86342b48) | `logs/build.log` |
| `git diff --check 572fdef dcce2ec` | 0 | 공백 오류 0 | `logs/diff-check.log` |

## 2. Codex 리뷰 (1회, 쓰기 없음)

- 명령: `node codex-companion.mjs review --scope branch --base 572fdef` (plugin 1.0.6). raw: `logs/codex-review.log`.
- 결과 원문: "정확성·오류 전파·회귀 가능성을 검토했으며, 수정이 필요한 결함은 발견하지 못했습니다. TypeScript 검사와 git diff --check는 통과했습니다. 테스트는 실행하지 않았습니다."
- 지적 0건 → 반영할 것 없음. Codex 프로세스 종료 확인.

## 3. Runtime (Ego Lite, TaskSpace 16, 앱 안 클릭만, 1280×900)

| 항목 | 판정 | 근거 |
|---|---|---|
| preview 4367 정적 HTML 내보내기 | **PASS** | status 원문 `<h3>정적 HTML을 만들었습니다 · 내보내기 전 상태는 스냅샷 '내보내기 전 · 01:00'에 있습니다</h3>` · "결과 해시 7bc3205cfb1f" · "HTML 1개 · 0.7MB" · 링크 `download="모던-카페-브랜드-프로젝트_r3.html"`. 내려받기 777,750B, `<!doctype html>` · `<title>모던 카페</title>` · `<style>` 1 (`exports/site-4367.html`, `logs/qa-export2-4367-repoll.log`, `shots/export-4367.png`) |
| dev 4369 환경 안내 | **PASS** | alert 원문 `<div role="alert">…<h3>내보내지 못했습니다</h3><div class="ds-body3">개발 서버에서는 스타일시트를 읽을 수 없습니다 — npm run build 후 vite preview에서 확인해 주세요</div>…` + "다시 시도" 버튼. 문장 = `DEV_SERVER_UNSUPPORTED`(devServer.ts:5)와 글자 단위 일치 (`logs/qa-export2-4369.stdout.log`, `shots/export-4369.png`) |
| PNG dev 안내 | 판정 대상 아님 | a180cfa 미병합 브랜치 범위 — main 회귀로 보지 않음(브리프) |

경로: 카탈로그 → 모던 카페·프리미엄 헤어살롱 비교 추가 → A 전부 선택 → 프로필 확정 v1 → 3안 → A안 편집 시작(게이트 "대비 AA 차단 1 · SEO 차단 2") → 프로필로 돌아가 "보정값 쓰기"(통과 4 · 미달 0) → 조정 저장 v2 → 3안 v2 → B안 → "B안으로 새로 시작"(대화상자 "대비 검사: 지금 v1 미달 1 · 새 v2 모두 통과") → SEO 제목·설명 입력 → 차단 0 → 정적 HTML 내보내기. 스크립트: `qa-flow2.mjs`, `qa-flow2-resume.mjs`, `qa-export2.mjs`.

진행 중 이탈(사실 기록):
- r1(`qa-export.mjs`, 프리미엄 헤어살롱 B안) — 시드 문서 게이트 "대비 AA 차단 3"으로 정적 HTML `aria-disabled` (기존 알려진 상태, 결함 아님). 경로를 restart-impl RS-AC-15 2차 흐름으로 바꿈.
- r2 1차 — "보정값 쓰기" 버튼 aria-label이 "보정값 쓰기 (보조 글자 muted)"라 `^…$` 정규식 대기 시간 초과(스크립트 문제). 이어서 실행 슬라이스 오류로 전체 흐름이 한 번 더 돌았고, 보정·저장은 단건 스크립트로 진행(`logs/qa-flow2-step-correct.log`: "통과 3 · 미달 1" → "통과 4 · 미달 0" → "v2로 저장했습니다").
- 4367 첫 내보내기 폴링이 빈 `<p role="alert" class="sr-only"></p>`를 결과로 오인해 656ms에 끊김 → 재조회로 완료 상태 확인(`logs/qa-export2-4367-repoll.log`). 필터 수정 후 4369는 정상 폴링.

## 4. 사용자 흐름 표본

| 항목 | 판정 | 근거 |
|---|---|---|
| 새로 시작 → 스냅샷 복원 (4367) | **PASS** | 목록 "자동 · 새로 시작 전 · 01:00 · 프로필 v1 · A안" → 미리보기 → 복원. 알림 "스냅샷 '새로 시작 전'으로 복원했습니다 · 복원 전 상태는 '복원 전 · 01:01'에 있습니다", 머리표 "B안 · 프로필 v2" → "A안 · 프로필 v1", 게이트 "대비 AA 차단 1 · SEO 차단 2"(= v1) (`logs/qa-restore-4367.json`, `shots/restored-4367.png`) |
| 필드 실행 취소 (4369) | **PASS** | `field-hero-1-title` "아침을 여는 한 잔의 커피" → 입력 "봄 신메뉴 출시 QA" → blur → Control+z → 원값 복귀, status "실행 취소: Hero 제목 편집" (`logs/qa-undo-4369.stdout.log`) |
| 이미지 실행 취소 | **미측정** | 시간 예산 안에서 실행하지 않음 |
| 이탈 저장 유지 | **미측정** | 시간 예산 안에서 실행하지 않음. 뒤로가기 저장 보장은 B-RS-01 범위 밖 한계로 유지 |

## 5. 정리

- 두 origin(4367·4369) IndexedDB `design-studio` 삭제(left 0) · 뷰포트 override 해제 · TaskSpace 16 `finish({ keep: [] })` → 잔여 0 (`logs/cleanup.log`).
- preview(pid 79903)·dev(pid 79904) 종료, `lsof -iTCP:4367 -iTCP:4369 -sTCP:LISTEN` 결과 없음(exit 1 = 리슨 0).
- 다른 창·worktree 접촉 0.
