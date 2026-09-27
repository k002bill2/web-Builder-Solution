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

## 5.1 advisor 검토 반영(커밋 3)
- 13.1·브리프: 가드 개정이 a1-β에 있다는 오기 정정 → a2 D 레인 첫 커밋, S·F는 그 병합 전 engine 테스트 import만.
- 8.2.1 (a): 멱등 재생 "알림 0"과 8.3.1 "이전 결과 그대로"의 모순 → 재생도 이동 뒤 1회(첫 응답 유실 때만 재생되므로).

## 5.2 r4.1 이후 (Jarvis f63de82 → 커밋 4bf1c4e)
- Jarvis가 Q-18 A · Q-24 A · Q-21 후속을 이력(r4.1)·브리프 9.1에 기록. 8.2.1 끝 줄과 13.1 a2 행, 브리프 머리·3절·8절·9절 표에 남아 있던 "착수 전 결정 필요"를 "결정됨(r4.1)"으로 정리(본문 결정 내용은 r4.1 문장 그대로).
- Codex: 1차 실행은 사용량 한도로 실패(15:26 해제). 2차는 셸 종료로 중단(`logs/codex-r1-aborted.txt` — 중단 전 "r4.1이 이력에만 있다" 지적 착수 → 위 정리로 선반영). 3차 = 최종 커밋 기준 재실행(`logs/codex-r1.txt`).

## 5.3 Codex adversarial r1 결과 (`logs/codex-r1.txt`, branch --base main, 최종 커밋 4bf1c4e 기준)
- Verdict needs-attention · **[high] 1건**: Q-18 A(motion 전달)가 현재 엔진 API와 맞지 않고 브리프가 `engine/**`를 읽기 전용으로 둠. **L1 확인**: `CandidatePlan.sections` = `{type, variant}` · `createDocFromCandidate.ts:46` 늘 `minMotion("L1", 상한)`. → r4.2 반영: 8.2 행 `motion?` · 8.2.1 끝 구현 계약(`minMotion(motion ?? "L1", 상한)`, 없으면 현행) · 브리프 4·5절 소유 권장(D 레인 예외 2파일) — **소유 확정은 Jarvis**.
- 그 밖 지적 0. 라운드 1/3 사용. r2는 반영분 확인용.

## 6. 남은 것 · 사용자 확인
- **Q-18 A 엔진 변경 소유 확정(Jarvis)**: D 레인 예외 2파일(권장) vs 소형 L4 레인 — 브리프 초안 4절.
- a2 착수 선행: a1-β 병합(현재 `/profile` 여유로 중지) · profile-headroom 병합 · Q-18·Q-24 결정.
- **Q-21의 제품 결과(영환님 확인)**: 매핑 뒤 그리드 축이 접힌다 — services `grid-3`·`grid-2`·`masonry`가 모두 `cards-3`이 되어, 편집기에서 B안·C안 차이는 Hero·글자 비율만 남는다(3안 화면의 축 표시는 그대로). 8.2.1 (a) 알림이 이를 알린다.
- 8.2.1 (a) 편집 알림 문구·(b) 알림 문구는 Designer 제안 — 영환님 검토 대상.
