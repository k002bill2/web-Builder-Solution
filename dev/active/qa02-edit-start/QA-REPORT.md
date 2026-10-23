판정: **스크립트 문제(앱 결함 아님)** — 새 TaskSpace에서 R2b 경로 그대로 "B안으로 편집 시작"을 누르면 1s 안에 "새로 시작" 대화상자가 열리고, "B안으로 새로 시작" → `/studio/project-6` 정상 이동(콘솔 오류 0). 근거 L2(실측) · 불확실성 Low(현상) / Medium(옛 실행의 정확한 멈춤 지점).

# QA02-EDIT-START — B-QA-02 판별 보고

## 1. 정적 경로 (보정값 v2 · 기존 문서 A안 v1 상태에서 B 클릭)
| 단계 | 위치 | 조건·결과 |
|---|---|---|
| 버튼 렌더 | `app/src/features/profile/CandidatesSection.tsx:245-254` | 네이티브 `disabled` 없음. `aria-disabled` = `!selected`일 때만(:247). `aria-busy` = `starting`(:249). 라벨 `${selected}안으로 편집 시작`(:253) |
| 클릭 가드 | `CandidatesSection.tsx:94-95` | `!selected \|\| starting` → 무반응(조용히 return). `!projectId` → `/projects` 이동(:96) |
| 청크 로드 | `CandidatesSection.tsx:100-103` | `loadProjects()`+`loadRestart()` 실패 → `console.error` + `startFailed` Callout(`role=alert`, :258-273) |
| 판정 | `restartFlow.ts:74-108` `startEdit` | 미확인 기억(pending) 있으면 대화상자 재오픈(:76) 또는 held Callout(:77). 최초 = `startDoc(create)` → `DOC_EXISTS`면 `judge`(:97) |
| judge | `restartFlow.ts:44-45` | 기존 문서 `candidateId !== selected`(A≠B) → `{open}` = 대화상자. 같으면 `{go}` = 이동 |
| 분기 | `CandidatesSection.tsx:106-108` | go → `navigate(/studio/:id)` · open → `RestartDialog` · 그 외 → `startAlert` Callout(`role=alert`) |
| 대화상자 | `RestartDialog.tsx:59-60,134` | 네이티브 `<dialog>` + `showModal()` → `dialog[open]`로 잡힘. `[role=dialog]` 속성은 없음(implicit role) |

가림/비활성 조건: 네이티브 disabled 0, aria-disabled는 미선택일 때만, 가림은 대화상자가 열린 뒤에만(showModal 바깥 inert). **조용한 무반응 경로는 `starting`(진행 중 연타) 하나뿐**이고, 나머지 실패는 모두 `role=alert` Callout으로 보인다.

## 2. 재현 (새 TaskSpace "qa02-edit-start repro-1", preview :4399, 1280×900)
스크립트 `scripts/repro-1.mjs`(r2b-export2 경로 그대로) → `logs/repro-1.txt`, 이어서 `scripts/repro-1b.mjs` → `logs/repro-1b.txt`.
- 클릭 직전 B 버튼: `disabled=false`, `aria-disabled=null`, rect (1078,228,159×40), `elementFromPoint(중심)` = 버튼 자신(`hitIsButtonOrChild=true`). 원 스크립트의 `textContent` 정규식 `^B안으로 편집 시작$` 매칭 1개.
- 클릭(`loc=role:button[name='B안으로 편집 시작']`) → **1s**: path `/profile/profile-6`, `dialog[open]` 1개("B안으로 새로 시작할까요? … 지금 편집 중인 문서: A안 · 프로필 v1"), 콘솔 오류 0. **3s**: 동일. (`[role=dialog]` 수 0 = 네이티브 dialog라 속성 없음 — 정상)
- 대화상자 "B안으로 새로 시작" 클릭 → **1s**: path `/studio/project-6`, 대화상자 닫힘, status "B안 · 프로필 v2로 새로 시작했습니다 · 이전 문서(A안 · v1)는 스냅샷 '새로 시작 전'에 있습니다 …", 오류 0.
- 비교: A안 편집 시작(문서 없음)은 대화상자 없이 바로 `/studio/project-6`(정상).

## 3. 옛 R2b 실패의 원인 (스크립트 측)
- `r2b-export2`는 B 클릭 전에 멈췄다: `logs/r2b-export3-run.txt`가 "보정값 쓰기 뒤 `조정 저장 (v2)` 아직 누르지 않음" 상태를 수동 확인 → 2차의 30s 초과는 `has("^3안 만들기 \(v2\)$")` 대기(저장 클릭 미반영)로 추정. 로그에 그 앞 줄이 없어 정확한 줄은 확인 불가(Medium).
- 4·5·7차는 **같은 TaskSpace("release-check-live r2b-2")를 재개**해 앞 실행이 남긴 중간 상태(선택·문서·미확인 기억)를 이어 받았다. 매번 `dialog[open]`·`/studio`만 기다리고 **`role=alert` Callout·`aria-busy`·콘솔은 수집하지 않아** 실제 반응(예: held/실패 Callout, `starting` 중 연타 무시)을 볼 수 없었다. 7차는 첫 줄에서 바로 B를 클릭(앞 상태 가정).
- 같은 경로를 새 TaskSpace·한 스크립트로 돌리면 정상 → 앱의 클릭 경로 결함 근거 없음.

## 4. 권고 (수정 아님)
- 자동화: 매 실행 새 TaskSpace(또는 처음부터 전체 경로), 클릭 뒤 `dialog[open]`·`/studio`·`[role=alert]`·`aria-busy` 셋 중 무엇이 나왔는지 기록. 대화상자 판정은 `dialog[open]`(속성 `[role=dialog]` 아님).
- 남은 가설(검증 안 함): 재개된 TaskSpace에서 미확인 기억(pending) 상태였다면 held Callout이 떴을 것 — 앱은 `role=alert`로 알리므로 결함 아님. B-QA-02는 "스크립트 문제"로 닫기 제안(BACKLOG 반영은 발주자 몫).

## 5. 환경·마감
- `npm ci` + `npm run build` 통과(`logs/build.txt`, lock 변경 0). preview `--port 4399 --strictPort`.
- lsof 사전 0줄(`logs/lsof-pre.txt`) · 종료 후 0줄(`logs/lsof-post.txt`). TaskSpace 41 finish(`logs/ego-finish.txt`).
