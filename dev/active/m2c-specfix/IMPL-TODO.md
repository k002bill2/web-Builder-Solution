# M2C-SPECFIX IMPL-TODO — 다음 Developer·QA 레인 입력

- 출처: M2C-SPECFIX(Designer, 코드 0) · 2026-10-06 · 각 항목의 정본은 표의 SPEC 절이다(이 파일은 목록만).
- **병렬 레인 충돌 주의**: M2C-P3(Developer, `app/**`)가 같은 `ImageSlotField.tsx`에서 B-M2C-06(지운 뒤 포커스)·B-M2C-07(지운 뒤 status 문구)을 고칠 수 있다. T-2는 **M2C-P3 병합 뒤** 그 결과 위에서 한다. 지우기 status 문장은 B-M2C-07 결과가 이미 있으면 그 문장을 쓰고, 없으면 m2c SPEC r3 2.7 표 문장을 쓴다(둘 중 하나로 통일 — 두 문장 공존 0).

| # | 백로그 | 할 일 | 정본 | 수용 기준 | 깨질 것(예상) | 담당 |
|---|---|---|---|---|---|---|
| T-1 | B-M2B-07 | `kit.css`에 `.kit-fieldset:disabled` 하위 규칙 1블록: `.kit-field` 경계 `dashed` · `.kit-submit` 면 투명·글자 `--site-ink`·경계 `--site-stroke-1` `dashed` `--site-ink` / `.kit-notice` 경계 상자(`solid` `--site-stroke-1` `--site-ink` · radius = `--site-radius-control` · 안쪽 `s3`×`s4`). 불투명도·새 토큰 0 · 스크립트 0 | m2a SPEC r3 K1-6 3 · SPEC-BODY r5 B1-11 3 | m2a K-AC-37 · SPEC-BODY KD-AC-20 · QB-11 · Q-6 | 시각 회귀 기준선 **6장**(`contact--form`·`contact--booking` × 1280·768·390) — QA가 재생성하고 "의도된 변경(B-M2B-07)"으로 분류. contact 킷 단위 테스트 중 버튼 배경·경계 스타일 단언이 있으면 개정 | Developer → QA |
| T-2 | B-M2C-08 | 이미지 지우기·바꾸기 성공 시 같은 `setSlot` 1회로 `alt: ""`·`decorative: false` + 상태 문장. 첫 넣기·잃은 이미지 다시 고르기·실패·스위치 끄기는 유지 | m2c SPEC r3 2.7 표 | IMG-AC-30 | `ImageSlotField` 테스트 중 지운 뒤 alt 유지를 기대하는 단언(있다면) | Developer (M2C-P3 뒤) |
| T-3 | B-M2C-03 (MQ-S1 A일 때) | 패널 안내 "편집기를 나가거나 새로고침하면 다시 골라야 합니다"(`ImageSlotPanel.tsx` 44행)는 사실과 맞으므로 **문구 변경 없음** — 기록만 | MQ-S1 | — | — | — |
| T-4 | B-M2C-03 (MQ-S1 B일 때만) | 이미지 맵을 앱 수준 메모리(프로젝트별)로 이동 + `/studio` 진입 예산 실측 + m2c SPEC 2.6 개정 | MQ-S1 B | 편집기 이탈·복귀 뒤 이미지 유지 · 진입 +0.03 이하 | `StudioLayout` 이미지 state 관련 테스트 | Developer (결정 뒤) |
| T-5 | B-M2C-03 | QB-10 새 경로 브라우저 실측: 이미지 2장 → 툴바 "프로젝트" → 같은 프로젝트 편집기 → 잃은 이미지(필드 "다시 골라 주세요"·자체 그래픽·F2 캡션 N장) → 정적 HTML·PNG 개수 문구. 보조: 스냅샷 복원 | m2c SPEC r3 9절 QB-10 | QB-10 | — | QA (Ego Lite 앱 안 클릭만) |
| T-6 | B-M2B-06 · B-M2B-08 | QA 재검 때 함께: ① 비교 대화상자 1안씩 모드의 "보는 안" 라디오·"다시 그리기" Tab 위치 실측(SPEC-COMPARE3 r3 4 — DOM 순서만 L1) ② 30변형 ⑩ 내보내기 동일성 변형별 실측(m2a 5절 ⑩ 7건 · BOUND·BODY 공통) — B-M2B-09 재검과 묶음 | SPEC-COMPARE3 r3 4 · m2a SPEC r3 5절 | — | — | QA |
- B-M2B-06은 **구현 변경 0**(문서만 정정 — 코드 순서가 이미 결정과 같음, L1 `CompareDialog.tsx:157` 스크롤 영역 `role=region`·`tabIndex=0`이 열 버튼들의 조상).
