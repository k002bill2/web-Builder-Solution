# M2C-TODO REPORT — T-1(B-M2B-07 · K-AC-37) · T-2(B-M2C-08 · IMG-AC-30)

base `83c06e5` · 브랜치 `k002bill2/m2c-todo` · 커밋 `81e4d2e`(P0·예측) → `13d341a`(T-1) → `cf9a667`(T-2) → `6206f38`(게이트 로그·캡처) → REPORT

## 1. 항목별 전후
| 항목 | 전 | 후 | 파일 |
|---|---|---|---|
| T-1 비활성 폼 단서 | 비활성 폼 = 연결 모양 그대로(실선 입력칸·primary 면 버튼) — 보내기가 꺼졌는지 모양으로 구분 불가. 안내 p 경계 없음 | `.kit-fieldset:disabled` 블록에만 입력칸 점선 · 버튼 = 면 투명 점선 외곽(글자 ink) · `.kit-notice` 실선 경계 상자(radius control·padding s3/s4). 회색·불투명도·새 토큰·스크립트 0. disabled 풀면 기본 규칙(실선·primary)으로 복귀 | `app/src/kit/kit.css` +14 |
| T-2 지우기 | 소스만 자체 그래픽으로, alt·decorative 남음(다음 이미지에 이전 설명이 따라감) | 같은 `edit` 1회로 `source` 자체 그래픽 · `alt ""` · `decorative false` · status "이미지를 지웠습니다"(M2C-P3 문장 그대로) · 포커스 "이미지 고르기"(M2C-P3 불변) | `ImageSlotField.tsx` |
| T-2 바꾸기 | 새 파일 반영해도 이전 alt·decorative 유지, status "이미지를 넣었습니다" | Blob 있는 이미지 → 새 파일 성공 시 같은 `setSlot` 1회로 alt·decorative 초기화 · status "이미지를 바꿨습니다 대체텍스트를 다시 적어 주세요" | `ImageSlotField.tsx` (`insertedMessage`) |
| T-2 유지 경로 | — | 첫 넣기 · 잃은 이미지 다시 고르기(로컬 id·Blob 없음, 빈 alt 아니면 "대체텍스트가 맞는지 확인해 주세요") · 변환/한도 실패(반영 전 종료) · 스위치 끄기 = alt·decorative 유지. 게이트 R-09 코드 변경 0 | — |

- T-1 테스트 개정(단언 약화 아님): `ContactForm.test.tsx` "비활성 모양 = 연결됐을 때와 같은 모양" → 정본 `docs/design/m2a/SPEC.md` r3 K1-6 3 · K-AC-37 [G] 개정(r2 "같은 모양" → 기본 규칙 유지 + disabled 블록 단서)에 따라 이름·뜻 개정. 기본 규칙 단언 4+3건 그대로 유지, `:disabled` 입력칸·버튼·안내 상자 단언과 불투명도/filter/hex 0 단언 추가.
- 묶음 블록 border 금지 가드(`ContactBooking.test.tsx`) 그대로 통과.
- 시각 회귀 기준선: contact--form · contact--booking × 3폭은 **의도된 변경** — 재생성은 QA 몫, 이 레인은 기록만.

## 2. 테스트 (RED 전 예측 커밋 `81e4d2e` → RED → GREEN)
| 항목 | 예측 | RED | GREEN |
|---|---|---|---|
| T-1 | 새 0 · 개정 1, RED = 그 1건 | `logs/t1-red.txt` — 1 failed / 9 passed (예측 일치) | `logs/t1-green.txt` — 49파일 269 통과 |
| T-2 | 새 7, RED = ①②④⑥ 실패 · ③⑤⑦ 통과 | `logs/t2-red.txt` — 4 failed / 24 passed, 실패 = 지우기·바꾸기·잃은 이미지·R-09 (예측 일치) | `logs/t2-green.txt` — 23파일 156 통과 |

- 전체: `logs/vitest-full.txt` — **227파일 2048 통과** (기준선 2041 + 7 = 예측 합계 일치). skip 0.
- typecheck · lint: `logs/typecheck-lint.txt` exit 0. build(번들 전 행): `logs/build.txt` exit 0.

## 3. 번들 (`logs/build.txt`)
| 지표 | 기준선 | 후 | 차 |
|---|---|---|---|
| `/studio/:projectId` 진입 직후 | 127.07 | 127.05 | −0.02 (멈춤 >127.39 아님) |
| `/studio` 첫 화면 | 91.76 | 91.75 | −0.01 |
| 렌더 JS | 84.19 | 84.19 | ±0 |
| 렌더 CSS | 8.80 | 8.85 | **+0.05KB** (T-1 kit.css, 예산 30KB · 예상 "수십 B" 범위) |
- 엔진·PageDoc·렌더 계약 변경 0.

## 4. Ego Lite 실화면 (영환님 지시 · `shots/`)
- 레인 4337 loopback 자기 서버 + 앱 안 클릭으로만 이동(새로고침 0, main 5480·영환님 창 무접촉).
- T-1 `t1-w1280-editor.png`(데스크톱 프레임): Contact·문의 폼 — 안내 문장이 실선 둥근 경계 상자 안, 이름·이메일·문의 내용 입력칸 점선, "문의하기" 버튼 면 없는 점선 외곽·ink 글자. 회색·반투명 없음. 판독 ✅
- T-1 `t1-frame390-editor.png`(모바일 프레임 390): 같은 단서가 세로 배치에서 유지, 버튼 전체 폭 점선 외곽. 판독 ✅ · `t1-w390-viewport-editor.png` = 창 폭 390 편집기 자체(참고).
- T-2 `t2-1-picked-alt-filled.png`: 이미지 넣기 → 대체텍스트 입력 상태.
- T-2 `t2-2-after-replace-alt-empty.png` · `t2-2b-after-replace-view.png`: "다른 이미지로 바꾸기" 뒤 새 이미지(320×200 WebP) · 대체텍스트 빈칸(포커스) · 장식 체크 해제 · 게이트 차단 4(지운 뒤 3보다 1 많음 = 빈 alt R-09 재표시). 판독 ✅
- T-2 `t2-3-after-clear-alt-empty-deco-off.png`: "이미지 지우기" 뒤 자체 그래픽 · "이미지 고르기" · 대체텍스트 빈칸 · 장식 해제 · 차단 3(지운 뒤 대상 밖). 판독 ✅
- 창 정리: 이 레인의 직전 실행이 턴 한도(61/60)로 끊겨 레인이 직접 `finish({keep:[]})`를 기록하지 못함. **Jarvis가 레인 4337 서버 종료 · Ego Lite space 79 닫음 · `listTaskSpaces()`=[] 확인**(이번 재개 브리프 기록). 재개 실행은 서버·Ego Lite를 다시 열지 않음.

## 5. Codex
- r1 `node codex-companion.mjs review --scope branch --base 83c06e5` (1.0.6, 커밋 `6206f38` 기준) — **실제 완료, 지적 0** ("검토한 변경에서 수정이 필요한 결함을 발견하지 못했습니다. 이미지 교체·삭제의 대체텍스트 초기화와 비활성 폼 스타일은 의도된 동작에 부합합니다"). Codex 자체 테스트 재실행은 읽기 전용 샌드박스에서 Vite 임시 설정 파일 생성 차단으로 미완 — 2절 전체 vitest 2048 통과가 대신 증거. 로그 `logs/codex-r1.txt`.
- 라운드 1/2 — 지적 0이라 반영·r2 생략(코드 변경 없음 → 표적·전체 vitest 재실행 불필요).

## 6. meta
- 커밋: P0 BRIEF·PROGRESS·예측 → T-1 → T-2 → 게이트 로그·캡처 → REPORT. push/merge/삭제 0, 새 의존성·lock·docs·scripts 수정 0, 서브에이전트 0.
- 실행 2회: 1차 61/60 턴 한도로 종료(T-1·T-2·게이트·Ego Lite 완료, 로그 미커밋) → 재개(사전 승인 3, 축소 1회)에서 로그 커밋·Codex·REPORT.
- 한계: Ego Lite(Chromium) 1종 실측. Safari·Firefox·실기기·스크린리더 낭독 미검증. 시각 회귀 기준선 미재생성(QA 몫).
