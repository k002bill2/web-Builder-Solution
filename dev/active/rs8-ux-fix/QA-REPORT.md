# RS8-UX-FIX QA REPORT — B-RS-11 · B-RS-12 독립 검증

- 대상: `k002bill2/rs8-ux-fix` tip `af5d680b` · base `ead47dcd` · QA 2026-10-18
- **판정(잠정): PASS with notes** — 코드 diff 정독 기준. 항목별 실측 전.

## 항목
| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | UXP-AC-03·04·05 + 변이 | **PASS** (단위) · AC-05 실화면은 2번에서 함께 | `npx vitest --run src/components/studio/PngSave.test.tsx` 원본 12 통과(게이트 5번 전체 실행에 포함). 변이 4종 모두 잡힘·되돌림: ① `StudioLayout` `onAnnounce={setNotice}` 제거 → 1 failed(1280 편집 알림 글자) ② PngSave `role=status` `<p>` 복원 → 5 failed(390·1024·1280 계수 + status null 단언) ③ PngSave `announce(done)` 호출 제거 → 4 failed ④ 재낭독 `onAnnounce?.("")` 제거 → 1 failed(같은 PNG 재저장 [문장,"",문장]). 실패 alert 단언 3개(`findByRole("alert")`)는 base와 동일 줄 그대로. 매 변이 뒤 `git checkout --` → `git status --short` 빈 값 |
| 2 | UXP-AC-06·07 실화면 | 대기 | |
| 3 | 바뀐 단언 이전/이후 | **PASS** — 약화 아님 | `git diff ead47dcd..af5d680b -- app/src` 바뀐 기존 단언은 PngSave 2개뿐. "성공": status 글자 → `onAnnounce` 1회·인자 동일 + status null, 셸 편집 알림 글자 일치는 새 1280 통합 테스트가 따로 단언(경로 이동, 사실 동일). "실패→재시도": 부분 글자 ⊇ → 전체 문장 일치 + 실패 동안 onAnnounce 0(더 엄격). 나머지는 추가만(UXP-AC-03 3폭·04·재낭독·08). `bundleBudget.test.mjs` 기대값 변경은 4번 |
| 4 | 예산 128.70 · 131.68 | **PASS** — fresh 재현 | tip `npm run build` 로그: `/studio` 해시 정규화 진입 **128.70KB** · 기준선 128.70 + 0.03(멈춤 > 128.73) · raw 129.99 / 130.5. 복원 진입 raw 133.03 / 134 · 정규화 줄 아래. REPORT 4절 수치와 일치. base(128.66 · 131.64) 재빌드는 하지 않음(다른 워크트리 금지·시간) — 증분 +0.04는 REPORT 값 인용 [L2] |
| 5 | 게이트 4개 | **PASS** | QA 변이 되돌린 뒤 fresh: `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npx vitest --run` exit 0 — 348 files / 3043 tests passed · `npm run build` exit 0(bundle 가드 통과) |

복원 정규화 줄(빌드 로그 그대로): `[bundle]   /studio/:projectId (저장 데이터 복원 진입) 해시 정규화 진입 131.68KB · 기준선 131.68KB + 0.03KB (멈춤 > 131.71KB) — raw 133.03KB는 참고(해시 이름 흔들림 포함)`

## 노트(정독)
- N-1 `PngSave.announce`의 `setTimeout(…, 0)`은 언마운트 때 취소하지 않는다 — 언마운트 직후 `setNotice` 1회(React 19는 경고 없음). 영향 낮음 [L1 코드].
- N-2 중복 판정은 `announced` ref(PngSave 지역) 기준 — 사이에 다른 편집 알림이 끼어도 같은 PNG 문장이면 `""` → 문장 경로를 탄다. 결과 글자는 같아 무해 [L1 코드].
