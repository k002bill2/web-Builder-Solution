# EDITOR-A2-SHELL — REPORT (S1 완료 · S2~S6 중지)

**결론**: S1(D1~D3)은 GREEN·전 게이트 통과로 커밋했다(`270bf6c`). 같은 커밋의 빌드에서 `/profile` 진입 직후가 **124.72KB(여유 0.28 < 0.3)** 라 브리프 중지 규칙이 발동했다 → S2~S6 미착수.

## 1. 커밋
| SHA | 내용 |
|---|---|
| `5cbf320` | S0 base build 실측 · PROGRESS 수신 |
| `270bf6c` | S1 문서 분기 · 편집 알림 1회 · 진입 h1 포커스 |

## 2. 파일 (app/src/)
- 수정: `pages/StudioPage.tsx`(문서 분기 — 문서 없음 E-S03 유지)
- 새: `features/studio/useStudioDoc.ts`(`useStudioDoc` 조회 · `useEntryState` 이동 state 1회 읽기 + `history.replaceState`로 `usr`만 비움) · `features/studio/selection.ts`(이름·변형 이름표·첫 선택·문서 Tag) · `components/studio/{StudioLayout,StudioToolbar,SectionList}.tsx` · `pages/StudioPage.test.tsx`
- F 레인 파일·`AppLayout.tsx`·`CandidateCard.tsx`·engine·design 무접촉.

## 3. AC 판정
| 항목 | 판정 | 근거 |
|---|---|---|
| D1 문서 있음 → E-S03 아님(편집 틀) | PASS | `StudioPage.test` "문서 있음 → …" |
| E-AC-02 문서 없음 → E-S03 그대로 | PASS | 같은 파일 + `StudioEmptyStates.test` |
| D2 editNotice `role=status` "편집 알림" 1개·1회·재렌더 1회·다시 열기 0회 · `display:none` 아님 | PASS | 테스트 3건. `navigate(replace)` 미사용 — 위치 key 불변 단언 |
| D3 편집 시작 도착 → 포커스 = h1(`tabIndex=-1`) | PASS | 테스트 2건(알림 있음 · 바뀐 쌍 0개) |
| 3회 반복 | PASS | `logs/s1-repeat.txt` 7/7 × 3 |
| S2 E-AC-03 · S3 E-AC-04·13 · S4 E-AC-05 · S5 E-AC-14 · S6 E-AC-15·16 | **미착수** | 중지 규칙(4절) |

S1 틀에 이미 들어간 것(판정 대상 아님, S2~S4에서 테스트 예정): `header` 툴바 · "프로젝트로 돌아가기" → `/projects` · 섹션 줄 `aria-current`.

## 4. 번들 (gzip KB, `check-bundle-size.mjs`)
| 화면 | base `932d423` | S1 `270bf6c` | 변형: registry 미사용 | 멈춤선 |
|---|---|---|---|---|
| 공통 JS | 89.34 | 89.36 | 89.34 | 변화 0 원칙 |
| /catalog 첫 | 99.65 | 99.67 | 99.65 | 99.70 |
| /references/:id 첫 | 96.99 | 97.01 | — | 99.70 |
| /compare 진입 | 121.39 | 121.41 | — | 124.70 |
| **/profile 첫 / 진입** | 99.60 / 124.69 | 99.63 / **124.72** | 99.61 / **124.71** | 99.70 / 124.70 |
| /projects 진입 | 106.99 | 107.03 | 107.00 | 124.70 |
| /studio 첫 / 진입 | 90.73 / 104.33 | 95.49 / 108.47 | 91.77 / 105.37 | 99.70 / 124.70 |

실측 원인(L1, 로그 `logs/s1-build-try1-icon-tag.txt` · `s1-build-try2-css-chevron.txt` · `s1-variant-no-registry.txt` · `s1-build.txt`):
- studio 청크에서 `components/ds/Icon` import → 공통 청크 재분할 **+0.39**(`/catalog` 100.18·`/profile` 125.30 예산 초과) → 제거.
- `chevron-left.svg?url` 직접 import → 공통 **+0.08** → 제거(CSS chevron으로 대체).
- `ds/Tag`(+`cx`) → 작지만 0 아님 → 토큰 span으로 대체.
- 남은 공통 +0.02 = index 프리로드 목록에 `registry` 청크 이름 추가(registry 미사용 변형은 89.34로 복귀).
- `/profile` +0.02~0.03은 registry를 빼도 남는다 → 원인 미상(L3: 다른 청크의 해시 문자열 변화에 따른 gzip 요동으로 추정, profile 청크 모듈 변경 없음).
- 교훈: base 여유 0.31은 studio 변경이 만드는 요동(±0.02~0.03) 안에 있다. **S2~S6은 `/profile` 여유 확보 없이는 어떤 변경으로도 규칙에 걸릴 가능성이 높다.**
- CSS(판정 밖): index.css gzip 9.07 → 9.14 kB(새 유틸리티 클래스). Q-24 경로 아님(engine 문자열 아님).

## 5. 검증 명령 · 결과
- `npx vitest run src/pages/StudioPage.test.tsx` RED 6 fail/1 pass(`logs/s1-red.txt`) → GREEN 7/7(`s1-green.txt`), 3회 반복 `s1-repeat.txt`.
- 가드: `npx vitest run src/test src/engine/engineImportGuard.test.ts src/components/studio` → 7 files · 64 passed(`s1-guards.txt`).
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0(`s1-build.txt`, 예산 검사 통과 — 멈춤선만 위반).
- 전체 `npx vitest run` → 112 files · **1279 passed · 실패 0**(`logs/full-vitest.txt`).
- 서버 미기동. `lsof -nP -iTCP:4337 -sTCP:LISTEN` → 빈 출력.
- Codex: **이관**(중지로 S1에서 멈춤 — 병합 전 `review --scope branch --base f22bbc8` 1회 권장).

## 6. 결정 · 목업 차이
- 돌아가기 = 아이콘 모양 버튼이지만 `chevron-left` 원본 SVG가 아닌 CSS 테두리 chevron(번들 사유, 접근 이름 동일) — EM 추가 후보.
- 편집 알림 글자는 영역을 빈 채 먼저 그린 뒤 `setTimeout 0`으로 넣는다(낭독 보장 + lint `set-state-in-effect`).
- `useEntryState`는 `editNotice` 또는 `changes`가 있을 때만 "편집 시작 도착"으로 본다(포커스 대상 판정).
- 저장소 `getDoc` 결과는 `PageDoc`으로 캐스팅(메모리 구현 문서는 엔진이 만든 것만 — `useStudioDoc.ts` 주석).

## 7. 남은 위험 · 필요한 결정
1. **`/profile` 여유 확보(차단)**: S2~S6 재개 전 profile-headroom 계열 레인으로 여유를 늘리거나(권장), 멈춤선 재기준을 Jarvis가 결정해야 한다.
2. 툴바 `header`는 앱 셸 `main` 안이라 banner 랜드마크가 아니다(E-AC-03 "header 1개"는 태그 개수로 검증 예정, `AppLayout` 수정 금지) — 설계 질문.
3. 실제 브라우저에서 `history.replaceState` 뒤 뒤로/앞으로 동작은 미검증(병합 뒤 QA).
