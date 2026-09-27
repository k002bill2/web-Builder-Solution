# EDITOR-A2-SPEC — REPORT (Designer · 2026-09-27)

**결론: Q-17·Q-21(영환님 ★A)을 SPEC r4에 반영했고, 변형 대응표(픽스처 30쌍 + 컴포저 쌍, 현재 어휘에서 불가 0쌍)와 a2 브리프 초안(레인 3개 분할)을 만들었다. 앱 코드·`design/` 변경 0, 로컬 커밋만.**

## 1. 산출물
| 파일 | 내용 |
|---|---|
| `docs/design/2a-05/SPEC.md` r4 | 8.2 `createDocFromCandidate(plan, profileVersion, start: DocStart{projectId, updatedAt})` · **8.2.1 신설**(어댑터 순서 · 표 위치 = 새 모듈 1곳, `startDoc` 쓰기 본문만 import · 키 `type/variant` · (a) 바뀐 변형 = 편집 알림 1문장 · (b) 표 밖 = `UNKNOWN_VARIANT` 쓰기 0·재시도 없음·새 E-S 없음 · 검증 · Q-18 영향) · 13.1 a2 행(선행·범위·결정 필요 표시)·끝 줄 · 변경 이력 r4 |
| `docs/design/2a-05/VARIANT-MAP.md` | 엔진 26쌍(L1 줄번호) · 픽스처 30쌍 대응(줄번호·같음/근접·이유) · 컴포저·보드 확정 쌍 7 · 엔진 어휘 그대로 행 · 불가 목록(현재 0, 방어 규칙) |
| `docs/06-handoff/EDITOR-A2_BRIEF.draft.md` | 범위(E-AC-03~16 + 40~42) · 선행 3건 · 레인 3개(D 데이터 · S 셸·캔버스 · F 필드·저장, 파일 소유 분리, 병합 D→S→F) · 파일 지도 · 번들 예상 · 검증 · Q 영향 표 |

## 2. 설계 판단 (Q-21 위임분)
- **표 위치 = `startDoc` 어댑터 쪽 새 모듈**(컴포저·`domain/generation.ts` 아님). 이유: 컴포저 그리드 축(`grid-3`/`grid-2`/`masonry`)은 3안 차이를 만드는 어휘라 바꾸면 병합된 2a-04c 화면·lint가 바뀐다 · `domain/generation.ts`는 `/profile` 진입 직후 청크(여유 0.2대)에 런타임으로 있다(2a-04c REPORT 3절 공유 청크 사례).
- **불가 변형 처리**: 현재 어휘는 표가 전부 덮음(근접 변형 + 편집 알림). 표 밖은 결정적 `UNKNOWN_VARIANT`(재시도 없음 — 같은 인자 재시도는 같은 실패). 새 E-S 번호를 주지 않아 0절(상태 34)·3.2·11절(AC 57) 무변경.
- 유형은 바꾸지 않는다(R-03·R-04 목적 판정). `contact/order-form` → `form`(예약 `booking` 아님).

## 3. 검증 (실행 결과)
- `python3 dev/active/editor-a2-spec/logs/variant-map-check.py` → `logs/variant-map-check.txt`: 픽스처 49줄·고유 30쌍 · 엔진 26쌍 · 표에 없는 픽스처 쌍 0 · 표에 없는 엔진 쌍 0 · 줄번호/목적지/구분 불일치 0 · **exit 0**.
- `git diff -U0 main -- docs/design/2a-05/SPEC.md | grep '^@@'` → `logs/spec-diff-hunks.txt`: 506(8.2) · 523~536(8.2.1) · 580(8.3.1 끝 1줄) · 832·839(13.1) · 923(이력). **예외 1건**: 8.3.1 끝 "8.2 `createDocFromCandidate` 이름·인자는 그대로다" — Q-17과 모순(QA post-merge 63행이 지적한 문장)이라 같이 고침, 이력에 명시.
- `git diff --name-only main` → `app/`·`design/` 0건.
- 서브에이전트 교차 확인: A가 "26 distinct"라 적었으나 직접 센 값은 30(표 30행) — 스크립트 값으로 기록. B가 "104.28은 브리프에만"이라 했으나 출처는 `k002bill2/editor-a1-beta` REPORT 21행(main 밖) — 브리프 초안에 `git show` 경로로 인용.

## 4. 서브에이전트
| 에이전트 | 격리 | 결과 |
|---|---|---|
| A 픽스처 변형 수집(Explore, 읽기 전용) | 없음(쓰기 0) | 픽스처 쌍·줄번호·데이터 경로·어댑터 없음 확인. 개수 1건 정정(26→30) |
| B 엔진 변형·startDoc 계약(Explore, 읽기 전용) | 없음(쓰기 0) | 3인자 시그니처·`UNKNOWN_VARIANT` throw·엔진 변형·`now` 주입 위치 확인. 104.28 출처 1건 정정 |

## 5. 결정하지 않은 것 (영향만)
- **a2 착수 전 결정 필요**: Q-18(새 문서 모션 — 어댑터가 `motion`을 넘길지) · Q-24(Tailwind engine 스캔 — a2가 engine을 처음 런타임 호출).
- a3·a4 전: Q-19 · Q-20 · Q-22 · Q-23 · `addSection` 5인자 SPEC 반영.

## 6. 남은 것 · 사용자 확인
- a2 착수 선행: a1-β 병합(현재 `/profile` 여유로 중지) · profile-headroom 병합 · Q-18·Q-24 결정.
- 8.2.1 (a) 편집 알림 문구·(b) 알림 문구는 Designer 제안 — 영환님 검토 대상.
