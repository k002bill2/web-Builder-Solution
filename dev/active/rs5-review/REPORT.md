# RS5-review — CONTRACT-5 r0.1a 독립 검토 REPORT

- 성격: **구현 전 검증(독립 계약 검토)만**. 계약·코드·SPEC/ADR 수정 0 · 구현 0 · 측정 0 · 예산 상향 0 · merge/push 0 · 새 의존성 0. 쓰기는 `dev/active/rs5-review/`만.
- 대상: `docs/design/restart/CONTRACT-5.md` r0.1a(`418979e`) · base `467a691`(앱 `93f8111`, HEAD까지 `app/` 변경 0 — `git diff --stat 93f8111 HEAD -- app` 빈 출력).
- 책임 QA(Orca Claude Code) · 회수 Jarvis. **제품 PASS 주장 없음** — 이 문서는 계약 문서의 정합성 판단이며, 테스트·브라우저 실행은 0이다.
- 순서 증거: QA 독립 판단 `logs/qa-independent.md` 커밋 `109ea6e` → 그 뒤 Codex 1회(`logs/codex-r1.started` 시각) → 이 REPORT.
- 표기: [L1] 코드 행 직접 확인 · [L1-추적] 여러 행 이어 읽은 경로 추론(실행 0) · [L3] 추정. **미측정** = 실행으로 확인하지 않음.

## 1. 결론 (먼저)

**CONTRACT-5 r0.1a는 구현 승인 전에 P1 5건이 풀리지 않았다**(QA 4 + Codex 신규 1). 계약 PASS도 제품 PASS도 아니다.

1. QA 독립 P1 4건: QA-1 `wrote:false` 증명 낡음 · QA-2 4.1↔I2 모순 및 커밋 레코드 미반환 · QA-3 replace가 dirtyMark를 안 봄 · QA-4 `discard`가 메모리 커밋분을 되돌리지 않음.
2. Codex 신규 P1 1건: CX-1 `confirm`이 아직 publish되지 않은 편집(dirtyMark)을 대상에서 빠뜨려 거짓 `confirmed`를 낸다. QA-3과 뿌리가 같다(dirtyMark가 I8에만 쓰이고 판정 전이에는 쓰이지 않음). 하지만 경로(4.2)가 달라 별개 결함으로 센다.
3. 공통 원인 [L3 해석]: r0.1의 `mark`/dirtyMark는 **이탈 경고 술어(I8)에만** 들어갔다. `confirm`(4.2), `replace`(4.4), 결과 `newer`(2.4), settle(QA-8) 판정에는 들어가지 않았다. CX-1·QA-3(P1)과 QA-8(P2)이 이 원인에서 나온다.
4. P2 5건(QA-5~9)은 내부 모순·누수·미정 수단이다. 반영은 이 레인 범위 밖이다.

## 2. QA 독립 지적 (귀속: QA · Codex 전 커밋 `109ea6e`)

상세·근거행 = `logs/qa-independent.md`. 전부 [L1-추적]·**미측정**.

| ID | 심각도 | 요지 | 핵심 근거행 |
|---|---|---|---|
| QA-1 | P1 | `wrote:false` 확인 증명이 싱크 열기 뒤 낡음 — readonly 탭에서 다른 탭 저장 뒤 거짓 `confirmed` | `localSync.ts:93-98,189-192` · `writerLock.ts:2-3` · 계약 I5b·4.2-5 |
| QA-2 | P1 | 4.1 oncomplete `confirmedSeq=max(…,s)` ↔ I2 `seqOf(제출 레코드)` 모순 · `flush`가 커밋 레코드를 돌려주지 않아 I2 구현 불가 · replace 직렬화 미명시 → conflicted "내 초안" 소실 경로 | `localSync.ts:48,151-155` · `memoryProjectRepository.ts:65-66` |
| QA-3 | P1 | replace 술어가 미publish 편집(dirtyMark)을 보지 않음 → `adopt`/디바운스 중 편집 덮어쓰기 "해결" 주장 미지지 | `useDocSave.ts:131-136` · 계약 4.4 · 6.2 |
| QA-4 | P1 | `discard`가 메모리 커밋된 초안을 되돌리지 않음 · inflight 중 discard 미정의 → 재진입 seed·다음 스냅샷 flush가 폐기 초안을 살림 | `memoryDocBook.ts:364-366` · `memoryProjectRepository.ts:86-89,132-133` |
| QA-5 | P2 | retry 성공 경로가 `stored` 미갱신 → binding 해제 조건 영구 미충족(누수)·거짓 `image-missing` 가능 | `localSync.ts:155,170` |
| QA-6 | P2 | `acquire(projectId)` 멱등 문장이 시그니처와 불일치 · 재seed 수단 미정 | `useAutosaveScheduler.ts:275-279` · `useDocSave.ts:58,61` |
| QA-7 | P2 | I7(not-applied·unknown만) ↔ 4.2-2(모든 start) 모순 — `held:"unconfirmed"` | 계약 내부 |
| QA-8 | P2 | I8 `dirtyMark>publishedMark`가 settle 경로(theirs·adopt)에서 안 꺼짐 → 거짓 `beforeunload` | `useDocSave.ts:103-107,136` · `useAutosaveScheduler.ts:125-131` |
| QA-9 | P2 | `local.base`·요청 revision 멱등 키 잔존 — 단일 소유자 문장과 존폐 미정 · in-tab STALE 소멸로 replace 미분류 경로가 생기면 조용히 덮임 | `memoryDocBook.ts:354,358,363,331` |

F표(1절) 대조: F1~F12 근거행 일치(F4는 `kept`의 `held` 완화를 계약이 언급하지 않음 — 결론은 유효). I5b의 하이드레이트 참조 동일성 전제 성립(`memoryDocBook.ts:146,166-167`), 단 "레코드 참조 동일"은 성분 동일로 읽어야 함(`localSync.ts:153,155`).

## 3. Codex adversarial-review (귀속: Codex · 1회)

- 명령: `node ~/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs adversarial-review --scope branch --base 467a691 "<집중 문장>"`를 1회 실행했다. 집중 문장 전문은 `logs/codex-r1.cmd.txt`에 있다. `--help` 실행 0회. 시작 시각은 `logs/codex-r1.started`, 원문은 `logs/codex-r1.txt`.
- 종료: `nohup … &`로 띄웠기 때문에 **exit code를 수집하지 못했다**. 완료는 출력 내용으로 판정했다. 원문 끝에 `# Codex Adversarial Review` · `Verdict: needs-attention` · Findings · Next steps 블록이 있고 `Turn completion inferred …` 줄이 찍혀 있다. 이전 레인의 완료 출력(`rs5-contract/logs/codex-a1.txt` 끝)과 모양이 같다.
- 판정: **needs-attention**. Codex는 읽기 전용으로 대조했고 런타임 테스트는 돌리지 않았다(원문 요약 그대로).
- 귀속 주의: `--scope branch --base 467a691` diff에는 QA 커밋 `109ea6e`(`qa-independent.md`)가 들어 있다. 집중 문장도 그 파일을 가리켰다. 그래서 아래 "동의"는 **QA 판단을 본 뒤의 동의**다. 독립된 확증으로 세지 않는다.

| ID | 심각도 | 요지(원문 요약) | 근거(Codex 인용) | QA와의 관계 |
|---|---|---|---|---|
| CX-1 | P1 | `confirm`이 publish 전 편집을 대상에서 빠뜨린다. 저장된 A에서 B를 편집하고 디바운스 전에 confirm하면 `latest`가 없어 A를 확인하고 `newer=false`를 낸다. A 확인 중 B를 편집해도 같다 → 화면의 B가 영속되지 않았는데 "확인됨"이 뜬다. T3의 "4.2-4로 초안 커밋" 기대도 이 경로에서는 성립하지 않는다 | 계약 4.2(`CONTRACT-5.md:178-181`) · `useDocSave.ts:87-92` · `useAutosaveScheduler.ts:57,90-98`(기본 2초 지연) | **신규**(QA 미지적). QA-3과 뿌리가 같다(dirtyMark 미사용) |
| — | 동의 | QA-1·3·4·5 | 원문 요약 1문장 | QA 판단을 본 뒤의 동의 |
| — | 부분 동의 | QA-2: 제출 레코드 증명 누락에는 동의. 경쟁 경로가 실제로 생기는지는 replace 직렬화 범위에 달렸다 | 원문 요약 | QA-2를 **좁은 경로 [L1-추적]**로 낮춰 읽는다. P1의 핵심 근거는 4.1↔I2 모순과 "flush/confirm이 커밋 레코드를 돌려주지 않아 I2를 구현할 수 없음"이다. `kept`의 틈은 `await local.sync()`(이미 resolve된 공유 로더)의 microtask 수준이다 |
| — | 언급 없음 | QA-6~9(P2) | — | 동의·반박 모두 없음 → QA 단독 판단으로 남긴다 |

- Codex 권고(원문): confirm 시작 때 `dirtyMark > publishedMark`이면 활성 lease에서 최신 doc·hash·binding을 동기로 publish한다. 제출 대상의 mark를 고정한다. `newer`에 제출 이후 미publish 편집도 넣는다. 최신 초안을 확보하지 못하면 `confirmed`를 내지 않는다. T3에 "확인 직전 편집"과 "확인 진행 중 편집, publish 전 resolve"를 추가한다. → **제안일 뿐, 이 레인은 반영하지 않는다.**
- 관찰: 원문 로그에 Codex가 저장소 밖 `~/Library/Application Support/…`에 `rg`를 실행한 줄이 있다(읽기만, 쓰기 0). 다른 레인·화면은 건드리지 않았다(관찰 사항이며 차단 사유 아님).

## 4. 미측정 · 범위 밖

- 미측정(전부): 위 모든 경로는 코드 읽기 추적이며 RED 테스트·하네스·브라우저 실행 0. 계약 7절 T1~T19도 실행 0.
- 번들: 이 레인 측정 0. CONTRACT-5 진입 몫 미측정(계약 8절 그대로). 제한된 번들 스파이크·UX 명세는 이 레인 범위 아님(BRIEF: QA 레인 = 계약 대조).
- 지적 반영·리뷰 반복 0(BRIEF "지적수정/리뷰반복금지"). 제안은 전부 **제안**이며 구현 승인 아님.

## 5. Jarvis 회수 요청

1. CONTRACT-5를 구현 승인으로 올리기 전에 P1 5건(QA-1~4 · CX-1)을 반영할지, 그리고 반영본을 누가 재검토할지 정해야 한다. 이 레인은 반영하지 않는다(BRIEF).
2. QA 권고 [L3]: dirtyMark를 판정 전이(4.2 confirm · 4.4 replace · 2.4 `newer` · settle)에 함께 넣는 수정 1회로 CX-1·QA-3·QA-8을 같이 닫을 수 있다. QA-1(writer 모드 한정)·QA-2(커밋 레코드 반환)·QA-4(discard 정의)는 각각 따로 결정해야 한다.
3. 반영 뒤 검증은 계약 7절 T3·T16·T17에 CX-1 사례와 QA 경로(readonly 탭 wrote:false · 메모리 커밋 뒤 discard · adopt 중 편집)를 RED로 추가하는 방식을 권한다. 이 레인에서 실행한 것은 0이다.
